import Link from "next/link";
import { db } from "@/lib/db";
import { currentFeeBps } from "@/lib/attribution";
import { requireUser } from "@/lib/auth";
import { sellerPublic } from "@/lib/queries";
import { ListingForm } from "@/components/ListingForm";
import { inWelcomeFee, welcomeFeeLabel } from "@/lib/welcome-fee";

export const metadata = { title: "Criar anúncio" };

export default async function VenderPage() {
  const feeNow = await currentFeeBps();
  const me = await requireUser("/vender");
  // Conta com menos de 72 h: taxa zero de boas-vindas.
  const welcome = inWelcomeFee(me.createdAt);
  const fee = welcome ? 0 : feeNow;
  const [games, seller] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" } }),
    db.user.findUniqueOrThrow({ where: { id: me.id }, ...sellerPublic }),
  ]);
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap"><span className="eyebrow">Sua loja começa aqui</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Criar anúncio</h1>{welcome ? <span className="welcome-fee"><b>Taxa ZERO</b> nas vendas até {welcomeFeeLabel(me.createdAt)}: presente de boas-vindas. Depois, {(feeNow / 100).toString().replace(".", ",")}% só quando vender.</span> : <Link className="linkish small" href="/conta/taxas">Taxa de {(feeNow / 100).toString().replace(".", ",")}% só quando vender · ver taxas e prazos →</Link>}</div>
      </div>
      <Link className="home-founders" href="/fundadores" style={{ marginBottom: 16 }}>
        <span aria-hidden="true">👑</span>
        <span><b>Campanha dos Fundadores:</b> os 20 primeiros vendedores a <b>concluir uma venda</b> ganham o título para sempre. Publicar o anúncio é o primeiro passo.</span>
      </Link>
      <ListingForm games={games} seller={seller} feeBps={fee} welcomeUntil={welcome ? welcomeFeeLabel(me.createdAt) : undefined} />
    </div>
  );
}
