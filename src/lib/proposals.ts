import { randomBytes } from "node:crypto";
import type { Proposal } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { money, parseReais } from "./format";
import { LISTING_TYPES, TYPE_LABEL } from "./constants";
import { OrderError, sysMsg, transition, type Tx } from "./orders";
import { contactErrorIn } from "./contact-filter";
import { cleanDisplayName } from "./store-names";
import { notify } from "./notify";
import { emailBlock } from "./email";
import { releaseStoreCoupon } from "./store-coupons";

// Proposta por link (docs/lojas-vendedor.md): o vendedor monta as condições combinadas com o cliente,
// o comprador revisa e aceita, e a compra segue o checkout, a entrega e a disputa normais.

export const PROPOSAL_MAX_DAYS = 30; // validade máxima do link (limite técnico)

export const proposalSchema = z.object({
  gameSlug: z.string().min(1, "Escolha o jogo."),
  server: z.string().trim().max(40, "Servidor: até 40 caracteres.").optional().default(""),
  type: z.enum(LISTING_TYPES, { message: "Escolha o tipo." }),
  title: z.string().trim().min(8, "O título precisa ter pelo menos 8 caracteres.").max(80, "Título: até 80 caracteres."),
  description: z.string().trim().min(20, "Descreva o que será entregue (pelo menos 20 caracteres).").max(2000, "Descrição: até 2000 caracteres."),
  quantity: z.coerce.number({ message: "Quantidade inválida." }).int("Quantidade inválida.").min(1, "Quantidade mínima: 1.").max(9999, "Quantidade máxima: 9999."),
  total: z.string(),
  deliveryDays: z.coerce.number({ message: "Prazo inválido." }).int("Prazo inválido.").min(0, "Prazo inválido.").max(60, "Prazo de entrega: no máximo 60 dias."),
  deliveryTerms: z.string().trim().min(10, "Explique como será a entrega (pelo menos 10 caracteres).").max(1000, "Condições de entrega: até 1000 caracteres."),
  validDays: z.coerce.number({ message: "Validade inválida." }).int("Validade inválida.").min(1, "Validade mínima: 1 dia.").max(PROPOSAL_MAX_DAYS, `Validade máxima: ${PROPOSAL_MAX_DAYS} dias.`),
});

export type ProposalInput = z.infer<typeof proposalSchema>;

/** Condições aceitas, copiadas para o pedido (Order.terms) e mostradas a comprador, vendedor e mediador. */
export type ProposalTerms = {
  proposalId: string; version: number; title: string; description: string; game: string; server: string; type: string;
  quantity: number; totalCents: number; deliveryDays: number; deliveryTerms: string; expiresAt: string; acceptedAt: string;
};

export const proposalUrl = (token: string) => `/proposta/${token}`;

export const isExpired = (p: Pick<Proposal, "expiresAt">) => p.expiresAt.getTime() <= Date.now();

export function proposalStatusLabel(p: Pick<Proposal, "status" | "expiresAt">) {
  if (p.status === "PAGA") return "Paga";
  if (p.status === "CANCELADA") return "Cancelada";
  if (isExpired(p)) return "Vencida";
  return p.status === "ACEITA" ? "Aceita, aguardando pagamento" : "Aguardando o cliente";
}

async function validate(sellerId: string, raw: Record<string, unknown>) {
  const parsed = proposalSchema.safeParse(raw);
  if (!parsed.success) throw new OrderError(parsed.error.issues[0].message);
  const d = parsed.data;
  const totalCents = parseReais(d.total);
  if (!Number.isFinite(totalCents) || totalCents < 100) throw new OrderError("Preço total inválido. Mínimo R$ 1,00.");
  if (totalCents > 5_000_000) throw new OrderError("Preço máximo por proposta: R$ 50.000,00.");
  const contact = contactErrorIn([d.title, d.description, d.deliveryTerms, d.server], "na proposta");
  if (contact) throw new OrderError(contact);
  if (!(await db.game.findUnique({ where: { slug: d.gameSlug } }))) throw new OrderError("Jogo inválido.");
  const seller = await db.user.findUniqueOrThrow({ where: { id: sellerId }, select: { suspendedAt: true } });
  if (seller.suspendedAt) throw new OrderError("Sua conta está suspensa.");
  const blocked = await emailBlock(sellerId);
  if (blocked) throw new OrderError(blocked);
  return {
    gameSlug: d.gameSlug, server: cleanDisplayName(d.server), type: d.type, title: cleanDisplayName(d.title), description: d.description,
    quantity: d.quantity, totalCents, deliveryDays: d.deliveryDays, deliveryTerms: d.deliveryTerms,
    expiresAt: new Date(Date.now() + d.validDays * 86_400_000),
  };
}

export async function createProposal(sellerId: string, raw: Record<string, unknown>) {
  const data = await validate(sellerId, raw);
  // Limite de propostas abertas, contra uso do link como anúncio paralelo ou spam.
  const open = await db.proposal.count({ where: { sellerId, status: { in: ["ABERTA", "ACEITA"] }, expiresAt: { gt: new Date() } } });
  if (open >= 50) throw new OrderError("Você tem 50 propostas em aberto. Cancele ou aguarde algumas antes de criar outra.");
  return db.proposal.create({ data: { ...data, sellerId, token: randomBytes(18).toString("base64url") } });
}

/** Tira de venda o anúncio reservado e cancela pagamentos em aberto da versão anterior. */
async function closeCheckout(tx: Tx, proposalId: string, why: string) {
  const listing = await tx.listing.findUnique({ where: { proposalId } });
  if (!listing) return;
  await tx.listing.update({ where: { id: listing.id }, data: { status: "PAUSADO" } });
  const pending = await tx.order.findMany({ where: { listingId: listing.id, status: "AGUARDANDO_PAGAMENTO" }, select: { id: true } });
  for (const o of pending) {
    await transition(tx, o.id, ["AGUARDANDO_PAGAMENTO"], { status: "CANCELADO" });
    await releaseStoreCoupon(tx, { orderId: o.id });
    await sysMsg(tx, o.id, `${why} Este pagamento foi cancelado; se o Pix for pago mesmo assim, o valor é estornado.`);
  }
}

/** Editar gera nova versão e exige nova aceitação do cliente (pagamentos em aberto são cancelados). */
export async function updateProposal(sellerId: string, id: string, raw: Record<string, unknown>) {
  const data = await validate(sellerId, raw);
  return db.$transaction(async (tx) => {
    const p = await tx.proposal.findUnique({ where: { id } });
    if (!p || p.sellerId !== sellerId) throw new OrderError("Proposta não encontrada.");
    if (p.status === "PAGA") throw new OrderError("Esta proposta já foi paga e não pode mais ser alterada.");
    if (p.status === "CANCELADA") throw new OrderError("Esta proposta foi cancelada. Crie uma nova.");
    const { count } = await tx.proposal.updateMany({
      where: { id, version: p.version, status: { in: ["ABERTA", "ACEITA"] } },
      data: { ...data, version: { increment: 1 }, status: "ABERTA", acceptedVersion: null, acceptedAt: null },
    });
    if (count !== 1) throw new OrderError("A proposta mudou enquanto você editava. Atualize a página.");
    await closeCheckout(tx, id, "O vendedor alterou a proposta.");
    if (p.buyerId) await notify(p.buyerId, "Proposta alterada", `${data.title}: revise as novas condições antes de pagar.`, proposalUrl(p.token), tx);
    return p;
  });
}

export async function cancelProposal(sellerId: string, id: string) {
  await db.$transaction(async (tx) => {
    const p = await tx.proposal.findUnique({ where: { id } });
    if (!p || p.sellerId !== sellerId) throw new OrderError("Proposta não encontrada.");
    const { count } = await tx.proposal.updateMany({ where: { id, status: { in: ["ABERTA", "ACEITA"] } }, data: { status: "CANCELADA" } });
    if (count !== 1) throw new OrderError(p.status === "PAGA" ? "Esta proposta já foi paga. Para desfazer, use o pedido." : "Esta proposta já foi cancelada.");
    await closeCheckout(tx, id, "O vendedor cancelou a proposta.");
    if (p.buyerId) await notify(p.buyerId, "Proposta cancelada", `${p.title}: o vendedor cancelou esta proposta.`, proposalUrl(p.token), tx);
  });
}

const listingDescription = (p: Pick<Proposal, "description" | "quantity" | "deliveryDays" | "deliveryTerms">) =>
  `${p.description}\n\nQuantidade: ${p.quantity}\nPrazo de entrega: ${p.deliveryDays ? `até ${p.deliveryDays} dia(s) após o pagamento` : "no mesmo dia do pagamento"}\nCondições de entrega: ${p.deliveryTerms}`;

/**
 * O comprador aceita a versão que está vendo. Cria (ou reabre) o anúncio reservado para ele
 * e devolve o id para o checkout. Clique duplo na mesma versão devolve o mesmo anúncio.
 */
export async function acceptProposal(buyerId: string, token: string, version: number) {
  return db.$transaction(async (tx) => {
    const p = await tx.proposal.findUnique({ where: { token }, include: { seller: { select: { suspendedAt: true } } } });
    if (!p || (p.buyerId && p.buyerId !== buyerId)) throw new OrderError("Proposta não encontrada.");
    if (p.sellerId === buyerId) throw new OrderError("Você não pode aceitar a própria proposta.");
    if (p.seller.suspendedAt) throw new OrderError("Este vendedor não está disponível.");
    if (p.status === "CANCELADA") throw new OrderError("Esta proposta foi cancelada pelo vendedor.");
    if (p.status === "PAGA") throw new OrderError("Esta proposta já foi paga.");
    if (isExpired(p)) throw new OrderError("Esta proposta venceu. Peça uma nova ao vendedor.");
    if (p.version !== version) throw new OrderError("O vendedor alterou as condições. Revise a proposta atualizada antes de aceitar.");

    if (p.status === "ABERTA") {
      const { count } = await tx.proposal.updateMany({
        where: { id: p.id, status: "ABERTA", version, OR: [{ buyerId: null }, { buyerId }] },
        data: { status: "ACEITA", buyerId, acceptedVersion: version, acceptedAt: new Date() },
      });
      if (count !== 1) throw new OrderError("A proposta mudou agora há pouco. Atualize a página.");
    } else if (p.acceptedVersion !== version) {
      throw new OrderError("A proposta mudou agora há pouco. Atualize a página.");
    }

    const listing = {
      sellerId: p.sellerId, gameSlug: p.gameSlug, server: p.server, type: p.type, title: p.title,
      description: listingDescription(p), priceCents: p.totalCents, stock: 1, status: "ATIVO", reservedForId: buyerId,
    };
    const l = await tx.listing.upsert({ where: { proposalId: p.id }, create: { ...listing, proposalId: p.id }, update: listing, select: { id: true } });
    if (p.status === "ABERTA") await notify(p.sellerId, "Proposta aceita", `${p.title} por ${money(p.totalCents)}. Aguarde o pagamento do cliente.`, `/conta/propostas/${p.id}`, tx);
    return { listingId: l.id, proposal: p };
  });
}

/** Confere, ao criar o pedido, se a proposta aceita ainda vale para este comprador. Devolve as condições a copiar. */
export async function termsForCheckout(proposalId: string, buyerId: string) {
  const p = await db.proposal.findUnique({ where: { id: proposalId } });
  if (!p || p.buyerId !== buyerId) throw new OrderError("Esta proposta não está disponível.");
  if (p.status !== "ACEITA" || p.acceptedVersion !== p.version || !p.acceptedAt) throw new OrderError("Aceite a versão atual da proposta antes de pagar.");
  if (isExpired(p)) throw new OrderError("Esta proposta venceu. Peça uma nova ao vendedor.");
  const game = await db.game.findUnique({ where: { slug: p.gameSlug }, select: { name: true } });
  const terms: ProposalTerms = {
    proposalId: p.id, version: p.version, title: p.title, description: p.description, game: game?.name ?? p.gameSlug, server: p.server,
    type: TYPE_LABEL[p.type] ?? p.type, quantity: p.quantity, totalCents: p.totalCents, deliveryDays: p.deliveryDays,
    deliveryTerms: p.deliveryTerms, expiresAt: p.expiresAt.toISOString(), acceptedAt: p.acceptedAt.toISOString(),
  };
  return terms;
}

/**
 * Na aprovação do pagamento: a proposta precisa continuar aceita na mesma versão do pedido.
 * Devolve false se foi cancelada ou alterada (o pedido é cancelado e estornado pelo fluxo normal).
 */
export async function claimProposalPayment(tx: Tx, order: { id: string; proposalId: string | null; terms: string }) {
  if (!order.proposalId) return true;
  let version = 0;
  try {
    version = (JSON.parse(order.terms) as ProposalTerms).version;
  } catch {
    return false;
  }
  const { count } = await tx.proposal.updateMany({
    where: { id: order.proposalId, status: "ACEITA", version, acceptedVersion: version },
    data: { status: "PAGA", orderId: order.id },
  });
  return count === 1;
}

export function parseTerms(raw: string): ProposalTerms | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProposalTerms;
  } catch {
    return null;
  }
}
