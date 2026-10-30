"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  cancelAction,
  confirmAction,
  deliverAction,
  disputeAction,
  reviewAction,
  simulatePayment,
  type ActionState,
} from "@/app/actions/orders";
import { CARD_MINUTES, PIX_MINUTES, type OrderStatus } from "@/lib/constants";
import { Icon } from "./Icon";

type Props = {
  code: string;
  role: "buyer" | "seller";
  status: OrderStatus;
  isMock: boolean;
  qr: string | null;
  pixCode: string | null;
  payMethod: string;
  paymentUrl: string | null;
  pixExpiresAt: string | null;
  pixExpiresIso: string | null;
  deliveryText: string;
  buyerNote: string;
  reviewed: boolean;
  autoConfirmAt: string | null;
  resolution: string;
  total: string;
};

function Err({ s }: { s: ActionState }) {
  return s?.error ? <p className="alert" role="alert">{s.error}</p> : null;
}

/** Botão que chama uma ação sem formulário e mostra o erro, se houver. */
function ActionButton({ fn, className, children }: { fn: () => Promise<ActionState>; className: string; children: React.ReactNode }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<ActionState>();
  return (
    <>
      <button className={className} type="button" disabled={pending} onClick={() => start(async () => setRes(await fn()))}>
        {pending ? "Aguarde…" : children}
      </button>
      <Err s={res} />
    </>
  );
}

export function CopyField({ value, label = "Copiar código Pix", done = "Código copiado! Cole no app do banco", aria = "Código Pix copia e cola" }: { value: string; label?: string; done?: string; aria?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <input className="input mono pix-code" readOnly value={value} aria-label={aria} onFocus={(e) => e.currentTarget.select()} />
      <button
        className={`btn btn-block ${copied ? "btn-ghost pix-copied" : "btn-primary"}`}
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            /* o campo continua selecionável */
          }
        }}
      >
        {copied ? <><Icon name="check" />{done}</> : <><Icon name="copy" />{label}</>}
      </button>
    </div>
  );
}

/** Contagem regressiva do Pix, com barra que esvazia. */
function PixTimer({ until, minutes }: { until: string; minutes: number }) {
  const end = new Date(until).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const pct = Math.min(100, (left / (minutes * 60000)) * 100);
  return (
    <div className={`pix-timer ${left < 5 * 60000 ? "low" : ""}`}>
      <div className="row"><span className="small muted"><Icon name="clock" /> {left ? "Expira em" : "Código expirado"}</span><b className="mono" suppressHydrationWarning>{mm}:{ss}</b></div>
      <div className="pix-bar"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function OrderPanel(p: Props) {
  const [deliverState, deliver, delivering] = useActionState(deliverAction.bind(null, p.code), undefined);
  const [disputeState, dispute, disputing] = useActionState(disputeAction.bind(null, p.code), undefined);
  const [reviewState, review, reviewing] = useActionState(reviewAction.bind(null, p.code), undefined);
  const [showDispute, setShowDispute] = useState(false);
  const [reveal, setReveal] = useState(false);

  const buyer = p.role === "buyer";

  if (p.status === "AGUARDANDO_PAGAMENTO") {
    if (!buyer) return <div className="panel box"><h3>Aguardando pagamento</h3><p className="muted small">O comprador ainda não pagou. Não entregue nada antes do pagamento aprovado.</p></div>;
    if (p.payMethod === "CARTAO")
      return (
        <div className="panel box pix-panel">
          <div className="row">
            <h3>Pague com cartão</h3>
            <span className="pix-wait"><span />Aguardando pagamento</span>
          </div>
          <div className="pix-amount"><span className="muted small">Valor</span><b>{p.total}</b></div>
          {p.pixExpiresIso && <PixTimer until={p.pixExpiresIso} minutes={CARD_MINUTES} />}
          {p.paymentUrl && <a className="btn btn-primary btn-block" href={p.paymentUrl} rel="noopener">Pagar com cartão na página segura <Icon name="arrow" /></a>}
          <ol className="pix-how">
            <li><span>1</span><span>Toque no botão: abre a página de pagamento do <b>Asaas</b></span></li>
            <li><span>2</span>Digite os dados do cartão lá (a Nexo nunca vê os números)</li>
            <li><span>3</span>Volte aqui: esta página atualiza sozinha quando for aprovado</li>
          </ol>
          {p.isMock && (
            <>
              <ActionButton className="btn btn-primary btn-block" fn={() => simulatePayment(p.code)}>Simular cartão aprovado</ActionButton>
              <span className="hint">Modo de teste: nenhum cartão é cobrado. O botão faz o papel da operadora aprovando.</span>
            </>
          )}
          <ActionButton className="btn btn-ghost btn-block btn-sm" fn={() => cancelAction(p.code)}>Cancelar pedido</ActionButton>
        </div>
      );
    return (
      <div className="panel box pix-panel">
        <div className="row">
          <h3>Pague com Pix</h3>
          <span className="pix-wait"><span />Aguardando pagamento</span>
        </div>
        <div className="pix-amount"><span className="muted small">Valor</span><b>{p.total}</b></div>
        {p.pixExpiresIso && <PixTimer until={p.pixExpiresIso} minutes={PIX_MINUTES} />}
        <div className="pix">
          {p.qr && <div className="pix-qr"><img src={p.qr} alt="QR code do Pix" /><span className="pix-scan" aria-hidden="true" /></div>}
          <div className="stack" style={{ gap: 10, minWidth: 0 }}>
            {p.pixCode && <CopyField value={p.pixCode} />}
          </div>
        </div>
        <ol className="pix-how">
          <li><span>1</span><span>Abra o app do seu banco e entre em <b>Pix</b></span></li>
          <li><span>2</span><span>Escaneie o QR ou escolha <b>Pix copia e cola</b></span></li>
          <li><span>3</span>Confirme: esta página atualiza sozinha</li>
        </ol>
        {p.isMock && (
          <>
            <ActionButton className="btn btn-primary btn-block" fn={() => simulatePayment(p.code)}>Simular pagamento aprovado</ActionButton>
            <span className="hint">Modo de teste: este QR não cobra nada. O botão faz o papel do banco confirmando o Pix.</span>
          </>
        )}
        <ActionButton className="btn btn-ghost btn-block btn-sm" fn={() => cancelAction(p.code)}>Cancelar pedido</ActionButton>
      </div>
    );
  }

  if (p.status === "PAGO") {
    if (buyer)
      return (
        <div className="panel box">
          <h3>Aguardando entrega</h3>
          <p className="muted small">O vendedor foi avisado. Combine os detalhes pelo chat ao lado.</p>
          {!showDispute ? (
            <button className="btn btn-ghost btn-block btn-sm" type="button" onClick={() => setShowDispute(true)}>Tive um problema</button>
          ) : (
            <DisputeForm action={dispute} pending={disputing} state={disputeState} />
          )}
        </div>
      );
    return (
      <form action={deliver} className="panel box">
        <h3>Entregar pedido</h3>
        {p.buyerNote && <div className="note"><Icon name="user" /><span>ID informado pelo comprador: <b className="mono">{p.buyerNote}</b></span></div>}
        <div className="field">
          <label htmlFor="text">Dados da entrega</label>
          <textarea className="input mono" id="text" name="text" rows={5} required placeholder={"Login, senha, código ou instruções.\nSó o comprador vê."} />
        </div>
        <Err s={deliverState} />
        <button className="btn btn-primary btn-block" type="submit" disabled={delivering}>{delivering ? "Enviando…" : "Marcar como entregue"}</button>
      </form>
    );
  }

  const delivery = p.deliveryText && (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <span className="label">Entrega</span>
        <button className="linkish small" type="button" onClick={() => setReveal(!reveal)}><Icon name="eye" />{reveal ? "Ocultar" : "Mostrar"}</button>
      </div>
      <pre className="delivery">{reveal ? p.deliveryText : "•••••••••••••"}</pre>
    </div>
  );

  if (p.status === "ENTREGUE") {
    if (!buyer)
      return <div className="panel box"><h3>Entregue</h3>{delivery}<p className="muted small">Aguardando o comprador confirmar. Se ele não responder, a confirmação é automática em {p.autoConfirmAt}.</p></div>;
    return (
      <div className="panel box">
        <h3>Confira sua entrega</h3>
        {delivery}
        <ActionButton className="btn btn-primary btn-block" fn={() => confirmAction(p.code)}><Icon name="check" />Recebi e está tudo certo</ActionButton>
        {!showDispute ? (
          <button className="btn btn-ghost btn-block" type="button" onClick={() => setShowDispute(true)}>Tive um problema</button>
        ) : (
          <DisputeForm action={dispute} pending={disputing} state={disputeState} />
        )}
        <p className="hint">Ao confirmar, o valor vai para o vendedor e o pedido não pode mais ser contestado. Sem resposta, a confirmação é automática em {p.autoConfirmAt}.</p>
      </div>
    );
  }

  if (p.status === "DISPUTA")
    return <div className="panel box"><div className="note warn"><Icon name="alert" /><span><b>Disputa aberta.</b> Um mediador da Nexo analisa o caso. O valor continua retido até a decisão.</span></div>{delivery}</div>;

  if (p.status === "REEMBOLSADO")
    return (
      <div className="panel box">
        <h3>Pedido reembolsado</h3>
        <p className="muted small">{buyer ? `${p.total} foram estornados para a conta que pagou o Pix.` : "A disputa foi decidida a favor do comprador e o valor foi estornado."}</p>
        {p.resolution && <div className="note"><Icon name="shield" /><span><b>Decisão do mediador:</b> {p.resolution}</span></div>}
      </div>
    );

  if (p.status === "CANCELADO") return <div className="panel box"><h3>Pedido cancelado</h3><p className="muted small">Nenhum valor foi cobrado.</p></div>;

  // CONCLUIDO
  return (
    <div className="panel box">
      <h3>Pedido concluído</h3>
      {p.resolution && <div className="note"><Icon name="shield" /><span><b>Decisão do mediador:</b> {p.resolution}</span></div>}
      {delivery}
      {buyer && !p.reviewed && !reviewState?.ok && (
        <form action={review} className="stack" style={{ gap: 10 }}>
          <span className="label">Como foi a compra?</span>
          <div className="rate-row" role="radiogroup" aria-label="Nota">
            {[1, 2, 3, 4, 5].map((n) => <input key={`i${n}`} type="radio" name="rating" id={`r${n}`} value={n} required />)}
            {[1, 2, 3, 4, 5].map((n) => <label key={`l${n}`} htmlFor={`r${n}`} aria-label={`${n} estrelas`}><Icon name="star" /></label>)}
          </div>
          <textarea className="input" name="comment" rows={3} maxLength={500} placeholder="Conte como foi (opcional)" />
          <Err s={reviewState} />
          <button className="btn btn-primary btn-block" type="submit" disabled={reviewing}>Enviar avaliação</button>
        </form>
      )}
      {buyer && (p.reviewed || reviewState?.ok) && <p className="muted small">Obrigado pela avaliação!</p>}
    </div>
  );
}

function DisputeForm({ action, pending, state }: { action: (f: FormData) => void; pending: boolean; state: ActionState }) {
  return (
    <form action={action} className="stack" style={{ gap: 10 }}>
      <div className="field">
        <label htmlFor="reason">O que aconteceu?</label>
        <textarea className="input" id="reason" name="reason" rows={4} required minLength={10} placeholder="Ex.: a senha não funciona, o item é diferente do anúncio…" />
      </div>
      <Err s={state} />
      <button className="btn btn-danger btn-block" type="submit" disabled={pending}>Abrir disputa</button>
    </form>
  );
}
