"use client";

import { useActionState } from "react";
import { requestWithdrawal, type WithdrawState } from "@/app/actions/account";
import { Icon } from "./Icon";
import { useKeepForm } from "@/lib/use-keep-form";

export function WithdrawForm({ cpfMasked }: { cpfMasked: string }) {
  const [state, action, pending] = useActionState<WithdrawState, FormData>(requestWithdrawal, undefined);
  const keepAction = useKeepForm(state, action);
  return (
    <form action={action} {...keepAction} className="panel box">
      <h3>Sacar via Pix</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="amount">Valor (R$)</label>
          <input className="input mono" id="amount" name="amount" inputMode="decimal" required placeholder="50,00" />
        </div>
        <div className="field">
          <label htmlFor="pixKey">Chave Pix (seu CPF)</label>
          <input className="input mono" id="pixKey" value={cpfMasked} readOnly aria-readonly="true" />
        </div>
      </div>
      <p className="hint"><Icon name="shield" /> Por segurança, o saque só vai para a chave Pix do <b>seu CPF</b>, o mesmo da verificação de identidade. Cadastre essa chave no seu banco se ainda não tiver.</p>
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      {state?.ok && <p className="note">{state.ok}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Solicitando…" : "Solicitar saque"}</button>
      <p className="hint">A equipe Nexo confere cada saque e, ao aprovar, o Pix é enviado na hora pelo Asaas para a sua chave.</p>
    </form>
  );
}
