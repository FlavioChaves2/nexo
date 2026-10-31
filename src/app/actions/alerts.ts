"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseReais } from "@/lib/format";
import { OrderError } from "@/lib/orders";
import { saveAlert } from "@/lib/alerts";

export type AlertState = { error?: string; ok?: string } | undefined;

export async function saveAlertAction(_: AlertState, form: FormData): Promise<AlertState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta para criar alertas." };
  const max = String(form.get("max") ?? "");
  const maxCents = max ? parseReais(max) : NaN;
  try {
    await saveAlert(user.id, {
      gameSlug: String(form.get("jogo") ?? "") || null,
      type: String(form.get("tipo") ?? "") || null,
      q: String(form.get("q") ?? ""),
      maxCents: Number.isFinite(maxCents) ? maxCents : null,
    });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath("/conta/alertas");
  return { ok: "Alerta criado! Você recebe um aviso no sino e no celular quando aparecer um anúncio assim." };
}

export async function deleteAlertAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.savedAlert.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/conta/alertas");
}
