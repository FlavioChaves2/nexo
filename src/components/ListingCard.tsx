import Link from "next/link";
import type { Game, Listing } from "@prisma/client";
import { money } from "@/lib/format";
import { TYPE_PLURAL } from "@/lib/constants";
import { imageUrl } from "@/lib/images-url";
import { Art } from "./Art";
import { Avatar } from "./Avatar";
import { FavButton } from "./FavButton";
import { Icon } from "./Icon";
import { SellerBadges } from "./SellerBadges";

export type CardListing = Listing & {
  game: Game;
  seller: { username: string; storeName?: string; avatarId?: string | null; verification?: string; completedSales?: number; ratingSum?: number; ratingCount?: number };
  images?: { id: string }[];
};

export function ListingCard({ l, fav = false, preview = false, previewImage }: { l: CardListing; fav?: boolean; preview?: boolean; previewImage?: string }) {
  const photo = previewImage ?? (l.images?.[0] ? imageUrl(l.images[0].id) : null);
  const s = l.seller;
  return (
    <article className="card">
      {!preview && <Link className="card-link" href={`/anuncio/${l.id}`} aria-label={l.title} />}
      <div className="thumb">
        {photo ? <img className="photo" src={photo} alt="" loading="lazy" /> : <Art game={l.game} glyph={l.glyph} />}
        {!preview && <FavButton listingId={l.id} initial={fav} />}
      </div>
      <div className="card-body">
        <span className="eyebrow">{TYPE_PLURAL[l.type]}</span>
        <div className="card-title">{l.title}</div>
        <div className="card-seller">
          <Avatar user={s} />
          <span className="nome">{s.storeName || s.username}</span>
          <SellerBadges rep={{ completedSales: s.completedSales ?? 0, ratingSum: s.ratingSum ?? 0, ratingCount: s.ratingCount ?? 0, verification: s.verification }} compact />
          {l.autoDelivery && (
            <span className="chip auto">
              <Icon name="bolt" />
              Auto
            </span>
          )}
        </div>
      </div>
      <div className="card-foot">
        <div>
          <small>{l.soldCount ? `${l.soldCount.toLocaleString("pt-BR")} vendidos` : l.stock === 1 ? "Unidade única" : "Novo"}</small>
          <span className="price">{money(l.priceCents)}</span>
          {l.oldPriceCents ? <span className="price-old">{money(l.oldPriceCents)}</span> : null}
        </div>
        <span className="go" aria-hidden="true">
          <Icon name="arrow" />
        </span>
      </div>
    </article>
  );
}
