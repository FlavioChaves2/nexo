import Link from "next/link";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { Art } from "@/components/Art";

export const metadata = { title: "Disputas" };

export default async function DisputasPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const resolved = (await searchParams).ver === "resolvidas";
  const orders = await db.order.findMany({
    where: resolved ? { resolvedAt: { not: null } } : { status: "DISPUTA" },
    include: { listing: { include: { game: true } }, buyer: { select: { username: true } }, seller: { select: { username: true } } },
    orderBy: resolved ? { resolvedAt: "desc" } : { disputedAt: "asc" },
    take: 100,
  });

  return (
    <div className="stack">
      <div className="pills">
        <Link className={`pill${resolved ? "" : " on"}`} href="/admin/disputas">Abertas</Link>
        <Link className={`pill${resolved ? " on" : ""}`} href="/admin/disputas?ver=resolvidas">Resolvidas</Link>
      </div>
      {orders.length ? (
        <div className="panel list">
          {orders.map((o) => (
            <Link key={o.id} className="list-row" href={`/admin/disputas/${o.code}`}>
              <div className="thumb"><Art game={o.listing.game} glyph={o.listing.glyph} showName={false} /></div>
              <div>
                <b>{o.disputeReason || o.listing.title}</b>
                <span className="muted small">
                  <span className="mono">#{o.code}</span> · {o.buyer.username} contra {o.seller.username} · aberta em {o.disputedAt ? dateTime(o.disputedAt) : "—"}
                </span>
              </div>
              <div className="grid-gap" style={{ justifyItems: "end", gap: 4 }}>
                <span className="price" style={{ fontSize: 17 }}>{money(o.totalCents)}</span>
                {resolved && <span className={`chip ${o.status === "REEMBOLSADO" ? "bad" : "ok"}`}>{o.status === "REEMBOLSADO" ? "Reembolsado" : "Liberado"}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel empty"><p className="muted">{resolved ? "Nenhuma disputa resolvida ainda." : "Nenhuma disputa aberta. Tudo em paz."}</p></div>
      )}
    </div>
  );
}
