import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProposalForm } from "@/components/ProposalForms";

export const metadata = { title: "Nova proposta" };

export default async function NovaPropostaPage() {
  await requireUser("/conta/propostas/nova");
  const games = await db.game.findMany({ orderBy: { sort: "asc" }, select: { slug: true, name: true, c1: true } });
  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <nav className="crumbs"><Link href="/conta/propostas">← Propostas</Link></nav>
      <div className="grid-gap" style={{ margin: "10px 0 18px" }}>
        <span className="eyebrow">Proposta por link</span>
        <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Nova proposta</h1>
        <p className="muted">Escreva só o que foi combinado. O cliente vê estas condições antes de pagar, e elas ficam guardadas no pedido.</p>
      </div>
      <ProposalForm games={games} />
    </div>
  );
}
