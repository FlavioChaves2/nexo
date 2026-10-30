import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { shapeSupport, SUPPORT_TOPICS } from "@/lib/support";
import { SupportChat } from "@/components/SupportChat";
import { Icon } from "@/components/Icon";
import { closeTicketAction } from "@/app/actions/support";

export const metadata = { title: "Conversa com o suporte", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuporteConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(`/suporte/${id}`);
  const t = await db.supportTicket.findUnique({
    where: { id },
    include: { messages: { include: { sender: { select: { username: true } } }, orderBy: { createdAt: "asc" }, take: 300 } },
  });
  if (!t || t.userId !== me.id) notFound();
  // Abriu a conversa: os avisos dela saem do sino.
  await db.notification.updateMany({ where: { userId: me.id, href: `/suporte/${id}`, readAt: null }, data: { readAt: new Date() } });
  const open = t.status === "ABERTO";

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/suporte">Suporte</Link><span>/</span><span>Conversa</span></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap">
          <span className="eyebrow"><Icon name="headset" /> Suporte Nexo</span>
          <h1 style={{ fontSize: "clamp(24px,3.2vw,34px)" }}>Conversa com o suporte</h1>
          <span className="muted small">Assunto: {SUPPORT_TOPICS[t.topic] ?? "Outro"}{t.orderCode ? ` (#${t.orderCode})` : ""} · aberta em {dateTime(t.createdAt)}{t.closedAt ? ` · encerrada em ${dateTime(t.closedAt)}` : ""}</span>
        </div>
        {open ? (
          <form action={closeTicketAction.bind(null, t.id)}><button className="btn btn-ghost btn-sm" type="submit">Encerrar conversa</button></form>
        ) : (
          <Link className="btn btn-primary btn-sm" href="/suporte">Nova conversa</Link>
        )}
      </div>
      <div className="sup-wrap">
        <SupportChat ticketId={t.id} staffView={false} open={open} initial={t.messages.map(shapeSupport)} customer={me.username} />
        {t.orderCode && <Link className="linkish small" href={`/pedido/${t.orderCode}`}><Icon name="bag" />Abrir o pedido #{t.orderCode}</Link>}
      </div>
    </div>
  );
}
