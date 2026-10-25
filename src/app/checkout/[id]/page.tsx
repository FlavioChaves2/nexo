import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { applyCoupon } from "@/lib/coupons";
import { OrderError } from "@/lib/orders";
import { needsPayerDocument } from "@/lib/payments";
import { Art } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";

export const metadata = { title: "Finalizar compra" };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ qtd?: string; cupom?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/anuncio/${id}`);
  const l = await db.listing.findUnique({ where: { id }, include: { game: true, seller: { select: { username: true, storeName: true, avatarId: true, verification: true, completedSales: true, ratingSum: true, ratingCount: true } } } });
  if (!l) notFound();

  const sp = await searchParams;
  const qty = Math.max(1, Math.min(Number(sp.qtd) || 1, l.stock || 1));
  const subtotal = l.priceCents * qty;
  let coupon: { code: string; discountCents: number } | null = null;
  let couponError = "";
  if (sp.cupom?.trim()) {
    try {
      coupon = await applyCoupon(sp.cupom, user.id, subtotal);
    } catch (e) {
      if (!(e instanceof OrderError)) throw e;
      couponError = e.message;
    }
  }
  const total = subtotal - (coupon?.discountCents ?? 0);
  const blocked = l.sellerId === user.id ? "Você não pode comprar o próprio anúncio." : l.status !== "ATIVO" || l.stock < 1 ? "Este anúncio está indisponível." : null;

  const s = l.seller;
  return (
    <div className="wrap">
      <nav className="crumbs"><Link href={`/anuncio/${l.id}`}>← Voltar ao anúncio</Link></nav>
      <ol className="co-steps" aria-label="Etapas da compra">
        <li className="done"><span><Icon name="check" /></span>Escolher</li>
        <li className="on"><span>2</span>Pagar</li>
        <li><span>3</span>Receber</li>
        <li><span>4</span>Confirmar</li>
      </ol>
      <div className="two-col">
        <div className="stack">
          <div className="grid-gap"><span className="eyebrow">Checkout seguro</span><h1 style={{ fontSize: "clamp(26px,3.4vw,36px)" }}>Finalizar compra</h1></div>
          {blocked ? (
            <div className="note warn"><Icon name="alert" /><span>{blocked}</span></div>
          ) : (
            <CheckoutForm listingId={l.id} qty={qty} needsPlayerId={l.type === "MOEDA"} gameName={l.game.name} couponCode={coupon?.code} askPayer={needsPayerDocument()} total={money(total)} totalCents={total} balanceCents={user.balanceCents} />
          )}
        </div>
        <aside className="stack buybox">
          <div className="panel box co-summary">
            <h3>Resumo do pedido</h3>
            <div className="co-item">
              <div className="thumb"><Art game={l.game} glyph={l.glyph} showName={false} /></div>
              <div style={{ minWidth: 0 }}>
                <span className="eyebrow">{l.game.name}</span>
                <b className="co-title">{l.title}</b>
                <span className="muted small">{qty}× {money(l.priceCents)}</span>
              </div>
            </div>
            <div className="co-seller">
              <Avatar user={s} />
              <div style={{ minWidth: 0 }}>
                <span className="small muted">Vendido por</span>
                <b className="co-seller-name">{s.storeName || s.username} <SellerBadges rep={{ completedSales: s.completedSales, ratingSum: s.ratingSum, ratingCount: s.ratingCount, verification: s.verification }} compact /></b>
              </div>
              <span className={`chip ${l.autoDelivery ? "auto" : ""}`}><Icon name={l.autoDelivery ? "bolt" : "chat"} />{l.autoDelivery ? "Entrega na hora" : "Entrega no chat"}</span>
            </div>
            <form action={`/checkout/${l.id}`} className="field">
              <input type="hidden" name="qtd" value={qty} />
              <label htmlFor="cupom">Cupom de desconto</label>
              <div className="copy-row">
                <input className="input mono" id="cupom" name="cupom" defaultValue={sp.cupom ?? ""} placeholder="EX.: BEMVINDO10" style={{ textTransform: "uppercase" }} />
                <button className="btn btn-ghost btn-sm" type="submit">Aplicar</button>
              </div>
              {couponError && <span className="error">{couponError}</span>}
              {coupon && <span className="lime small"><Icon name="tag" /> Cupom {coupon.code} aplicado</span>}
            </form>
            <dl className="kv">
              <dt>Subtotal</dt><dd className="num">{money(subtotal)}</dd>
              {coupon && <><dt>Desconto ({coupon.code})</dt><dd className="num lime">−{money(coupon.discountCents)}</dd></>}
              <dt>Taxa do Pix</dt><dd>Grátis</dd>
              <dt style={{ fontWeight: 700, color: "var(--ink)" }}>Total</dt><dd className="price" style={{ fontSize: 22 }}>{money(total)}</dd>
            </dl>
          </div>
          <div className="panel box co-guarantee">
            <h3><Icon name="shield" /> Garantia Nexo</h3>
            <ul>
              <li><Icon name="check" />Seu Pix fica retido até você confirmar que recebeu</li>
              <li><Icon name="check" />Não recebeu ou veio diferente? Abra uma disputa e o dinheiro volta</li>
              <li><Icon name="check" />Conversa gravada e mediação pela equipe</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
