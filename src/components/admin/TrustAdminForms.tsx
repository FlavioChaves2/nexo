"use client";

import { useActionState, useState, useTransition } from "react";
import {
  resolveReportsAction,
  reviewVerificationAction,
  suspendUserAction,
  unsuspendUserAction,
  type AdminState,
} from "@/app/actions/admin";

function Feedback({ s }: { s: AdminState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

type Option = { value: string; label: string; danger?: boolean };

/** Dois botões de decisão que compartilham um campo de observação. */
function Decision({ action, options, placeholder }: { action: (s: AdminState, f: FormData) => Promise<AdminState>; options: Option[]; placeholder: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  if (state?.ok) return <Feedback s={state} />;
  return (
    <form action={run} className="stack" style={{ gap: 8, minWidth: 0 }}>
      <input className="input" name="note" placeholder={placeholder} aria-label="Observação" />
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        {options.map((o) => (
          <button key={o.value} className={`btn btn-sm ${o.danger ? "btn-danger" : "btn-ghost"}`} type="submit" name="decision" value={o.value} disabled={pending}>
            {o.label}
          </button>
        ))}
      </div>
      <Feedback s={state} />
    </form>
  );
}

export function VerificationReview({ userId }: { userId: string }) {
  return (
    <Decision
      action={reviewVerificationAction.bind(null, userId)}
      placeholder="Motivo (obrigatório para recusar)"
      options={[{ value: "recusar", label: "Recusar", danger: true }, { value: "aprovar", label: "Aprovar" }]}
    />
  );
}

export function ReportsReview({ listingId }: { listingId: string }) {
  return (
    <Decision
      action={resolveReportsAction.bind(null, listingId)}
      placeholder="Motivo da remoção (o vendedor vê)"
      options={[{ value: "descartar", label: "Descartar denúncias" }, { value: "procedente", label: "Remover anúncio", danger: true }]}
    />
  );
}

export function SuspendControls({ userId, suspended }: { userId: string; suspended: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [res, setRes] = useState<AdminState>();
  const [state, suspend, suspending] = useActionState(suspendUserAction.bind(null, userId), undefined);

  if (suspended)
    return (
      <div className="stack" style={{ gap: 6, justifyItems: "end" }}>
        <button className="btn btn-ghost btn-sm" type="button" disabled={pending} onClick={() => start(async () => setRes(await unsuspendUserAction(userId)))}>Reativar conta</button>
        <Feedback s={res} />
      </div>
    );
  if (!open) return <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(true)}>Suspender</button>;
  return (
    <form action={suspend} className="stack" style={{ gap: 8, minWidth: 240 }}>
      <input className="input" name="note" required minLength={5} placeholder="Motivo (a pessoa vê ao tentar entrar)" aria-label="Motivo da suspensão" />
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>Voltar</button>
        <button className="btn btn-danger btn-sm" type="submit" disabled={suspending}>Suspender</button>
      </div>
      <Feedback s={state} />
    </form>
  );
}
