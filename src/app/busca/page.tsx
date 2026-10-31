import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cardInclude, favoriteIds, visibleListing } from "@/lib/queries";
import { withOrbitFirst } from "@/lib/orbit";
import { parseReais } from "@/lib/format";
import { LISTING_TYPES, TYPE_PLURAL } from "@/lib/constants";
import { ListingCard } from "@/components/ListingCard";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { GameBanner } from "@/components/GameBanner";
import { Nexinho3D } from "@/components/Nexinho3D";
import { Icon } from "@/components/Icon";
import { GamePicker } from "@/components/GamePicker";
import { AlertButton } from "@/components/AlertButton";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const game = sp.jogo ? await db.game.findUnique({ where: { slug: sp.jogo }, select: { name: true } }) : null;
  const tipo = sp.tipo && TYPE_PLURAL[sp.tipo] ? TYPE_PLURAL[sp.tipo] : null;
  if (sp.q) return { title: `“${sp.q.slice(0, 40)}” à venda` };
  if (tipo && game) return { title: `${tipo} de ${game.name} à venda` };
  if (game) return { title: `${game.name}: contas, itens e moedas` };
  if (tipo) return { title: `${tipo} de jogos à venda` };
  return { title: "Todos os anúncios" };
}

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
  // Aceita "39.90", "39,90" ou "40"; negativo, vazio ou texto inválido = sem limite.
  const maxCents = sp.max ? parseReais(sp.max) : NaN;
  const max = Number.isFinite(maxCents) && maxCents > 0 ? maxCents / 100 : 0;
  // Muda a cada combinação de filtros: o formulário é recriado e não guarda marcações antigas (ex.: depois de "Limpar filtros").
  const formKey = JSON.stringify([q, sp.jogo ?? "", tipo, sp.auto ?? "", max, ordem]);
  // Filtros que viram um alerta "Me avise quando aparecer".
  const alertFilters = { q, jogo: sp.jogo ?? "", tipo, max: max > 0 ? max.toFixed(2) : "" };
  const hasFilter = Object.values(alertFilters).some(Boolean);
  const user = await getCurrentUser();

  const where: Prisma.ListingWhereInput = {
    ...visibleListing,
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { game: { name: { contains: q, mode: "insensitive" } } }] }),
    ...(sp.jogo && { gameSlug: sp.jogo }),
    ...(tipo && { type: tipo }),
    ...(sp.auto === "1" && { autoDelivery: true }),
    ...(max > 0 && { priceCents: { lte: maxCents } }),
  };

  const [games, results, favs] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { listings: { where: visibleListing } } } } }),
    // Em "Mais relevantes", até 6 anúncios em órbita vêm primeiro; nas outras ordens vale só a ordem escolhida.
    ordem === "relevancia" ? withOrbitFirst(where, ORDENS[ordem], 60, 6) : db.listing.findMany({ where, include: cardInclude, orderBy: ORDENS[ordem], take: 60 }),
    favoriteIds(user?.id),
  ]);

  const game = games.find((g) => g.slug === sp.jogo);
  const activeFilters = [q, sp.jogo, tipo, sp.auto === "1", max > 0].filter(Boolean).length;
  const title = game?.name ?? (tipo ? TYPE_PLURAL[tipo] : q ? `Resultados para “${q}”` : "Todos os anúncios");

  return (
    <div className="wrap catalog">
      {/* Celular: os filtros ficam atrás deste botão, para os anúncios aparecerem logo (só CSS, sem JavaScript). */}
      <input type="checkbox" id="ft" className="ft-toggle" aria-hidden="true" tabIndex={-1} />
      <label htmlFor="ft" className="btn btn-ghost ft-btn"><Icon name="search" />Filtros{activeFilters > 0 && <span className="ft-count">{activeFilters}</span>}</label>
      <AutoSubmitForm key={formKey} className="panel filters" action="/busca" aria-label="Filtros">
        <div className="field">
          <label htmlFor="q">Palavra-chave</label>
          <input className="input" id="q" name="q" type="search" defaultValue={q} placeholder="Ex.: skins, VP, nível" />
        </div>
        <div className="field">
          <label htmlFor="jogo-busca">Jogo</label>
          <GamePicker id="jogo-busca" name="jogo" value={sp.jogo ?? ""} allowAll autoSubmit games={games.map((g) => ({ slug: g.slug, name: g.name, c1: g.c1, count: g._count.listings }))} />
          <Link className="linkish small" href="/jogos">Ver todos os jogos</Link>
        </div>
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
          <input className="input" id="max" name="max" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={max > 0 ? max.toFixed(2) : ""} placeholder="Sem limite" />
        </div>
        <input type="hidden" name="ordem" value={ordem} />
        <button className="btn btn-ghost" type="submit">Aplicar filtros</button>
        <Link className="linkish small" href="/busca">Limpar filtros</Link>
      </AutoSubmitForm>

      <section>
        {game && <GameBanner game={game} count={results.length} />}
        <div className="results-head">
          <div className="grid-gap" style={{ gap: 4 }}>
            <span className="eyebrow">{results.length} {results.length === 1 ? "anúncio" : "anúncios"}</span>
            <h2>{title}</h2>
            {hasFilter && results.length > 0 && <AlertButton filters={alertFilters} logged={!!user} />}
          </div>
          <AutoSubmitForm key={formKey} action="/busca">
            {Object.entries({ q, jogo: sp.jogo, tipo, auto: sp.auto === "1" ? "1" : "", max: max > 0 ? max.toFixed(2) : "" }).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
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
            <Nexinho3D className="sad-bot" mood="sad" decor={false} interactive={false} zoom={11} label="Nexinho triste: nada encontrado" />
            <h3>Nenhum anúncio com esses filtros</h3>
            {hasFilter ? (
              <>
                <p className="muted">Crie um alerta: avisamos no seu celular assim que alguém anunciar isso.</p>
                <AlertButton filters={alertFilters} logged={!!user} big />
                <p className="muted small">Ou publique um pedido em Quero comprar e receba ofertas dos vendedores.</p>
                <div className="copy-row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                  <Link className="btn btn-ghost" href="/busca">Limpar filtros</Link>
                  <Link className="btn btn-ghost" href="/quero-comprar/novo">Quero comprar</Link>
                </div>
              </>
            ) : (
              <>
                <p className="muted">Tente remover um filtro ou buscar outro termo.</p>
                <p className="muted">Ou publique um pedido e deixe os vendedores virem até você.</p>
                <div className="copy-row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                  <Link className="btn btn-ghost" href="/busca">Limpar filtros</Link>
                  <Link className="btn btn-primary" href="/quero-comprar/novo">Quero comprar</Link>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
