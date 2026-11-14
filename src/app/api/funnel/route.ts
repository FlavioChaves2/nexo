import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Conta os passos do funil do guia sem identificar ninguém (sem nome, e-mail ou IP).
const EVENTS = new Set(["abriu-guia", "viu-oferta", "clicou-comprar", "deu-email"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.e === "string" ? body.e : "";
  const source = typeof body?.s === "string" ? body.s.slice(0, 60).replace(/[^\w.-]/g, "") : "";
  if (!EVENTS.has(name)) return NextResponse.json({ ok: false }, { status: 400 });
  await db.funnelEvent.create({ data: { name, source } });
  return NextResponse.json({ ok: true });
}
