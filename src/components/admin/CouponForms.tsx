"use client";

import { useActionState, useState, useTransition } from "react";
import { createCouponAction, toggleCouponAction, type AdminState } from "@/app/actions/admin";

function Feedback({ s }: { s: AdminState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function CouponCreate() {
  const [state, run, pending] = useActionState(createCouponAction, undefined);
  const [kind, setKind] = useState("percent");
  return (
    <form action={run} className="panel box" key={state?.ok}>
      <h3>Novo cupom</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="code">Código</label>
          <input className="input mono" id="code" name="code" required placeholder="BEMVINDO10" style={{ textTransform: "uppercase" }} maxLength={20} />
        </div>
        <div className="field">
          <label htmlFor="kind">Tipo</label>
          <select className="input" id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="percent">Porcentagem</option>
            <option value="amount">Valor fixo (R$)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="value">{kind === "percent" ? "Desconto (%)" : "Desconto (R$)"}</label>
          <input className="input mono" id="value" name="value" required inputMode="decimal" placeholder={kind === "percent" ? "10" : "5,00"} />
        </div>
        {kind === "percent" && (
          <div className="field">
            <label htmlFor="maxDiscount">Teto do desconto (R$, opcional)</label>
            <input className="input mono" id="maxDiscount" name="maxDiscount" inputMode="decimal" placeholder="20,00" />
          </div>
        )}
        <div className="field">
          <label htmlFor="minOrder">Compra mínima (R$, opcional)</label>
          <input className="input mono" id="minOrder" name="minOrder" inputMode="decimal" placeholder="30,00" />
        </div>
        <div className="field">
          <label htmlFor="maxUses">Limite de usos (opcional)</label>
          <input className="input mono" id="maxUses" name="maxUses" type="number" min={1} placeholder="100" />
        </div>
        <div className="field">
          <label htmlFor="days">Válido por quantos dias (opcional)</label>
          <input className="input mono" id="days" name="days" type="number" min={1} placeholder="30" />
        </div>
      </div>
      <p className="hint">O desconto sai da taxa da Nexo: o vendedor recebe sobre o preço cheio. Cada pessoa usa cada cupom uma vez.</p>
      <Feedback s={state} />
      <button className="btn btn-primary" type="submit" disabled={pending}>Criar cupom</button>
    </form>
  );
}

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<AdminState>();
  return (
    <div className="stack" style={{ gap: 4, justifyItems: "end" }}>
      <button className="btn btn-ghost btn-sm" type="button" disabled={pending} onClick={() => start(async () => setRes(await toggleCouponAction(id)))}>
        {active ? "Desativar" : "Ativar"}
      </button>
      {res?.error && <span className="error">{res.error}</span>}
    </div>
  );
}
