import type { Coupon } from "@prisma/client";
import { db } from "./db";
import { money } from "./format";
import { OrderError } from "./orders";

// Cupons da Nexo. O comprador paga menos e o vendedor recebe sobre o preço cheio:
// o desconto sai da taxa da plataforma. Cada pessoa usa cada cupom uma vez.

const MIN_TO_PAY = 100; // o Pix nunca fica abaixo de R$ 1,00

export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s/g, "");

export function discountFor(c: Coupon, subtotal: number) {
  let d = c.percentOff ? Math.round((subtotal * c.percentOff) / 100) : c.amountOffCents;
  if (c.maxDiscountCents) d = Math.min(d, c.maxDiscountCents);
  return Math.max(0, Math.min(d, subtotal - MIN_TO_PAY));
}

export async function applyCoupon(rawCode: string, buyerId: string, subtotal: number) {
  const code = normalizeCode(rawCode);
  const c = await db.coupon.findUnique({ where: { code } });
  if (!c || !c.active) throw new OrderError("Cupom inválido.");
  if (c.expiresAt && c.expiresAt < new Date()) throw new OrderError("Este cupom expirou.");
  if (c.maxUses !== null && c.uses >= c.maxUses) throw new OrderError("Este cupom esgotou.");
  if (subtotal < c.minOrderCents) throw new OrderError(`Este cupom vale para compras a partir de ${money(c.minOrderCents)}.`);
  // Conta também pedidos ainda não pagos: senão dá para abrir vários Pix com o mesmo cupom e pagar todos.
  const used = await db.order.count({ where: { buyerId, couponCode: code, status: { not: "CANCELADO" } } });
  if (used) throw new OrderError("Você já usou este cupom.");
  const discountCents = discountFor(c, subtotal);
  if (!discountCents) throw new OrderError("Este cupom não dá desconto neste pedido.");
  return { code, discountCents, coupon: c };
}

export const describeCoupon = (c: Coupon) =>
  (c.percentOff ? `${c.percentOff}% off${c.maxDiscountCents ? ` (até ${money(c.maxDiscountCents)})` : ""}` : `${money(c.amountOffCents)} off`) +
  (c.minOrderCents ? ` · mínimo ${money(c.minOrderCents)}` : "");
