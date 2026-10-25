import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { sellerNet, sellerStats } from "@/lib/orders";
import { ORDER_STATUS, TYPE_LABEL, type OrderStatus } from "@/lib/constants";
import { DisputeDecision, MediatorMessage } from "@/components/admin/AdminForms";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  return { title: `Disputa #${(await params).code}` };
}

export default async function DisputaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const o = await db.order.findUnique({
    where: { code },
    include: {
      listing: { include: { game: true } },
      buyer: { select: { id: true, username: true, createdAt: true } },
      seller: { select: { id: true, username: true, createdAt: true } },
      messages: { include: { sender: { select: { username: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!o || (!o.disputedAt && o.status !== "DISPUTA")) notFound();

  const [stats, buyerDisputes, sellerDisputes] = await Promise.all([
    sellerStats(o.sellerId),
    db.order.count({ where: { buyerId: o.buyerId, disputedAt: { not: null } } }),
    db.order.count({ where: { sellerId: o.sellerId, disputedAt: { not: null } } }),
  ]);
  const open = o.status === "DISPUTA";

  return (
    <div className="stack">
      <Link className="linkish small" href="/admin/disputas">← Todas as disputas</Link>
      <div className="two-col" style={{ paddingTop: 0 }}>
        <div className="stack">
          <div className="panel box">
            <div className="row">
              <h2>Pedido <span className="mono">#{o.code}</span></h2>
              <span className={`chip ${open ? "auto" : o.status === "REEMBOLSADO" ? "bad" : "ok"}`}>{ORDER_STATUS[o.status as OrderStatus]}</span>
            </div>
            <div className="note warn"><span><b>Motivo do comprador:</b> {o.disputeReason || "—"}</span></div>
            {o.resolution && <div className="note"><span><b>Decisão:</b> {o.resolution}</span></div>}
            <dl className="kv">
              <dt>Anúncio</dt><dd><Link className="lime" href={`/anuncio/${o.listingId}`}>{o.listing.title}</Link></dd>
              <dt>Tipo</dt><dd>{TYPE_LABEL[o.listing.type]} · {o.listing.game.name}{o.listing.autoDelivery ? " · entrega automática" : ""}</dd>
              <dt>Valor</dt><dd>{money(o.totalCents)} ({o.quantity}×) · taxa {money(o.feeCents)}</dd>
              <dt>Pago em</dt><dd>{o.paidAt ? dateTime(o.paidAt) : "—"}</dd>
              <dt>Entregue em</dt><dd>{o.deliveredAt ? dateTime(o.deliveredAt) : "Não entregue"}</dd>
              <dt>Disputa aberta</dt><dd>{o.disputedAt ? dateTime(o.disputedAt) : "—"}</dd>
              {o.buyerNote && <><dt>ID informado</dt><dd className="mono">{o.buyerNote}</dd></>}
            </dl>
            <div className="stack" style={{ gap: 6 }}>
              <span className="label">O que o vendedor entregou</span>
              <pre className="delivery">{o.deliveryText || "Nada foi entregue pelo quadro de entrega."}</pre>
            </div>
          </div>

          <div className="panel box">
            <h3>Conversa do pedido</h3>
            <div className="msgs" style={{ maxHeight: 460, padding: 0 }}>
              {o.messages.map((m) => (
                <div key={m.id} className={`msg ${m.senderId === null ? "sys" : m.senderId === o.buyerId ? "them" : "me"}`}>
                  {m.sender && <b style={{ display: "block", fontSize: 12 }}>{m.sender.username} ({m.senderId === o.buyerId ? "comprador" : "vendedor"})</b>}
                  {m.body}
                  <time>{dateTime(m.createdAt)}</time>
                </div>
              ))}
            </div>
            {open && <MediatorMessage orderId={o.id} code={o.code} />}
          </div>
        </div>

        <aside className="stack buybox">
          {open ? (
            <DisputeDecision orderId={o.id} code={o.code} sellerNet={money(sellerNet(o))} total={money(o.totalCents)} />
          ) : (
            <div className="panel box"><h3>Disputa resolvida</h3><p className="muted small">Resolvida em {o.resolvedAt ? `${dateTime(o.resolvedAt)}` : "—"}.{o.refundId ? ` Estorno ${o.refundId}.` : ""}</p></div>
          )}
          <div className="panel box">
            <h3>Histórico das partes</h3>
            <dl className="kv">
              <dt>Comprador</dt><dd>{o.buyer.username}</dd>
              <dt>Disputas abertas por ele</dt><dd>{buyerDisputes}</dd>
              <dt>Vendedor</dt><dd><Link className="lime" href={`/loja/${o.seller.username}`}>{o.seller.username}</Link></dd>
              <dt>Vendas concluídas</dt><dd>{stats.sales}</dd>
              <dt>Disputas contra ele</dt><dd>{sellerDisputes}</dd>
              <dt>Avaliação média</dt><dd>{stats.reviews ? `${stats.avg.toFixed(1).replace(".", ",")} (${stats.reviews})` : "—"}</dd>
            </dl>
            <span className="hint">Contas criadas em: comprador {o.buyer.createdAt.toLocaleDateString("pt-BR")} · vendedor {o.seller.createdAt.toLocaleDateString("pt-BR")}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
