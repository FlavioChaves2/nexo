import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { titlesSelect } from "@/lib/titles";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pct, monthYear } from "@/lib/format";
import { sellerStats } from "@/lib/orders";
import { cardInclude, displayName, favoriteIds, visibleListing } from "@/lib/queries";
import { imageUrl } from "@/lib/images-url";
import { TYPE_LABEL } from "@/lib/constants";
import { deliveryStats, durationLabel, isFollowing, storeLink } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";
import { ListingCard } from "@/components/ListingCard";
import { StoreActions } from "@/components/StoreActions";
import { Icon, Stars } from "@/components/Icon";
import { after } from "next/server";
import { recordTouch, visitorId } from "@/lib/attribution";

type Search = { jogo?: string; servidor?: string; tipo?: string; q?: string };

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username);
  const u = await db.user.findUnique({ where: { username }, select: { storeName: true, bio: true, suspendedAt: true } });
  if (!u || u.suspendedAt) return { title: "Loja" };
  const name = u.storeName || username;
  return { title: `${name} · Loja na Nexo`, description: u.bio.slice(0, 160) || `Anúncios de ${name} com pagamento pela Garantia Nexo.` };
}

// Loja do vendedor. Mostra só os anúncios dele: nada de recomendações de outras lojas aqui.
export default async function LojaPage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<Search> }) {
  const { username } = await params;
  const sp = await searchParams;
  const seller = await db.user.findUnique({ where: { username: decodeURIComponent(username) }, include: titlesSelect });
  if (!seller || seller.suspendedAt) notFound();

  const me = await getCurrentUser();
  const mine = me?.id === seller.id;
  // Visita à loja sem passar pelo link /v/ conta como contato pelo marketplace (o primeiro contato decide).
  const vid = await visitorId();
  if (!mine) after(() => recordTouch({ sellerId: seller.id, source: "MARKETPLACE", userId: me?.id, visitorId: vid }).catch(() => {}));
  const base = { ...visibleListing, sellerId: seller.id };
  const where: Prisma.ListingWhereInput = { ...base };
  if (sp.jogo) where.gameSlug = sp.jogo;
  if (sp.servidor) where.server = sp.servidor;
  if (sp.tipo && TYPE_LABEL[sp.tipo]) where.type = sp.tipo;
  const q = sp.q?.trim().slice(0, 60);
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [stats, listings, all, reviews, favs, delivery, following, followers] = await Promise.all([
    sellerStats(seller.id),
    db.listing.findMany({ where, include: cardInclude, orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }], take: 120 }),
    db.listing.findMany({ where: base, select: { gameSlug: true, server: true, type: true, game: { select: { name: true } } } }),
    db.review.findMany({ where: { sellerId: seller.id }, include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    favoriteIds(me?.id),
    deliveryStats(seller.id),
    isFollowing(me?.id, seller.id),
    db.storeFollow.count({ where: { sellerId: seller.id } }),
  ]);

  // Opções de filtro só com o que existe na loja.
  const games = [...new Map(all.map((l) => [l.gameSlug, l.game.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const servers = [...new Set(all.map((l) => l.server).filter(Boolean))].sort();
  const types = [...new Set(all.map((l) => l.type))];
  const filtered = Boolean(sp.jogo || sp.servidor || sp.tipo || q);
  const name = displayName(seller);
  const path = `/loja/${seller.username}`;

  return (
    <div className="wrap store">
      <div className="store-cover" style={seller.storeBannerId ? { backgroundImage: `url(${imageUrl(seller.storeBannerId)})` } : undefined} aria-hidden="true" />
      <div className="panel store-head">
        <Avatar user={seller} size="xl" />
        <div className="stack" style={{ gap: 10, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>{name}</h1>
            <SellerBadges rep={seller} />
          </div>
          <span className="muted small">@{seller.username} · na Nexo desde {monthYear(seller.createdAt)}</span>
          {seller.bio && <p className="muted" style={{ maxWidth: "70ch", whiteSpace: "pre-line" }}>{seller.bio}</p>}
          <StoreActions sellerId={seller.id} path={path} shareUrl={storeLink(seller.username)} name={name} following={following} followers={followers} loggedIn={!!me} mine={mine} />
          {mine && <p className="muted small">Este é o link para divulgar: <b>nexopoint.com.br{storeLink(seller.username)}</b>. <Link className="lime" href="/conta/perfil">Editar loja</Link></p>}
        </div>
      </div>

      <section className="store-facts" aria-label="Reputação e atendimento na Nexo">
        <div><b>{seller.completedSales}</b><span>vendas concluídas na Nexo</span></div>
        <div><b>{stats.reviews ? pct(stats.positivePct) : "—"}</b><span>{stats.reviews ? `positivas em ${stats.reviews} avaliações` : "ainda sem avaliações"}</span></div>
        <div><b>{delivery.medianMin !== null ? durationLabel(delivery.medianMin) : "—"}</b><span>{delivery.medianMin !== null ? `tempo típico de entrega (${delivery.count} entregas, 90 dias)` : "tempo de entrega: poucas entregas ainda"}</span></div>
        <div><b>{seller.storeHours || "—"}</b><span>horário de atendimento informado pelo vendedor</span></div>
      </section>

      <section className="section" id="catalogo">
        <div className="section-head"><h2>Anúncios {filtered ? `(${listings.length} de ${all.length})` : `(${all.length})`}</h2></div>
        {all.length > 0 && (
          <form className="store-filters" action={path} role="search" aria-label="Filtrar anúncios da loja">
            <input className="input" name="q" defaultValue={q} placeholder="Buscar nesta loja" aria-label="Buscar nesta loja" />
            {games.length > 1 && (
              <select className="input" name="jogo" defaultValue={sp.jogo ?? ""} aria-label="Jogo">
                <option value="">Todos os jogos</option>
                {games.map(([slug, n]) => <option key={slug} value={slug}>{n}</option>)}
              </select>
            )}
            {servers.length > 0 && (
              <select className="input" name="servidor" defaultValue={sp.servidor ?? ""} aria-label="Servidor">
                <option value="">Todos os servidores</option>
                {servers.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {types.length > 1 && (
              <select className="input" name="tipo" defaultValue={sp.tipo ?? ""} aria-label="Tipo">
                <option value="">Todos os tipos</option>
                {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
              </select>
            )}
            <button className="btn btn-primary btn-sm" type="submit"><Icon name="search" />Filtrar</button>
            {filtered && <Link className="btn btn-ghost btn-sm" href={`${path}#catalogo`}>Limpar</Link>}
          </form>
        )}
        {listings.length ? (
          <div className="cards">{listings.map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}</div>
        ) : (
          <div className="panel empty">
            <p className="muted">{filtered ? "Nenhum anúncio desta loja com esses filtros." : mine ? "Você ainda não tem anúncios ativos." : "Esta loja ainda não tem anúncios ativos."}</p>
            {mine && <Link className="btn btn-primary" href="/vender">Criar anúncio</Link>}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Avaliações na Nexo</h2></div>
          <div className="panel box">
            {reviews.map((r) => (
              <div className="review" key={r.id}>
                <div className="row"><b>{r.author.username.slice(0, 2)}***</b><Stars n={r.rating} /></div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
