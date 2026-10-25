"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function toggleFavorite(listingId: string): Promise<{ on: boolean; needLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { on: false, needLogin: true };
  const key = { userId_listingId: { userId: user.id, listingId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) {
    await db.favorite.delete({ where: key });
    return { on: false };
  }
  await db.favorite.create({ data: { userId: user.id, listingId } });
  return { on: true };
}
