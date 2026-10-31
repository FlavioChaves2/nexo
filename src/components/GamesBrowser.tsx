"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";

type G = { slug: string; name: string; letter: string; c1: string; popular: boolean; count: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const initial = (name: string) => {
  const c = norm(name)[0] ?? "#";
  return /[a-z]/.test(c) ? c.toUpperCase() : "#";
};

function Tile({ g }: { g: G }) {
  return (
    <Link className="uni" href={`/busca?jogo=${g.slug}`} style={{ "--c1": g.c1 } as CSSProperties}>
      <span className="letra">{g.letter}</span>
      <div>
        <b>{g.name}</b>
        <small>{g.count ? `${g.count} ${g.count === 1 ? "anúncio" : "anúncios"}` : "Explorar"} <Icon name="arrow" /></small>
      </div>
    </Link>
  );
}

/** Lista de todos os jogos com busca, "com anúncios agora", "populares" e índice de A a Z. */
export function GamesBrowser({ games }: { games: G[] }) {
  const [q, setQ] = useState("");
  const n = norm(q.trim());
  const found = useMemo(() => (n ? games.filter((g) => norm(g.name).includes(n)) : games), [n, games]);
  const groups = useMemo(() => {
    const m = new Map<string, G[]>();
    for (const g of found) m.set(initial(g.name), [...(m.get(initial(g.name)) ?? []), g]);
    return [...m.entries()].sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  }, [found]);
  const withListings = games.filter((g) => g.count > 0).sort((a, b) => b.count - a.count);
  const popular = games.filter((g) => g.popular);

  return (
    <div className="stack" style={{ paddingBlock: "16px 40px", gap: 26 }}>
      <div className="games-search">
        <Icon name="search" />
        <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar entre ${games.length} jogos`} aria-label="Buscar jogo" />
      </div>

      {n ? (
        found.length ? <div className="unis">{found.map((g) => <Tile key={g.slug} g={g} />)}</div> : (
          <div className="panel empty">
            <p className="muted">Nenhum jogo com “{q}”. Anuncie em “Outros jogos” e diga o nome no título.</p>
            <Link className="btn btn-primary" href="/vender">Criar anúncio</Link>
          </div>
        )
      ) : (
        <>
          {withListings.length > 0 && (
            <section className="stack" style={{ gap: 12 }}>
              <h2 className="games-h">Com anúncios agora</h2>
              <div className="unis">{withListings.map((g) => <Tile key={g.slug} g={g} />)}</div>
            </section>
          )}
          <section className="stack" style={{ gap: 12 }}>
            <h2 className="games-h">Mais populares</h2>
            <div className="unis">{popular.map((g) => <Tile key={g.slug} g={g} />)}</div>
          </section>
          <nav className="az" aria-label="Índice de A a Z">
            {groups.map(([l]) => <a key={l} href={`#letra-${l}`}>{l}</a>)}
          </nav>
          {groups.map(([l, list]) => (
            <section key={l} id={`letra-${l}`} className="stack" style={{ gap: 12, scrollMarginTop: 140 }}>
              <h2 className="games-h az-letter">{l}</h2>
              <div className="unis">{list.map((g) => <Tile key={g.slug} g={g} />)}</div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
