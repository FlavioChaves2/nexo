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

export const metadata = { title: "Finalizar compra" };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ qtd?: string; cupom?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/anuncio/${id}`);
  const l = await db.listing.findUnique({ where: { id }, include: { game: true, seller: { select: { username: true } } } });
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

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href={`/anuncio/${l.id}`}>← Voltar ao anúncio</Link></nav>
      <div className="two-col">
        <div className="stack">
          <div className="grid-gap"><span className="eyebrow">Checkout</span><h1 style={{ fontSize: "clamp(26px,3.4vw,36px)" }}>Finalizar compra</h1></div>
          {blocked ? (
            <div className="note warn"><Icon name="alert" /><span>{blocked}</span></div>
          ) : (
            <CheckoutForm listingId={l.id} qty={qty} needsPlayerId={l.type === "MOEDA"} gameName={l.game.name} couponCode={coupon?.code} askPayer={needsPayerDocument()} />
          )}
        </div>
        <aside className="stack buybox">
          <div className="panel box">
            <h3>Resumo</h3>
            <div className="mini">
              <div className="thumb"><Art game={l.game} glyph={l.glyph} showName={false} /></div>
              <div style={{ minWidth: 0 }}><b style={{ fontSize: 14, lineHeight: 1.3, display: "block" }}>{l.title}</b><span className="muted small">{l.seller.username} · {qty}×</span></div>
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
            <div className="note"><Icon name="shield" /><span>Seu pagamento fica retido na Nexo até você confirmar o recebimento.</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
