import { randomInt } from "node:crypto";
import type { Order, Prisma } from "@prisma/client";
import { db } from "./db";
import { feeFor, money } from "./format";
import { createPixCharge } from "./payments";
import { AUTO_CONFIRM_DAYS } from "./constants";
import { notify } from "./notify";
import { applyCoupon } from "./coupons";

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

export async function createOrder(input: { buyerId: string; listingId: string; quantity: number; buyerNote: string; couponCode?: string }) {
  const listing = await db.listing.findUnique({ where: { id: input.listingId }, include: { seller: { select: { suspendedAt: true } } } });
  if (!listing || listing.status !== "ATIVO" || listing.seller.suspendedAt) throw new OrderError("Este anúncio não está disponível.");
  if (listing.sellerId === input.buyerId) throw new OrderError("Você não pode comprar o próprio anúncio.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new OrderError("Quantidade inválida.");
  if (input.quantity > listing.stock) throw new OrderError(`Só há ${listing.stock} unidade(s) disponível(is).`);

  const grossCents = listing.priceCents * input.quantity;
  const coupon = input.couponCode ? await applyCoupon(input.couponCode, input.buyerId, grossCents) : null;
  const discountCents = coupon?.discountCents ?? 0;
  const totalCents = grossCents - discountCents; // o que o comprador paga
  const code = await newOrderCode();
  const charge = await createPixCharge({ code, totalCents });

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
      feeCents: feeFor(grossCents),
      buyerNote: input.buyerNote,
      paymentId: charge.id,
      pixCode: charge.copyPaste,
      pixExpiresAt: charge.expiresAt,
      messages: { create: { body: `Pedido criado. Pague o Pix de ${money(totalCents)} para iniciar.` } },
    },
  });
  return order;
}

/** Chamado pelo webhook do gateway (ou pelo botão de simulação no modo mock). */
export async function markOrderPaid(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { listing: true } });
    if (order.status !== "AGUARDANDO_PAGAMENTO") return order;

    const reserved = await tx.listing.updateMany({
      where: { id: order.listingId, stock: { gte: order.quantity } },
      data: { stock: { decrement: order.quantity }, soldCount: { increment: order.quantity } },
    });
    if (reserved.count !== 1) {
      // Sem estoque: em produção, aqui entra o estorno automático do Pix.
      await transition(tx, order.id, ["AGUARDANDO_PAGAMENTO"], { status: "CANCELADO" });
      await sysMsg(tx, order.id, "Pagamento recebido, mas o anúncio esgotou. O valor será estornado.");
      return order;
    }

    const now = new Date();
    await transition(tx, order.id, ["AGUARDANDO_PAGAMENTO"], { status: "PAGO", paidAt: now });
    await sysMsg(tx, order.id, `Pagamento aprovado. ${money(order.totalCents)} ficam retidos pela Nexo até você confirmar o recebimento.`);
    if (order.couponCode) await tx.coupon.update({ where: { code: order.couponCode }, data: { uses: { increment: 1 } } });
    await notify(order.sellerId, "Você vendeu!", `${order.listing.title} · ${order.listing.autoDelivery ? "entrega automática feita" : "entregue pelo pedido"}`, `/pedido/${order.code}`, tx);

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
          autoConfirmAt: addDays(now, AUTO_CONFIRM_DAYS),
        });
        await sysMsg(tx, order.id, 'Entrega automática concluída. O código está no quadro "Entrega".');
        await notify(order.buyerId, "Pedido entregue", `${order.listing.title}: o código já está no pedido.`, `/pedido/${order.code}`, tx);
      }
    }
    return order;
  });
}

export async function deliverOrder(orderId: string, sellerId: string, text: string) {
  const body = text.trim();
  if (body.length < 2) throw new OrderError("Escreva os dados da entrega.");
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.sellerId !== sellerId) throw new OrderError("Só o vendedor pode entregar este pedido.");
    const now = new Date();
    await transition(tx, orderId, ["PAGO"], {
      status: "ENTREGUE",
      deliveryText: body.slice(0, 4000),
      deliveredAt: now,
      autoConfirmAt: addDays(now, AUTO_CONFIRM_DAYS),
    });
    await sysMsg(tx, orderId, `O vendedor marcou o pedido como entregue. Confirme em até ${AUTO_CONFIRM_DAYS} dias ou abra uma disputa.`);
    await notify(order.buyerId, "Pedido entregue", `Confira a entrega do pedido #${order.code} e confirme o recebimento.`, `/pedido/${order.code}`, tx);
  });
}

/** O que o vendedor recebe: preço cheio menos a taxa (o cupom é pago pela Nexo). */
export const sellerNet = (o: { totalCents: number; discountCents: number; feeCents: number }) => o.totalCents + o.discountCents - o.feeCents;

/** Credita o vendedor e conta a venda para o nível dele. */
export async function payoutSeller(tx: Tx, order: Order) {
  const net = sellerNet(order);
  await tx.user.update({ where: { id: order.sellerId }, data: { balanceCents: { increment: net }, completedSales: { increment: 1 } } });
  await notify(order.sellerId, "Dinheiro liberado", `${money(net)} do pedido #${order.code} entraram no seu saldo.`, "/conta?aba=saldo", tx);
  return net;
}

async function complete(tx: Tx, order: Order, auto: boolean) {
  await transition(tx, order.id, ["ENTREGUE"], { status: "CONCLUIDO", completedAt: new Date() });
  const net = await payoutSeller(tx, order);
  await sysMsg(
    tx,
    order.id,
    auto
      ? `Confirmação automática após ${AUTO_CONFIRM_DAYS} dias. ${money(net)} liberados para o vendedor.`
      : `Recebimento confirmado. ${money(net)} liberados para o vendedor.`,
  );
}

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
  await db.$transaction([
    db.review.create({ data: { orderId, authorId: buyerId, sellerId: order.sellerId, rating, comment: comment.trim().slice(0, 500) } }),
    db.user.update({ where: { id: order.sellerId }, data: { ratingSum: { increment: rating }, ratingCount: { increment: 1 } } }),
    db.notification.create({ data: { userId: order.sellerId, title: `Nova avaliação: ${rating} estrela${rating > 1 ? "s" : ""}`, body: comment.trim().slice(0, 300), href: `/pedido/${order.code}` } }),
  ]);
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
        await sysMsg(tx, order.id, "O Pix expirou e o pedido foi cancelado.");
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
