"use client";

import { useActionState, useState, useTransition } from "react";
import { requestPasswordReset, resendVerification, resetPassword, type FormState } from "@/app/actions/auth";

function Feedback({ s }: { s: FormState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function ForgotForm() {
  const [state, run, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={run} className="panel box">
      <div className="field">
        <label htmlFor="email">E-mail da conta</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Feedback s={state} />
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? "Enviando…" : "Enviar link"}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, run, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={run} className="panel box">
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">Nova senha</label>
        <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="field">
        <label htmlFor="confirm">Repita a nova senha</label>
        <input className="input" id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <Feedback s={state} />
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>Salvar nova senha</button>
    </form>
  );
}

export function VerifyBanner({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<FormState>();
  return (
    <div className="note warn" style={{ alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ flex: 1 }}><b>Confirme seu e-mail.</b> Enviamos um link para {email}. Sem confirmar, você não consegue vender nem sacar.</span>
      <button className="btn btn-ghost btn-sm" type="button" disabled={pending} onClick={() => start(async () => setRes(await resendVerification()))}>Reenviar link</button>
      {res && <span className={res.error ? "error" : "lime small"} style={{ width: "100%" }}>{res.error ?? res.ok}</span>}
    </div>
  );
}
