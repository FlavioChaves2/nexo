import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordTouch } from "@/lib/attribution";

// Link de divulgação do vendedor: nexopoint.com.br/v/<usuário>. Registra no servidor o contato
// "link do vendedor" (regra do primeiro contato, docs/lojas-vendedor.md) e leva para a loja.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username).toLowerCase();
  const seller = await db.user.findUnique({ where: { username }, select: { id: true, suspendedAt: true } });
  if (!seller || seller.suspendedAt) return NextResponse.redirect(new URL("/", req.url));
  const user = await getCurrentUser();
  await recordTouch({ sellerId: seller.id, source: "LINK_VENDEDOR", userId: user?.id }).catch((e) => console.error("Origem:", e));
  return NextResponse.redirect(new URL(`/loja/${encodeURIComponent(username)}`, req.url));
}
