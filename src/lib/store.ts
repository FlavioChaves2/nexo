import { db } from "./db";

// Loja pública do vendedor: dados reais de atendimento calculados pelos pedidos.

/** Tempo mediano entre pagamento e entrega feita pelo vendedor (sem entrega automática), nos últimos 90 dias. */
export async function deliveryStats(sellerId: string) {
  const since = new Date(Date.now() - 90 * 86_400_000);
  const rows = await db.order.findMany({
    where: { sellerId, paidAt: { gte: since }, deliveredAt: { not: null }, listing: { autoDelivery: false } },
    select: { paidAt: true, deliveredAt: true },
    take: 300,
    orderBy: { paidAt: "desc" },
  });
  const mins = rows.map((r) => (r.deliveredAt!.getTime() - r.paidAt!.getTime()) / 60_000).filter((m) => m >= 0).sort((a, b) => a - b);
  // Com poucas entregas o número engana: só mostra a partir de 3.
  if (mins.length < 3) return { count: mins.length, medianMin: null };
  return { count: mins.length, medianMin: mins[Math.floor(mins.length / 2)] };
}

export function durationLabel(min: number) {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} dias`;
}

export const storeLink = (username: string) => `/v/${encodeURIComponent(username)}`;

export async function isFollowing(followerId: string | undefined, sellerId: string) {
  if (!followerId) return false;
  return !!(await db.storeFollow.findUnique({ where: { followerId_sellerId: { followerId, sellerId } } }));
}

/**
 * Avisa quem segue a loja sobre um anúncio novo. Para não lotar o sino, cada seguidor
 * recebe no máximo um aviso desta loja por dia (os seguintes ficam visíveis na própria loja).
 */
export async function notifyFollowers(listing: { id: string; sellerId: string; title: string }) {
  const { notify } = await import("./notify");
  const seller = await db.user.findUniqueOrThrow({ where: { id: listing.sellerId }, select: { username: true, storeName: true } });
  const name = seller.storeName || seller.username;
  const href = `/loja/${seller.username}`;
  const since = new Date(Date.now() - 86_400_000);
  const follows = await db.storeFollow.findMany({ where: { sellerId: listing.sellerId }, select: { followerId: true }, take: 5000 });
  for (const { followerId } of follows) {
    const recent = await db.notification.findFirst({ where: { userId: followerId, href, createdAt: { gte: since } }, select: { id: true } });
    if (recent) continue;
    await notify(followerId, `Novidade na loja ${name}`, listing.title, href);
  }
}
