"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isMockPayments, needsPayerDocument, type Payer } from "@/lib/payments";
import { validCpf } from "@/lib/trust";
import { isPlan, type PayMethod, type PlanCode } from "@/lib/plans";
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
  const m = form.get("method");
  const method: PayMethod = m === "saldo" || m === "cartao" ? m : "pix";
  const planRaw = form.get("plan");
  const plan: PlanCode = isPlan(planRaw) ? planRaw : "BASICO";
  let payer: Payer | undefined;
  if (method !== "saldo" && needsPayerDocument()) {
    const name = String(form.get("payerName") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
    const cpf = String(form.get("payerCpf") ?? "").replace(/\D/g, "");
    if (name.split(" ").length < 2) return { error: "Informe seu nome completo." };
    if (!validCpf(cpf)) return { error: "CPF inválido." };
    payer = { name, cpf, email: user.email };
  }
  let code: string;
  try {
    const order = await createOrder({
      buyerId: user.id,
      listingId,
      quantity: Number(form.get("qty")) || 1,
      buyerNote: String(form.get("note") ?? "").trim().slice(0, 40),
      couponCode: String(form.get("coupon") ?? "") || undefined,
      payer,
      method,
      plan,
    });
    code = order.code;
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  // Pago com saldo já chega aprovado: o ?pago=1 dispara a comemoração na página do pedido.
  redirect(`/pedido/${code}${method === "saldo" ? "?pago=1" : ""}`);
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
