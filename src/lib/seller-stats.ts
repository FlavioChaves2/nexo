import { db } from "./db";
import { sellerNet } from "./orders";

// Números do painel do vendedor: vendas e receita por dia, visitas dos anúncios e efeito da Órbita.

/** Dia AAAA-MM-DD no horário de Brasília. */
export const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

/** Soma uma visita do dia ao anúncio. */
export async function countView(listingId: string) {
  const day = dayKey(new Date());
  await db.listingViewDay.upsert({ where: { listingId_day: { listingId, day } }, create: { listingId, day, count: 1 }, update: { count: { increment: 1 } } });
}

export type DayPoint = { day: string; sales: number; net: number; views: number };

export async function sellerDashboard(sellerId: string, days: number) {
  const now = Date.now();
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now - (days - 1 - i) * 86_400_000)));
  const since = new Date(now - days * 86_400_000);
  const [done, paid, open, views, listings, boosts] = await Promise.all([
    db.order.findMany({ where: { sellerId, status: "CONCLUIDO", completedAt: { gte: since } } }),
    db.order.count({ where: { sellerId, paidAt: { gte: since } } }),
    db.order.count({ where: { sellerId, status: { in: ["PAGO", "ENTREGUE", "DISPUTA"] } } }),
    db.listingViewDay.findMany({ where: { listing: { sellerId }, day: { gte: keys[0] } } }),
    db.listing.findMany({ where: { sellerId, status: { not: "REMOVIDO" } }, select: { id: true, title: true, status: true, stock: true, priceCents: true, orbitUntil: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.boost.findMany({ where: { userId: sellerId, endsAt: { gte: since } }, select: { listingId: true, days: true, amountCents: true, endsAt: true, createdAt: true } }),
  ]);

  const byDay = new Map<string, DayPoint>(keys.map((day) => [day, { day, sales: 0, net: 0, views: 0 }]));
  for (const o of done) {
    const p = byDay.get(dayKey(o.completedAt!));
    if (p) { p.sales++; p.net += sellerNet(o); }
  }
  for (const v of views) { const p = byDay.get(v.day); if (p) p.views += v.count; }

  const perListing = new Map<string, { views: number; sales: number; net: number }>();
  const slot = (id: string) => perListing.get(id) ?? perListing.set(id, { views: 0, sales: 0, net: 0 }).get(id)!;
  for (const v of views) slot(v.listingId).views += v.count;
  for (const o of done) { const s = slot(o.listingId); s.sales++; s.net += sellerNet(o); }

  // Órbita: média de visitas por dia nos dias em órbita x fora dela (só anúncios que já usaram Órbita).
  const orbitDays = new Set<string>();
  for (const b of boosts) {
    const start = new Date(b.endsAt.getTime() - b.days * 86_400_000);
    for (let t = Math.max(start.getTime(), since.getTime()); t <= Math.min(b.endsAt.getTime(), now); t += 86_400_000) orbitDays.add(`${b.listingId}|${dayKey(new Date(t))}`);
  }
  const boostedIds = new Set(boosts.map((b) => b.listingId));
  let inV = 0, inD = 0, outV = 0, outD = 0;
  for (const id of boostedIds) for (const day of keys) {
    const v = views.find((x) => x.listingId === id && x.day === day)?.count ?? 0;
    if (orbitDays.has(`${id}|${day}`)) { inV += v; inD++; } else { outV += v; outD++; }
  }

  const points = [...byDay.values()];
  const totals = {
    sales: done.length,
    net: done.reduce((s, o) => s + sellerNet(o), 0),
    views: points.reduce((s, p) => s + p.views, 0),
    paid,
    open,
  };
  return {
    points,
    totals: { ...totals, avgTicket: totals.sales ? Math.round(totals.net / totals.sales) : 0, conversion: totals.views ? (paid / totals.views) * 100 : 0 },
    listings: listings.map((l) => ({ ...l, ...(perListing.get(l.id) ?? { views: 0, sales: 0, net: 0 }) })).sort((a, b) => b.views - a.views || b.sales - a.sales),
    orbit: {
      spent: boosts.filter((b) => b.createdAt >= since).reduce((s, b) => s + b.amountCents, 0),
      used: boostedIds.size > 0,
      avgIn: inD ? inV / inD : 0,
      avgOut: outD ? outV / outD : 0,
    },
  };
}
