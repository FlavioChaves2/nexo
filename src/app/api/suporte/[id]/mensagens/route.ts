import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { postMessage, shapeSupport, SupportError } from "@/lib/support";

// Mensagens de uma conversa de suporte. Quem abriu a conversa e a equipe (admin com 2 etapas) podem ler e escrever.
async function load(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Faça login." }, { status: 401 }) };
  const ticket = await db.supportTicket.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  const staff = user.role === "ADMIN" && user.totpEnabled;
  if (!ticket || (ticket.userId !== user.id && !staff)) return { error: NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 }) };
  // Admin escrevendo na própria conversa conta como cliente.
  return { user, ticket, staff: staff && ticket.userId !== user.id };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if ("error" in r) return r.error;
  const after = new Date(new URL(req.url).searchParams.get("after") ?? 0);
  const messages = await db.supportMessage.findMany({
    where: { ticketId: r.ticket.id, createdAt: { gt: isNaN(after.getTime()) ? new Date(0) : after } },
    include: { sender: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ messages: messages.map(shapeSupport), status: r.ticket.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if ("error" in r) return r.error;
  const body = String((await req.json().catch(() => ({})))?.body ?? "");
  try {
    const msg = await postMessage(r.ticket.id, r.user.id, r.staff, body);
    return NextResponse.json(shapeSupport(msg));
  } catch (e) {
    if (e instanceof SupportError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
