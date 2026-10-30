import { PrismaClient } from "@prisma/client";

// O Neon grátis "dorme" depois de alguns minutos sem uso e leva alguns segundos para acordar.
// O padrão do Prisma (5 s) às vezes não basta e a primeira visita via tela de erro: espera até 20 s.
function withWakeTimeout(url?: string) {
  if (!url || /[?&]connect_timeout=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "connect_timeout=20";
}

// Reaproveita a conexão entre recarregamentos do servidor de desenvolvimento.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: withWakeTimeout(process.env.DATABASE_URL) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
