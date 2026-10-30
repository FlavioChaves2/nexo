import webpush from "web-push";
import { db } from "./db";

// Notificações no celular (Web Push). Sem as chaves VAPID no ambiente, fica desligado e o site segue normal.
// Gere as chaves uma vez com: npx web-push generate-vapid-keys

export const pushPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";
const enabled = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function setup() {
  if (configured) return;
  webpush.setVapidDetails(`mailto:${process.env.VAPID_CONTACT ?? "contato@nexopoint.com.br"}`, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

/** Manda para todos os aparelhos da pessoa. Aparelho que desinstalou (404/410) sai da lista. */
export async function sendPush(userId: string, title: string, body: string, href: string) {
  if (!enabled()) return;
  setup();
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify({ title, body, href });
  await Promise.all(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86_400 }).catch(async (e) => {
        if (e?.statusCode === 404 || e?.statusCode === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => null);
        else console.error("Falha no push:", e?.statusCode ?? e);
      }),
    ),
  );
}
