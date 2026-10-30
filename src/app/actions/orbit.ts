"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { OrderError } from "@/lib/orders";
import { buyOrbit } from "@/lib/orbit";

export type OrbitState = { error?: string; ok?: string } | undefined;

export async function buyOrbitAction(listingId: string, _: OrbitState, form: FormData): Promise<OrbitState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login de novo." };
  try {
    const ends = await buyOrbit(user.id, listingId, Number(form.get("days")));
    for (const p of [`/anuncio/${listingId}/orbita`, `/anuncio/${listingId}`, "/", "/busca", "/conta"]) revalidatePath(p);
    return { ok: `Pronto! Seu anúncio está em órbita até ${dateTime(ends)}.` };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
}
