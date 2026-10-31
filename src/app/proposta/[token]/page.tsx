import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/constants";
import { titlesSelect } from "@/lib/titles";
import { displayName } from "@/lib/queries";
import { isExpired, proposalStatusLabel } from "@/lib/proposals";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";
import { AcceptProposal } from "@/components/ProposalForms";
import { Icon } from "@/components/Icon";

// Página que o cliente abre pelo link. Não mostra dados pessoais: só o nome público da loja e as condições.
export const metadata: Metadata = { title: "Proposta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PropostaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  const p = await db.proposal.findUnique({ where: { token }, include: { seller: { select: { id: true, username: true, storeName: true, avatarId: true, verification: true, completedSales: true, ratingSum: true, ratingCount: true, suspendedAt: true, ...titlesSelect } } } });
  if (!p || p.seller.suspendedAt) notFound();
  const me = await getCurrentUser();
  // Depois de aceita, só o cliente vinculado e o vendedor enxergam a proposta.
  if (p.buyerId && me?.id !== p.buyerId && me?.id !== p.sellerId) notFound();
  const game = await db.game.findUnique({ where: { slug: p.gameSlug }, select: { name: true } });
  const mine = me?.id === p.sellerId;
  const expired = isExpired(p);
  const payable = (p.status === "ABERTA" || p.status === "ACEITA") && !expired;
  const listing = p.status === "ACEITA" && p.acceptedVersion === p.version ? await db.listing.findUnique({ where: { proposalId: p.id }, select: { id: true } }) : null;
  const order = p.orderId ? await db.order.findUnique({ where: { id: p.orderId }, select: { code: true, buyerId: true } }) : null;
  const s = p.seller;

  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="grid-gap" style={{ margin: "22px 0 16px" }}>
        <span className="eyebrow">Proposta de {displayName(s)}</span>
        <h1 style={{ fontSize: "clamp(24px,3.6vw,36px)" }}>{p.title}</h1>
        <span className="muted">{proposalStatusLabel(p)} · versão {p.version}</span>
      </div>

      <div className="panel box seller-mini" style={{ marginBottom: 16 }}>
        <Avatar user={s} size="lg" />
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}><b>{displayName(s)}</b><SellerBadges rep={s} compact /></div>
          <span className="muted small">{s.completedSales} vendas concluídas na Nexo</span>
          <Link className="lime small" href={`/loja/${s.username}`}>Ver loja</Link>
        </div>
      </div>

      <div className="panel box terms">
        <dl>
          <div><dt>Jogo</dt><dd>{game?.name ?? p.gameSlug}{p.server ? ` · ${p.server}` : ""}</dd></div>
          <div><dt>Tipo</dt><dd>{TYPE_LABEL[p.type] ?? p.type}</dd></div>
          <div><dt>Quantidade</dt><dd>{p.quantity}</dd></div>
          <div><dt>Preço total</dt><dd className="mono lime">{money(p.totalCents)}</dd></div>
          <div><dt>Prazo de entrega</dt><dd>{p.deliveryDays ? `até ${p.deliveryDays} dia(s) depois do pagamento` : "no mesmo dia do pagamento"}</dd></div>
          <div><dt>Proposta válida até</dt><dd>{dateTime(p.expiresAt)}</dd></div>
        </dl>
        <h3>O que será entregue</h3>
        <p style={{ whiteSpace: "pre-line" }}>{p.description}</p>
        <h3>Condições de entrega</h3>
        <p style={{ whiteSpace: "pre-line" }}>{p.deliveryTerms}</p>
      </div>

      <div className="panel box stack" style={{ gap: 12, marginTop: 16 }}>
        <p className="note"><Icon name="shield" /><span>O pagamento fica retido pela Nexo até você confirmar a entrega. Se houver problema, abra uma disputa pelo pedido. Estas condições ficam guardadas no pedido.</span></p>
        {mine ? (
          <p className="muted">Esta é a sua proposta. <Link className="lime" href={`/conta/propostas/${p.id}`}>Gerenciar</Link></p>
        ) : order ? (
          me?.id === order.buyerId ? <Link className="btn btn-primary" href={`/pedido/${order.code}`}>Ver meu pedido #{order.code}</Link> : <p className="muted">Proposta paga.</p>
        ) : !payable ? (
          <p className="alert">{p.status === "CANCELADA" ? "O vendedor cancelou esta proposta." : "Esta proposta venceu. Peça uma nova ao vendedor."}</p>
        ) : !me ? (
          <Link className="btn btn-primary btn-block" href={`/entrar?next=${encodeURIComponent(`/proposta/${token}`)}`}>Entrar para aceitar</Link>
        ) : listing ? (
          <Link className="btn btn-primary btn-block" href={`/checkout/${listing.id}`}>Você aceitou esta versão · ir para o pagamento <Icon name="arrow" /></Link>
        ) : (
          <AcceptProposal token={token} version={p.version} />
        )}
      </div>
    </div>
  );
}
