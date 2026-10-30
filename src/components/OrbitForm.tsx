"use client";

import { useActionState, useState } from "react";
import { buyOrbitAction, type OrbitState } from "@/app/actions/orbit";
import { ORBIT_PLANS } from "@/lib/orbit-plans";
import { Icon } from "./Icon";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function OrbitForm({ listingId, balanceCents, active }: { listingId: string; balanceCents: number; active: boolean }) {
  const [state, action, pending] = useActionState<OrbitState, FormData>(buyOrbitAction.bind(null, listingId), undefined);
  const [days, setDays] = useState<number>(3);
  const plan = ORBIT_PLANS.find((p) => p.days === days)!;
  const short = balanceCents < plan.cents;

  return (
    <form action={action} className="panel box">
      <h3>{active ? "Estender a Órbita" : "Escolha quanto tempo"}</h3>
      <div className="orbit-plans" role="radiogroup" aria-label="Período da Órbita">
        {ORBIT_PLANS.map((p) => (
          <label key={p.days} className={`orbit-plan${p.days === days ? " on" : ""}`}>
            <input type="radio" name="days" value={p.days} checked={p.days === days} onChange={() => setDays(p.days)} />
            {p.tag && <span className="orbit-plan-tag">{p.tag}</span>}
            <b>{p.days} {p.days === 1 ? "dia" : "dias"}</b>
            <span className="price">{brl(p.cents)}</span>
            <small className="muted">{brl(Math.round(p.cents / p.days))} por dia</small>
          </label>
        ))}
      </div>
      <div className="orbit-pay">
        <span className="muted small">Pago com o seu saldo Nexo</span>
        <b className={short ? "error" : undefined}>Saldo: {brl(balanceCents)}</b>
      </div>
      {short && (
        <p className="note warn"><Icon name="alert" /><span>Falta {brl(plan.cents - balanceCents)} no saldo. O saldo vem das suas vendas concluídas e dos ganhos com convites.</span></p>
      )}
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      {state?.ok && <p className="note"><Icon name="check" /><span>{state.ok}</span></p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending || short}>
        <Icon name="orbit" />
        {pending ? "Lançando…" : `${active ? "Estender" : "Colocar em órbita"} por ${brl(plan.cents)}`}
      </button>
      <p className="hint">{active ? "Os dias novos são somados ao tempo que ainda falta." : "Começa na hora. Não renova sozinho: quando acabar, você decide se quer de novo."}</p>
    </form>
  );
}
