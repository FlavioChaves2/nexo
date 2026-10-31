"use client";

import { useActionState, useState, useTransition } from "react";
import { decideVerificationAction, requestVerificationAction, withdrawVerificationAction, type ExternalState } from "@/app/actions/external";
import { useKeepForm } from "@/lib/use-keep-form";

const Msg = ({ s }: { s: ExternalState }) => (s?.error ? <p className="alert" role="alert">{s.error}</p> : s?.ok ? <p className="note">{s.ok}</p> : null);

export function RequestVerification({ platforms }: { platforms: [string, string][] }) {
  const [state, run, pending] = useActionState<ExternalState, FormData>(requestVerificationAction, undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="panel box">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="platform">Plataforma</label>
          <select className="input" id="platform" name="platform" required defaultValue="">
            <option value="" disabled>Escolha</option>
            {platforms.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="handle">Nome no perfil</label>
          <input className="input" id="handle" name="handle" maxLength={60} placeholder="Ex.: LojaDoJoao" />
        </div>
        <div className="field full">
          <label htmlFor="url">Link do seu perfil</label>
          <input className="input" id="url" name="url" type="url" required maxLength={300} placeholder="https://…" />
          <span className="hint">O link direto do perfil (não da página inicial da plataforma).</span>
        </div>
        <Msg s={state} />
        <button className="btn btn-primary full" type="submit" disabled={pending}>{pending ? "Enviando…" : "Gerar código de verificação"}</button>
      </div>
    </form>
  );
}

export function WithdrawVerification({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => start(async () => setErr((await withdrawVerificationAction(id))?.error ?? ""))}>{label}</button>
      {err && <span className="small" role="alert" style={{ color: "var(--danger)" }}>{err}</span>}
    </>
  );
}

export function DecideVerification({ id, approved }: { id: string; approved: boolean }) {
  const [state, run, pending] = useActionState<ExternalState, FormData>(decideVerificationAction.bind(null, id), undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="stack" style={{ gap: 8, minWidth: 240 }}>
      <input className="input" name="note" required minLength={5} maxLength={500} placeholder={approved ? "Motivo da revogação" : "O que você conferiu (ex.: código na bio em 05/11)"} aria-label="Motivo" />
      <div className="row" style={{ gap: 8, justifyContent: "flex-start" }}>
        {approved ? (
          <button className="btn btn-danger btn-sm" name="decision" value="REVOGAR" disabled={pending}>Revogar</button>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" name="decision" value="APROVAR" disabled={pending}>Aprovar</button>
            <button className="btn btn-danger btn-sm" name="decision" value="RECUSAR" disabled={pending}>Recusar</button>
          </>
        )}
      </div>
      <Msg s={state} />
    </form>
  );
}
