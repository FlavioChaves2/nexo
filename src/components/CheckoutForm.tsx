"use client";

import { useActionState, useEffect, useState } from "react";
import { startCheckout, type ActionState } from "@/app/actions/orders";
import { PIX_MINUTES } from "@/lib/constants";
import { CARD_MIN_CENTS, PLANS, PLAN_CODES, checkoutTotals, planFee, type PayMethod, type PlanCode } from "@/lib/plans";
import { Icon } from "./Icon";
import { TrustBadges } from "./TrustBadges";

const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl = (c: number) => BRL.format(c / 100);

/** Avisa o resumo da lateral (CheckoutTotal) quando plano ou forma de pagamento mudam. */
export type CheckoutTotalsEvent = { planName: string; planCents: number; cardFeeCents: number; totalCents: number };

const PixIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Zm0 3.3L5.8 12l6.2 6.2 6.2-6.2L12 5.8Zm0 3.4 2.8 2.8-2.8 2.8-2.8-2.8L12 9.2Z" /></svg>
);
const CardIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" strokeLinecap="round" /></svg>
);

export function CheckoutForm({ listingId, qty, needsPlayerId, gameName, couponCode, askPayer, baseCents, balanceCents }: { listingId: string; qty: number; needsPlayerId: boolean; gameName: string; couponCode?: string; askPayer: boolean; baseCents: number; balanceCents: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(startCheckout, undefined);
  const [cpf, setCpf] = useState("");
  const [plan, setPlan] = useState<PlanCode>("BASICO");
  const [method, setMethod] = useState<PayMethod>("pix");

  const t = checkoutTotals(baseCents, plan, method);
  const saldoOk = balanceCents >= checkoutTotals(baseCents, plan, "saldo").totalCents;
  const cardOk = checkoutTotals(baseCents, plan, "cartao").totalCents >= CARD_MIN_CENTS;
  // Trocou de plano e o saldo deixou de dar, ou o valor ficou abaixo do mínimo do cartão: volta para o Pix.
  useEffect(() => {
    if ((method === "saldo" && !saldoOk) || (method === "cartao" && !cardOk)) setMethod("pix");
  }, [method, saldoOk, cardOk]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent<CheckoutTotalsEvent>("nexo:checkout", { detail: { planName: PLANS[plan].name, ...t } }));
  }, [plan, t.planCents, t.cardFeeCents, t.totalCents]); // eslint-disable-line react-hooks/exhaustive-deps

  let n = 0;
  return (
    <form action={action} className="checkout">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="plan" value={plan} />
      {couponCode && <input type="hidden" name="coupon" value={couponCode} />}

      <section className="panel box co-step">
        <h3><span className="co-n">{++n}</span>Plano de proteção</h3>
        <div className="plan-grid">
          {PLAN_CODES.map((code) => {
            const p = PLANS[code];
            const fee = planFee(code, baseCents);
            return (
              <label key={code} className={`plan-card plan-${code.toLowerCase()}${plan === code ? " on" : ""}`}>
                <input type="radio" name="plan-choice" value={code} checked={plan === code} onChange={() => setPlan(code)} />
                {code === "PREMIUM" && <span className="plan-tag">Recomendado</span>}
                <span className="plan-check" aria-hidden="true"><Icon name="check" /></span>
                <b className="plan-name">{code === "BASICO" ? "Básico" : code === "VIP" ? <>VIP</> : <>VIP <span className="plan-gold">Premium</span></>}</b>
                <span className="plan-price">{fee ? `+${brl(fee)}` : "Grátis"}<small>{p.bps ? ` · ${(p.bps / 100).toString().replace(".", ",")}%` : ""}</small></span>
                <ul>{p.perks.map((x) => <li key={x}><Icon name="check" />{x}</li>)}</ul>
              </label>
            );
          })}
        </div>
      </section>

      <section className="panel box co-step">
        <h3><span className="co-n">{++n}</span>Forma de pagamento</h3>
        <div className="pay-grid">
          <label className={`pay-opt${method === "pix" ? " on" : ""}`}>
            <input type="radio" name="method" value="pix" checked={method === "pix"} onChange={() => setMethod("pix")} />
            <span className="pay-ic"><PixIcon /></span>
            <b>Pix</b>
            <span className="muted small">Pagamento instantâneo</span>
            <span className="chip ok"><Icon name="bolt" />Sem taxa</span>
            <span className="plan-tag">Recomendado</span>
          </label>
          <label className={`pay-opt${method === "saldo" ? " on" : ""}${saldoOk ? "" : " off"}`}>
            <input type="radio" name="method" value="saldo" checked={method === "saldo"} disabled={!saldoOk} onChange={() => setMethod("saldo")} />
            <span className="pay-ic"><Icon name="diamond" /></span>
            <b>Saldo Nexo</b>
            <span className="muted small">Você tem {brl(balanceCents)}</span>
            {saldoOk ? <span className="chip ok"><Icon name="bolt" />Instantâneo</span> : <span className="chip">Saldo insuficiente</span>}
          </label>
          <label className={`pay-opt${method === "cartao" ? " on" : ""}${cardOk ? "" : " off"}`}>
            <input type="radio" name="method" value="cartao" checked={method === "cartao"} disabled={!cardOk} onChange={() => setMethod("cartao")} />
            <span className="pay-ic"><CardIcon /></span>
            <b>Cartão de crédito</b>
            <span className="muted small">Visa, Mastercard, Elo</span>
            {cardOk ? <span className="chip">Taxa 2,99% + R$ 0,49</span> : <span className="chip warnchip"><Icon name="alert" />Valor mínimo: {brl(CARD_MIN_CENTS)}</span>}
          </label>
        </div>
        {method === "pix" && (
          <ul className="co-perks">
            <li><Icon name="bolt" />Liberado assim que o banco confirmar</li>
            <li><Icon name="clock" />Código válido por {PIX_MINUTES} minutos</li>
            <li><Icon name="shield" />Dinheiro retido até você receber</li>
          </ul>
        )}
        {method === "saldo" && (
          <ul className="co-perks">
            <li><Icon name="bolt" />Sem QR Code: o pedido é pago na hora</li>
            <li><Icon name="diamond" />Restam {brl(balanceCents - t.totalCents)} de saldo</li>
            <li><Icon name="shield" />Dinheiro retido até você receber</li>
          </ul>
        )}
        {method === "cartao" && (
          <ul className="co-perks">
            <li><Icon name="shield" />Você digita o cartão na página segura do Asaas: a Nexo nunca vê os números</li>
            <li><Icon name="clock" />Você tem 2 horas para concluir o pagamento</li>
            <li><Icon name="check" />Aprovação em instantes, direto pela operadora</li>
          </ul>
        )}
      </section>

      {askPayer && method !== "saldo" && (
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
          <div className="note co-cpf">
            <Icon name="shield" />
            <span><b>Por que pedimos o CPF?</b> {method === "cartao" ? "Toda cobrança no cartão precisa do CPF de quem paga" : "Toda cobrança Pix precisa do CPF de quem paga, é uma regra do Banco Central"}. Ele vai só para o banco que processa o pagamento: o vendedor <b>não vê</b> seus dados e a Nexo não usa para mais nada.</span>
          </div>
        </section>
      )}

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
        {pending ? (
          <><span className="co-spin" aria-hidden="true" />{method === "saldo" ? "Pagando…" : method === "cartao" ? "Preparando o pagamento…" : "Gerando seu Pix…"}</>
        ) : (
          <>Pagar {brl(t.totalCents)} com {method === "saldo" ? "saldo" : method === "cartao" ? "cartão" : "Pix"} <Icon name="arrow" /></>
        )}
      </button>
      <TrustBadges compact />
      <p className="hint co-legal">Ao continuar você concorda com os <a href="/termos">Termos</a> e a <a href="/privacidade">Política de privacidade</a>.</p>
    </form>
  );
}

/** Linhas do resumo (lateral) que mudam com o plano e a forma de pagamento. */
export function CheckoutTotal({ baseCents }: { baseCents: number }) {
  const [t, setT] = useState<CheckoutTotalsEvent>({ planName: "Básico", planCents: 0, cardFeeCents: 0, totalCents: baseCents });
  useEffect(() => {
    const on = (e: Event) => setT((e as CustomEvent<CheckoutTotalsEvent>).detail);
    window.addEventListener("nexo:checkout", on);
    return () => window.removeEventListener("nexo:checkout", on);
  }, []);
  return (
    <>
      <dt>Plano {t.planName}</dt><dd className="num">{t.planCents ? brl(t.planCents) : "Grátis"}</dd>
      <dt>{t.cardFeeCents ? "Taxa do cartão" : "Taxa do pagamento"}</dt><dd className="num">{t.cardFeeCents ? brl(t.cardFeeCents) : "Grátis"}</dd>
      <dt style={{ fontWeight: 700, color: "var(--ink)" }}>Total</dt><dd className="price" style={{ fontSize: 22 }}>{brl(t.totalCents)}</dd>
    </>
  );
}
