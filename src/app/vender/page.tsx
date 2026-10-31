import Link from "next/link";
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
        <div className="grid-gap"><span className="eyebrow">Sua loja começa aqui</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Criar anúncio</h1><Link className="linkish small" href="/conta/taxas">Taxa de {(feeBps() / 100).toString().replace(".", ",")}% só quando vender · ver taxas e prazos →</Link></div>
      </div>
      <Link className="home-founders" href="/fundadores" style={{ marginBottom: 16 }}>
        <span aria-hidden="true">👑</span>
        <span><b>Campanha dos Fundadores:</b> os 20 primeiros vendedores a <b>concluir uma venda</b> ganham o título para sempre. Publicar o anúncio é o primeiro passo.</span>
      </Link>
      <ListingForm games={games} seller={seller} feeBps={feeBps()} />
    </div>
  );
}
