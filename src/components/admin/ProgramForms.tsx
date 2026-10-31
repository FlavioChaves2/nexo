"use client";

import { useActionState } from "react";
import { addToProgramAction, updateProgramAction, type GrowthState } from "@/app/actions/admin-growth";
import { useKeepForm } from "@/lib/use-keep-form";

const Msg = ({ s }: { s: GrowthState }) => (s?.error ? <p className="alert" role="alert">{s.error}</p> : s?.ok ? <p className="note">{s.ok}</p> : null);

export function AddToProgram() {
  const [state, run, pending] = useActionState<GrowthState, FormData>(addToProgramAction, undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="panel box row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "flex-start" }}>
      <input className="input" name="username" required placeholder="@usuário do vendedor" aria-label="Usuário do vendedor" style={{ flex: "1 1 220px", width: "auto" }} />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Adicionar ao programa</button>
      <Msg s={state} />
    </form>
  );
}

type Row = { id: string; status: string; ownerId: string | null; notes: string; stepListings: boolean; stepStore: boolean; stepMaterial: boolean; stepFirstSale: boolean };

export function ProgramRow({ p, admins, statuses, steps, hints }: { p: Row; admins: { id: string; username: string }[]; statuses: [string, string][]; steps: [keyof Row, string][]; hints: Partial<Record<keyof Row, string>> }) {
  const [state, run, pending] = useActionState<GrowthState, FormData>(updateProgramAction.bind(null, p.id), undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "flex-start" }}>
        <select className="input" name="status" defaultValue={p.status} aria-label="Status" style={{ width: "auto" }}>
          {statuses.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <select className="input" name="ownerId" defaultValue={p.ownerId ?? ""} aria-label="Responsável" style={{ width: "auto" }}>
          <option value="">Sem responsável</option>
          {admins.map((a) => <option key={a.id} value={a.id}>@{a.username}</option>)}
        </select>
      </div>
      <div className="program-steps">
        {steps.map(([k, label]) => (
          <label key={k} className="check">
            <input type="checkbox" name={k} defaultChecked={Boolean(p[k])} />
            <span>{label}{hints[k] && <span className="muted small"> · {hints[k]}</span>}</span>
          </label>
        ))}
      </div>
      <textarea className="input" name="notes" rows={2} maxLength={2000} defaultValue={p.notes} placeholder="Observações da equipe (não aparecem para o vendedor)" aria-label="Observações" />
      <div className="row" style={{ gap: 10, justifyContent: "flex-start" }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
