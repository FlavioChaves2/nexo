import { randomInt } from "node:crypto";
import { db } from "./db";
import { OrderError } from "./orders";
import { cleanDisplayName } from "./store-names";
import { notify } from "./notify";
import { logAction } from "./admin-growth";

// Verificação de perfil em outra plataforma. A prova é um código único que o vendedor coloca
// na bio/descrição do perfil externo; a equipe abre o perfil e confere à mão. Print sozinho não vale.
// O selo diz só que o CONTROLE do perfil foi confirmado: não é parceria nem garantia de conduta.

export const PLATFORMS: Record<string, { name: string; hosts: string[] }> = {
  GGMAX: { name: "GGMax", hosts: ["ggmax.com.br"] },
  DISCORD: { name: "Discord", hosts: ["discord.com"] },
  INSTAGRAM: { name: "Instagram", hosts: ["instagram.com"] },
  TIKTOK: { name: "TikTok", hosts: ["tiktok.com"] },
  YOUTUBE: { name: "YouTube", hosts: ["youtube.com"] },
  TWITCH: { name: "Twitch", hosts: ["twitch.tv"] },
  STEAM: { name: "Steam", hosts: ["steamcommunity.com"] },
  MERCADOLIVRE: { name: "Mercado Livre", hosts: ["mercadolivre.com.br"] },
  OUTRA: { name: "Outra plataforma", hosts: [] },
};

export const platformName = (p: string) => PLATFORMS[p]?.name ?? p;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O e 1/I, que confundem
const newChallenge = () => `NEXO-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

/** Aceita só https, sem usuário/senha na URL, sem IP, e no domínio da plataforma escolhida. */
export function checkProfileUrl(platform: string, raw: string) {
  const conf = PLATFORMS[platform];
  if (!conf) throw new OrderError("Escolha a plataforma.");
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new OrderError("Endereço do perfil inválido. Copie o link completo, começando com https://");
  }
  if (u.protocol !== "https:") throw new OrderError("Use o link com https://");
  if (u.username || u.password) throw new OrderError("Endereço do perfil inválido.");
  const host = u.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  if (/^[\d.]+$/.test(host) || host.includes(":") || !host.includes(".")) throw new OrderError("Endereço do perfil inválido.");
  if (host.endsWith("nexopoint.com.br")) throw new OrderError("Informe um perfil de outra plataforma.");
  if (conf.hosts.length && !conf.hosts.some((h) => host === h || host.endsWith(`.${h}`))) throw new OrderError(`O link precisa ser do ${conf.name} (${conf.hosts.join(", ")}).`);
  if (u.pathname.length < 2) throw new OrderError("Use o link direto do seu perfil, não a página inicial da plataforma.");
  const url = `https://${u.hostname.toLowerCase()}${u.pathname}`.replace(/\/+$/, "").slice(0, 200);
  return { url, guessHandle: decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "").slice(0, 60) };
}

export async function requestVerification(userId: string, input: { platform: string; url: string; handle: string }) {
  const { url, guessHandle } = checkProfileUrl(input.platform, input.url);
  const handle = cleanDisplayName(input.handle || guessHandle).slice(0, 60);
  if (!handle) throw new OrderError("Informe o nome do perfil.");
  const active = await db.externalProfile.count({ where: { userId, status: { in: ["PENDENTE", "APROVADO"] } } });
  if (active >= 5) throw new OrderError("Você já tem 5 perfis em análise ou verificados.");
  const dup = await db.externalProfile.findFirst({ where: { url, status: { in: ["PENDENTE", "APROVADO"] } }, select: { userId: true } });
  if (dup) throw new OrderError(dup.userId === userId ? "Este perfil já está em análise ou verificado." : "Este perfil já está vinculado a outra conta na Nexo. Fale com o suporte se ele é seu.");
  return db.externalProfile.create({ data: { userId, platform: input.platform, url, handle, challenge: newChallenge() } });
}

export async function withdrawVerification(userId: string, id: string) {
  const { count } = await db.externalProfile.updateMany({ where: { id, userId, status: { in: ["PENDENTE", "APROVADO"] } }, data: { status: "REVOGADO", note: "Removido pelo vendedor.", decidedAt: new Date() } });
  if (count !== 1) throw new OrderError("Pedido não encontrado.");
}

/** Decisão da equipe: aprovar, recusar (pendentes) ou revogar (aprovados). Sempre com motivo e no histórico. */
export async function decideVerification(adminId: string, id: string, decision: "APROVAR" | "RECUSAR" | "REVOGAR", rawNote: string) {
  const note = rawNote.trim();
  if (note.length < 5) throw new OrderError("Escreva o motivo da decisão (o vendedor vê).");
  const from = decision === "REVOGAR" ? "APROVADO" : "PENDENTE";
  const to = decision === "APROVAR" ? "APROVADO" : decision === "RECUSAR" ? "RECUSADO" : "REVOGADO";
  await db.$transaction(async (tx) => {
    const p = await tx.externalProfile.findUnique({ where: { id } });
    if (!p) throw new OrderError("Pedido não encontrado.");
    const { count } = await tx.externalProfile.updateMany({ where: { id, status: from }, data: { status: to, note: note.slice(0, 500), reviewerId: adminId, decidedAt: new Date() } });
    if (count !== 1) throw new OrderError("Este pedido já foi decidido. Atualize a página.");
    await logAction(tx, adminId, `PERFIL_EXTERNO_${to}`, id, `${platformName(p.platform)} · ${p.handle}`, note);
    const title = to === "APROVADO" ? "Perfil externo verificado" : to === "RECUSADO" ? "Verificação de perfil recusada" : "Verificação de perfil revogada";
    await notify(p.userId, title, `${platformName(p.platform)} (${p.handle}): ${note}`, "/conta/perfis-externos", tx);
  });
}
