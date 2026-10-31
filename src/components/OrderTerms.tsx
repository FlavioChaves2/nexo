import { dateTime, money } from "@/lib/format";
import { parseTerms } from "@/lib/proposals";
import { ORIGIN_LABEL, bpsLabel } from "@/lib/attribution";
import { sellerNet } from "@/lib/orders";
import { Icon } from "./Icon";

/** Condições da proposta aceitas pelo comprador, guardadas no pedido. Comprador, vendedor e mediador veem igual. */
export function OrderTerms({ raw }: { raw: string }) {
  const t = parseTerms(raw);
  if (!t) return null;
  const due = t.deliveryDays ? `até ${t.deliveryDays} dia(s) depois do pagamento` : "no mesmo dia do pagamento";
  return (
    <div className="panel box terms">
      <div className="row" style={{ justifyContent: "flex-start", gap: 8 }}><Icon name="check" /><b>Condições aceitas (proposta v{t.version})</b></div>
      <dl>
        <div><dt>Produto ou serviço</dt><dd>{t.title}</dd></div>
        <div><dt>Jogo</dt><dd>{t.game}{t.server ? ` · ${t.server}` : ""}</dd></div>
        <div><dt>Quantidade</dt><dd>{t.quantity}</dd></div>
        <div><dt>Preço total</dt><dd className="mono">{money(t.totalCents)}</dd></div>
        <div><dt>Prazo de entrega</dt><dd>{due}</dd></div>
        <div><dt>Aceita em</dt><dd>{dateTime(new Date(t.acceptedAt))}</dd></div>
      </dl>
      <h3>O que será entregue</h3>
      <p style={{ whiteSpace: "pre-line" }}>{t.description}</p>
      <h3>Condições de entrega</h3>
      <p style={{ whiteSpace: "pre-line" }}>{t.deliveryTerms}</p>
    </div>
  );
}

type FeeOrder = { origin: string; feeBps: number | null; feeCents: number; totalCents: number; discountCents: number; planCents: number; cardFeeCents: number; storeDiscountCents: number };

/** Só para o vendedor: origem reconhecida, comissão aplicada e o líquido estimado deste pedido. */
export function OrderOrigin({ o }: { o: FeeOrder }) {
  return (
    <div className="panel box stack" style={{ gap: 8 }}>
      <b>Origem e comissão</b>
      <div className="calc">
        <div><span>Origem reconhecida</span><span>{ORIGIN_LABEL[o.origin] ?? o.origin}</span></div>
        <div><span>Comissão da Nexo{o.feeBps !== null ? ` (${bpsLabel(o.feeBps)})` : ""}</span><span>−{money(o.feeCents)}</span></div>
        {o.storeDiscountCents > 0 && <div><span>Cupom da sua loja</span><span>−{money(o.storeDiscountCents)}</span></div>}
        <div className="total"><span>Você recebe (estimado)</span><span>{money(sellerNet(o))}</span></div>
      </div>
      <p className="muted small">A origem e a comissão ficam fixadas quando o pedido é criado. A origem vem do primeiro contato do comprador com a sua loja no aparelho e na conta dele; sem esse registro, conta como marketplace.</p>
    </div>
  );
}
