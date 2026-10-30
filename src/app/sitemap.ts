import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { visibleListing } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "https://nexopoint.com.br").replace(/\/$/, "");
  const [games, listings] = await Promise.all([
    db.game.findMany({ select: { slug: true } }),
    db.listing.findMany({ where: visibleListing, select: { id: true, createdAt: true }, take: 5000 }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/busca`, changeFrequency: "hourly", priority: 0.8 },
    ...games.map((g) => ({ url: `${base}/busca?jogo=${g.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...listings.map((l) => ({ url: `${base}/anuncio/${l.id}`, lastModified: l.createdAt, priority: 0.6 })),
    ...["ajuda", "termos", "privacidade"].map((p) => ({ url: `${base}/${p}`, priority: 0.3 })),
  ];
}
