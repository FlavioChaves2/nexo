"use client";

import { useActionState } from "react";
import { PasswordInput } from "./PasswordInput";
import { deleteMyAccount, type FormState } from "@/app/actions/auth";
import { Icon } from "./Icon";
import { useKeepForm } from "@/lib/use-keep-form";

/** Zona de perigo do perfil: excluir a conta (pede senha e a palavra EXCLUIR). */
export function DeleteAccount({ blockers }: { blockers: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteMyAccount, undefined);
  const keepAction = useKeepForm(state, action);
  return (
    <div className="panel box danger-zone">
      <h3>Excluir minha conta</h3>
      <p className="muted small">
        Só quer trocar o nome? O <b>nome da loja</b> pode ser mudado em <a className="lime" href="/conta/perfil">Perfil da loja</a>, sem excluir nada. Ao excluir, seus anúncios saem do ar, seus dados pessoais são apagados
        e você sai da conta. O e-mail e o nome de usuário ficam livres para criar uma conta nova. Os pedidos antigos continuam registrados para as outras pessoas, sem seus dados. <b>Não dá para desfazer.</b>
      </p>
      {blockers.length ? (
        <div className="note warn"><Icon name="alert" /><span><b>Ainda não dá para excluir:</b> {blockers.join(" ")}</span></div>
      ) : (
        <form action={action} {...keepAction} className="stack" style={{ gap: 10 }}>
          <div className="field">
            <label htmlFor="del-password">Sua senha</label>
            <PasswordInput id="del-password" name="password" required autoComplete="current-password" />
          </div>
          <div className="field">
            <label htmlFor="del-confirm">Digite EXCLUIR para confirmar</label>
            <input className="input" id="del-confirm" name="confirm" required autoComplete="off" placeholder="EXCLUIR" />
          </div>
          {state?.error && <p className="alert" role="alert">{state.error}</p>}
          <button className="btn btn-danger" type="submit" disabled={pending}>{pending ? "Excluindo…" : "Excluir minha conta para sempre"}</button>
        </form>
      )}
    </div>
  );
}
