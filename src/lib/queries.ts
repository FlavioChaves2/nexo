import { db } from "./db";

export const sellerPublic = {
  select: { username: true, storeName: true, avatarId: true, verification: true, completedSales: true, ratingSum: true, ratingCount: true },
} as const;

export const cardInclude = {
  game: true,
  seller: sellerPublic,
  images: { select: { id: true }, orderBy: { sort: "asc" as const }, take: 1 },
} as const;

/** Ids dos anúncios favoritados pelo usuário (para pintar o coração). */
export async function favoriteIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const favs = await db.favorite.findMany({ where: { userId }, select: { listingId: true } });
  return new Set(favs.map((f) => f.listingId));
}

export const visibleListing = { status: "ATIVO", stock: { gt: 0 }, reservedForId: null, seller: { suspendedAt: null } } as const;

export const displayName = (u: { username: string; storeName?: string | null }) => u.storeName || u.username;
