"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isMockPayments } from "@/lib/payments";
import {
  OrderError,
  cancelOrder,
  confirmOrder,
  createOrder,
  deliverOrder,
  disputeOrder,
  markOrderPaid,
  reviewOrder,
} from "@/lib/orders";

export type ActionState = { error?: string; ok?: boolean } | undefined;

/** Roda a ação e converte erros de regra em mensagem para o formulário. */
async function run(code: string, fn: (orderId: string, userId: string) => Promise<unknown>): Promise<ActionState> {
  const user = await requireUser(`/pedido/${code}`);
  const order = await db.order.findUnique({ where: { code }, select: { id: true } });
  if (!order) return { error: "Pedido não encontrado." };
  try {
    await fn(order.id, user.id);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/pedido/${code}`);
  return { ok: true };
}

export async function startCheckout(_: ActionState, form: FormData): Promise<ActionState> {
  const listingId = String(form.get("listingId") ?? "");
  const user = await requireUser(`/anuncio/${listingId}`);
  let code: string;
  try {
    const order = await createOrder({
      buyerId: user.id,
      listingId,
      quantity: Number(form.get("qty")) || 1,
      buyerNote: String(form.get("note") ?? "").trim().slice(0, 40),
      couponCode: String(form.get("coupon") ?? "") || undefined,
    });
    code = order.code;
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  redirect(`/pedido/${code}`);
}

export async function simulatePayment(code: string) {
  if (!isMockPayments()) throw new Error("Simulação de pagamento só existe no modo de teste.");
  return run(code, async (orderId, userId) => {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.buyerId !== userId) throw new OrderError("Só o comprador pode pagar.");
    await markOrderPaid(orderId);
  });
}

export async function deliverAction(code: string, _: ActionState, form: FormData) {
  return run(code, (orderId, userId) => deliverOrder(orderId, userId, String(form.get("text") ?? "")));
}

export async function confirmAction(code: string) {
  return run(code, confirmOrder);
}

export async function disputeAction(code: string, _: ActionState, form: FormData) {
  return run(code, (orderId, userId) => disputeOrder(orderId, userId, String(form.get("reason") ?? "")));
}

export async function cancelAction(code: string) {
  return run(code, cancelOrder);
}

export async function reviewAction(code: string, _: ActionState, form: FormData) {
  return run(code, (orderId, userId) => reviewOrder(orderId, userId, Number(form.get("rating")), String(form.get("comment") ?? "")));
}
