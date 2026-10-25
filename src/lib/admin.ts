import { db } from "./db";
import { money } from "./format";
import { payoutPix, refundPix } from "./payments";
import { OrderError, payoutSeller, sysMsg, transition, type Tx } from "./orders";
import { notify } from "./notify";

// Decisões do painel de admin. Cada uma muda o status de forma atômica
// (só passa se o item ainda estiver no estado esperado) e grava um AdminAction.

export class AdminError extends OrderError {}

const log = (tx: Tx, adminId: string, kind: string, targetId: string, label: string, note = "") =>
  tx.adminAction.create({ data: { adminId, kind, targetId, label, note } });

function needNote(note: string, min = 10) {
  const n = note.trim();
  if (n.length < min) throw new AdminError(`Explique a decisão em pelo menos ${min} caracteres. As duas partes vão ler.`);
  return n.slice(0, 1000);
}

/** Disputa a favor do vendedor: o valor (menos a taxa) vai para o saldo dele. */
export async function releaseDispute(orderId: string, adminId: string, note: string) {
  const why = needNote(note);
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    await transition(tx, orderId, ["DISPUTA"], { status: "CONCLUIDO", completedAt: new Date(), resolvedAt: new Date(), resolution: why });
    await payoutSeller(tx, order);
    await sysMsg(tx, orderId, `Mediador Nexo decidiu a favor do vendedor: ${why}\nPagamento liberado ao vendedor.`);
    await notify(order.buyerId, "Disputa decidida", `Pedido #${order.code}: a favor do vendedor.`, `/pedido/${order.code}`, tx);
    await log(tx, adminId, "DISPUTA_LIBERADA", orderId, `#${order.code}`, why);
  });
}

/** Disputa a favor do comprador: estorna o Pix inteiro (a taxa não é cobrada). */
export async function refundDispute(orderId: string, adminId: string, note: string) {
  const why = needNote(note);
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "DISPUTA") throw new AdminError("Esta disputa já foi resolvida.");
  // O estorno no gateway acontece antes de gravar; se o gateway falhar, nada muda aqui.
  const refund = await refundPix(order);
  await db.$transaction(async (tx) => {
    const now = new Date();
    await transition(tx, orderId, ["DISPUTA"], { status: "REEMBOLSADO", refundedAt: now, refundId: refund.id, resolvedAt: now, resolution: why });
    await sysMsg(tx, orderId, `Mediador Nexo decidiu a favor do comprador: ${why}\n${money(order.totalCents)} estornados por Pix.`);
    await notify(order.buyerId, "Reembolso aprovado", `Pedido #${order.code}: ${money(order.totalCents)} estornados.`, `/pedido/${order.code}`, tx);
    await notify(order.sellerId, "Disputa decidida", `Pedido #${order.code}: a favor do comprador.`, `/pedido/${order.code}`, tx);
    await log(tx, adminId, "DISPUTA_REEMBOLSADA", orderId, `#${order.code}`, why);
  });
}

/** Mensagem do mediador no chat do pedido, sem decidir ainda. */
export async function mediatorMessage(orderId: string, adminId: string, text: string) {
  const body = text.trim().slice(0, 1000);
  if (!body) throw new AdminError("Escreva a mensagem.");
  await db.message.create({ data: { orderId, body: `Mediador Nexo: ${body}` } });
}

export async function approveWithdrawal(id: string, adminId: string) {
  const w = await db.withdrawal.findUniqueOrThrow({ where: { id }, include: { user: { select: { username: true } } } });
  if (w.status !== "PENDENTE") throw new AdminError("Este saque já foi processado.");
  const payout = await payoutPix(w);
  await db.$transaction(async (tx) => {
    const { count } = await tx.withdrawal.updateMany({
      where: { id, status: "PENDENTE" },
      data: { status: "PAGO", payoutId: payout.id, processedAt: new Date() },
    });
    if (count !== 1) throw new AdminError("Este saque já foi processado.");
    await log(tx, adminId, "SAQUE_PAGO", id, `${money(w.amountCents)} para ${w.user.username}`);
    await notify(w.userId, "Saque pago", `${money(w.amountCents)} enviados para a chave ${w.pixKey}.`, "/conta?aba=saldo", tx);
  });
}

/** Recusa o saque e devolve o valor ao saldo do vendedor. */
export async function rejectWithdrawal(id: string, adminId: string, note: string) {
  const why = needNote(note, 5);
  await db.$transaction(async (tx) => {
    const w = await tx.withdrawal.findUniqueOrThrow({ where: { id }, include: { user: { select: { username: true } } } });
    const { count } = await tx.withdrawal.updateMany({
      where: { id, status: "PENDENTE" },
      data: { status: "RECUSADO", note: why, processedAt: new Date() },
    });
    if (count !== 1) throw new AdminError("Este saque já foi processado.");
    await tx.user.update({ where: { id: w.userId }, data: { balanceCents: { increment: w.amountCents } } });
    await log(tx, adminId, "SAQUE_RECUSADO", id, `${money(w.amountCents)} de ${w.user.username}`, why);
    await notify(w.userId, "Saque recusado", `${money(w.amountCents)} voltaram ao seu saldo. Motivo: ${why}`, "/conta?aba=saldo", tx);
  });
}

/** Tira o anúncio do ar. O vendedor vê o motivo e não consegue reativar sozinho. */
export async function removeListing(id: string, adminId: string, note: string) {
  const why = needNote(note, 5);
  await db.$transaction(async (tx) => {
    const l = await tx.listing.findUniqueOrThrow({ where: { id } });
    if (l.status === "REMOVIDO") throw new AdminError("Este anúncio já foi removido.");
    await tx.listing.update({ where: { id }, data: { status: "REMOVIDO", moderationNote: why } });
    await log(tx, adminId, "ANUNCIO_REMOVIDO", id, l.title, why);
    await notify(l.sellerId, "Anúncio removido pela moderação", `${l.title}: ${why}`, "/conta?aba=anuncios", tx);
  });
}

export async function restoreListing(id: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const l = await tx.listing.findUniqueOrThrow({ where: { id } });
    if (l.status !== "REMOVIDO") throw new AdminError("Este anúncio não está removido.");
    await tx.listing.update({ where: { id }, data: { status: "PAUSADO", moderationNote: "" } });
    await log(tx, adminId, "ANUNCIO_RESTAURADO", id, l.title);
  });
}

/** Suspende: a pessoa é deslogada, não entra mais e os anúncios somem da busca. */
export async function suspendUser(userId: string, adminId: string, note: string) {
  const why = needNote(note, 5);
  if (userId === adminId) throw new AdminError("Você não pode suspender a própria conta.");
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.suspendedAt) throw new AdminError("Esta conta já está suspensa.");
    if (u.role === "ADMIN") throw new AdminError("Não é possível suspender um admin.");
    await tx.user.update({ where: { id: userId }, data: { suspendedAt: new Date(), suspendReason: why } });
    await log(tx, adminId, "USUARIO_SUSPENSO", userId, u.username, why);
  });
}

export async function unsuspendUser(userId: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!u.suspendedAt) throw new AdminError("Esta conta não está suspensa.");
    await tx.user.update({ where: { id: userId }, data: { suspendedAt: null, suspendReason: "" } });
    await log(tx, adminId, "USUARIO_REATIVADO", userId, u.username);
  });
}

export async function reviewVerification(userId: string, adminId: string, approve: boolean, note: string) {
  const why = approve ? note.trim().slice(0, 300) : needNote(note, 5);
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const { count } = await tx.user.updateMany({
      where: { id: userId, verification: "PENDENTE" },
      data: approve ? { verification: "APROVADO", verificationNote: "" } : { verification: "RECUSADO", verificationNote: why, cpf: null },
    });
    if (count !== 1) throw new AdminError("Esta verificação já foi analisada.");
    await log(tx, adminId, approve ? "VERIFICACAO_APROVADA" : "VERIFICACAO_RECUSADA", userId, u.username, why);
    await notify(userId, approve ? "Identidade verificada" : "Verificação recusada", approve ? "Você já pode sacar seu saldo." : why, "/conta?aba=saldo", tx);
  });
}

/**
 * Fecha todas as denúncias abertas de um anúncio.
 * procedente: tira o anúncio do ar. descartar: volta ao ar se tinha sido escondido pelas denúncias.
 */
export async function resolveReports(listingId: string, adminId: string, valid: boolean, note: string) {
  const why = valid ? needNote(note, 5) : note.trim().slice(0, 300);
  await db.$transaction(async (tx) => {
    const l = await tx.listing.findUniqueOrThrow({ where: { id: listingId } });
    const { count } = await tx.report.updateMany({ where: { listingId, status: "ABERTA" }, data: { status: valid ? "PROCEDENTE" : "DESCARTADA" } });
    if (!count) throw new AdminError("Não há denúncias abertas para este anúncio.");
    if (valid) await tx.listing.update({ where: { id: listingId }, data: { status: "REMOVIDO", moderationNote: why } });
    else if (l.status === "REMOVIDO" && l.moderationNote.startsWith("Em análise"))
      await tx.listing.update({ where: { id: listingId }, data: { status: "ATIVO", moderationNote: "" } });
    await log(tx, adminId, valid ? "DENUNCIA_PROCEDENTE" : "DENUNCIA_DESCARTADA", listingId, l.title, why);
  });
}

export async function createCoupon(adminId: string, input: { code: string; percentOff: number; amountOffCents: number; maxDiscountCents: number | null; minOrderCents: number; maxUses: number | null; expiresAt: Date | null }) {
  if (!/^[A-Z0-9]{4,20}$/.test(input.code)) throw new AdminError("Código: 4 a 20 letras ou números, sem espaço.");
  if (!input.percentOff === !input.amountOffCents) throw new AdminError("Preencha só um: porcentagem ou valor fixo.");
  if (input.percentOff < 0 || input.percentOff > 90) throw new AdminError("Porcentagem entre 1 e 90.");
  if (await db.coupon.findUnique({ where: { code: input.code } })) throw new AdminError("Já existe um cupom com esse código.");
  await db.$transaction(async (tx) => {
    const c = await tx.coupon.create({ data: input });
    await log(tx, adminId, "CUPOM_CRIADO", c.id, c.code);
  });
}

export async function toggleCoupon(id: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const c = await tx.coupon.findUniqueOrThrow({ where: { id } });
    await tx.coupon.update({ where: { id }, data: { active: !c.active } });
    await log(tx, adminId, c.active ? "CUPOM_DESATIVADO" : "CUPOM_ATIVADO", id, c.code);
  });
}
