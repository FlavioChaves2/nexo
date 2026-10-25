import { db } from "./db";
import { OrderError } from "./orders";

// Denúncias, verificação de vendedor e regras antifraude.

export const REPORT_REASONS = ["Golpe ou fraude", "Item proibido ou roubado", "Descrição enganosa", "Preço abusivo", "Outro"] as const;
/** Denúncias abertas de pessoas diferentes que tiram o anúncio do ar até a análise. */
export const AUTO_HIDE_REPORTS = 3;
export const NEW_ACCOUNT_DAYS = 7;
export const NEW_ACCOUNT_MAX_WITHDRAW = 30000; // R$ 300,00

export async function reportListing(listingId: string, reporterId: string, reason: string, details: string) {
  if (!REPORT_REASONS.includes(reason as never)) throw new OrderError("Escolha um motivo.");
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new OrderError("Anúncio não encontrado.");
  if (listing.sellerId === reporterId) throw new OrderError("Você não pode denunciar o próprio anúncio.");
  const exists = await db.report.findUnique({ where: { listingId_reporterId: { listingId, reporterId } } });
  if (exists) throw new OrderError("Você já denunciou este anúncio. A equipe vai analisar.");

  await db.report.create({ data: { listingId, reporterId, reason, details: details.trim().slice(0, 1000) } });
  const open = await db.report.count({ where: { listingId, status: "ABERTA" } });
  if (open >= AUTO_HIDE_REPORTS && listing.status === "ATIVO") {
    await db.listing.update({
      where: { id: listingId },
      data: { status: "REMOVIDO", moderationNote: `Em análise: recebeu ${open} denúncias. A equipe vai revisar.` },
    });
  }
}

/** Valida CPF pelos dígitos verificadores. */
export function validCpf(input: string) {
  const d = input.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export async function submitVerification(userId: string, fullName: string, cpf: string, birthDate: string) {
  const name = fullName.trim().replace(/\s+/g, " ");
  const digits = cpf.replace(/\D/g, "");
  if (name.split(" ").length < 2 || name.length > 120) throw new OrderError("Informe o nome completo, como no documento.");
  if (!validCpf(digits)) throw new OrderError("CPF inválido.");
  const birth = new Date(`${birthDate}T12:00:00`);
  const age = (Date.now() - birth.getTime()) / (365.25 * 86_400_000);
  if (isNaN(age) || age < 18 || age > 110) throw new OrderError("É preciso ter 18 anos ou mais para vender.");

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.verification === "APROVADO" || user.verification === "PENDENTE") throw new OrderError("Seus dados já foram enviados.");
  const other = await db.user.findFirst({ where: { cpf: digits, id: { not: userId } } });
  if (other) throw new OrderError("Este CPF já está ligado a outra conta.");

  await db.user.update({
    where: { id: userId },
    data: { fullName: name, cpf: digits, birthDate, verification: "PENDENTE", verificationNote: "" },
  });
}

/** Regras antes de aceitar um pedido de saque. Retorna o motivo do bloqueio ou null. */
export async function withdrawalBlock(userId: string, amountCents: number) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.verification !== "APROVADO") return "Verifique sua identidade antes de sacar (formulário abaixo).";
  if (await db.withdrawal.count({ where: { userId, status: "PENDENTE" } }))
    return "Você já tem um saque pendente. Aguarde ele ser processado.";
  const isNew = Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_DAYS * 86_400_000;
  if (isNew && amountCents > NEW_ACCOUNT_MAX_WITHDRAW)
    return `Contas com menos de ${NEW_ACCOUNT_DAYS} dias podem sacar até R$ 300,00 por vez.`;
  return null;
}

/** Sinais de risco de um usuário, para o painel de admin. */
export async function riskFlags(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const [sales, disputesAgainst, disputesOpened, reports] = await Promise.all([
    db.order.count({ where: { sellerId: userId, paidAt: { not: null } } }),
    db.order.count({ where: { sellerId: userId, disputedAt: { not: null } } }),
    db.order.count({ where: { buyerId: userId, disputedAt: { not: null } } }),
    db.report.count({ where: { listing: { sellerId: userId }, status: { not: "DESCARTADA" } } }),
  ]);
  const flags: string[] = [];
  if (Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_DAYS * 86_400_000) flags.push("Conta nova");
  if (disputesAgainst >= 3 || (sales >= 5 && disputesAgainst / sales > 0.2)) flags.push("Muitas disputas como vendedor");
  if (disputesOpened >= 3) flags.push("Abre muitas disputas");
  if (reports >= 2) flags.push(`${reports} denúncias nos anúncios`);
  return { flags, sales, disputesAgainst, disputesOpened, reports };
}
