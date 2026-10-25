import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/constants";
import { Art } from "@/components/Art";
import { ListingModeration } from "@/components/admin/AdminForms";

export const metadata = { title: "Anúncios" };

const FILTROS = [
  ["recentes", "Novos (7 dias)"],
  ["ativos", "Ativos"],
  ["removidos", "Removidos"],
  ["todos", "Todos"],
] as const;

export default async function AdminAnunciosPage({ searchParams }: { searchParams: Promise<{ ver?: string; q?: string }> }) {
  const sp = await searchParams;
  const ver = FILTROS.some(([k]) => k === sp.ver) ? sp.ver! : "recentes";
  const q = (sp.q ?? "").trim().slice(0, 80);

  const where: Prisma.ListingWhereInput = {
    ...(ver === "recentes" && { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }),
    ...(ver === "ativos" && { status: "ATIVO" }),
    ...(ver === "removidos" && { status: "REMOVIDO" }),
    ...(q && { OR: [{ title: { contains: q } }, { description: { contains: q } }, { seller: { username: { contains: q } } }] }),
  };
  const listings = await db.listing.findMany({
    where,
    include: { game: true, seller: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="stack">
      <div className="row">
        <div className="pills">
          {FILTROS.map(([k, n]) => (
            <Link key={k} className={`pill${ver === k ? " on" : ""}`} href={`/admin/anuncios?ver=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{n}</Link>
          ))}
        </div>
        <form action="/admin/anuncios" className="search" style={{ minWidth: 260 }}>
          <input type="hidden" name="ver" value={ver} />
          <input name="q" type="search" defaultValue={q} placeholder="Título, descrição ou vendedor" aria-label="Buscar anúncios" />
        </form>
      </div>
      {listings.length ? (
        <div className="panel list">
          {listings.map((l) => (
            <div key={l.id} className="list-row">
              <div className="thumb"><Art game={l.game} glyph={l.glyph} showName={false} /></div>
              <div>
                <Link href={`/anuncio/${l.id}`}><b>{l.title}</b></Link>
                <span className="muted small">
                  {TYPE_LABEL[l.type]} · {l.game.name} · {money(l.priceCents)} · por <Link className="lime" href={`/loja/${l.seller.username}`}>{l.seller.username}</Link> · {dateTime(l.createdAt)}
                </span>
                {l.status === "REMOVIDO" && <span className="error" style={{ display: "block" }}>Removido: {l.moderationNote}</span>}
              </div>
              <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                <span className={`chip ${l.status === "ATIVO" ? "ok" : l.status === "REMOVIDO" ? "bad" : ""}`}>{l.status === "ATIVO" ? "Ativo" : l.status === "REMOVIDO" ? "Removido" : "Pausado"}</span>
                <ListingModeration id={l.id} removed={l.status === "REMOVIDO"} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel empty"><p className="muted">Nenhum anúncio neste filtro.</p></div>
      )}
    </div>
  );
}
