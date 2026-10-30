"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clearPending2fa,
  clientIp,
  createSession,
  destroySession,
  readPending2fa,
  requireUser,
  safeNext,
  startPending2fa,
} from "@/lib/auth";
import { newTotpSecret, verifyTotp } from "@/lib/totp";
import { consumeToken, emailEnabled, sendResetEmail, sendVerifyEmail } from "@/lib/email";

export type FormState = { error?: string; ok?: string } | undefined;

const WINDOW_MS = 15 * 60_000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

/** Bloqueia por 15 min depois de 5 erros no mesmo e-mail ou 20 no mesmo IP. */
async function tooManyAttempts(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { email, ok: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { ip, ok: false, createdAt: { gte: since } } }),
  ]);
  return byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

const record = (email: string, ip: string, ok: boolean) => db.loginAttempt.create({ data: { email, ip, ok } });

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/, "Nome de usuário: 3 a 20 letras, números, ponto ou _."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, username, password } = parsed.data;

  const ip = await clientIp();
  // Limite por IP (robô criando contas em série) e um teto geral alto, para não barrar o público num lançamento.
  const hourAgo = new Date(Date.now() - 3_600_000);
  const [byIp, recent] = await Promise.all([
    db.loginAttempt.count({ where: { ip, email: { startsWith: "cadastro:" }, createdAt: { gte: hourAgo } } }),
    db.user.count({ where: { createdAt: { gte: hourAgo } } }),
  ]);
  if (byIp >= 5) return { error: "Muitos cadastros feitos desta conexão. Tente de novo mais tarde." };
  if (recent > 2000) return { error: "Muitos cadastros agora. Tente de novo em alguns minutos." };

  const taken = await db.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (taken) return { error: taken.email === email ? "Este e-mail já tem conta." : "Este nome de usuário já existe." };

  let user;
  try {
    user = await db.user.create({ data: { email, username, passwordHash: await bcrypt.hash(password, 10) } });
  } catch (e) {
    // Dois cadastros iguais ao mesmo tempo (clique duplo): o segundo cai aqui.
    if ((e as { code?: string }).code === "P2002") return { error: "Este e-mail ou nome de usuário já tem conta." };
    throw e;
  }
  await sendVerifyEmail(user).catch(() => false);
  await record(`cadastro:${email}`, ip, true);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  const ip = await clientIp();

  if (await tooManyAttempts(email, ip)) return { error: "Muitas tentativas erradas. Espere 15 minutos e tente de novo." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await record(email, ip, false);
    return { error: "E-mail ou senha incorretos." };
  }
  if (user.suspendedAt) {
    await record(email, ip, false);
    return { error: `Esta conta está suspensa${user.suspendReason ? `: ${user.suspendReason}` : "."} Fale com o suporte.` };
  }
  await record(email, ip, true);

  if (user.totpEnabled) {
    await startPending2fa(user.id);
    redirect(`/entrar/codigo?next=${encodeURIComponent(next)}`);
  }
  await createSession(user.id);
  redirect(next);
}

/** Segunda etapa do login: código do app autenticador. */
export async function verifyLoginCode(_: FormState, form: FormData): Promise<FormState> {
  const userId = await readPending2fa();
  if (!userId) return { error: "O tempo acabou. Entre com e-mail e senha de novo." };
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret || user.suspendedAt) return { error: "Não foi possível continuar. Entre de novo." };

  const ip = await clientIp();
  if (await tooManyAttempts(user.email, ip)) return { error: "Muitas tentativas erradas. Espere 15 minutos." };
  if (!verifyTotp(user.totpSecret, String(form.get("code") ?? ""))) {
    await record(user.email, ip, false);
    return { error: "Código incorreto. Use o código que aparece agora no app." };
  }
  await clearPending2fa();
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

/** Gera (ou regera) o segredo e mostra o QR; só ativa depois de confirmar um código. */
export async function start2faSetup() {
  const user = await requireUser("/conta/seguranca");
  await db.user.update({ where: { id: user.id }, data: { totpSecret: newTotpSecret(), totpEnabled: false } });
  revalidatePath("/conta/seguranca");
}

export async function confirm2faSetup(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("/conta/seguranca");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!user.totpSecret) return { error: "Gere o QR code primeiro." };
  if (!verifyTotp(user.totpSecret, String(form.get("code") ?? ""))) return { error: "Código incorreto. Confira se o horário do celular está automático." };
  await db.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  revalidatePath("/conta/seguranca");
  return { ok: "Login em duas etapas ativado." };
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!emailEnabled()) return { error: "A recuperação por e-mail ainda não está ativa. Fale com o suporte." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.suspendedAt) await sendResetEmail(user);
  // Mesma resposta exista ou não a conta, para não revelar quem é cadastrado.
  return { ok: "Se existir uma conta com esse e-mail, enviamos um link. Confira também o spam." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 72) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "As senhas não são iguais." };
  const userId = await consumeToken(String(form.get("token") ?? ""), "RESET");
  if (!userId) return { error: "Link inválido ou vencido. Peça um novo." };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 10), emailVerifiedAt: new Date(), passwordChangedAt: new Date() } });
  await db.emailToken.updateMany({ where: { userId, kind: "RESET", usedAt: null }, data: { usedAt: new Date() } });
  redirect("/entrar?senha=nova");
}

export async function resendVerification(): Promise<FormState> {
  const me = await requireUser("/conta");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (user.emailVerifiedAt) return { ok: "Seu e-mail já está confirmado." };
  return (await sendVerifyEmail(user)) ? { ok: `Enviamos um link para ${user.email}.` } : { error: "Você pediu muitos e-mails. Tente daqui a 1 hora." };
}
