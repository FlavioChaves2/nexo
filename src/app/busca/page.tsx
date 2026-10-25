import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cardInclude, favoriteIds, visibleListing } from "@/lib/queries";
import { LISTING_TYPES, TYPE_PLURAL } from "@/lib/constants";
import { ListingCard } from "@/components/ListingCard";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";

export const metadata = { title: "Buscar" };

type SP = { q?: string; jogo?: string; tipo?: string; auto?: string; max?: string; ordem?: string };

const ORDENS: Record<string, Prisma.ListingOrderByWithRelationInput[]> = {
  relevancia: [{ featured: "desc" }, { soldCount: "desc" }, { createdAt: "desc" }],
  menor: [{ priceCents: "asc" }],
  maior: [{ priceCents: "desc" }],
  vendidos: [{ soldCount: "desc" }],
  recentes: [{ createdAt: "desc" }],
};

export default async function BuscaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const tipo = LISTING_TYPES.includes(sp.tipo as never) ? sp.tipo! : "";
  const ordem = sp.ordem && ORDENS[sp.ordem] ? sp.ordem : "relevancia";
  const max = Number(sp.max);
  const user = await getCurrentUser();

  const where: Prisma.ListingWhereInput = {
    ...visibleListing,
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { game: { name: { contains: q, mode: "insensitive" } } }] }),
    ...(sp.jogo && { gameSlug: sp.jogo }),
    ...(tipo && { type: tipo }),
    ...(sp.auto === "1" && { autoDelivery: true }),
    ...(max > 0 && { priceCents: { lte: Math.round(max * 100) } }),
  };

  const [games, results, favs] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { listings: { where: visibleListing } } } } }),
    db.listing.findMany({ where, include: cardInclude, orderBy: ORDENS[ordem], take: 60 }),
    favoriteIds(user?.id),
  ]);

  const game = games.find((g) => g.slug === sp.jogo);
  const title = game?.name ?? (tipo ? TYPE_PLURAL[tipo] : q ? `Resultados para “${q}”` : "Todos os anúncios");

  return (
    <div className="wrap catalog">
      <AutoSubmitForm className="panel filters" action="/busca" aria-label="Filtros">
        <div className="field">
          <label htmlFor="q">Palavra-chave</label>
          <input className="input" id="q" name="q" type="search" defaultValue={q} placeholder="Ex.: skins, VP, nível" />
        </div>
        <fieldset>
          <legend>Jogo</legend>
          <div className="radio-pills">
            <label><input type="radio" name="jogo" value="" defaultChecked={!sp.jogo} /><span>Todos</span></label>
            {games.map((g) => (
              <label key={g.slug}>
                <input type="radio" name="jogo" value={g.slug} defaultChecked={sp.jogo === g.slug} />
                <span>{g.name} <small className="muted">{g._count.listings}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Tipo</legend>
          <div className="radio-pills">
            <label><input type="radio" name="tipo" value="" defaultChecked={!tipo} /><span>Todos</span></label>
            {LISTING_TYPES.map((t) => (
              <label key={t}><input type="radio" name="tipo" value={t} defaultChecked={tipo === t} /><span>{TYPE_PLURAL[t]}</span></label>
            ))}
          </div>
        </fieldset>
        <label className="check"><input type="checkbox" name="auto" value="1" defaultChecked={sp.auto === "1"} />Só entrega automática</label>
        <div className="field">
          <label htmlFor="max">Preço máximo (R$)</label>
          <input className="input" id="max" name="max" type="number" min="0" step="1" inputMode="numeric" defaultValue={max > 0 ? max : ""} placeholder="Sem limite" />
        </div>
        <input type="hidden" name="ordem" value={ordem} />
        <button className="btn btn-ghost" type="submit">Aplicar filtros</button>
        <Link className="linkish small" href="/busca">Limpar filtros</Link>
      </AutoSubmitForm>

      <section>
        <div className="results-head">
          <div className="grid-gap" style={{ gap: 4 }}>
            <span className="eyebrow">{results.length} {results.length === 1 ? "anúncio" : "anúncios"}</span>
            <h2>{title}</h2>
          </div>
          <AutoSubmitForm action="/busca">
            {Object.entries(sp).map(([k, v]) => (k !== "ordem" && v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
            <select className="input" name="ordem" defaultValue={ordem} aria-label="Ordenar" style={{ width: "auto" }}>
              <option value="relevancia">Mais relevantes</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="vendidos">Mais vendidos</option>
              <option value="recentes">Mais recentes</option>
            </select>
          </AutoSubmitForm>
        </div>
        {results.length ? (
          <div className="cards">{results.map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}</div>
        ) : (
          <div className="panel empty">
            <h3>Nenhum anúncio com esses filtros</h3>
            <p className="muted">Tente remover um filtro ou buscar outro termo.</p>
            <Link className="btn btn-ghost" href="/busca">Limpar filtros</Link>
          </div>
        )}
      </section>
    </div>
  );
}
