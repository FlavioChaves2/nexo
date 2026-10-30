"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { closeTicket, openTicket, SupportError } from "@/lib/support";

export type SupportState = { error?: string } | undefined;

export async function openTicketAction(_: SupportState, form: FormData): Promise<SupportState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Faça login de novo." };
  let id: string;
  try {
    id = await openTicket(user.id, { topic: String(form.get("topic") ?? ""), orderCode: String(form.get("orderCode") ?? ""), body: String(form.get("body") ?? "") });
  } catch (e) {
    if (e instanceof SupportError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin/suporte");
  redirect(`/suporte/${id}`);
}

export async function closeTicketAction(ticketId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const staff = user.role === "ADMIN" && user.totpEnabled;
  try {
    await closeTicket(ticketId, { id: user.id, staff });
  } catch (e) {
    if (!(e instanceof SupportError)) throw e;
  }
  for (const p of [`/suporte/${ticketId}`, "/suporte", `/admin/suporte/${ticketId}`, "/admin/suporte"]) revalidatePath(p);
}
