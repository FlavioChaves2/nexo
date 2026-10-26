"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, parseReais } from "@/lib/format";
import { LISTING_TYPES } from "@/lib/constants";
import { emailBlock } from "@/lib/email";
import { notify } from "@/lib/notify";
import { OrderError } from "@/lib/orders";
import { CONTACT } from "@/lib/trust";
import { WANTED_DAYS, WANTED_MAX_OPEN, openWanted } from "@/lib/wanted";

// values: o que foi digitado, para o formulário não apagar tudo depois de um erro.
export type WantedState = { error?: string; ok?: string; values?: Record<string, string> } | undefined;

const schema = z.object({
  gameSlug: z.string().min(1, "Escolha o jogo."),
  type: z.enum(LISTING_TYPES, { message: "Escolha o tipo." }),
  title: z.string().trim().min(8, "O título precisa ter pelo menos 8 caracteres.").max(80),
  description: z.string().trim().min(20, "Descreva o que procura com pelo menos 20 caracteres.").max(1500),
  max: z.string(),
});

function cents(input: string, label: string) {
  const c = parseReais(input);
  if (!Number.isFinite(c) || c < 100) throw new OrderError(`${label} inválido. Mínimo R$ 1,00.`);
  if (c > 5_000_000) throw new OrderError(`${label} máximo: R$ 50.000,00.`);
  return c;
}

async function guard(fn: () => Promise<string | WantedState>, form?: FormData): Promise<WantedState> {
  let r: string | WantedState;
  try {
    r = await fn();
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message, values: form && Object.fromEntries([...form].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)])) };
    throw e;
  }
  if (typeof r === "string") redirect(r);
  return r;
}

export async function createWanted(_: WantedState, form: FormData): Promise<WantedState> {
  const user = await requireUser("/quero-comprar/novo");
  return guard(async () => {
    const blocked = await emailBlock(user.id);
    if (blocked) throw new OrderError(blocked);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) throw new OrderError(parsed.error.issues[0].message);
    const d = parsed.data;
    if (CONTACT.test(`${d.title} ${d.description}`)) throw new OrderError("Não coloque contato, telefone ou link. Toda negociação acontece pela Nexo.");
    if (!(await db.game.findUnique({ where: { slug: d.gameSlug } }))) throw new OrderError("Jogo inválido.");
    const open = await db.wanted.count({ where: { buyerId: user.id, ...openWanted() } });
    if (open >= WANTED_MAX_OPEN) throw new OrderError(`Você já tem ${WANTED_MAX_OPEN} pedidos abertos. Feche ou cancele um antes.`);
    const w = await db.wanted.create({
      data: {
        buyerId: user.id,
        gameSlug: d.gameSlug,
        type: d.type,
        title: d.title,
        description: d.description,
        maxCents: cents(d.max, "Valor máximo"),
        expiresAt: new Date(Date.now() + WANTED_DAYS * 86_400_000),
      },
    });
    revalidatePath("/quero-comprar");
    return `/quero-comprar/${w.id}`;
  }, form);
}

export async function sendOffer(wantedId: string, _: WantedState, form: FormData): Promise<WantedState> {
  const user = await requireUser(`/quero-comprar/${wantedId}`);
  return guard(async () => {
    const blocked = await emailBlock(user.id);
    if (blocked) throw new OrderError(blocked);
    const w = await db.wanted.findFirst({ where: { id: wantedId, ...openWanted() } });
    if (!w) throw new OrderError("Este pedido não está mais aberto.");
    if (w.buyerId === user.id) throw new OrderError("Você não pode oferecer no próprio pedido.");
    const priceCents = cents(String(form.get("price") ?? ""), "Preço");
    if (priceCents > w.maxCents) throw new OrderError(`O comprador paga no máximo ${money(w.maxCents)}.`);
    const message = String(form.get("message") ?? "").trim();
    if (message.length < 10 || message.length > 1000) throw new OrderError("Descreva o que você entrega (10 a 1000 caracteres).");
    if (CONTACT.test(message)) throw new OrderError("Não envie contato, telefone ou link. Toda negociação acontece pela Nexo.");

    const prev = await db.wantedOffer.findUnique({ where: { wantedId_sellerId: { wantedId, sellerId: user.id } } });
    if (prev && prev.status !== "ENVIADA") throw new OrderError("Sua oferta já foi respondida pelo comprador.");
    await db.wantedOffer.upsert({
      where: { wantedId_sellerId: { wantedId, sellerId: user.id } },
      create: { wantedId, sellerId: user.id, priceCents, message },
      update: { priceCents, message },
    });
    if (!prev) await notify(w.buyerId, `Nova oferta: ${money(priceCents)}`, `${user.username} respondeu "${w.title}".`, `/quero-comprar/${wantedId}`);
    revalidatePath(`/quero-comprar/${wantedId}`);
    return { ok: prev ? "Oferta atualizada." : "Oferta enviada. Você recebe um aviso se o comprador aceitar." };
  }, form);
}

/** Aceita a oferta: fecha o pedido e cria um anúncio reservado ao comprador, pago pelo checkout normal. */
export async function acceptOffer(offerId: string): Promise<WantedState> {
  const user = await requireUser("/quero-comprar");
  return guard(async () => {
    const offer = await db.wantedOffer.findUnique({ where: { id: offerId }, include: { wanted: true, seller: { select: { suspendedAt: true } } } });
    if (!offer || offer.wanted.buyerId !== user.id) throw new OrderError("Oferta não encontrada.");
    if (offer.seller.suspendedAt) throw new OrderError("Este vendedor não está disponível.");
    const w = offer.wanted;
    const listingId = await db.$transaction(async (tx) => {
      // updateMany com o status esperado: dois cliques juntos não aceitam duas ofertas.
      const closed = await tx.wanted.updateMany({ where: { id: w.id, ...openWanted() }, data: { status: "FECHADO" } });
      if (closed.count !== 1) throw new OrderError("Este pedido não está mais aberto.");
      const ok = await tx.wantedOffer.updateMany({ where: { id: offer.id, status: "ENVIADA" }, data: { status: "ACEITA" } });
      if (ok.count !== 1) throw new OrderError("Esta oferta não está mais disponível.");
      const listing = await tx.listing.create({
        data: {
          sellerId: offer.sellerId,
          gameSlug: w.gameSlug,
          type: w.type,
          title: w.title,
          description: `${w.description}\n\nOferta do vendedor: ${offer.message}`,
          priceCents: offer.priceCents,
          stock: 1,
          reservedForId: user.id,
        },
      });
      await tx.wantedOffer.update({ where: { id: offer.id }, data: { listingId: listing.id } });
      await tx.wantedOffer.updateMany({ where: { wantedId: w.id, status: "ENVIADA" }, data: { status: "RECUSADA" } });
      await notify(offer.sellerId, "Sua oferta foi aceita!", `"${w.title}" por ${money(offer.priceCents)}. Aguarde o pagamento do comprador.`, `/anuncio/${listing.id}`, tx);
      return listing.id;
    });
    revalidatePath("/quero-comprar");
    return `/checkout/${listingId}`;
  });
}

export async function cancelWanted(wantedId: string): Promise<WantedState> {
  const user = await requireUser(`/quero-comprar/${wantedId}`);
  const { count } = await db.wanted.updateMany({ where: { id: wantedId, buyerId: user.id, status: "ABERTO" }, data: { status: "CANCELADO" } });
  if (count !== 1) return { error: "Este pedido não está mais aberto." };
  await db.wantedOffer.updateMany({ where: { wantedId, status: "ENVIADA" }, data: { status: "RECUSADA" } });
  revalidatePath("/quero-comprar");
  revalidatePath(`/quero-comprar/${wantedId}`);
  return { ok: "Pedido cancelado." };
}
