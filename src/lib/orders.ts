import { randomInt } from "node:crypto";
import type { Order, Prisma } from "@prisma/client";
import { db } from "./db";
import { feeFor, money } from "./format";
import { createCardCharge, createPixCharge, type Payer } from "./payments";
import { CARD_ENABLED, CARD_MIN_CENTS, PLANS, checkoutTotals, isPlan, planCashback, type PayMethod, type PlanCode } from "./plans";
import { confirmDays, daysLabel } from "./constants";
import { after } from "next/server";
import { notify } from "./notify";
import { applyCoupon } from "./coupons";
import { payReferrals } from "./referrals";

// Regras da Garantia Nexo. Toda mudança de status usa updateMany com o status
// esperado no filtro: se duas requisições chegarem juntas, só uma passa.

export type Tx = Prisma.TransactionClient;

export class OrderError extends Error {}

export const sysMsg = (tx: Tx, orderId: string, body: string) => tx.message.create({ data: { orderId, body } });

export async function transition(tx: Tx, id: string, from: string[], data: Prisma.OrderUpdateManyMutationInput) {
  const { count } = await tx.order.updateMany({ where: { id, status: { in: from } }, data });
  if (count !== 1) throw new OrderError("O pedido mudou de status. Atualize a página.");
}

async function newOrderCode() {
  for (let i = 0; i < 10; i++) {
    const code = `NX-${randomInt(10000, 99999)}`;
    if (!(await db.order.findUnique({ where: { code } }))) return code;
  }
  throw new Error("Não foi possível gerar o código do pedido.");
}

export async function createOrder(input: { buyerId: string; listingId: string; quantity: number; buyerNote: string; couponCode?: string; payer?: Payer; method?: PayMethod; plan?: PlanCode }) {
  const listing = await db.listing.findUnique({ where: { id: input.listingId }, include: { seller: { select: { suspendedAt: true } } } });
  if (!listing || listing.status !== "ATIVO" || listing.seller.suspendedAt) throw new OrderError("Este anúncio não está disponível.");
  if (listing.reservedForId && listing.reservedForId !== input.buyerId) throw new OrderError("Este anúncio não está disponível.");
  if (listing.sellerId === input.buyerId) throw new OrderError("Você não pode comprar o próprio anúncio.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new OrderError("Quantidade inválida.");
  if (input.quantity > listing.stock) throw new OrderError(`Só há ${listing.stock} unidade(s) disponível(is).`);

  const grossCents = listing.priceCents * input.quantity;
  const coupon = input.couponCode ? await applyCoupon(input.couponCode, input.buyerId, grossCents) : null;
  const discountCents = coupon?.discountCents ?? 0;
  const method: PayMethod = input.method ?? "pix";
  const plan: PlanCode = input.plan ?? "BASICO";
  // O que o comprador paga: item (com cupom) + plano VIP + taxa do cartão. Sempre recalculado aqui.
  const { planCents, cardFeeCents, totalCents } = checkoutTotals(grossCents - discountCents, plan, method);
  if (method === "cartao" && !CARD_ENABLED) throw new OrderError("Pagamento com cartão em breve. Use Pix ou saldo.");
  if (method === "cartao" && totalCents < CARD_MIN_CENTS) throw new OrderError(`Cartão só a partir de ${money(CARD_MIN_CENTS)}. Use Pix ou saldo.`);
  const code = await newOrderCode();
  const bySaldo = method === "saldo";
  if (bySaldo) {
    const buyer = await db.user.findUniqueOrThrow({ where: { id: input.buyerId }, select: { balanceCents: true } });
    if (buyer.balanceCents < totalCents) throw new OrderError("Saldo insuficiente para esta compra.");
  }
  let charge: { id: string; copyPaste: string | null; expiresAt: Date | null; url?: string | null } = { id: `saldo_${code}`, copyPaste: null, expiresAt: null };
  if (!bySaldo) {
    try {
      charge = method === "cartao" ? await createCardCharge({ code, totalCents }, input.payer) : await createPixCharge({ code, totalCents }, input.payer);
    } catch (e) {
      console.error("Falha ao gerar cobrança:", e);
      throw new OrderError(`Não foi possível gerar ${method === "cartao" ? "o pagamento com cartão" : "o Pix"} agora. Confira seus dados e tente de novo.`);
    }
  }

  const order = await db.order.create({
    data: {
      code,
      buyerId: input.buyerId,
      sellerId: listing.sellerId,
      listingId: listing.id,
      quantity: input.quantity,
      unitPriceCents: listing.priceCents,
      totalCents,
      discountCents,
      couponCode: coupon?.code,
      plan,
      planCents,
      cardFeeCents,
      payMethod: method.toUpperCase(),
      paymentUrl: charge.url ?? null,
      feeCents: feeFor(grossCents),
      buyerNote: input.buyerNote,
      paymentId: charge.id,
      pixCode: charge.copyPaste,
      pixExpiresAt: charge.expiresAt,
      messages: { create: { body: bySaldo ? "Pedido criado." : `Pedido criado. Pague ${money(totalCents)} ${method === "cartao" ? "no cartão" : "no Pix"} para iniciar.${plan !== "BASICO" ? ` Plano ${PLANS[plan].name} ativo.` : ""}` } },
    },
  });
  if (bySaldo) {
    try {
      await payWithBalance(order.id, input.buyerId, totalCents);
    } catch (e) {
      // Saldo mudou entre a checagem e o débito: o pedido não segue.
      await db.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } });
      throw e;
    }
  }
  return order;
}

/** Pedido pago com o saldo da Nexo (sem Pix): estornos voltam para o saldo do comprador. */
export const paidWithBalance = (o: { paymentId: string | null }) => !!o.paymentId?.startsWith("saldo_");

/** Devolve ao saldo do comprador um pedido pago com saldo. */
export async function refundToBalance(tx: Tx, order: { id: string; buyerId: string; totalCents: number }) {
  await tx.user.update({ where: { id: order.buyerId }, data: { balanceCents: { increment: order.totalCents } } });
  return { id: `saldo_refund_${order.id}` };
}

/** Chamado pelo webhook do gateway (ou pelo botão de simulação no modo mock). */
export async function markOrderPaid(orderId: string) {
  return db.$transaction((tx) => payInTx(tx, orderId));
}

async function payInTx(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { listing: true } });
  if (order.status !== "AGUARDANDO_PAGAMENTO") return order;

  const reserved = await tx.listing.updateMany({
    where: { id: order.listingId, stock: { gte: order.quantity } },
    data: { stock: { decrement: order.quantity }, soldCount: { increment: order.quantity } },
  });
  if (reserved.count !== 1) {
    await transition(tx, order.id, ["AGUARDANDO_PAGAMENTO"], { status: "CANCELADO" });
    if (paidWithBalance(order)) {
      const r = await refundToBalance(tx, order);
      await tx.order.update({ where: { id: order.id }, data: { refundedAt: new Date(), refundId: r.id } });
      await sysMsg(tx, order.id, "O anúncio esgotou. O valor voltou para o seu saldo na Nexo.");
    } else {
      // Pix: o webhook vê o pedido cancelado e estorna no gateway.
      await sysMsg(tx, order.id, "Pagamento recebido, mas o anúncio esgotou. O valor será estornado.");
    }
    return order;
  }

  const now = new Date();
  await transition(tx, order.id, ["AGUARDANDO_PAGAMENTO"], { status: "PAGO", paidAt: now });
  await sysMsg(tx, order.id, `Pagamento aprovado. ${money(order.totalCents)} ficam retidos pela Nexo até você confirmar o recebimento.`);
  if (order.couponCode) await tx.coupon.update({ where: { code: order.couponCode }, data: { uses: { increment: 1 } } });
  const vip = order.plan === "PREMIUM" ? " · ⭐ Cliente VIP Premium: entregue com prioridade" : order.plan === "VIP" ? " · Cliente VIP" : "";
  await notify(order.sellerId, "Você vendeu!", `${order.listing.title} · ${order.listing.autoDelivery ? "entrega automática feita" : "entregue pelo pedido"}${vip}`, `/pedido/${order.code}`, tx);

  if (order.listing.autoDelivery) {
    const codes = await tx.autoCode.findMany({
      where: { listingId: order.listingId, orderId: null },
      take: order.quantity,
      orderBy: { createdAt: "asc" },
    });
    if (codes.length === order.quantity) {
      await tx.autoCode.updateMany({ where: { id: { in: codes.map((c) => c.id) } }, data: { orderId: order.id } });
      await transition(tx, order.id, ["PAGO"], {
        status: "ENTREGUE",
        deliveryText: codes.map((c) => c.code).join("\n"),
        deliveredAt: now,
        autoConfirmAt: addDays(now, confirmDays(order.listing.type) + extraDays(order.plan)),
      });
      await sysMsg(tx, order.id, 'Entrega automática concluída. O código está no quadro "Entrega".');
      await notify(order.buyerId, "Pedido entregue", `${order.listing.title}: o código já está no pedido.`, `/pedido/${order.code}`, tx);
    }
  }
  return order;
}

/** Paga o pedido com o saldo do comprador: débito e aprovação na mesma transação. */
async function payWithBalance(orderId: string, buyerId: string, totalCents: number) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: buyerId, balanceCents: { gte: totalCents } },
      data: { balanceCents: { decrement: totalCents } },
    });
    if (count !== 1) throw new OrderError("Saldo insuficiente para esta compra.");
    await sysMsg(tx, orderId, `Pago com saldo da Nexo (${money(totalCents)}).`);
    await payInTx(tx, orderId);
  });
}

export async function deliverOrder(orderId: string, sellerId: string, text: string) {
  const body = text.trim();
  if (body.length < 2) throw new OrderError("Escreva os dados da entrega.");
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { listing: { select: { type: true } } } });
    if (order.sellerId !== sellerId) throw new OrderError("Só o vendedor pode entregar este pedido.");
    const days = confirmDays(order.listing.type) + extraDays(order.plan);
    const now = new Date();
    await transition(tx, orderId, ["PAGO"], {
      status: "ENTREGUE",
      deliveryText: body.slice(0, 4000),
      deliveredAt: now,
      autoConfirmAt: addDays(now, days),
    });
    await sysMsg(tx, orderId, `O vendedor marcou o pedido como entregue. Confirme em até ${daysLabel(days)} ou abra uma disputa.`);
    await notify(order.buyerId, "Pedido entregue", `Confira a entrega do pedido #${order.code} e confirme o recebimento.`, `/pedido/${order.code}`, tx);
  });
}

/** O que o vendedor recebe: preço cheio menos a taxa (o cupom é pago pela Nexo). */
export const sellerNet = (o: { totalCents: number; discountCents: number; feeCents: number; planCents?: number; cardFeeCents?: number }) =>
  o.totalCents + o.discountCents - o.feeCents - (o.planCents ?? 0) - (o.cardFeeCents ?? 0);

/** Credita o vendedor e conta a venda para o nível dele. */
export async function payoutSeller(tx: Tx, order: Order) {
  const net = sellerNet(order);
  await tx.user.update({ where: { id: order.sellerId }, data: { balanceCents: { increment: net }, completedSales: { increment: 1 } } });
  await notify(order.sellerId, "Dinheiro liberado", `${money(net)} do pedido #${order.code} entraram no seu saldo.`, "/conta?aba=saldo", tx);
  // Primeira venda concluída: os 20 primeiros vendedores reais ganham o título Fundador.
  // Roda depois da resposta (com a venda já gravada); falha aqui não afeta o pagamento.
  const grant = () => import("./titles").then((t) => t.grantFounderIfEligible(order.sellerId)).catch((e) => console.error("Fundador:", e));
  try {
    after(grant);
  } catch {
    setTimeout(grant, 2000); // fora de uma requisição (scripts)
  }
  return net;
}

async function complete(tx: Tx, order: Order, auto: boolean) {
  await transition(tx, order.id, ["ENTREGUE"], { status: "CONCLUIDO", completedAt: new Date() });
  await payoutSeller(tx, order);
  await payReferrals(tx, order);
  // O chat é visto pelas duas partes: o valor líquido do vendedor fica só na visão dele.
  await sysMsg(
    tx,
    order.id,
    auto
      ? "Confirmação automática: o prazo para conferir terminou. Pagamento liberado ao vendedor."
      : "Recebimento confirmado. Pagamento liberado ao vendedor.",
  );
  // Cashback dos planos VIP: volta em saldo para o comprador, pago do valor do plano.
  const cashback = planCashback(order.plan, order.totalCents - order.planCents - order.cardFeeCents);
  if (cashback > 0) {
    await tx.user.update({ where: { id: order.buyerId }, data: { balanceCents: { increment: cashback } } });
    await tx.order.update({ where: { id: order.id }, data: { cashbackCents: cashback } });
    await notify(order.buyerId, `${money(cashback)} de volta no seu saldo`, `Cashback do plano ${PLANS[order.plan as PlanCode].name} no pedido #${order.code}.`, "/conta?aba=saldo", tx);
  }
}

/** Dias extras para conferir a entrega, conforme o plano VIP do pedido. */
const extraDays = (plan: string) => (isPlan(plan) ? PLANS[plan].extraDays : 0);

export async function confirmOrder(orderId: string, buyerId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.buyerId !== buyerId) throw new OrderError("Só o comprador pode confirmar.");
    await complete(tx, order, false);
  });
}

export async function disputeOrder(orderId: string, buyerId: string, reason: string) {
  const why = reason.trim();
  if (why.length < 10) throw new OrderError("Conte em pelo menos 10 caracteres o que aconteceu.");
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.buyerId !== buyerId) throw new OrderError("Só o comprador pode abrir disputa.");
    await transition(tx, orderId, ["PAGO", "ENTREGUE"], { status: "DISPUTA", disputedAt: new Date(), disputeReason: why.slice(0, 1000) });
    await sysMsg(tx, orderId, "Disputa aberta. Um mediador da Nexo vai analisar o caso. O valor continua retido.");
    await notify(order.sellerId, "Disputa aberta", `O comprador do pedido #${order.code} relatou um problema.`, `/pedido/${order.code}`, tx);
  });
}

export async function cancelOrder(orderId: string, buyerId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.buyerId !== buyerId) throw new OrderError("Só o comprador pode cancelar.");
    await transition(tx, orderId, ["AGUARDANDO_PAGAMENTO"], { status: "CANCELADO" });
    await sysMsg(tx, orderId, "Pedido cancelado pelo comprador antes do pagamento.");
  });
}

export async function reviewOrder(orderId: string, buyerId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new OrderError("Escolha de 1 a 5 estrelas.");
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { review: true } });
  if (order.buyerId !== buyerId) throw new OrderError("Só o comprador pode avaliar.");
  if (order.status !== "CONCLUIDO") throw new OrderError("Avalie depois de concluir o pedido.");
  if (order.review) throw new OrderError("Você já avaliou este pedido.");
  // Clique duplo: a segunda avaliação bate na trava do banco (um review por pedido) e vira aviso.
  await db.$transaction([
    db.review.create({ data: { orderId, authorId: buyerId, sellerId: order.sellerId, rating, comment: comment.trim().slice(0, 500) } }),
    db.user.update({ where: { id: order.sellerId }, data: { ratingSum: { increment: rating }, ratingCount: { increment: 1 } } }),
    db.notification.create({ data: { userId: order.sellerId, title: `Nova avaliação: ${rating} estrela${rating > 1 ? "s" : ""}`, body: comment.trim().slice(0, 300), href: `/pedido/${order.code}` } }),
  ]).catch((e) => {
    if ((e as { code?: string }).code === "P2002") throw new OrderError("Você já avaliou este pedido.");
    throw e;
  });
}

/**
 * Aplica os prazos vencidos: Pix expirado vira CANCELADO e entrega sem
 * resposta vira CONCLUIDO. Roda ao abrir pedidos/conta; em produção, rode
 * também num cron a cada hora.
 */
export async function settleExpired(where: Prisma.OrderWhereInput) {
  const now = new Date();
  const due = await db.order.findMany({
    where: {
      AND: [
        where,
        {
          OR: [
            { status: "AGUARDANDO_PAGAMENTO", pixExpiresAt: { lt: now } },
            { status: "ENTREGUE", autoConfirmAt: { lt: now } },
          ],
        },
      ],
    },
  });
  for (const order of due) {
    try {
      await db.$transaction(async (tx) => {
        if (order.status === "ENTREGUE") return complete(tx, order, true);
        await transition(tx, order.id, ["AGUARDANDO_PAGAMENTO"], { status: "CANCELADO" });
        await sysMsg(tx, order.id, order.payMethod === "CARTAO" ? "O prazo para pagar no cartão terminou e o pedido foi cancelado." : "O Pix expirou e o pedido foi cancelado.");
      });
    } catch (e) {
      if (!(e instanceof OrderError)) throw e;
    }
  }
}

/** Estatísticas públicas do vendedor. */
export async function sellerStats(sellerId: string) {
  const [sales, agg, positive] = await Promise.all([
    db.order.count({ where: { sellerId, status: "CONCLUIDO" } }),
    db.review.aggregate({ where: { sellerId }, _count: true, _avg: { rating: true } }),
    db.review.count({ where: { sellerId, rating: { gte: 4 } } }),
  ]);
  return {
    sales,
    reviews: agg._count,
    avg: agg._avg.rating ?? 0,
    positivePct: agg._count ? (positive / agg._count) * 100 : 100,
  };
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86_400_000);
}
