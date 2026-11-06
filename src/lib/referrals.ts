import type { Order } from "@prisma/client";
import { money } from "./format";
import { notify } from "./notify";
import type { Tx } from "./orders";

// Convites: quem convidou ganha 3% do valor dos anúncios de cada pedido concluído do convidado,
// tanto quando ele compra quanto quando ele vende, e mais R$ 5 na primeira venda dele (payFirstSaleBonus).
// Sai da Nexo; comprador e vendedor não pagam nada a mais.

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
  await payFirstSaleBonus(tx, order);
}

// Bônus de indicação: R$ 5 fixos quando o convidado conclui a PRIMEIRA venda.
// Travas contra conta falsa (convidar a si mesmo e comprar de si mesmo): venda de pelo menos R$ 20,
// comprador não é quem convidou nem outro convidado dele, cadastros de IPs diferentes, e até 20 bônus por mês.
export const FIRST_SALE_BONUS_CENTS = 500;
export const FIRST_SALE_BONUS_MIN_CENTS = 2000;
const BONUS_MONTHLY_CAP = 20;

async function payFirstSaleBonus(tx: Tx, order: Order) {
  if (order.unitPriceCents * order.quantity < FIRST_SALE_BONUS_MIN_CENTS) return;
  const [seller, buyer] = await Promise.all([
    tx.user.findUnique({ where: { id: order.sellerId }, select: { username: true, email: true, referredById: true, referredBy: { select: { id: true, email: true, suspendedAt: true } } } }),
    tx.user.findUnique({ where: { id: order.buyerId }, select: { email: true, referredById: true } }),
  ]);
  const ref = seller?.referredBy;
  if (!seller || !buyer || !ref || ref.suspendedAt) return;
  if (order.buyerId === ref.id || buyer.referredById === ref.id) return;
  // Primeira venda concluída deste vendedor (a deste pedido já está marcada como concluída).
  const sales = await tx.order.count({ where: { sellerId: order.sellerId, status: "CONCLUIDO" } });
  if (sales !== 1) return;
  const ips = await tx.loginAttempt.findMany({ where: { email: { in: [seller.email, buyer.email, ref.email].map((e) => `cadastro:${e}`) } }, select: { email: true, ip: true } });
  const ipOf = (e: string) => ips.find((i) => i.email === `cadastro:${e}`)?.ip;
  const [sIp, bIp, rIp] = [ipOf(seller.email), ipOf(buyer.email), ipOf(ref.email)];
  if ((sIp && (sIp === bIp || sIp === rIp)) || (bIp && bIp === rIp)) return;
  const month = await tx.referralEarning.count({ where: { referrerId: ref.id, side: "BONUS", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } });
  if (month >= BONUS_MONTHLY_CAP) return;
  const created = await tx.referralEarning.createMany({ data: [{ referrerId: ref.id, orderId: order.id, side: "BONUS", amountCents: FIRST_SALE_BONUS_CENTS }], skipDuplicates: true });
  if (!created.count) return;
  await tx.user.update({ where: { id: ref.id }, data: { balanceCents: { increment: FIRST_SALE_BONUS_CENTS } } });
  await notify(ref.id, `+${money(FIRST_SALE_BONUS_CENTS)} de bônus de convite`, `${seller.username}, que você convidou, concluiu a primeira venda na Nexo.`, "/conta/convites", tx);
}
