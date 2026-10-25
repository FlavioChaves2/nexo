"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

/** Campo de código de 6 dígitos ligado a uma ação do servidor. */
export function CodeForm({ action, next, label }: { action: (s: FormState, f: FormData) => Promise<FormState>; next?: string; label: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="stack" style={{ gap: 12 }}>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="field">
        <label htmlFor="code">Código de 6 dígitos</label>
        <input
          className="input mono"
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          style={{ fontSize: 22, letterSpacing: ".3em", textAlign: "center" }}
        />
      </div>
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      {state?.ok && <p className="note">{state.ok}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? "Verificando…" : label}</button>
    </form>
  );
}
