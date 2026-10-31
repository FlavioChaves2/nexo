import { db } from "@/lib/db";
import { dateTime, money, parseReais } from "@/lib/format";
import { activePolicy, bpsLabel, linkModeActive, ORIGIN_LABEL } from "@/lib/attribution";
import { describePolicy, recordedTotals, simulate, type SimInput } from "@/lib/admin-growth";
import { isPlan } from "@/lib/plans";
import { PolicyForm } from "@/components/admin/PolicyForm";

export const metadata = { title: "Comissões" };
export const dynamic = "force-dynamic";

type Sp = { preco?: string; origem?: string; cupomNexo?: string; cupomLoja?: string; plano?: string; metodo?: string; convites?: string };

const cents = (v: string | undefined, d: number) => {
  const c = v ? parseReais(v) : NaN;
  return Number.isFinite(c) ? c : d;
};

export default async function ComissoesPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const [policy, history, totals] = await Promise.all([
    activePolicy(),
    db.commissionPolicy.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { createdBy: { select: { username: true } } } }),
    recordedTotals(30),
  ]);
  const sim: SimInput = {
    priceCents: cents(sp.preco, 10000),
    origin: sp.origem === "LINK_VENDEDOR" ? "LINK_VENDEDOR" : "MARKETPLACE",
    nexoCouponCents: cents(sp.cupomNexo, 0),
    storeCouponCents: cents(sp.cupomLoja, 0),
    plan: isPlan(sp.plano) ? sp.plano : "BASICO",
    method: sp.metodo === "saldo" || sp.metodo === "cartao" ? sp.metodo : "pix",
    referred: Math.max(0, Math.min(2, Number(sp.convites) || 0)),
  };
  const r = simulate(policy, sim);
  const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

  return (
    <div className="stack">
      <div className="panel box stack" style={{ gap: 6 }}>
        <span className="eyebrow">Política vigente</span>
        <b>{describePolicy(policy)}</b>
        <span className="muted small">{policy.id ? `Versão de ${dateTime(policy.createdAt!)}.` : "Nenhuma versão salva: vale a cobrança atual do código (9,79%), sem modalidade reduzida."} {linkModeActive(policy) ? "A comissão reduzida está LIGADA." : "A comissão reduzida está desligada: todas as vendas pagam a comissão normal."}</span>
        <span className="muted small">Regras de origem: docs/lojas-vendedor.md (primeiro contato dentro da janela; sem dados = marketplace). Pedidos guardam a versão usada.</span>
      </div>

      <PolicyForm p={policy} />

      <div className="panel box stack" style={{ gap: 12 }}>
        <span className="eyebrow">Simulação de um pedido</span>
        <form className="form-grid" action="/admin/comissoes">
          <div className="field"><label htmlFor="preco">Preço do item (R$)</label><input className="input mono" id="preco" name="preco" defaultValue={reais(sim.priceCents)} /></div>
          <div className="field"><label htmlFor="origem">Origem</label><select className="input" id="origem" name="origem" defaultValue={sim.origin}><option value="MARKETPLACE">Marketplace</option><option value="LINK_VENDEDOR">Link do vendedor</option></select></div>
          <div className="field"><label htmlFor="cupomNexo">Cupom da Nexo (R$)</label><input className="input mono" id="cupomNexo" name="cupomNexo" defaultValue={reais(sim.nexoCouponCents)} /></div>
          <div className="field"><label htmlFor="cupomLoja">Cupom da loja (R$)</label><input className="input mono" id="cupomLoja" name="cupomLoja" defaultValue={reais(sim.storeCouponCents)} /></div>
          <div className="field"><label htmlFor="plano">Plano do comprador</label><select className="input" id="plano" name="plano" defaultValue={sim.plan}><option value="BASICO">Básico</option><option value="VIP">VIP</option><option value="PREMIUM">VIP Premium</option></select></div>
          <div className="field"><label htmlFor="metodo">Pagamento</label><select className="input" id="metodo" name="metodo" defaultValue={sim.method}><option value="pix">Pix</option><option value="saldo">Saldo</option><option value="cartao">Cartão</option></select></div>
          <div className="field"><label htmlFor="convites">Partes convidadas (comissão de convite)</label><select className="input" id="convites" name="convites" defaultValue={String(sim.referred)}><option value="0">Nenhuma</option><option value="1">Comprador ou vendedor</option><option value="2">Os dois</option></select></div>
          <button className="btn btn-primary" type="submit">Simular</button>
        </form>
        <div className="calc">
          <div><span>Comprador paga</span><span>{money(r.buyerPays)}</span></div>
          <div><span>Vendedor recebe</span><span>{money(r.sellerNet)}</span></div>
          <div><span>Comissão ({bpsLabel(r.feeBps)})</span><span>+{money(r.commission)}</span></div>
          {r.planCents > 0 && <div><span>Plano VIP</span><span>+{money(r.planCents)}</span></div>}
          {r.card > 0 && <div><span>Taxa do cartão cobrada</span><span>+{money(r.card)}</span></div>}
          {r.nexoDisc > 0 && <div><span>Cupom da Nexo</span><span>−{money(r.nexoDisc)}</span></div>}
          {r.storeDisc > 0 && <div><span>Cupom da loja (sai do vendedor)</span><span>{money(r.storeDisc)}</span></div>}
          <div><span>Custo do pagamento (configurado)</span><span>−{money(r.payCost)}</span></div>
          {r.cashback > 0 && <div><span>Cashback do plano</span><span>−{money(r.cashback)}</span></div>}
          {r.referral > 0 && <div><span>Comissão de convite</span><span>−{money(r.referral)}</span></div>}
          <div><span>Outros custos (configurados)</span><span>−{money(r.other)}</span></div>
          <div className="total"><span>Margem estimada do pedido</span><span style={{ color: r.margin < 0 ? "var(--danger)" : undefined }}>{money(r.margin)}</span></div>
        </div>
        <p className="muted small">Margem estimada ≠ lucro real. Não entram impostos, estornos, chargebacks, disputas reembolsadas, custos fixos (servidor, equipe, marketing) nem custos que não foram configurados acima.</p>
      </div>

      <div className="panel box stack" style={{ gap: 10 }}>
        <span className="eyebrow">Registrado nos pedidos concluídos (30 dias)</span>
        {totals.byOrigin.length ? totals.byOrigin.map((g) => (
          <div key={g.origin} className="calc">
            <div className="total"><span>{ORIGIN_LABEL[g.origin] ?? g.origin}: {g._count} pedido(s)</span><span /></div>
            <div><span>Comissões</span><span>{money(g._sum.feeCents ?? 0)}</span></div>
            <div><span>Planos VIP e taxa do cartão</span><span>{money((g._sum.planCents ?? 0) + (g._sum.cardFeeCents ?? 0))}</span></div>
            <div><span>Cupons da Nexo pagos</span><span>−{money(g._sum.discountCents ?? 0)}</span></div>
            <div><span>Cashback pago</span><span>−{money(g._sum.cashbackCents ?? 0)}</span></div>
          </div>
        )) : <p className="muted">Nenhum pedido concluído nos últimos 30 dias.</p>}
        <p className="muted small">Comissões de convite pagas no período: {money(totals.referralCents)}. Receita registrada, não lucro: custos do gateway, impostos e custos fixos não estão aqui.</p>
      </div>

      <div className="panel list">
        {history.length ? history.map((h) => (
          <div key={h.id} className="list-row" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <b>{dateTime(h.createdAt)} · @{h.createdBy.username}</b>
              <span className="muted small">Normal {bpsLabel(h.standardFeeBps)} · link {h.linkFeeBps === null ? "—" : bpsLabel(h.linkFeeBps)} ({h.linkEnabled ? "ligada" : "desligada"}) · janela {h.windowHours || "—"} h · {h.note}</span>
            </div>
          </div>
        )) : <p className="muted" style={{ padding: 16 }}>Nenhuma versão salva ainda.</p>}
      </div>
    </div>
  );
}
