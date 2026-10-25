import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Chat em tempo real por Server-Sent Events: o servidor empurra mensagens novas
// assim que chegam. A conexão dura até 5 min e o navegador reconecta sozinho.

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login.", { status: 401 });
  const order = await db.order.findUnique({ where: { code: (await params).code }, select: { id: true, buyerId: true, sellerId: true } });
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) return new Response("Pedido não encontrado.", { status: 404 });

  const afterParam = new URL(req.url).searchParams.get("after");
  let since = afterParam && !isNaN(Date.parse(afterParam)) ? new Date(afterParam) : new Date();
  const seen = new Set<string>();
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const tick = async () => {
        try {
          const [msgs, o] = await Promise.all([
            db.message.findMany({ where: { orderId: order.id, createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, take: 50 }),
            db.order.findUnique({ where: { id: order.id }, select: { status: true } }),
          ]);
          for (const m of msgs) {
            if (seen.has(m.id)) continue;
            seen.add(m.id);
            send("message", { id: m.id, senderId: m.senderId, body: m.body, at: m.createdAt.toISOString() });
          }
          if (msgs.length) since = msgs[msgs.length - 1].createdAt;
          send("status", o?.status);
        } catch {
          /* tenta de novo no próximo ciclo */
        }
      };
      const timer = setInterval(tick, 1000);
      const stop = setTimeout(() => end(), 5 * 60_000);
      const end = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        clearTimeout(stop);
        controller.close();
      };
      req.signal.addEventListener("abort", end);
      tick();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
