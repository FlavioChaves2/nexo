import { db } from "@/lib/db";

const ago = (d: Date) => {
  const m = Math.max(1, Math.round((Date.now() - d.getTime()) / 60_000));
  return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`;
};

/** Faixa rolando com as últimas vendas pagas (nome do comprador mascarado). */
export async function Ticker() {
  const orders = await db.order.findMany({
    where: { paidAt: { not: null } },
    orderBy: { paidAt: "desc" },
    take: 12,
    select: { id: true, paidAt: true, buyer: { select: { username: true } }, listing: { select: { title: true } } },
  });
  if (orders.length < 3) return null;
  const items = (copy: string) => orders.map((o) => (
    <span className="ticker-item" key={o.id + copy} aria-hidden={copy ? true : undefined}>
      <span className="live" aria-hidden="true" />
      <b>{o.buyer.username.slice(0, 2)}***</b> comprou {o.listing.title} · {ago(o.paidAt!)}
    </span>
  ));
  return (
    <div className="ticker" aria-label="Últimas compras na Nexo">
      {/* Lista duplicada para a rolagem não ter emenda. */}
      <div className="ticker-track">{items("")}{items("-b")}</div>
    </div>
  );
}
