"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendPush } from "@/lib/push";

const subSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

/** Guarda o aparelho que aceitou notificações. O mesmo aparelho em outra conta passa para a conta atual. */
export async function savePushSubscription(raw: unknown): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta para ativar as notificações." };
  const parsed = subSchema.safeParse(raw);
  if (!parsed.success) return { error: "Não foi possível ativar neste aparelho." };
  const { endpoint, keys } = parsed.data;
  const fresh = !(await db.pushSubscription.findUnique({ where: { endpoint } }));
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });
  if (fresh) await sendPush(user.id, "Notificações ativadas! 🎉", "Você vai saber na hora de vendas, ofertas e entregas.", "/notificacoes");
  return { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  const user = await getCurrentUser();
  if (!user || typeof endpoint !== "string") return;
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}
