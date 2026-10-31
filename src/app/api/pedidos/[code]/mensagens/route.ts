import { notifyMessage } from "@/lib/notify";
import { contactError } from "@/lib/contact-filter";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function load(code: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Faça login." }, { status: 401 }) };
  const order = await db.order.findUnique({ where: { code }, select: { id: true, code: true, buyerId: true, sellerId: true, status: true } });
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id))
    return { error: NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 }) };
  return { user, order };
}

const shape = (m: { id: string; senderId: string | null; body: string; createdAt: Date }) => ({
  id: m.id,
  senderId: m.senderId,
  body: m.body,
  at: m.createdAt.toISOString(),
});

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const r = await load((await params).code);
  if ("error" in r) return r.error;
  const after = new URL(req.url).searchParams.get("after");
  const since = after ? new Date(after) : new Date(0);
  const messages = await db.message.findMany({
    where: { orderId: r.order.id, createdAt: { gte: isNaN(since.getTime()) ? new Date(0) : since } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ messages: messages.map(shape), status: r.order.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const r = await load((await params).code);
  if ("error" in r) return r.error;
  if (r.order.status === "CANCELADO") return NextResponse.json({ error: "Este pedido foi cancelado." }, { status: 400 });
  const body = String((await req.json().catch(() => ({})))?.body ?? "").trim().slice(0, 1000);
  if (!body) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  const blocked = contactError(body, "nesta mensagem");
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
  const recent = await db.message.count({ where: { orderId: r.order.id, senderId: r.user.id, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent >= 20) return NextResponse.json({ error: "Muitas mensagens seguidas. Espere um minuto." }, { status: 429 });
  const msg = await db.message.create({ data: { orderId: r.order.id, senderId: r.user.id, body } });
  await notifyMessage(r.user.id === r.order.buyerId ? r.order.sellerId : r.order.buyerId, r.order.code, r.user.username, body);
  return NextResponse.json(shape(msg));
}
