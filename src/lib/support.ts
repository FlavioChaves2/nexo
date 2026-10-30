import { db } from "./db";
import { notify } from "./notify";
import { OrderError } from "./orders";

// Chat com o suporte: a pessoa abre uma conversa e a equipe responde em /admin/suporte.
// Uma conversa aberta por pessoa; "waiting" marca as que esperam resposta da equipe.

export const SUPPORT_TOPICS: Record<string, string> = {
  PEDIDO: "Um pedido",
  PAGAMENTO: "Pagamento ou Pix",
  SAQUE: "Saldo e saque",
  CONTA: "Minha conta",
  VENDER: "Vender na Nexo",
  OUTRO: "Outro assunto",
};

export class SupportError extends OrderError {}

const WELCOME =
  "Oi! Aqui é o Nexinho 👋 Recebi sua mensagem e já chamei a equipe. Um atendente de verdade responde aqui mesmo, e você recebe um aviso no sino (e no celular, se ativou as notificações). Enquanto isso, pode mandar mais detalhes por aqui.";

const clean = (text: string) => text.trim().slice(0, 1500);

/** Avisa a equipe. Sem lotar o sino: só se não houver outro aviso não lido da mesma conversa. */
async function pingStaff(ticketId: string, title: string, preview: string) {
  const href = `/admin/suporte/${ticketId}`;
  const admins = await db.user.findMany({ where: { role: "ADMIN", suspendedAt: null }, select: { id: true } });
  for (const a of admins) {
    const pending = await db.notification.findFirst({ where: { userId: a.id, href, readAt: null } });
    if (!pending) await notify(a.id, title, preview, href);
  }
}

export async function openTicket(userId: string, input: { topic: string; orderCode: string; body: string }) {
  const body = clean(input.body);
  if (body.length < 10) throw new SupportError("Conte um pouco mais (pelo menos 10 letras) para a equipe já chegar sabendo.");
  const topic = SUPPORT_TOPICS[input.topic] ? input.topic : "OUTRO";
  let orderCode: string | null = input.orderCode.trim().replace(/^#/, "").toUpperCase() || null;
  if (orderCode) {
    const order = await db.order.findUnique({ where: { code: orderCode }, select: { buyerId: true, sellerId: true } });
    if (!order || (order.buyerId !== userId && order.sellerId !== userId)) orderCode = null;
  }
  const existing = await db.supportTicket.findFirst({ where: { userId, status: "ABERTO" }, select: { id: true } });
  if (existing) {
    await postMessage(existing.id, userId, false, body);
    return existing.id;
  }
  const t = await db.supportTicket.create({
    data: {
      userId,
      topic,
      orderCode,
      messages: { create: [{ senderId: userId, body }, { senderId: null, body: WELCOME }] },
    },
    include: { user: { select: { username: true } } },
  });
  await pingStaff(t.id, `💬 Suporte: ${t.user.username} · ${SUPPORT_TOPICS[topic]}`, body);
  return t.id;
}

export async function postMessage(ticketId: string, senderId: string, staff: boolean, text: string) {
  const body = clean(text);
  if (!body) throw new SupportError("Mensagem vazia.");
  const t = await db.supportTicket.findUnique({ where: { id: ticketId }, include: { user: { select: { username: true } } } });
  if (!t) throw new SupportError("Conversa não encontrada.");
  if (t.status !== "ABERTO") throw new SupportError("Esta conversa foi encerrada. Abra uma nova em Falar com o suporte.");
  if (!staff) {
    const recent = await db.supportMessage.count({ where: { ticketId, senderId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
    if (recent >= 15) throw new SupportError("Muitas mensagens seguidas. Espere um minuto.");
  }
  const [msg] = await db.$transaction([
    db.supportMessage.create({ data: { ticketId, senderId, staff, body }, include: { sender: { select: { username: true } } } }),
    db.supportTicket.update({ where: { id: ticketId }, data: { waiting: !staff, lastAt: new Date() } }),
  ]);
  if (staff) {
    const href = `/suporte/${ticketId}`;
    const pending = await db.notification.findFirst({ where: { userId: t.userId, href, readAt: null } });
    if (!pending) await notify(t.userId, "💬 O suporte respondeu", body, href);
  } else if (!t.waiting) {
    await pingStaff(ticketId, `💬 ${t.user.username} respondeu no suporte`, body);
  }
  return msg;
}

/** Encerra a conversa (pela pessoa ou pela equipe). */
export async function closeTicket(ticketId: string, by: { id: string; staff: boolean }) {
  const t = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!t || (!by.staff && t.userId !== by.id)) throw new SupportError("Conversa não encontrada.");
  const { count } = await db.supportTicket.updateMany({ where: { id: ticketId, status: "ABERTO" }, data: { status: "FECHADO", waiting: false, closedAt: new Date() } });
  if (count !== 1) throw new SupportError("Esta conversa já foi encerrada.");
  await db.supportMessage.create({
    data: { ticketId, body: by.staff ? "A equipe encerrou o atendimento. Se precisar de mais alguma coisa, é só abrir uma nova conversa. Obrigado! 💚" : "Você encerrou a conversa. Obrigado por falar com a gente! 💚" },
  });
  if (by.staff) await notify(t.userId, "Atendimento encerrado", "Sua conversa com o suporte foi finalizada.", `/suporte/${ticketId}`);
}

/** Formato enviado ao navegador. */
export const shapeSupport = (m: { id: string; senderId: string | null; staff: boolean; body: string; createdAt: Date; sender?: { username: string } | null }) => ({
  id: m.id,
  senderId: m.senderId,
  staff: m.staff,
  name: m.senderId === null ? "Nexinho" : m.staff ? "Equipe Nexo" : (m.sender?.username ?? ""),
  body: m.body,
  at: m.createdAt.toISOString(),
});
export type SupportMsg = ReturnType<typeof shapeSupport>;
