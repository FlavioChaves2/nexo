// Gera a miniatura das fotos enviadas antes de existir a coluna Image.thumb.
// Uso (uma vez, depois do db push): npx tsx prisma/backfill-thumbs.ts
import { PrismaClient } from "@prisma/client";
import { makeThumb } from "../src/lib/images";

const db = new PrismaClient();

(async () => {
  let done = 0;
  let skipped = 0;
  let cursor: string | undefined;
  for (;;) {
    // Anda por id: foto que não dá para reduzir fica sem miniatura e não é tentada de novo.
    const batch = await db.image.findMany({
      where: { thumb: null, ...(cursor && { id: { gt: cursor } }) },
      select: { id: true, data: true },
      orderBy: { id: "asc" },
      take: 20,
    });
    if (!batch.length) break;
    for (const img of batch) {
      const thumb = await makeThumb(Buffer.from(img.data));
      if (thumb) {
        await db.image.update({ where: { id: img.id }, data: { thumb } });
        done++;
      } else skipped++;
    }
    cursor = batch[batch.length - 1].id;
  }
  console.log(`${done} miniatura(s) gerada(s), ${skipped} ignorada(s).`);
})().finally(() => db.$disconnect());
