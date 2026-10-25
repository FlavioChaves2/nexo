import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";

type Client = PrismaClient | Prisma.TransactionClient;

/** Aviso dentro do site (sino no topo). Para e-mail, chame o serviço de envio aqui também. */
export function notify(userId: string, title: string, body: string, href: string, client: Client = db) {
  return client.notification.create({ data: { userId, title, body: body.slice(0, 300), href } });
}

/** Aviso de mensagem nova sem lotar o sino: só cria se não houver outro não lido do mesmo pedido. */
export async function notifyMessage(userId: string, code: string, from: string, preview: string) {
  const href = `/pedido/${code}`;
  const pending = await db.notification.findFirst({ where: { userId, href, readAt: null, title: { startsWith: "Nova mensagem" } } });
  if (pending) return;
  await notify(userId, `Nova mensagem de ${from}`, preview, href);
}
