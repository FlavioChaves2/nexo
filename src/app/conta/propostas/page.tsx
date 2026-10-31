import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { proposalStatusLabel, proposalUrl } from "@/lib/proposals";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Propostas por link" };
export const dynamic = "force-dynamic";

export default async function PropostasPage() {
  const me = await requireUser("/conta/propostas");
  const [sent, received] = await Promise.all([
    db.proposal.findMany({ where: { sellerId: me.id }, orderBy: { createdAt: "desc" }, take: 100, include: { buyer: { select: { username: true } } } }),
    db.proposal.findMany({ where: { buyerId: me.id }, orderBy: { updatedAt: "desc" }, take: 50, include: { seller: { select: { username: true, storeName: true } } } }),
  ]);
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Minha conta</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Propostas por link</h1>
          <p className="muted" style={{ maxWidth: "68ch" }}>Combinou um serviço ou um pacote com um cliente? Monte a proposta com preço, prazo e condições e mande o link. Ele revisa, aceita e paga pela Nexo, com a mesma garantia, entrega e disputa de qualquer pedido.</p>
        </div>
        <Link className="btn btn-primary" href="/conta/propostas/nova"><Icon name="edit" />Nova proposta</Link>
      </div>

      <section className="section">
        <div className="section-head"><h2>Enviadas</h2></div>
        {sent.length ? (
          <div className="panel box table-list">
            {sent.map((p) => (
              <Link key={p.id} href={`/conta/propostas/${p.id}`} className="table-row">
                <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <b className="ellipsis">{p.title}</b>
                  <span className="muted small">{proposalStatusLabel(p)} · v{p.version}{p.buyer ? ` · cliente @${p.buyer.username}` : ""} · vale até {dateTime(p.expiresAt)}</span>
                </span>
                <span className="mono">{money(p.totalCents)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel empty"><p className="muted">Você ainda não criou propostas.</p><Link className="btn btn-primary" href="/conta/propostas/nova">Criar a primeira</Link></div>
        )}
      </section>

      {received.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Recebidas</h2></div>
          <div className="panel box table-list">
            {received.map((p) => (
              <Link key={p.id} href={proposalUrl(p.token)} className="table-row">
                <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <b className="ellipsis">{p.title}</b>
                  <span className="muted small">{proposalStatusLabel(p)} · de {p.seller.storeName || p.seller.username}</span>
                </span>
                <span className="mono">{money(p.totalCents)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
