import { notFound } from "next/navigation";
import { titlesSelect } from "@/lib/titles";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pct, monthYear } from "@/lib/format";
import { sellerStats } from "@/lib/orders";
import { cardInclude, displayName, favoriteIds, visibleListing } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";
import { ListingCard } from "@/components/ListingCard";
import { Stars } from "@/components/Icon";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  return { title: `Loja de ${decodeURIComponent((await params).username)}` };
}

export default async function LojaPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const seller = await db.user.findUnique({ where: { username: decodeURIComponent(username) }, include: titlesSelect });
  if (!seller) notFound();

  const me = await getCurrentUser();
  const [stats, listings, reviews, favs] = await Promise.all([
    sellerStats(seller.id),
    db.listing.findMany({ where: { ...visibleListing, sellerId: seller.id }, include: cardInclude, orderBy: { soldCount: "desc" } }),
    db.review.findMany({ where: { sellerId: seller.id }, include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    favoriteIds(me?.id),
  ]);

  return (
    <div className="wrap">
      <div className="panel profile">
        <Avatar user={seller} size="xl" />
        <div className="stack" style={{ gap: 10, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "flex-start", gap: 10 }}><h1 style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>{displayName(seller)}</h1><SellerBadges rep={seller} /></div>
          {seller.storeName && <span className="muted small">@{seller.username}</span>}
          {seller.bio && <p className="muted" style={{ maxWidth: "62ch" }}>{seller.bio}</p>}
          <div className="profile-stats">
            <div><b>{seller.completedSales}</b>vendas</div>
            <div><b>{stats.reviews ? pct(stats.positivePct) : "—"}</b>positivas</div>
            <div><b>{stats.reviews}</b>avaliações</div>
            <div><b>{monthYear(seller.createdAt)}</b>na Nexo</div>
          </div>
        </div>
      </div>
      <section className="section">
        <div className="section-head"><h2>Anúncios ({listings.length})</h2></div>
        {listings.length ? (
          <div className="cards">{listings.map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}</div>
        ) : (
          <p className="muted">Nenhum anúncio ativo.</p>
        )}
      </section>
      {reviews.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Avaliações</h2></div>
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
