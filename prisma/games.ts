// Grava o catálogo de jogos (src/lib/game-catalog.ts) no banco. Só cria e atualiza: nunca apaga
// um jogo, porque anúncios e pedidos dependem dele. Uso: npm run games
import { PrismaClient } from "@prisma/client";
import { GAME_CATALOG } from "../src/lib/game-catalog";

const db = new PrismaClient();

async function main() {
  let created = 0;
  for (const g of GAME_CATALOG) {
    const exists = await db.game.findUnique({ where: { slug: g.slug }, select: { slug: true } });
    await db.game.upsert({ where: { slug: g.slug }, create: g, update: { name: g.name, sort: g.sort } });
    if (!exists) created++;
  }
  console.log(`Catálogo: ${GAME_CATALOG.length} jogos (${created} novos). Total no banco: ${await db.game.count()}.`);
}

main().finally(() => db.$disconnect());
