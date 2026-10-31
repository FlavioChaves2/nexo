import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { isExpired, proposalStatusLabel, proposalUrl } from "@/lib/proposals";
import { CancelProposal, CopyLink, ProposalForm } from "@/components/ProposalForms";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Proposta" };
export const dynamic = "force-dynamic";

const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function PropostaVendedorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criada?: string; alterada?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await requireUser(`/conta/propostas/${id}`);
  const p = await db.proposal.findUnique({ where: { id }, include: { buyer: { select: { username: true } } } });
  if (!p || p.sellerId !== me.id) notFound();
  const order = p.orderId ? await db.order.findUnique({ where: { id: p.orderId }, select: { code: true } }) : null;
  const games = await db.game.findMany({ orderBy: { sort: "asc" }, select: { slug: true, name: true, c1: true } });
  const editable = (p.status === "ABERTA" || p.status === "ACEITA");
  const daysLeft = Math.max(1, Math.min(30, Math.ceil((p.expiresAt.getTime() - Date.now()) / 86_400_000)));

  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <nav className="crumbs"><Link href="/conta/propostas">← Propostas</Link></nav>
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Proposta · versão {p.version}</span>
          <h1 style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>{p.title}</h1>
          <span className="muted">{proposalStatusLabel(p)} · {money(p.totalCents)} · vale até {dateTime(p.expiresAt)}</span>
        </div>
      </div>

      {sp.criada && <p className="note" style={{ marginBottom: 14 }}><Icon name="check" />Proposta criada. Copie o link abaixo e mande para o seu cliente.</p>}
      {sp.alterada && <p className="note" style={{ marginBottom: 14 }}><Icon name="check" />Nova versão salva. O cliente precisa aceitar de novo antes de pagar.</p>}

      <div className="panel box stack" style={{ gap: 12, marginBottom: 18 }}>
        <b>Link para o cliente</b>
        <CopyLink url={proposalUrl(p.token)} />
        <p className="muted small">Quem tiver o link vê a proposta. O primeiro cliente que aceitar fica vinculado, e só ele pode pagar.{p.buyer ? ` Vinculada a @${p.buyer.username}.` : ""}</p>
        {order && <Link className="btn btn-ghost btn-sm" href={`/pedido/${order.code}`}>Ver pedido #{order.code}</Link>}
        {editable && !isExpired(p) && <CancelProposal id={p.id} />}
      </div>

      {editable ? (
        <>
          <div className="section-head"><h2>Alterar condições</h2></div>
          <ProposalForm
            games={games}
            id={p.id}
            accepted={p.status === "ACEITA"}
            values={{ gameSlug: p.gameSlug, server: p.server, type: p.type, title: p.title, description: p.description, quantity: p.quantity, total: reais(p.totalCents), deliveryDays: p.deliveryDays, deliveryTerms: p.deliveryTerms, validDays: daysLeft }}
          />
        </>
      ) : (
        <p className="muted">{p.status === "PAGA" ? "Proposta paga: acompanhe a entrega pelo pedido." : "Proposta cancelada."}</p>
      )}
    </div>
  );
}
