import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, time, dateTime } from "@/lib/format";
import { sellerNet, settleExpired } from "@/lib/orders";
import { isMockPayments } from "@/lib/payments";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { Art } from "@/components/Art";
import { Icon } from "@/components/Icon";
import { Chat } from "@/components/Chat";
import { OrderPanel } from "@/components/OrderPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  return { title: `Pedido #${(await params).code}` };
}

export default async function PedidoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/pedido/${code}`);
  await settleExpired({ code });

  const o = await db.order.findUnique({
    where: { code },
    include: {
      listing: { include: { game: true } },
      buyer: { select: { username: true } },
      seller: { select: { username: true } },
      review: true,
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!o || (o.buyerId !== user.id && o.sellerId !== user.id)) notFound();

  const role = o.buyerId === user.id ? "buyer" : "seller";
  const other = role === "buyer" ? o.seller.username : o.buyer.username;
  const status = o.status as OrderStatus;
  const qr = status === "AGUARDANDO_PAGAMENTO" && o.pixCode ? await QRCode.toDataURL(o.pixCode, { margin: 1, width: 360 }) : null;

  const done = { AGUARDANDO_PAGAMENTO: 0, PAGO: 1, ENTREGUE: 2, DISPUTA: 2, CONCLUIDO: 4, CANCELADO: 0, REEMBOLSADO: 0 }[status];
  const closedBad = status === "DISPUTA" || status === "CANCELADO" || status === "REEMBOLSADO";
  const steps: [string, string, Date | null][] = [
    ["Pagamento aprovado", "Pix recebido e retido pela Nexo.", o.paidAt],
    ["Vendedor entregou", o.listing.autoDelivery ? "Entrega automática." : "Dados no quadro de entrega.", o.deliveredAt],
    ["Comprador confirma", o.autoConfirmAt && status === "ENTREGUE" ? `Automático em ${dateTime(o.autoConfirmAt)}.` : "Ou abre uma disputa.", o.completedAt],
    ["Valor liberado", status !== "CONCLUIDO" ? "O vendedor recebe depois da confirmação." : role === "seller" ? `${money(sellerNet(o))} no seu saldo.` : "Pagamento liberado ao vendedor.", o.completedAt],
  ];
  const chip =
    status === "CONCLUIDO" ? "ok" : closedBad ? "bad" : "auto";

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">{role === "buyer" ? "Sua compra" : "Sua venda"}</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Pedido <span className="mono" style={{ fontWeight: 700 }}>#{o.code}</span></h1>
        </div>
        <span className={`chip ${chip} o-status`}><Icon name={status === "CONCLUIDO" ? "check" : closedBad ? "alert" : "clock"} />{ORDER_STATUS[status]}</span>
      </div>
      {!closedBad && (
        <div className="o-progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={4} aria-label="Andamento do pedido">
          <span style={{ width: `${(done / 4) * 100}%` }} />
        </div>
      )}
      <div className="two-col">
        <div className="stack">
          <Chat
            code={o.code}
            meId={user.id}
            other={other}
            role={role}
            status={status}
            initial={o.messages.map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, at: m.createdAt.toISOString() }))}
          />
          <div className="note warn"><Icon name="alert" /><span>Nunca combine pagamento por fora da Nexo. Fora daqui o seu dinheiro não tem garantia.</span></div>
        </div>
        <aside className="stack buybox">
          <OrderPanel
            code={o.code}
            role={role}
            status={status}
            isMock={isMockPayments()}
            qr={qr}
            pixCode={o.pixCode}
            pixExpiresAt={o.pixExpiresAt ? time(o.pixExpiresAt) : null}
            pixExpiresIso={o.pixExpiresAt?.toISOString() ?? null}
            deliveryText={o.deliveryText}
            buyerNote={o.buyerNote}
            reviewed={!!o.review}
            autoConfirmAt={o.autoConfirmAt ? dateTime(o.autoConfirmAt) : null}
            resolution={o.resolution}
            total={money(o.totalCents)}
          />
          {status !== "CANCELADO" && status !== "REEMBOLSADO" && (
            <div className="panel box o-guarantee">
              <h3 className="l-h"><Icon name="shield" />Garantia do pedido</h3>
              <ol className="flow">
                {steps.map(([t, s, at], i) => (
                  <li key={t} className={i < done ? "done" : i === done ? "now" : ""}>
                    <div><strong>{t}</strong><span>{s}</span></div>
                    <time>{at && i < done ? time(at) : ""}</time>
                  </li>
                ))}
              </ol>
              <div className="hold">
                <span className="hold-label"><Icon name={status === "CONCLUIDO" ? "check" : "shield"} />{status === "CONCLUIDO" ? (role === "seller" ? "Venda concluída" : "Total pago") : status === "AGUARDANDO_PAGAMENTO" ? "A pagar" : "Retido pela Nexo"}</span>
                <b>{money(o.totalCents)}</b>
              </div>
              {role === "seller" && <span className="muted small">Taxa Nexo: {money(o.feeCents)} · Você recebe {money(sellerNet(o))}</span>}
            </div>
          )}
          <Link className="panel box" href={`/anuncio/${o.listingId}`}>
            <div className="mini" style={{ gridTemplateColumns: "64px 1fr" }}>
              <div className="thumb"><Art game={o.listing.game} glyph={o.listing.glyph} showName={false} /></div>
              <div style={{ minWidth: 0 }}><b style={{ fontSize: 14, lineHeight: 1.3, display: "block" }}>{o.listing.title}</b><span className="muted small">{o.quantity}× · {money(o.totalCents)}</span></div>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
