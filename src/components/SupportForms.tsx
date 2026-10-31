"use client";

import { useActionState } from "react";
import { openTicketAction, type SupportState } from "@/app/actions/support";
import { Icon } from "./Icon";
import { useKeepForm } from "@/lib/use-keep-form";

export function NewTicketForm({ topics, orders, preset }: { topics: [string, string][]; orders: { code: string; title: string }[]; preset: { topic?: string; order?: string } }) {
  const [state, action, pending] = useActionState<SupportState, FormData>(openTicketAction, undefined);
  const keepAction = useKeepForm(state, action);
  return (
    <form action={action} {...keepAction} className="panel box">
      <h3>Sobre o que você quer falar?</h3>
      <div className="radio-pills">
        {topics.map(([k, label], i) => (
          <label key={k}>
            <input type="radio" name="topic" value={k} defaultChecked={preset.topic ? preset.topic === k : i === 0} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {orders.length > 0 && (
        <div className="field">
          <label htmlFor="orderCode">Pedido (se for sobre um)</label>
          <select className="input" id="orderCode" name="orderCode" defaultValue={preset.order ?? ""}>
            <option value="">Nenhum pedido</option>
            {orders.map((o) => <option key={o.code} value={o.code}>#{o.code} · {o.title}</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="body">Conte o que aconteceu</label>
        <textarea className="input" id="body" name="body" rows={4} required minLength={10} maxLength={1500} placeholder="Ex.: paguei o Pix há 20 minutos e o pedido ainda aparece aguardando pagamento." />
      </div>
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}><Icon name="send" />{pending ? "Abrindo…" : "Começar conversa"}</button>
      <p className="hint"><Icon name="shield" /> A equipe Nexo <b>nunca</b> pede sua senha, código de 2 etapas ou pagamento fora do site.</p>
    </form>
  );
}
