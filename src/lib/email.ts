import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

// Envio de e-mail pelo Resend (https://resend.com). Sem RESEND_API_KEY o envio
// fica desligado: o site funciona, mas sem confirmação de e-mail e sem "esqueci a senha".

export const emailEnabled = () => !!process.env.RESEND_API_KEY;

export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Layout simples na identidade da Nexo. */
function layout(title: string, text: string, button: { label: string; href: string }) {
  return `<div style="background:#111311;padding:32px 16px;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#181B17;border:1px solid #2A2F28;border-radius:14px;padding:28px;color:#F1F4EC">
    <div style="font-weight:800;font-size:22px;letter-spacing:-1px;margin-bottom:18px">NEXO<span style="color:#C5F04A">.</span></div>
    <h1 style="font-size:20px;margin:0 0 10px">${esc(title)}</h1>
    <p style="color:#B9BFB3;line-height:1.5;margin:0 0 22px">${esc(text)}</p>
    <a href="${button.href}" style="display:inline-block;background:#C5F04A;color:#12160A;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px">${esc(button.label)}</a>
    <p style="color:#959C8F;font-size:12px;margin:22px 0 0">Se você não pediu isso, ignore este e-mail.</p>
  </div></div>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailEnabled()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Nexo <onboarding@resend.dev>", to, subject, html }),
  });
  if (!res.ok) console.error("Falha ao enviar e-mail:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Cria um link de uso único. Limita a 3 por hora para não virar spam. */
export async function issueToken(userId: string, kind: "VERIFY" | "RESET") {
  const recent = await db.emailToken.count({ where: { userId, kind, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 3) return null;
  const token = randomBytes(32).toString("base64url");
  const ttl = kind === "RESET" ? 3_600_000 : 7 * 86_400_000;
  await db.emailToken.create({ data: { userId, kind, tokenHash: hash(token), expiresAt: new Date(Date.now() + ttl) } });
  return token;
}

/** Valida e consome o token. Devolve o id do usuário ou null. */
export async function consumeToken(token: string, kind: "VERIFY" | "RESET") {
  const t = await db.emailToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!t || t.kind !== kind || t.usedAt || t.expiresAt < new Date()) return null;
  const { count } = await db.emailToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1 ? t.userId : null;
}

export async function sendVerifyEmail(user: { id: string; email: string }) {
  const token = await issueToken(user.id, "VERIFY");
  if (!token) return false;
  const link = `${await appUrl()}/verificar-email?token=${token}`;
  return sendEmail(user.email, "Confirme seu e-mail na Nexo", layout("Confirme seu e-mail", "Falta só um passo para vender e sacar na Nexo. O link vale por 7 dias.", { label: "Confirmar e-mail", href: link }));
}

export async function sendResetEmail(user: { id: string; email: string }) {
  const token = await issueToken(user.id, "RESET");
  if (!token) return false;
  const link = `${await appUrl()}/redefinir-senha?token=${token}`;
  return sendEmail(user.email, "Redefinir sua senha da Nexo", layout("Redefinir senha", "Recebemos um pedido para trocar a sua senha. O link vale por 1 hora.", { label: "Criar nova senha", href: link }));
}

/** Exige e-mail confirmado para vender e sacar, mas só quando o envio de e-mail está ligado. */
export async function emailBlock(userId: string) {
  if (!emailEnabled()) return null;
  const u = await db.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
  return u?.emailVerifiedAt ? null : "Confirme seu e-mail antes (veja o aviso em Minha conta).";
}
