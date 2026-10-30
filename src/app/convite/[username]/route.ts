import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { REF_COOKIE, REF_COOKIE_DAYS } from "@/lib/referrals";

// Link de convite: nexopoint.com.br/convite/<usuário>. Guarda quem convidou por 30 dias e manda para o cadastro.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username).toLowerCase();
  const user = await db.user.findUnique({ where: { username }, select: { id: true, suspendedAt: true } });
  const res = NextResponse.redirect(new URL(user ? "/cadastro?convite=1" : "/", req.url));
  if (user && !user.suspendedAt) {
    res.cookies.set(REF_COOKIE, user.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: REF_COOKIE_DAYS * 86_400 });
  }
  return res;
}
