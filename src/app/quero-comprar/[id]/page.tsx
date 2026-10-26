import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/constants";
import { sellerPublic } from "@/lib/queries";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";
import { AcceptButton, CancelWantedButton, OfferForm } from "@/components/WantedForms";

export const metadata = { title: "Pedido de compra" };
export const dynamic = "force-dynamic";

const OFFER_STATUS: Record<string, string> = { ENVIADA: "Aguardando", ACEITA: "Aceita", RECUSADA: "Recusada" };

export default async function PedidoCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [w, user] = await Promise.all([
    db.wanted.findUnique({
      where: { id },
      include: {
        game: { select: { name: true } },
        buyer: { select: { username: true, suspendedAt: true } },
        offers: { include: { seller: sellerPublic }, orderBy: { priceCents: "asc" } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!w || w.buyer.suspendedAt) notFound();

  const isBuyer = user?.id === w.buyerId;
  const open = w.status === "ABERTO" && w.expiresAt > new Date();
  const mine = user ? w.offers.find((o) => o.sellerId === user.id) : undefined;
  // O comprador vê todas as ofertas; cada vendedor vê só a própria.
  const offers = isBuyer ? w.offers : mine ? [mine] : [];
  const status = open ? "Aberto" : w.status === "FECHADO" ? "Oferta aceita" : w.status === "CANCELADO" ? "Cancelado" : "Vencido";

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/quero-comprar">← Pedidos de compradores</Link></nav>
      <div className="two-col">
        <div className="stack">
          <div className="grid-gap">
            <span className="eyebrow">{w.game.name} · {TYPE_LABEL[w.type]}</span>
            <h1 style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>{w.title}</h1>
            <p className="muted small">Pedido de {w.buyer.username} · <span className={`chip${open ? " ok" : ""}`}>{status}</span> · {open ? `vence ${dateTime(w.expiresAt)}` : `publicado ${dateTime(w.createdAt)}`}</p>
          </div>
          <div className="panel box"><p style={{ whiteSpace: "pre-wrap" }}>{w.description}</p></div>

          <section className="stack">
            <h3>{isBuyer ? `Ofertas recebidas (${w.offers.length})` : mine ? "Sua oferta" : `${w.offers.length} oferta${w.offers.length === 1 ? "" : "s"} recebida${w.offers.length === 1 ? "" : "s"}`}</h3>
            {offers.length > 0 ? (
              <div className="panel">
                {offers.map((o) => (
                  <div key={o.id} className="notif wanted-offer">
                    <Avatar user={o.seller} />
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/loja/${o.seller.username}`}><b>{o.seller.storeName || o.seller.username}</b></Link> <SellerBadges rep={o.seller} compact />
                      <p className="small" style={{ whiteSpace: "pre-wrap" }}>{o.message}</p>
                    </div>
                    <div className="grid-gap" style={{ justifyItems: "end" }}>
                      <b className="mono">{money(o.priceCents)}</b>
                      {isBuyer && open && o.status === "ENVIADA" ? <AcceptButton offerId={o.id} /> : <span className={`chip${o.status === "ACEITA" ? " ok" : ""}`}>{OFFER_STATUS[o.status]}</span>}
                      {o.status === "ACEITA" && o.listingId && (isBuyer || o.sellerId === user?.id) && <Link className="btn btn-ghost btn-sm" href={isBuyer ? `/checkout/${o.listingId}` : `/anuncio/${o.listingId}`}>{isBuyer ? "Ir para o pagamento" : "Ver anúncio"}</Link>}
                    </div>
                  </div>
                ))}
              </div>
            ) : isBuyer ? (
              <div className="panel empty"><p className="muted">Nenhuma oferta ainda. Você recebe um aviso quando chegar uma.</p></div>
            ) : null}
          </section>
        </div>

        <aside className="stack buybox">
          <div className="panel box">
            <span className="muted small">O comprador paga até</span>
            <b className="mono" style={{ fontSize: 28 }}>{money(w.maxCents)}</b>
            {isBuyer ? (
              open ? <CancelWantedButton wantedId={w.id} /> : null
            ) : !open ? (
              <p className="muted small">Este pedido não recebe mais ofertas.</p>
            ) : !user ? (
              <Link className="btn btn-primary btn-block" href={`/entrar?next=/quero-comprar/${w.id}`}>Entrar para oferecer</Link>
            ) : mine && mine.status !== "ENVIADA" ? (
              <p className="muted small">Sua oferta foi {OFFER_STATUS[mine.status].toLowerCase()}.</p>
            ) : (
              <OfferForm wantedId={w.id} price={mine ? (mine.priceCents / 100).toFixed(2).replace(".", ",") : undefined} message={mine?.message} />
            )}
          </div>
          <div className="note"><Icon name="shield" /><span>Oferta aceita vira um pedido normal: o dinheiro fica guardado pela Nexo até o comprador confirmar que recebeu.</span></div>
        </aside>
      </div>
    </div>
  );
}
