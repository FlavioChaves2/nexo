import type { Order } from "@prisma/client";
import { money } from "./format";
import { notify } from "./notify";
import type { Tx } from "./orders";

// Convites: quem convidou ganha 3% do valor dos anúncios de cada pedido concluído do convidado,
// tanto quando ele compra quanto quando ele vende. Sai da taxa da Nexo; comprador e vendedor não pagam nada a mais.

export const REFERRAL_BPS = 300; // 3%
export const REF_COOKIE = "nexo_ref";
export const REF_COOKIE_DAYS = 30;

export const referralAmount = (o: { unitPriceCents: number; quantity: number }) => Math.round((o.unitPriceCents * o.quantity * REFERRAL_BPS) / 10000);

/** Chamado quando o pedido é concluído (confirmação ou disputa liberada ao vendedor). */
export async function payReferrals(tx: Tx, order: Order) {
  const amount = referralAmount(order);
  if (amount <= 0) return;
  const people = await tx.user.findMany({
    where: { id: { in: [order.buyerId, order.sellerId] } },
    select: { id: true, username: true, referredBy: { select: { id: true, suspendedAt: true } } },
  });
  for (const p of people) {
    const ref = p.referredBy;
    if (!ref || ref.suspendedAt) continue;
    const side = p.id === order.buyerId ? "COMPRA" : "VENDA";
    // Um pagamento por pedido e lado: se a conclusão rodar duas vezes, a trava do banco recusa a segunda.
    const created = await tx.referralEarning.createMany({ data: [{ referrerId: ref.id, orderId: order.id, side, amountCents: amount }], skipDuplicates: true });
    if (!created.count) continue;
    await tx.user.update({ where: { id: ref.id }, data: { balanceCents: { increment: amount } } });
    await notify(ref.id, `+${money(amount)} de convite`, `${p.username}, que você convidou, ${side === "COMPRA" ? "fez uma compra" : "fez uma venda"} na Nexo.`, "/conta/convites", tx);
  }
}
