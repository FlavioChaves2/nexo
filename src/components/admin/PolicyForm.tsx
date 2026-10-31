"use client";

import { useActionState } from "react";
import { savePolicyAction, type GrowthState } from "@/app/actions/admin-growth";
import { useKeepForm } from "@/lib/use-keep-form";

const pct = (bps: number | null) => (bps === null ? "" : (bps / 100).toString().replace(".", ","));
const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export function PolicyForm({ p }: { p: { standardFeeBps: number; linkFeeBps: number | null; linkEnabled: boolean; windowHours: number; pixCostCents: number; pixCostBps: number; otherCostCents: number } }) {
  const [state, run, pending] = useActionState<GrowthState, FormData>(savePolicyAction, undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="panel box">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="standardPct">Comissão normal (%)</label>
          <input className="input mono" id="standardPct" name="standardPct" inputMode="decimal" required defaultValue={pct(p.standardFeeBps)} />
          <span className="hint">Vendas vindas do marketplace (e todas, se a reduzida estiver desligada).</span>
        </div>
        <div className="field">
          <label htmlFor="linkPct">Comissão do link do vendedor (%)</label>
          <input className="input mono" id="linkPct" name="linkPct" inputMode="decimal" defaultValue={pct(p.linkFeeBps)} placeholder="não definida" />
          <span className="hint">Só vale com a opção abaixo ligada e janela definida.</span>
        </div>
        <div className="field">
          <label htmlFor="windowHours">Janela de atribuição (horas)</label>
          <input className="input mono" id="windowHours" name="windowHours" type="number" min={0} max={2160} defaultValue={p.windowHours || ""} placeholder="não definida" />
          <span className="hint">Tempo em que o primeiro contato pelo link continua valendo.</span>
        </div>
        <label className="switch" htmlFor="linkEnabled">
          <span><b>Ligar comissão reduzida</b><br /><span className="hint">Para vendas reconhecidas como vindas do link do vendedor.</span></span>
          <input type="checkbox" id="linkEnabled" name="linkEnabled" defaultChecked={p.linkEnabled} />
        </label>
        <div className="field">
          <label htmlFor="pixCost">Custo fixo por Pix (R$)</label>
          <input className="input mono" id="pixCost" name="pixCost" inputMode="decimal" defaultValue={reais(p.pixCostCents)} />
        </div>
        <div className="field">
          <label htmlFor="pixCostPct">Custo percentual do Pix (%)</label>
          <input className="input mono" id="pixCostPct" name="pixCostPct" inputMode="decimal" defaultValue={pct(p.pixCostBps)} placeholder="0" />
        </div>
        <div className="field">
          <label htmlFor="otherCost">Outros custos por pedido (R$)</label>
          <input className="input mono" id="otherCost" name="otherCost" inputMode="decimal" defaultValue={reais(p.otherCostCents)} />
          <span className="hint">Custos só para a simulação; não mudam nenhuma cobrança.</span>
        </div>
        <div className="field full">
          <label htmlFor="note">Motivo da mudança</label>
          <input className="input" id="note" name="note" required minLength={10} maxLength={500} placeholder="Ex.: definido em reunião de 05/11: taxa do link 6% por 7 dias" />
        </div>
        {state?.error && <p className="alert full" role="alert">{state.error}</p>}
        {state?.ok && <p className="note full">{state.ok}</p>}
        <button className="btn btn-primary full" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar nova versão"}</button>
      </div>
    </form>
  );
}
