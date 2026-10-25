"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { OrderError } from "@/lib/orders";
import { parseReais } from "@/lib/format";
import { normalizeCode } from "@/lib/coupons";
import {
  approveWithdrawal,
  mediatorMessage,
  refundDispute,
  rejectWithdrawal,
  releaseDispute,
  removeListing,
  restoreListing,
  resolveReports,
  reviewVerification,
  suspendUser,
  unsuspendUser,
  createCoupon,
  toggleCoupon,
} from "@/lib/admin";

export type AdminState = { error?: string; ok?: string } | undefined;

async function run(paths: string[], fn: (adminId: string) => Promise<unknown>, ok: string): Promise<AdminState> {
  const admin = await requireAdmin();
  try {
    await fn(admin.id);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  for (const p of [...paths, "/admin"]) revalidatePath(p);
  return { ok };
}

export async function decideDispute(orderId: string, code: string, _: AdminState, form: FormData): Promise<AdminState> {
  const note = String(form.get("note") ?? "");
  const decision = form.get("decision");
  if (decision !== "liberar" && decision !== "reembolsar") return { error: "Escolha a decisão." };
  return run(
    [`/admin/disputas/${code}`, "/admin/disputas", `/pedido/${code}`],
    (adminId) => (decision === "liberar" ? releaseDispute(orderId, adminId, note) : refundDispute(orderId, adminId, note)),
    decision === "liberar" ? "Valor liberado ao vendedor." : "Valor estornado ao comprador.",
  );
}

export async function sendMediatorMessage(orderId: string, code: string, _: AdminState, form: FormData): Promise<AdminState> {
  return run([`/admin/disputas/${code}`], (adminId) => mediatorMessage(orderId, adminId, String(form.get("text") ?? "")), "Mensagem enviada.");
}

export async function approveWithdrawalAction(id: string): Promise<AdminState> {
  return run(["/admin/saques"], (adminId) => approveWithdrawal(id, adminId), "Saque pago.");
}

export async function rejectWithdrawalAction(id: string, _: AdminState, form: FormData): Promise<AdminState> {
  return run(["/admin/saques"], (adminId) => rejectWithdrawal(id, adminId, String(form.get("note") ?? "")), "Saque recusado e valor devolvido.");
}

export async function removeListingAction(id: string, _: AdminState, form: FormData): Promise<AdminState> {
  return run(["/admin/anuncios", `/anuncio/${id}`], (adminId) => removeListing(id, adminId, String(form.get("note") ?? "")), "Anúncio removido.");
}

export async function restoreListingAction(id: string): Promise<AdminState> {
  return run(["/admin/anuncios", `/anuncio/${id}`], (adminId) => restoreListing(id, adminId), "Anúncio restaurado (pausado).");
}

export async function suspendUserAction(id: string, _: AdminState, form: FormData): Promise<AdminState> {
  return run(["/admin/usuarios"], (adminId) => suspendUser(id, adminId, String(form.get("note") ?? "")), "Conta suspensa.");
}

export async function unsuspendUserAction(id: string): Promise<AdminState> {
  return run(["/admin/usuarios"], (adminId) => unsuspendUser(id, adminId), "Conta reativada.");
}

export async function reviewVerificationAction(id: string, _: AdminState, form: FormData): Promise<AdminState> {
  const approve = form.get("decision") === "aprovar";
  return run(["/admin/usuarios"], (adminId) => reviewVerification(id, adminId, approve, String(form.get("note") ?? "")), approve ? "Vendedor verificado." : "Verificação recusada.");
}

export async function resolveReportsAction(listingId: string, _: AdminState, form: FormData): Promise<AdminState> {
  const valid = form.get("decision") === "procedente";
  return run(["/admin/denuncias", `/anuncio/${listingId}`], (adminId) => resolveReports(listingId, adminId, valid, String(form.get("note") ?? "")), valid ? "Anúncio removido." : "Denúncias descartadas.");
}

export async function createCouponAction(_: AdminState, form: FormData): Promise<AdminState> {
  const num = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v ? parseReais(v) : null;
  };
  const kind = form.get("kind");
  const value = String(form.get("value") ?? "").trim();
  const days = Number(form.get("days")) || 0;
  const uses = Number(form.get("maxUses")) || 0;
  const input = {
    code: normalizeCode(String(form.get("code") ?? "")),
    percentOff: kind === "percent" ? Math.round(Number(value.replace(",", "."))) || 0 : 0,
    amountOffCents: kind === "amount" ? parseReais(value) || 0 : 0,
    maxDiscountCents: kind === "percent" ? num("maxDiscount") : null,
    minOrderCents: num("minOrder") ?? 0,
    maxUses: uses > 0 ? uses : null,
    expiresAt: days > 0 ? new Date(Date.now() + days * 86_400_000) : null,
  };
  return run(["/admin/cupons"], (adminId) => createCoupon(adminId, input), `Cupom ${input.code} criado.`);
}

export async function toggleCouponAction(id: string): Promise<AdminState> {
  return run(["/admin/cupons"], (adminId) => toggleCoupon(id, adminId), "Cupom atualizado.");
}
