import Link from "next/link";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/constants";
import { openWanted } from "@/lib/wanted";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Quero comprar: pedidos de compradores" };
export const dynamic = "force-dynamic";

export default async function QueroComprarPage({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  const { jogo } = await searchParams;
  const [games, list] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" }, select: { slug: true, name: true } }),
    db.wanted.findMany({
      where: { ...openWanted(), buyer: { suspendedAt: null }, ...(jogo && { gameSlug: jogo }) },
      include: { game: { select: { name: true } }, buyer: { select: { username: true } }, _count: { select: { offers: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Quero comprar</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Pedidos de compradores</h1>
          <p className="muted">Não achou o que queria? Publique um pedido e receba ofertas. Vendedor: responda e venda com a Garantia Nexo.</p>
        </div>
        <Link className="btn btn-primary" href={`/quero-comprar/novo${jogo ? `?jogo=${jogo}` : ""}`}>+ Publicar pedido</Link>
      </div>
      <section className="section">
        <nav className="wanted-games" aria-label="Filtrar por jogo">
          <Link className={`chip${jogo ? "" : " ok"}`} href="/quero-comprar">Todos</Link>
          {games.map((g) => <Link key={g.slug} className={`chip${jogo === g.slug ? " ok" : ""}`} href={`/quero-comprar?jogo=${g.slug}`}>{g.name}</Link>)}
        </nav>
        {list.length ? (
          <div className="panel">
            {list.map((w) => (
              <Link key={w.id} href={`/quero-comprar/${w.id}`} className="notif wanted-row">
                <Icon name="search" />
                <div style={{ minWidth: 0 }}>
                  <b>{w.title}</b>
                  <p className="muted small">{w.game.name} · {TYPE_LABEL[w.type]} · por {w.buyer.username} · {w._count.offers} oferta{w._count.offers === 1 ? "" : "s"}</p>
                </div>
                <span className="grid-gap" style={{ justifyItems: "end" }}><b className="mono">até {money(w.maxCents)}</b><span className="muted small">vence {dateTime(w.expiresAt)}</span></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel empty">
            <h3>Nenhum pedido aberto{jogo ? " para este jogo" : ""}</h3>
            <p className="muted">Seja o primeiro a dizer o que procura.</p>
            <Link className="btn btn-ghost" href={`/quero-comprar/novo${jogo ? `?jogo=${jogo}` : ""}`}>Publicar pedido</Link>
          </div>
        )}
      </section>
    </div>
  );
}
