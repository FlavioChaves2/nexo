import type { CSSProperties } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/constants";
import { openWanted } from "@/lib/wanted";
import { Icon } from "@/components/Icon";
import { Nexinho3D } from "@/components/Nexinho3D";

export const metadata = { title: "Quero comprar: diga o que procura e receba ofertas" };
export const dynamic = "force-dynamic";

/** "vence em 3 d" / "vence em 5 h" */
function timeLeft(d: Date) {
  const h = Math.max(1, Math.round((d.getTime() - Date.now()) / 3_600_000));
  return h >= 24 ? `${Math.round(h / 24)} d` : `${h} h`;
}

const STEPS = [
  { icon: "search", t: "Diga o que procura", d: "Jogo, detalhes e quanto você paga no máximo." },
  { icon: "chat", t: "Receba ofertas", d: "Vendedores disputam o seu pedido com preço e prazo." },
  { icon: "shield", t: "Aceite e pague seguro", d: "O dinheiro fica com a Nexo até você receber." },
] as const;

export default async function QueroComprarPage({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  const { jogo } = await searchParams;
  const open = { ...openWanted(), buyer: { suspendedAt: null } };
  const [games, list, totals, offers] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" }, select: { slug: true, name: true, c1: true, c2: true, letter: true } }),
    db.wanted.findMany({
      where: { ...open, ...(jogo && { gameSlug: jogo }) },
      include: { game: { select: { name: true, c1: true, c2: true, letter: true } }, buyer: { select: { username: true } }, _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.wanted.aggregate({ where: open, _count: true, _sum: { maxCents: true } }),
    db.wantedOffer.count({ where: { wanted: open } }),
  ]);
  const novo = `/quero-comprar/novo${jogo ? `?jogo=${jogo}` : ""}`;
  const dayAgo = Date.now() - 86_400_000;

  return (
    <div className="wrap">
      <section className="qc-hero">
        <div className="qc-copy">
          <span className="qc-badge"><Icon name="bolt" />Exclusivo da Nexo</span>
          <h1>Não achou? <span className="qc-shine">Peça.</span><br />Os vendedores vêm até você.</h1>
          <p className="muted">Publique o que procura e receba ofertas de vendedores verificados. Você escolhe a melhor e paga com a Garantia Nexo.</p>
          <div className="qc-cta">
            <Link className="btn btn-primary" href={novo}>+ Publicar pedido</Link>
            <a className="btn btn-ghost" href="#pedidos">Sou vendedor: ver pedidos</a>
          </div>
          {/* Sem pedidos ainda, números zerados afastam: mostra as vantagens no lugar. */}
          <div className="qc-stats">
            {totals._count > 0 ? (
              <>
                <div><b>{totals._count.toLocaleString("pt-BR")}</b><span>pedidos abertos</span></div>
                <div><b>{offers.toLocaleString("pt-BR")}</b><span>ofertas enviadas</span></div>
                <div><b>{money(totals._sum.maxCents ?? 0)}</b><span>em compras esperando vendedor</span></div>
              </>
            ) : (
              <>
                <div><b>Grátis</b><span>publicar um pedido</span></div>
                <div><b>7 dias</b><span>recebendo ofertas</span></div>
                <div><b>100%</b><span>protegido pela Garantia Nexo</span></div>
              </>
            )}
          </div>
        </div>
        <Nexinho3D className="qc-bot" decor={false} zoom={9} label="Nexinho, o mascote da Nexo" />
      </section>

      <ol className="qc-steps">
        {STEPS.map((s, i) => (
          <li key={s.t}><span className="qc-num">{i + 1}</span><Icon name={s.icon} /><b>{s.t}</b><span className="muted small">{s.d}</span></li>
        ))}
      </ol>

      <section className="section" id="pedidos">
        <div className="section-head"><h2><Icon name="search" />Pedidos abertos</h2></div>
        <nav className="wanted-games" aria-label="Filtrar por jogo">
          <Link className={`qc-game${jogo ? "" : " on"}`} href="/quero-comprar#pedidos">Todos</Link>
          {games.map((g) => (
            <Link key={g.slug} className={`qc-game${jogo === g.slug ? " on" : ""}`} style={{ "--c1": g.c1 } as CSSProperties} href={`/quero-comprar?jogo=${g.slug}#pedidos`}>{g.name}</Link>
          ))}
        </nav>
        {list.length ? (
          <div className="qc-grid">
            {list.map((w) => (
              <Link key={w.id} href={`/quero-comprar/${w.id}`} className="qc-card" style={{ "--c1": w.game.c1, "--c2": w.game.c2 } as CSSProperties}>
                <span className="qc-letter" aria-hidden="true">{w.game.letter}</span>
                <div className="qc-top">
                  <span className="qc-tag">{w.game.name} · {TYPE_LABEL[w.type]}</span>
                  {w.createdAt.getTime() > dayAgo && <span className="qc-new">Novo</span>}
                </div>
                <b className="qc-title">{w.title}</b>
                <span className="muted small">por {w.buyer.username}</span>
                <div className="qc-foot">
                  <div><span className="muted small">Paga até</span><b className="mono">{money(w.maxCents)}</b></div>
                  <div className="qc-meta">
                    <span className={w._count.offers ? "qc-hot" : ""}><Icon name="chat" />{w._count.offers} oferta{w._count.offers === 1 ? "" : "s"}</span>
                    <span className="muted small">vence em {timeLeft(w.expiresAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel empty qc-empty">
            <Nexinho3D className="sad-bot" decor={false} interactive={false} zoom={11} label="Nexinho esperando o primeiro pedido" />
            <h3>Nenhum pedido aberto{jogo ? " para este jogo" : ""} ainda</h3>
            <p className="muted">Seja o primeiro: quem pede primeiro recebe a atenção de todos os vendedores.</p>
            <Link className="btn btn-primary" href={novo}>Publicar o primeiro pedido</Link>
          </div>
        )}
      </section>
    </div>
  );
}
