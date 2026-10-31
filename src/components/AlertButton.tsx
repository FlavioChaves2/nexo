"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveAlertAction, type AlertState } from "@/app/actions/alerts";
import { Icon } from "./Icon";
import { useKeepForm } from "@/lib/use-keep-form";

/** "Me avise quando aparecer": salva os filtros atuais da busca como alerta. */
export function AlertButton({ filters, logged, label = "Me avise quando aparecer", big = false }: { filters: Record<string, string>; logged: boolean; label?: string; big?: boolean }) {
  const [state, action, pending] = useActionState<AlertState, FormData>(saveAlertAction, undefined);
  const keepAction = useKeepForm(state, action);
  const next = `/busca?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()}`;
  if (!logged)
    return (
      <Link className={`btn ${big ? "btn-primary" : "btn-ghost btn-sm"} alert-btn`} href={`/entrar?next=${encodeURIComponent(next)}`}>
        <Icon name="bell" />{label}
      </Link>
    );
  return (
    <form action={action} {...keepAction} className="alert-form">
      {Object.entries(filters).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {state?.ok ? (
        <span className="alert-ok"><Icon name="check" />{state.ok} <Link className="lime" href="/conta/alertas">Meus alertas</Link></span>
      ) : (
        <button className={`btn ${big ? "btn-primary" : "btn-ghost btn-sm"} alert-btn`} type="submit" disabled={pending}>
          <Icon name="bell" />{pending ? "Criando…" : label}
        </button>
      )}
      {state?.error && <span className="error small">{state.error}</span>}
    </form>
  );
}
