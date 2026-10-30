import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { money, dateTime } from "./format";
import { notify } from "./notify";
import { OrderError } from "./orders";
import { cardInclude } from "./queries";
import { ORBIT_MAX_DAYS, ORBIT_PLANS } from "./orbit-plans";

// Órbita: o vendedor paga com o saldo e o anúncio aparece no topo da página inicial e da busca,
// com o selo "Em órbita", até o fim do período.

export class OrbitError extends OrderError {}

/** Cobra do saldo e coloca (ou mantém) o anúncio em órbita por mais `days` dias. */
export async function buyOrbit(userId: string, listingId: string, days: number) {
  const plan = ORBIT_PLANS.find((p) => p.days === days);
  if (!plan) throw new OrbitError("Escolha um dos períodos.");
  const ends = await db.$transaction(async (tx) => {
    const l = await tx.listing.findUnique({ where: { id: listingId } });
    if (!l || l.sellerId !== userId) throw new OrbitError("Anúncio não encontrado.");
    if (l.status !== "ATIVO" || l.stock < 1 || l.reservedForId) throw new OrbitError("Só anúncios ativos e com estoque podem entrar em órbita. Reative o anúncio ou aumente o estoque.");
    const now = Date.now();
    const from = Math.max(now, l.orbitUntil?.getTime() ?? 0);
    const endsAt = new Date(from + plan.days * 86_400_000);
    if (endsAt.getTime() - now > ORBIT_MAX_DAYS * 86_400_000) throw new OrbitError(`Dá para deixar no máximo ${ORBIT_MAX_DAYS} dias de Órbita à frente.`);
    // Debita só se houver saldo: dois cliques ao mesmo tempo não deixam o saldo negativo.
    const { count } = await tx.user.updateMany({ where: { id: userId, balanceCents: { gte: plan.cents } }, data: { balanceCents: { decrement: plan.cents } } });
    if (count !== 1) throw new OrbitError(`Saldo insuficiente. A Órbita de ${plan.days} ${plan.days === 1 ? "dia" : "dias"} custa ${money(plan.cents)}.`);
    await tx.listing.update({ where: { id: listingId }, data: { orbitUntil: endsAt } });
    await tx.boost.create({ data: { listingId, userId, days: plan.days, amountCents: plan.cents, endsAt } });
    await notify(userId, "🪐 Anúncio em órbita!", `${l.title} fica no topo até ${dateTime(endsAt)}.`, `/anuncio/${listingId}/orbita`, tx);
    return endsAt;
  });
  return ends;
}

/** Embaralha (os anúncios em órbita se revezam no topo a cada visita). */
function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lista de cards com até `slots` anúncios em órbita na frente, sem repetir. */
export async function withOrbitFirst(where: Prisma.ListingWhereInput, orderBy: Prisma.ListingOrderByWithRelationInput[], take: number, slots: number) {
  const [orbit, rest] = await Promise.all([
    db.listing.findMany({ where: { AND: [where, { orbitUntil: { gt: new Date() } }] }, include: cardInclude, take: 40 }),
    db.listing.findMany({ where, include: cardInclude, orderBy, take: take + slots }),
  ]);
  const top = shuffle(orbit).slice(0, slots);
  const ids = new Set(top.map((l) => l.id));
  return [...top, ...rest.filter((l) => !ids.has(l.id))].slice(0, take);
}
