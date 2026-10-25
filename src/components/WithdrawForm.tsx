"use client";

import { useActionState } from "react";
import { requestWithdrawal, type WithdrawState } from "@/app/actions/account";

export function WithdrawForm() {
  const [state, action, pending] = useActionState<WithdrawState, FormData>(requestWithdrawal, undefined);
  return (
    <form action={action} className="panel box">
      <h3>Sacar via Pix</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="amount">Valor (R$)</label>
          <input className="input mono" id="amount" name="amount" inputMode="decimal" required placeholder="50,00" />
        </div>
        <div className="field">
          <label htmlFor="pixKey">Chave Pix</label>
          <input className="input" id="pixKey" name="pixKey" required placeholder="CPF, e-mail, telefone ou aleatória" />
        </div>
      </div>
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      {state?.ok && <p className="note">{state.ok}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Solicitando…" : "Solicitar saque"}</button>
      <p className="hint">No modo de teste o saque fica pendente; com o gateway conectado, ele é pago por Pix automaticamente.</p>
    </form>
  );
}
