import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { describeCoupon } from "@/lib/coupons";
import { CouponCreate, CouponToggle } from "@/components/admin/CouponForms";

export const metadata = { title: "Cupons" };

export default async function CuponsPage() {
  const [coupons, totals] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.order.groupBy({ by: ["couponCode"], where: { couponCode: { not: null }, paidAt: { not: null } }, _sum: { discountCents: true } }),
  ]);
  const spent = new Map(totals.map((t) => [t.couponCode, t._sum.discountCents ?? 0]));

  return (
    <div className="stack">
      <CouponCreate />
      {coupons.length ? (
        <div className="panel list">
          {coupons.map((c) => {
            const expired = c.expiresAt && c.expiresAt < new Date();
            const soldOut = c.maxUses !== null && c.uses >= c.maxUses;
            return (
              <div key={c.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <b className="mono">{c.code}</b>
                  <span className="muted small">
                    {describeCoupon(c)} · {c.uses}{c.maxUses ? `/${c.maxUses}` : ""} usos · {money(spent.get(c.code) ?? 0)} em descontos
                    {c.expiresAt ? ` · ${expired ? "expirou" : "vale até"} ${dateTime(c.expiresAt)}` : ""}
                  </span>
                </div>
                <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                  <span className={`chip ${c.active && !expired && !soldOut ? "ok" : "bad"}`}>{!c.active ? "Desativado" : expired ? "Expirado" : soldOut ? "Esgotado" : "Ativo"}</span>
                  <CouponToggle id={c.id} active={c.active} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel empty"><p className="muted">Nenhum cupom criado ainda.</p></div>
      )}
    </div>
  );
}
