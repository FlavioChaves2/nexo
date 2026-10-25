import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { feeBps } from "@/lib/format";
import { sellerPublic } from "@/lib/queries";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Criar anúncio" };

export default async function VenderPage() {
  const me = await requireUser("/vender");
  const [games, seller] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" } }),
    db.user.findUniqueOrThrow({ where: { id: me.id }, ...sellerPublic }),
  ]);
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap"><span className="eyebrow">Sua loja começa aqui</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Criar anúncio</h1></div>
      </div>
      <ListingForm games={games} seller={seller} feeBps={feeBps()} />
    </div>
  );
}
