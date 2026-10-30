import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { shapeSupport, SUPPORT_TOPICS } from "@/lib/support";
import { SupportChat } from "@/components/SupportChat";
import { closeTicketAction } from "@/app/actions/support";

export const metadata = { title: "Conversa de suporte" };

const VERIF: Record<string, string> = { NAO_ENVIADO: "Não enviou", PENDENTE: "Em análise", APROVADO: "Verificado", RECUSADO: "Recusado" };

export default async function AdminSuporteConversa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin(`/admin/suporte/${id}`);
  const t = await db.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, email: true, createdAt: true, verification: true, balanceCents: true, completedSales: true, suspendedAt: true } },
      messages: { include: { sender: { select: { username: true } } }, orderBy: { createdAt: "asc" }, take: 300 },
    },
  });
  if (!t) notFound();
  const [order, history] = await Promise.all([
    t.orderCode
      ? db.order.findUnique({ where: { code: t.orderCode }, include: { listing: { select: { title: true } }, buyer: { select: { username: true } }, seller: { select: { username: true } } } })
      : null,
    db.supportTicket.count({ where: { userId: t.userId } }),
  ]);
  await db.notification.updateMany({ where: { userId: admin.id, href: `/admin/suporte/${id}`, readAt: null }, data: { readAt: new Date() } });
  const open = t.status === "ABERTO";

  return (
    <div className="two-col" style={{ paddingTop: 0 }}>
      <div className="stack">
        <div className="row">
          <Link className="linkish small" href="/admin/suporte">← Todas as conversas</Link>
          {open && <form action={closeTicketAction.bind(null, t.id)}><button className="btn btn-ghost btn-sm" type="submit">Encerrar atendimento</button></form>}
        </div>
        <SupportChat ticketId={t.id} staffView open={open} initial={t.messages.map(shapeSupport)} customer={t.user.username} />
      </div>
      <aside className="stack">
        <div className="panel box">
          <h3>{SUPPORT_TOPICS[t.topic] ?? t.topic}</h3>
          <span className="muted small">Aberta em {dateTime(t.createdAt)}{t.closedAt ? ` · encerrada em ${dateTime(t.closedAt)}` : ""}</span>
        </div>
        <div className="panel box">
          <h3>Cliente</h3>
          <ul className="fee-list">
            <li><span><b>{t.user.username}</b> · {t.user.email}</span></li>
            <li><span>Na Nexo desde {dateTime(t.user.createdAt)}</span></li>
            <li><span>Identidade: <b>{VERIF[t.user.verification] ?? t.user.verification}</b> · {t.user.completedSales} vendas · saldo {money(t.user.balanceCents)}</span></li>
            <li><span>{history} {history === 1 ? "conversa" : "conversas"} com o suporte{t.user.suspendedAt ? " · CONTA SUSPENSA" : ""}</span></li>
          </ul>
          <Link className="linkish small" href={`/loja/${t.user.username}`}>Ver loja pública</Link>
        </div>
        {order && (
          <div className="panel box">
            <h3>Pedido #{order.code}</h3>
            <ul className="fee-list">
              <li><span>{order.listing.title}</span></li>
              <li><span><b>{ORDER_STATUS[order.status as OrderStatus] ?? order.status}</b> · {money(order.totalCents)} · {order.payMethod}</span></li>
              <li><span>Comprador {order.buyer.username} · vendedor {order.seller.username}</span></li>
              <li><span>Criado {dateTime(order.createdAt)}{order.paidAt ? ` · pago ${dateTime(order.paidAt)}` : ""}</span></li>
            </ul>
            {order.disputedAt && <Link className="btn btn-ghost btn-sm" href={`/admin/disputas/${order.code}`}>Abrir a disputa</Link>}
          </div>
        )}
      </aside>
    </div>
  );
}
