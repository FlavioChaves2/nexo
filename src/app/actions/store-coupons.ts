"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { OrderError } from "@/lib/orders";
import { createStoreCoupon, toggleStoreCoupon } from "@/lib/store-coupons";

export type StoreCouponState = { error?: string; ok?: string } | undefined;

export async function createStoreCouponAction(_: StoreCouponState, form: FormData): Promise<StoreCouponState> {
  const user = await requireUser("/conta/cupons");
  const g = (k: string) => String(form.get(k) ?? "");
  try {
    const c = await createStoreCoupon(user.id, {
      code: g("code"), percentOff: g("percentOff"), amountOff: g("amountOff"), maxDiscount: g("maxDiscount"), minOrder: g("minOrder"),
      maxUses: g("maxUses"), scope: g("scope"), target: g("scope") === "JOGO" ? g("game") : g("listing"), startsAt: g("startsAt"), expiresAt: g("expiresAt"),
    });
    revalidatePath("/conta/cupons");
    return { ok: `Cupom ${c.code} criado.` };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
}

export async function toggleStoreCouponAction(id: string): Promise<StoreCouponState> {
  const user = await requireUser("/conta/cupons");
  try {
    await toggleStoreCoupon(user.id, id);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath("/conta/cupons");
  return { ok: "Atualizado." };
}
