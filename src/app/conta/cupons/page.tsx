import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { describeStoreCoupon } from "@/lib/store-coupons";
import { StoreCouponCreate, StoreCouponToggle } from "@/components/StoreCouponForms";

export const metadata = { title: "Cupons da minha loja" };
export const dynamic = "force-dynamic";

export default async function CuponsLojaPage() {
  const me = await requireUser("/conta/cupons");
  const [coupons, listings, spent] = await Promise.all([
    db.storeCoupon.findMany({ where: { sellerId: me.id }, orderBy: { createdAt: "desc" } }),
    db.listing.findMany({ where: { sellerId: me.id, status: { not: "REMOVIDO" }, reservedForId: null }, select: { id: true, title: true, gameSlug: true, game: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.order.groupBy({ by: ["storeCouponId"], where: { sellerId: me.id, storeCouponId: { not: null }, paidAt: { not: null } }, _sum: { storeDiscountCents: true } }),
  ]);
  const games = [...new Map(listings.map((l) => [l.gameSlug, l.game.name])).entries()].map(([slug, name]) => ({ slug, name }));
  const byCoupon = new Map(spent.map((s) => [s.storeCouponId, s._sum.storeDiscountCents ?? 0]));
  const now = new Date();

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="grid-gap" style={{ margin: "22px 0 16px" }}>
        <span className="eyebrow">Minha loja</span>
        <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Cupons da minha loja</h1>
        <p className="muted">Crie códigos para os seus clientes. O cliente digita o código no pagamento.</p>
      </div>
      <StoreCouponCreate games={games} listings={listings.map((l) => ({ id: l.id, title: l.title }))} />
      <section className="section">
        <div className="section-head"><h2>Seus cupons</h2></div>
        {coupons.length ? (
          <div className="panel list">
            {coupons.map((c) => {
              const expired = !!c.expiresAt && c.expiresAt < now;
              const soon = !!c.startsAt && c.startsAt > now;
              const soldOut = c.maxUses !== null && c.uses >= c.maxUses;
              const state = !c.active ? "Desativado" : expired ? "Expirado" : soldOut ? "Esgotado" : soon ? "Agendado" : "Ativo";
              const where = c.scope === "JOGO" ? `só ${games.find((g) => g.slug === c.target)?.name ?? c.target}` : c.scope === "ANUNCIO" ? `só “${listings.find((l) => l.id === c.target)?.title ?? "anúncio"}”` : "toda a loja";
              return (
                <div key={c.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div>
                    <b className="mono">{c.code}</b>
                    <span className="muted small">{describeStoreCoupon(c)} · {where} · {c.uses}{c.maxUses ? `/${c.maxUses}` : ""} usos · {money(byCoupon.get(c.id) ?? 0)} em descontos{c.startsAt ? ` · de ${dateTime(c.startsAt)}` : ""}{c.expiresAt ? ` · até ${dateTime(c.expiresAt)}` : ""}</span>
                  </div>
                  <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                    <span className={`chip ${state === "Ativo" ? "ok" : state === "Agendado" ? "auto" : "bad"}`}>{state}</span>
                    <StoreCouponToggle id={c.id} active={c.active} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="panel empty"><p className="muted">Você ainda não criou cupons.</p></div>}
      </section>
    </div>
  );
}
