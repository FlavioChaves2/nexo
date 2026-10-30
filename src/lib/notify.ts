import type { Prisma, PrismaClient } from "@prisma/client";
import { after } from "next/server";
import { db } from "./db";
import { sendPush } from "./push";

type Client = PrismaClient | Prisma.TransactionClient;

/** Aviso dentro do site (sino no topo) e no celular de quem ativou as notificações. */
export async function notify(userId: string, title: string, body: string, href: string, client: Client = db) {
  const n = await client.notification.create({ data: { userId, title, body: body.slice(0, 300), href } });
  // O push sai depois da resposta, para não atrasar a página nem segurar a transação.
  const send = () => sendPush(userId, title, body.slice(0, 160), href).catch((e) => console.error("Falha no push:", e));
  try {
    after(send);
  } catch {
    void send(); // fora de uma requisição (scripts)
  }
  return n;
}

/** Aviso de mensagem nova sem lotar o sino: só cria se não houver outro não lido do mesmo pedido. */
export async function notifyMessage(userId: string, code: string, from: string, preview: string) {
  const href = `/pedido/${code}`;
  const pending = await db.notification.findFirst({ where: { userId, href, readAt: null, title: { startsWith: "Nova mensagem" } } });
  if (pending) return;
  await notify(userId, `Nova mensagem de ${from}`, preview, href);
}
