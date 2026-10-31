import Link from "next/link";
import { money } from "@/lib/format";
import { Icon } from "./Icon";

type RebuyOrder = {
  code: string; quantity: number; unitPriceCents: number; proposalId: string | null;
  listing: { id: string; status: string; stock: number; priceCents: number; reservedForId: string | null; proposalId: string | null };
  seller: { username: string };
};

/** "Comprar de novo" num pedido terminado: confere disponibilidade e preço de agora, sem reaproveitar o preço antigo. */
export function Rebuy({ o }: { o: RebuyOrder }) {
  const l = o.listing;
  if (o.proposalId || l.proposalId) {
    return (
      <div className="panel box stack" style={{ gap: 8 }}>
        <b>Quer de novo?</b>
        <p className="muted small">Este pedido veio de uma proposta combinada. Peça uma nova proposta ao vendedor.</p>
        <Link className="btn btn-ghost btn-sm" href={`/loja/${o.seller.username}`}>Ver a loja</Link>
      </div>
    );
  }
  const available = l.status === "ATIVO" && l.stock > 0 && !l.reservedForId;
  if (!available) {
    return (
      <div className="panel box stack" style={{ gap: 8 }}>
        <b>Comprar de novo</b>
        <p className="muted small">Este anúncio não está disponível agora.</p>
        <Link className="btn btn-ghost btn-sm" href={`/loja/${o.seller.username}`}>Ver outros anúncios da loja</Link>
      </div>
    );
  }
  const qty = Math.min(o.quantity, l.stock);
  const diff = l.priceCents - o.unitPriceCents;
  return (
    <div className="panel box stack" style={{ gap: 8 }}>
      <b>Comprar de novo</b>
      <p className="muted small">
        Preço atual: <b>{money(l.priceCents)}</b> por unidade
        {diff !== 0 && <> ({diff > 0 ? "subiu" : "baixou"} {money(Math.abs(diff))} desde este pedido)</>}
        {qty < o.quantity && <>. Só há {l.stock} disponível(is)</>}.
      </p>
      <Link className="btn btn-primary btn-sm" href={`/checkout/${l.id}?qtd=${qty}`}><Icon name="swap" />Comprar de novo</Link>
    </div>
  );
}
