import type { Listing } from "@prisma/client";
import { db } from "./db";
import { money } from "./format";
import { notify } from "./notify";
import { OrderError } from "./orders";
import { TYPE_PLURAL } from "./constants";

// "Me avise quando aparecer": a pessoa salva os filtros da busca e recebe um aviso (sino e celular)
// quando um anúncio novo combina com eles.

export const MAX_ALERTS = 10;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type AlertInput = { gameSlug?: string | null; type?: string | null; q?: string; maxCents?: number | null };

/** Texto curto que descreve o alerta: "Contas de Valorant até R$ 200,00 com “imortal”". */
export function describeAlert(a: { type: string | null; q: string; maxCents: number | null; game?: { name: string } | null }) {
  const what = a.type ? TYPE_PLURAL[a.type] ?? "Anúncios" : "Anúncios";
  return [what, a.game ? `de ${a.game.name}` : "", a.q ? `com “${a.q}”` : "", a.maxCents ? `até ${money(a.maxCents)}` : ""].filter(Boolean).join(" ");
}

export async function saveAlert(userId: string, input: AlertInput) {
  const data = { gameSlug: input.gameSlug || null, type: input.type || null, q: (input.q ?? "").trim().slice(0, 60), maxCents: input.maxCents && input.maxCents > 0 ? input.maxCents : null };
  if (!data.gameSlug && !data.type && !data.q && !data.maxCents) throw new OrderError("Escolha pelo menos um filtro (jogo, tipo, palavra ou preço) antes de criar o alerta.");
  const same = await db.savedAlert.findFirst({ where: { userId, ...data } });
  if (same) throw new OrderError("Você já tem um alerta igual a este.");
  if ((await db.savedAlert.count({ where: { userId } })) >= MAX_ALERTS) throw new OrderError(`Você pode ter até ${MAX_ALERTS} alertas. Apague um em Meus alertas.`);
  return db.savedAlert.create({ data: { userId, ...data } });
}

/** Chamado quando um anúncio é publicado: avisa quem tem alerta que combina com ele. */
export async function matchAlerts(listing: Listing) {
  if (listing.reservedForId || listing.status !== "ATIVO") return 0;
  const alerts = await db.savedAlert.findMany({
    where: {
      userId: { not: listing.sellerId },
      user: { suspendedAt: null },
      OR: [{ gameSlug: null }, { gameSlug: listing.gameSlug }],
      AND: [{ OR: [{ type: null }, { type: listing.type }] }, { OR: [{ maxCents: null }, { maxCents: { gte: listing.priceCents } }] }],
    },
  });
  const text = norm(`${listing.title} ${listing.description}`);
  const hits = alerts.filter((a) => !a.q || norm(a.q).split(/\s+/).every((w) => text.includes(w)));
  for (const a of hits) {
    await notify(a.userId, "🔔 Apareceu o que você procura!", `${listing.title} por ${money(listing.priceCents)}`, `/anuncio/${listing.id}`);
    await db.savedAlert.update({ where: { id: a.id }, data: { hits: { increment: 1 }, lastHitAt: new Date() } });
  }
  return hits.length;
}
