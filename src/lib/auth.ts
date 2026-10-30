import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "nexo_session";
const PENDING_2FA = "nexo_2fa";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET ausente ou curto demais no .env");
  return new TextEncoder().encode(secret);
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

async function sign(sub: string, purpose: string, seconds: number) {
  return new SignJWT({ purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(key());
}

async function verify(token: string | undefined, purpose: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.purpose === purpose && payload.sub ? { sub: payload.sub, iat: payload.iat ?? 0 } : null;
  } catch {
    return null;
  }
}

const read = async (token: string | undefined, purpose: string) => (await verify(token, purpose))?.sub ?? null;

export async function createSession(userId: string) {
  (await cookies()).set(COOKIE, await sign(userId, "session", MAX_AGE), cookieOpts(MAX_AGE));
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Senha certa, falta o código do autenticador: guarda quem é por 5 minutos. */
export async function startPending2fa(userId: string) {
  (await cookies()).set(PENDING_2FA, await sign(userId, "2fa", 300), cookieOpts(300));
}

export async function readPending2fa() {
  return read((await cookies()).get(PENDING_2FA)?.value, "2fa");
}

export async function clearPending2fa() {
  (await cookies()).delete(PENDING_2FA);
}

export const getCurrentUser = cache(async () => {
  const session = await verify((await cookies()).get(COOKIE)?.value, "session");
  if (!session) return null;
  const found = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, username: true, balanceCents: true, role: true, totpEnabled: true, suspendedAt: true, createdAt: true, verification: true, passwordChangedAt: true },
  });
  if (!found) return null;
  const { passwordChangedAt, ...user } = found;
  // Conta suspensa age como deslogada em todo o site.
  if (user.suspendedAt) return null;
  // Trocou a senha: login feito antes disso (em outro aparelho, por exemplo) cai.
  if (passwordChangedAt && session.iat < Math.floor(passwordChangedAt.getTime() / 1000)) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Exige login; senão manda para /entrar e volta para `next` depois. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return user;
}

/** Exige conta de admin com login em duas etapas ativo; para os outros a página não existe. */
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "ADMIN") notFound();
  if (!user.totpEnabled) redirect("/conta/seguranca?obrigatorio=1");
  return user;
}

export async function clientIp() {
  const h = await headers();
  // Na Vercel o x-forwarded-for é preenchido pela própria plataforma; cf-connecting-ip
  // viria do navegador e poderia ser forjado para driblar o limite de tentativas.
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** Só aceita caminhos internos, para não virar redirecionamento aberto. */
export function safeNext(next: unknown, fallback = "/") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
