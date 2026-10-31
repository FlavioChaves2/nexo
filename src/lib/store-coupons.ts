import type { StoreCoupon } from "@prisma/client";
import { db } from "./db";
import { money } from "./format";
import { OrderError, type Tx } from "./orders";
import { applyCoupon, normalizeCode } from "./coupons";

// Cupons criados pelo vendedor para a própria loja. O desconto sai do valor que ele recebe.
// Regras: um cupom por pedido (da loja OU da Nexo), uma vez por comprador (trava no banco),
// limite de usos reservado na criação do pedido e devolvido se o pedido for cancelado.

const MIN_TO_PAY = 100; // o pagamento nunca fica abaixo de R$ 1,00

export type CouponListing = { id: string; sellerId: string; gameSlug: string };

export function storeDiscountFor(c: Pick<StoreCoupon, "percentOff" | "amountOffCents" | "maxDiscountCents">, subtotal: number) {
  let d = c.percentOff ? Math.round((subtotal * c.percentOff) / 100) : c.amountOffCents;
  if (c.maxDiscountCents) d = Math.min(d, c.maxDiscountCents);
  return Math.max(0, Math.min(d, subtotal - MIN_TO_PAY));
}

function checkStoreCoupon(c: StoreCoupon, listing: CouponListing, subtotal: number) {
  const now = new Date();
  if (!c.active) throw new OrderError("Cupom inválido.");
  if (c.startsAt && c.startsAt > now) throw new OrderError("Este cupom ainda não começou a valer.");
  if (c.expiresAt && c.expiresAt < now) throw new OrderError("Este cupom expirou.");
  if (c.maxUses !== null && c.uses >= c.maxUses) throw new OrderError("Este cupom esgotou.");
  if (c.scope === "JOGO" && c.target !== listing.gameSlug) throw new OrderError("Este cupom não vale para este jogo.");
  if (c.scope === "ANUNCIO" && c.target !== listing.id) throw new OrderError("Este cupom não vale para este anúncio.");
  if (subtotal < c.minOrderCents) throw new OrderError(`Este cupom vale para compras a partir de ${money(c.minOrderCents)}.`);
  const discountCents = storeDiscountFor(c, subtotal);
  if (!discountCents) throw new OrderError("Este cupom não dá desconto neste pedido.");
  return discountCents;
}

export type ResolvedCoupon =
  | { kind: "NEXO"; code: string; discountCents: number }
  | { kind: "LOJA"; code: string; discountCents: number; coupon: StoreCoupon };

/** Descobre de quem é o cupom digitado (Nexo primeiro, depois a loja do anúncio) e calcula o desconto. Não reserva nada. */
export async function resolveCoupon(raw: string, buyerId: string, listing: CouponListing, subtotal: number): Promise<ResolvedCoupon> {
  const code = normalizeCode(raw);
  if (await db.coupon.findUnique({ where: { code }, select: { id: true } })) {
    const n = await applyCoupon(code, buyerId, subtotal);
    return { kind: "NEXO", code: n.code, discountCents: n.discountCents };
  }
  const c = await db.storeCoupon.findUnique({ where: { sellerId_code: { sellerId: listing.sellerId, code } } });
  if (!c) throw new OrderError("Cupom inválido.");
  if (await db.storeCouponUse.findUnique({ where: { couponId_buyerId: { couponId: c.id, buyerId } }, select: { id: true } })) throw new OrderError("Você já usou este cupom.");
  return { kind: "LOJA", code, discountCents: checkStoreCoupon(c, listing, subtotal), coupon: c };
}

/**
 * Reserva o uso antes de gerar a cobrança. Duas compras ao mesmo tempo não passam do limite
 * (incremento condicional) e o mesmo comprador não usa duas vezes (chave única no banco).
 */
export async function reserveStoreCoupon(couponId: string, buyerId: string) {
  try {
    return await db.$transaction(async (tx) => {
      const changed = await tx.$executeRaw`UPDATE "StoreCoupon" SET "uses" = "uses" + 1 WHERE "id" = ${couponId} AND "active" = true AND ("maxUses" IS NULL OR "uses" < "maxUses")`;
      if (changed !== 1) throw new OrderError("Este cupom esgotou.");
      return tx.storeCouponUse.create({ data: { couponId, buyerId }, select: { id: true } });
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw new OrderError("Você já usou este cupom.");
    throw e;
  }
}

/** Devolve o uso quando o pedido (ou a tentativa de pedido) não segue. */
export async function releaseStoreCoupon(client: Tx | typeof db, where: { useId?: string; orderId?: string }) {
  const use = where.useId ? await client.storeCouponUse.findUnique({ where: { id: where.useId } }) : where.orderId ? await client.storeCouponUse.findUnique({ where: { orderId: where.orderId } }) : null;
  if (!use) return;
  await client.storeCouponUse.delete({ where: { id: use.id } });
  await client.storeCoupon.update({ where: { id: use.couponId }, data: { uses: { decrement: 1 } } });
}

export const describeStoreCoupon = (c: Pick<StoreCoupon, "percentOff" | "amountOffCents" | "maxDiscountCents" | "minOrderCents">) =>
  (c.percentOff ? `${c.percentOff}% off${c.maxDiscountCents ? ` (até ${money(c.maxDiscountCents)})` : ""}` : `${money(c.amountOffCents)} off`) + (c.minOrderCents ? ` · mínimo ${money(c.minOrderCents)}` : "");

export type StoreCouponInput = { code: string; percentOff: string; amountOff: string; maxDiscount: string; minOrder: string; maxUses: string; scope: string; target: string; startsAt: string; expiresAt: string };

const reaisOrNull = (v: string) => {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 50_000) throw new OrderError("Valor inválido no cupom.");
  return Math.round(n * 100);
};

export async function createStoreCoupon(sellerId: string, i: StoreCouponInput) {
  const code = normalizeCode(i.code);
  if (!/^[A-Z0-9]{4,20}$/.test(code)) throw new OrderError("Código: 4 a 20 letras ou números, sem espaço.");
  const percentOff = i.percentOff.trim() ? Number(i.percentOff) : 0;
  const amountOffCents = reaisOrNull(i.amountOff) ?? 0;
  if (!percentOff === !amountOffCents) throw new OrderError("Preencha só um: porcentagem ou valor fixo.");
  if (percentOff && (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 90)) throw new OrderError("Porcentagem: número inteiro de 1 a 90.");
  const maxUses = i.maxUses.trim() ? Number(i.maxUses) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100_000)) throw new OrderError("Limite de usos inválido.");
  const scope = i.scope === "JOGO" || i.scope === "ANUNCIO" ? i.scope : "LOJA";
  let target = "";
  if (scope === "JOGO") {
    target = i.target.trim();
    if (!(await db.game.findUnique({ where: { slug: target }, select: { slug: true } }))) throw new OrderError("Escolha o jogo do cupom.");
  }
  if (scope === "ANUNCIO") {
    target = i.target.trim();
    const l = await db.listing.findUnique({ where: { id: target }, select: { sellerId: true } });
    if (!l || l.sellerId !== sellerId) throw new OrderError("Escolha um anúncio seu.");
  }
  const startsAt = i.startsAt ? new Date(`${i.startsAt}T00:00:00-03:00`) : null;
  const expiresAt = i.expiresAt ? new Date(`${i.expiresAt}T23:59:59-03:00`) : null;
  if ((startsAt && isNaN(+startsAt)) || (expiresAt && isNaN(+expiresAt))) throw new OrderError("Data inválida.");
  if (startsAt && expiresAt && expiresAt <= startsAt) throw new OrderError("A validade precisa terminar depois do início.");
  if (await db.coupon.findUnique({ where: { code }, select: { id: true } })) throw new OrderError("Esse código já é usado por um cupom da Nexo. Escolha outro.");
  if (await db.storeCoupon.findUnique({ where: { sellerId_code: { sellerId, code } }, select: { id: true } })) throw new OrderError("Você já tem um cupom com esse código.");
  const active = await db.storeCoupon.count({ where: { sellerId, active: true } });
  if (active >= 30) throw new OrderError("No máximo 30 cupons ativos por loja.");
  return db.storeCoupon.create({
    data: { sellerId, code, percentOff, amountOffCents, maxDiscountCents: reaisOrNull(i.maxDiscount), minOrderCents: reaisOrNull(i.minOrder) ?? 0, maxUses, scope, target, startsAt, expiresAt },
  });
}

export async function toggleStoreCoupon(sellerId: string, id: string) {
  const c = await db.storeCoupon.findUnique({ where: { id } });
  if (!c || c.sellerId !== sellerId) throw new OrderError("Cupom não encontrado.");
  await db.storeCoupon.update({ where: { id }, data: { active: !c.active } });
}
