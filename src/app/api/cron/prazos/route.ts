import { NextResponse } from "next/server";
import { settleExpired } from "@/lib/orders";

// Roda pelo Cron da Vercel (vercel.json): cancela Pix vencidos e confirma
// entregas sem resposta há 3 dias, mesmo que ninguém abra o pedido.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  await settleExpired({});
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
