"use client";

import { useActionState, useState } from "react";
import { startCheckout, type ActionState } from "@/app/actions/orders";
import { PIX_MINUTES } from "@/lib/constants";
import { Icon } from "./Icon";

const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");

export function CheckoutForm({ listingId, qty, needsPlayerId, gameName, couponCode, askPayer, total }: { listingId: string; qty: number; needsPlayerId: boolean; gameName: string; couponCode?: string; askPayer: boolean; total: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(startCheckout, undefined);
  const [cpf, setCpf] = useState("");
  let n = 0;
  return (
    <form action={action} className="checkout">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="qty" value={qty} />
      {couponCode && <input type="hidden" name="coupon" value={couponCode} />}

      {askPayer && (
        <section className="panel box co-step">
          <h3><span className="co-n">{++n}</span>Seus dados</h3>
          <div className="co-row">
            <div className="field">
              <label htmlFor="payerName">Nome completo</label>
              <input className="input" id="payerName" name="payerName" required autoComplete="name" maxLength={120} placeholder="Como no documento" />
            </div>
            <div className="field">
              <label htmlFor="payerCpf">CPF</label>
              <input className="input mono" id="payerCpf" name="payerCpf" required inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} />
            </div>
          </div>
          <span className="hint"><Icon name="shield" /> Exigido pelo Banco Central para gerar o Pix. Não aparece para o vendedor.</span>
        </section>
      )}

      <section className="panel box co-step">
        <h3><span className="co-n">{++n}</span>Forma de pagamento</h3>
        <label className="co-pay on">
          <input type="radio" name="method" value="pix" defaultChecked />
          <span className="co-pix" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Zm0 3.3L5.8 12l6.2 6.2 6.2-6.2L12 5.8Zm0 3.4 2.8 2.8-2.8 2.8-2.8-2.8L12 9.2Z" /></svg>
          </span>
          <span className="co-pay-txt"><b>Pix</b><span>Aprovação em segundos · sem taxa</span></span>
          <span className="chip auto">Recomendado</span>
        </label>
        <ul className="co-perks">
          <li><Icon name="bolt" />Liberado assim que o banco confirmar</li>
          <li><Icon name="clock" />Código válido por {PIX_MINUTES} minutos</li>
          <li><Icon name="shield" />Dinheiro retido até você receber</li>
        </ul>
      </section>

      {needsPlayerId && (
        <section className="panel box co-step">
          <h3><span className="co-n">{++n}</span>Dados para entrega</h3>
          <div className="field">
            <label htmlFor="note">ID do jogador no {gameName}</label>
            <input className="input mono" id="note" name="note" inputMode="numeric" required placeholder="Ex.: 1234567890" maxLength={40} />
            <span className="hint">Confira com atenção: a recarga vai para este ID.</span>
          </div>
        </section>
      )}

      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-primary btn-block co-go" type="submit" disabled={pending}>
        {pending ? <><span className="co-spin" aria-hidden="true" />Gerando seu Pix…</> : <>Pagar {total} com Pix <Icon name="arrow" /></>}
      </button>
      <p className="hint co-legal">Ao continuar você concorda com os <a href="/termos">Termos</a> e a <a href="/privacidade">Política de privacidade</a>.</p>
    </form>
  );
}
