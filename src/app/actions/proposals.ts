"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OrderError } from "@/lib/orders";
import { acceptProposal, cancelProposal, createProposal, proposalUrl, updateProposal } from "@/lib/proposals";
import { recordTouch } from "@/lib/attribution";

export type ProposalState = { error?: string; ok?: string } | undefined;

async function guard(fn: () => Promise<string | void>): Promise<ProposalState> {
  let to: string | void;
  try {
    to = await fn();
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  if (to) redirect(to);
  return { ok: "Salvo." };
}

export async function createProposalAction(_: ProposalState, form: FormData): Promise<ProposalState> {
  const user = await requireUser("/conta/propostas/nova");
  return guard(async () => {
    const p = await createProposal(user.id, Object.fromEntries(form));
    revalidatePath("/conta/propostas");
    return `/conta/propostas/${p.id}?criada=1`;
  });
}

export async function updateProposalAction(id: string, _: ProposalState, form: FormData): Promise<ProposalState> {
  const user = await requireUser(`/conta/propostas/${id}`);
  return guard(async () => {
    await updateProposal(user.id, id, Object.fromEntries(form));
    revalidatePath(`/conta/propostas/${id}`);
    return `/conta/propostas/${id}?alterada=1`;
  });
}

export async function cancelProposalAction(id: string): Promise<ProposalState> {
  const user = await requireUser(`/conta/propostas/${id}`);
  return guard(async () => {
    await cancelProposal(user.id, id);
    revalidatePath(`/conta/propostas/${id}`);
    revalidatePath("/conta/propostas");
  });
}

export async function acceptProposalAction(token: string, _: ProposalState, form: FormData): Promise<ProposalState> {
  const user = await requireUser(proposalUrl(token));
  if (form.get("agree") !== "on") return { error: "Confirme que leu e aceita as condições." };
  const version = Number(form.get("version"));
  return guard(async () => {
    const { listingId, proposal } = await acceptProposal(user.id, token, version);
    // Aceitar a proposta do vendedor conta como contato pelo link dele (regra do primeiro contato).
    await recordTouch({ sellerId: proposal.sellerId, source: "LINK_VENDEDOR", userId: user.id }).catch(() => {});
    return `/checkout/${listingId}`;
  });
}
