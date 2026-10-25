"use client";

import { useActionState } from "react";
import { startCheckout, type ActionState } from "@/app/actions/orders";
import { Icon } from "./Icon";

export function CheckoutForm({ listingId, qty, needsPlayerId, gameName, couponCode, askPayer }: { listingId: string; qty: number; needsPlayerId: boolean; gameName: string; couponCode?: string; askPayer: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(startCheckout, undefined);
  return (
    <form action={action} className="panel box">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="qty" value={qty} />
      {couponCode && <input type="hidden" name="coupon" value={couponCode} />}
      <h3>Forma de pagamento</h3>
      <label className="switch" style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
        <span><b>Pix</b><br /><span className="hint">Aprovação na hora, sem taxa</span></span>
        <span className="chip auto">Recomendado</span>
      </label>
      <p className="hint">Cartão de crédito entra quando o gateway de pagamento for conectado.</p>
      {askPayer && (
        <>
          <div className="field">
            <label htmlFor="payerName">Nome completo de quem paga</label>
            <input className="input" id="payerName" name="payerName" required autoComplete="name" maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="payerCpf">CPF de quem paga</label>
            <input className="input mono" id="payerCpf" name="payerCpf" required inputMode="numeric" placeholder="000.000.000-00" maxLength={14} />
            <span className="hint">Exigido pelo Banco Central para gerar o Pix.</span>
          </div>
        </>
      )}
      {needsPlayerId && (
        <div className="field">
          <label htmlFor="note">ID do jogador no {gameName}</label>
          <input className="input mono" id="note" name="note" inputMode="numeric" required placeholder="Ex.: 1234567890" maxLength={40} />
        </div>
      )}
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? "Gerando Pix…" : <>Gerar código Pix <Icon name="arrow" /></>}
      </button>
    </form>
  );
}
