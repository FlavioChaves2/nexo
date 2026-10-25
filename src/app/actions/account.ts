"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { money, parseReais } from "@/lib/format";
import { OrderError } from "@/lib/orders";
import { emailBlock } from "@/lib/email";
import { reportListing, submitVerification, withdrawalBlock } from "@/lib/trust";

export type WithdrawState = { error?: string; ok?: string } | undefined;

const MIN_WITHDRAW = 1000; // R$ 10,00

export async function requestWithdrawal(_: WithdrawState, form: FormData): Promise<WithdrawState> {
  const user = await requireUser("/conta?aba=saldo");
  const amount = parseReais(String(form.get("amount") ?? ""));
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) return { error: `Saque mínimo: ${money(MIN_WITHDRAW)}.` };
  const block = (await emailBlock(user.id)) ?? (await withdrawalBlock(user.id, amount));
  if (block) return { error: block };
  // Saque só para a chave Pix CPF do próprio titular verificado (evita golpe e lavagem com contas de terceiros).
  const { cpf } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { cpf: true } });
  if (!cpf) return { error: "Verifique sua identidade antes de sacar." };
  const pixKey = cpf;

  // Desconta só se houver saldo, na mesma operação (evita saque duplo).
  const ok = await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: user.id, balanceCents: { gte: amount } },
      data: { balanceCents: { decrement: amount } },
    });
    if (count !== 1) return false;
    await tx.withdrawal.create({ data: { userId: user.id, amountCents: amount, pixKey } });
    return true;
  });
  if (!ok) return { error: "Saldo insuficiente." };
  revalidatePath("/conta");
  return { ok: `Saque de ${money(amount)} solicitado. Ele aparece como pendente até o pagamento.` };
}

export async function sendVerification(_: WithdrawState, form: FormData): Promise<WithdrawState> {
  const user = await requireUser("/conta?aba=saldo");
  try {
    await submitVerification(user.id, String(form.get("fullName") ?? ""), String(form.get("cpf") ?? ""), String(form.get("birthDate") ?? ""));
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath("/conta");
  return { ok: "Dados enviados. A equipe confere e libera os saques, normalmente em até 1 dia útil." };
}

export async function sendReport(listingId: string, _: WithdrawState, form: FormData): Promise<WithdrawState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta para denunciar." };
  try {
    await reportListing(listingId, user.id, String(form.get("reason") ?? ""), String(form.get("details") ?? ""));
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin");
  return { ok: "Denúncia enviada. Obrigado: a equipe vai analisar." };
}
