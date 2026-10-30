import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { SUPPORT_TOPICS } from "@/lib/support";
import { NewTicketForm } from "@/components/SupportForms";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Falar com o suporte", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuportePage({ searchParams }: { searchParams: Promise<{ assunto?: string; pedido?: string }> }) {
  const sp = await searchParams;
  const me = await requireUser("/suporte");
  const open = await db.supportTicket.findFirst({ where: { userId: me.id, status: "ABERTO" }, select: { id: true } });
  if (open) redirect(`/suporte/${open.id}`);
  const [orders, past] = await Promise.all([
    db.order.findMany({ where: { OR: [{ buyerId: me.id }, { sellerId: me.id }] }, select: { code: true, listing: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.supportTicket.findMany({ where: { userId: me.id }, include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow"><Icon name="headset" /> Suporte Nexo</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Fale com a gente</h1>
          <p className="muted">Uma pessoa da equipe responde aqui mesmo, por chat. Você recebe um aviso quando chegar a resposta.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack">
          <NewTicketForm topics={Object.entries(SUPPORT_TOPICS)} orders={orders.map((o) => ({ code: o.code, title: o.listing.title }))} preset={{ topic: sp.assunto, order: sp.pedido }} />
          {past.length > 0 && (
            <div className="panel">
              <div className="box" style={{ paddingBottom: 0 }}><h3>Conversas anteriores</h3></div>
              <div className="list">
                {past.map((t) => (
                  <Link key={t.id} className="list-row" href={`/suporte/${t.id}`} style={{ gridTemplateColumns: "1fr auto" }}>
                    <div>
                      <b>{SUPPORT_TOPICS[t.topic] ?? "Suporte"}{t.orderCode ? ` · #${t.orderCode}` : ""}</b>
                      <span className="muted small">{t.messages[0]?.body.slice(0, 90)}</span>
                    </div>
                    <span className="muted small" style={{ textAlign: "right" }}>{dateTime(t.createdAt)}<br /><span className="chip">Encerrada</span></span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="stack">
          <div className="panel box">
            <h3>Antes de escrever</h3>
            <ul className="fee-list">
              <li><Icon name="bag" /><span><b>Problema com um pedido?</b> Fale primeiro com o vendedor no chat do pedido. Se não resolver, use “Tive um problema” para abrir disputa: o dinheiro fica retido.</span></li>
              <li><Icon name="clock" /><span><b>Pix pago e pedido parado?</b> A confirmação costuma levar até 2 minutos. Atualize a página do pedido.</span></li>
              <li><Icon name="chat" /><span><b>Dúvidas rápidas</b> estão na <Link className="lime" href="/ajuda">Central de ajuda</Link> e em <Link className="lime" href="/como-funciona">Como funciona</Link>.</span></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
