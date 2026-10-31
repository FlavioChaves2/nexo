"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { OrderError } from "@/lib/orders";
import { decideVerification, requestVerification, withdrawVerification } from "@/lib/external-profiles";

export type ExternalState = { error?: string; ok?: string } | undefined;

async function guard(fn: () => Promise<unknown>, ok: string, paths: string[]): Promise<ExternalState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  for (const p of paths) revalidatePath(p);
  return { ok };
}

export async function requestVerificationAction(_: ExternalState, form: FormData): Promise<ExternalState> {
  const user = await requireUser("/conta/perfis-externos");
  return guard(
    () => requestVerification(user.id, { platform: String(form.get("platform") ?? ""), url: String(form.get("url") ?? ""), handle: String(form.get("handle") ?? "") }),
    "Pedido criado. Coloque o código no seu perfil externo e aguarde a conferência da equipe.",
    ["/conta/perfis-externos"],
  );
}

export async function withdrawVerificationAction(id: string): Promise<ExternalState> {
  const user = await requireUser("/conta/perfis-externos");
  return guard(() => withdrawVerification(user.id, id), "Removido.", ["/conta/perfis-externos", `/loja/${user.username}`]);
}

export async function decideVerificationAction(id: string, _: ExternalState, form: FormData): Promise<ExternalState> {
  const admin = await requireAdmin();
  const d = form.get("decision");
  if (d !== "APROVAR" && d !== "RECUSAR" && d !== "REVOGAR") return { error: "Escolha a decisão." };
  return guard(() => decideVerification(admin.id, id, d, String(form.get("note") ?? "")), "Decisão registrada.", ["/admin/verificacoes"]);
}
