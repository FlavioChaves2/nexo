"use client";

import { useActionState, useState } from "react";
import { sendReport, sendVerification } from "@/app/actions/account";
import { Icon } from "./Icon";
import { useKeepForm } from "@/lib/use-keep-form";

const REASONS = ["Golpe ou fraude", "Item proibido ou roubado", "Descrição enganosa", "Preço abusivo", "Outro"];

function Feedback({ s }: { s: { error?: string; ok?: string } | undefined }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendReport.bind(null, listingId), undefined);
  const keepAction = useKeepForm(state, action);
  if (state?.ok) return <Feedback s={state} />;
  if (!open)
    return (
      <button className="linkish small muted" type="button" onClick={() => setOpen(true)} style={{ justifySelf: "start" }}>
        <Icon name="alert" />Denunciar anúncio
      </button>
    );
  return (
    <form action={action} {...keepAction} className="stack" style={{ gap: 10 }}>
      <div className="field">
        <label htmlFor="reason">Motivo da denúncia</label>
        <select className="input" id="reason" name="reason" required defaultValue="">
          <option value="" disabled>Escolha…</option>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <textarea className="input" name="details" rows={3} maxLength={1000} placeholder="Conte o que aconteceu (opcional)" aria-label="Detalhes" />
      <Feedback s={state} />
      <div className="row">
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>Cancelar</button>
        <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>Enviar denúncia</button>
      </div>
    </form>
  );
}

export function VerificationForm() {
  const [state, action, pending] = useActionState(sendVerification, undefined);
  const keepAction = useKeepForm(state, action);
  if (state?.ok) return <div className="panel box"><Feedback s={state} /></div>;
  return (
    <form action={action} {...keepAction} className="panel box">
      <h3>Verificar identidade</h3>
      <p className="muted small">Para proteger compradores, só vendedores verificados podem sacar. Seus dados ficam visíveis apenas para a equipe da Nexo.</p>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="fullName">Nome completo</label>
          <input className="input" id="fullName" name="fullName" required autoComplete="name" placeholder="Como no documento" />
        </div>
        <div className="field">
          <label htmlFor="cpf">CPF</label>
          <input className="input mono" id="cpf" name="cpf" required inputMode="numeric" placeholder="000.000.000-00" maxLength={14} />
        </div>
        <div className="field">
          <label htmlFor="birthDate">Data de nascimento</label>
          <input className="input" id="birthDate" name="birthDate" type="date" required />
        </div>
      </div>
      <Feedback s={state} />
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Enviando…" : "Enviar para análise"}</button>
    </form>
  );
}
