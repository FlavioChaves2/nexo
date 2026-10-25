"use client";

import { useActionState, useState, useTransition } from "react";
import {
  approveWithdrawalAction,
  decideDispute,
  rejectWithdrawalAction,
  removeListingAction,
  restoreListingAction,
  sendMediatorMessage,
  type AdminState,
} from "@/app/actions/admin";

function Feedback({ s }: { s: AdminState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function DisputeDecision({ orderId, code, sellerNet, total }: { orderId: string; code: string; sellerNet: string; total: string }) {
  const [state, action, pending] = useActionState(decideDispute.bind(null, orderId, code), undefined);
  const [decision, setDecision] = useState<"" | "liberar" | "reembolsar">("");
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="panel box">
      <h3>Decisão</h3>
      <div className="stack" style={{ gap: 8 }}>
        <label className="switch">
          <span><b>Liberar ao vendedor</b><br /><span className="hint">A entrega foi feita como anunciado. Vendedor recebe {sellerNet}.</span></span>
          <input type="radio" name="decision" value="liberar" checked={decision === "liberar"} onChange={() => { setDecision("liberar"); setConfirming(false); }} />
        </label>
        <label className="switch">
          <span><b>Reembolsar o comprador</b><br /><span className="hint">Problema confirmado. Estorna {total} por Pix.</span></span>
          <input type="radio" name="decision" value="reembolsar" checked={decision === "reembolsar"} onChange={() => { setDecision("reembolsar"); setConfirming(false); }} />
        </label>
      </div>
      <div className="field">
        <label htmlFor="note">Justificativa (as duas partes leem no chat)</label>
        <textarea className="input" id="note" name="note" rows={3} required minLength={10} placeholder="Ex.: o vendedor comprovou a entrega com print do login funcionando." />
      </div>
      <Feedback s={state} />
      {!confirming ? (
        <button className="btn btn-primary btn-block" type="button" disabled={!decision} onClick={() => setConfirming(true)}>Revisar decisão</button>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <p className="note warn">Esta decisão é final e movimenta dinheiro. Confirmar {decision === "liberar" ? `liberação de ${sellerNet} ao vendedor` : `estorno de ${total} ao comprador`}?</p>
          <div className="row">
            <button className="btn btn-ghost" type="button" onClick={() => setConfirming(false)}>Voltar</button>
            <button className={`btn ${decision === "reembolsar" ? "btn-danger" : "btn-primary"}`} type="submit" disabled={pending}>
              {pending ? "Aplicando…" : "Confirmar decisão"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export function MediatorMessage({ orderId, code }: { orderId: string; code: string }) {
  const [state, action, pending] = useActionState(sendMediatorMessage.bind(null, orderId, code), undefined);
  return (
    <form action={action} className="chat-form" style={{ borderTop: 0, padding: 0 }}>
      <input className="input" name="text" placeholder="Pedir prova, explicar o próximo passo…" maxLength={1000} required aria-label="Mensagem do mediador" />
      <button className="btn btn-ghost" type="submit" disabled={pending}>Enviar como mediador</button>
      {state?.error && <span className="error">{state.error}</span>}
    </form>
  );
}

export function WithdrawalActions({ id }: { id: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [paying, start] = useTransition();
  const [payState, setPayState] = useState<AdminState>();
  const [state, reject, pending] = useActionState(rejectWithdrawalAction.bind(null, id), undefined);

  if (rejecting)
    return (
      <form action={reject} className="stack" style={{ gap: 8, minWidth: 240 }}>
        <input className="input" name="note" required minLength={5} placeholder="Motivo da recusa" aria-label="Motivo da recusa" />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setRejecting(false)}>Voltar</button>
          <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>Recusar e devolver</button>
        </div>
        <Feedback s={state} />
      </form>
    );
  return (
    <div className="stack" style={{ gap: 6, justifyItems: "end" }}>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setRejecting(true)}>Recusar</button>
        <button className="btn btn-primary btn-sm" type="button" disabled={paying} onClick={() => start(async () => setPayState(await approveWithdrawalAction(id)))}>
          {paying ? "Pagando…" : "Aprovar e pagar"}
        </button>
      </div>
      <Feedback s={payState} />
    </div>
  );
}

export function ListingModeration({ id, removed }: { id: string; removed: boolean }) {
  const [open, setOpen] = useState(false);
  const [restoring, start] = useTransition();
  const [restoreState, setRestoreState] = useState<AdminState>();
  const [state, remove, pending] = useActionState(removeListingAction.bind(null, id), undefined);

  if (removed)
    return (
      <div className="stack" style={{ gap: 6, justifyItems: "end" }}>
        <button className="btn btn-ghost btn-sm" type="button" disabled={restoring} onClick={() => start(async () => setRestoreState(await restoreListingAction(id)))}>Restaurar</button>
        <Feedback s={restoreState} />
      </div>
    );
  if (open)
    return (
      <form action={remove} className="stack" style={{ gap: 8, minWidth: 240 }}>
        <input className="input" name="note" required minLength={5} placeholder="Motivo (o vendedor vê)" aria-label="Motivo da remoção" />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>Voltar</button>
          <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>Remover</button>
        </div>
        <Feedback s={state} />
      </form>
    );
  return <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(true)}>Remover</button>;
}
