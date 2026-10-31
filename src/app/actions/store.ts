"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type FollowState = { following: boolean; followers: number; error?: string };

/** Seguir ou deixar de seguir uma loja. Quem segue recebe aviso de anúncio novo. */
export async function toggleFollow(sellerId: string): Promise<FollowState> {
  const user = await getCurrentUser();
  const count = () => db.storeFollow.count({ where: { sellerId } });
  if (!user) return { following: false, followers: await count(), error: "Entre na sua conta para seguir lojas." };
  if (user.id === sellerId) return { following: false, followers: await count(), error: "Você não pode seguir a própria loja." };
  const seller = await db.user.findUnique({ where: { id: sellerId }, select: { username: true, suspendedAt: true } });
  if (!seller || seller.suspendedAt) return { following: false, followers: 0, error: "Loja indisponível." };

  const key = { followerId_sellerId: { followerId: user.id, sellerId } };
  const existing = await db.storeFollow.findUnique({ where: key });
  if (existing) await db.storeFollow.delete({ where: key }).catch(() => null);
  else await db.storeFollow.create({ data: { followerId: user.id, sellerId } }).catch(() => null); // clique duplo: a chave já existe
  revalidatePath(`/loja/${seller.username}`);
  return { following: !existing, followers: await count() };
}
