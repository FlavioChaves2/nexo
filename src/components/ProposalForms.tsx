"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { acceptProposalAction, cancelProposalAction, createProposalAction, updateProposalAction, type ProposalState } from "@/app/actions/proposals";
import { LISTING_TYPES, TYPE_LABEL } from "@/lib/constants";
import { useKeepForm } from "@/lib/use-keep-form";
import { GamePicker, type PickGame } from "./GamePicker";
import { Icon } from "./Icon";

export type ProposalValues = {
  gameSlug: string; server: string; type: string; title: string; description: string; quantity: number;
  total: string; deliveryDays: number; deliveryTerms: string; validDays: number;
};

const Err = ({ s }: { s: ProposalState }) => (s?.error ? <p className="alert full" role="alert">{s.error}</p> : null);

/** Criar ou editar proposta. Na edição, avisa que o cliente precisa aceitar de novo. */
export function ProposalForm({ games, id, values, accepted }: { games: PickGame[]; id?: string; values?: ProposalValues; accepted?: boolean }) {
  const action = id ? updateProposalAction.bind(null, id) : createProposalAction;
  const [state, run, pending] = useActionState<ProposalState, FormData>(action, undefined);
  const keep = useKeepForm(state, run);
  const [game, setGame] = useState(values?.gameSlug ?? games[0]?.slug ?? "");
  return (
    <form action={run} {...keep} className="panel box">
      <div className="form-grid">
        {id && (
          <div className="note warn full">
            <Icon name="alert" />
            <span>{accepted ? "O cliente já aceitou esta versão. Salvar uma alteração cancela o pagamento em aberto e ele precisa aceitar de novo." : "Salvar uma alteração cria uma nova versão; o cliente vê sempre a versão mais recente."}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="gameSlug">Jogo</label>
          <GamePicker id="gameSlug" games={games} name="gameSlug" value={game} onChange={setGame} />
        </div>
        <div className="field">
          <label htmlFor="type">Tipo</label>
          <select className="input" id="type" name="type" defaultValue={values?.type ?? "SERVICO"}>
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="title">Produto ou serviço</label>
          <input className="input" id="title" name="title" required minLength={8} maxLength={80} defaultValue={values?.title} placeholder="Ex.: Upar conta de Ragnarok do nível 90 ao 99" />
        </div>
        <div className="field full">
          <label htmlFor="description">O que será entregue</label>
          <textarea className="input" id="description" name="description" rows={4} required minLength={20} maxLength={2000} defaultValue={values?.description} placeholder="Descreva de forma objetiva o que o cliente recebe." />
        </div>
        <div className="field">
          <label htmlFor="server">Servidor ou região (opcional)</label>
          <input className="input" id="server" name="server" maxLength={40} defaultValue={values?.server} placeholder="Ex.: BR, Mundo 12" />
        </div>
        <div className="field">
          <label htmlFor="quantity">Quantidade</label>
          <input className="input mono" id="quantity" name="quantity" type="number" min={1} max={9999} required defaultValue={values?.quantity ?? 1} />
        </div>
        <div className="field">
          <label htmlFor="total">Preço total (R$)</label>
          <input className="input mono" id="total" name="total" inputMode="decimal" required placeholder="150,00" defaultValue={values?.total} />
        </div>
        <div className="field">
          <label htmlFor="deliveryDays">Prazo de entrega (dias após o pagamento)</label>
          <input className="input mono" id="deliveryDays" name="deliveryDays" type="number" min={0} max={60} required defaultValue={values?.deliveryDays ?? 1} />
          <span className="hint">0 = no mesmo dia.</span>
        </div>
        <div className="field full">
          <label htmlFor="deliveryTerms">Condições de entrega</label>
          <textarea className="input" id="deliveryTerms" name="deliveryTerms" rows={3} required minLength={10} maxLength={1000} defaultValue={values?.deliveryTerms} placeholder="Como e onde a entrega acontece, o que o cliente precisa informar, o que acontece se houver atraso." />
        </div>
        <div className="field">
          <label htmlFor="validDays">Validade da proposta (dias)</label>
          <input className="input mono" id="validDays" name="validDays" type="number" min={1} max={30} required defaultValue={values?.validDays ?? 3} />
          <span className="hint">Depois disso o link não pode mais ser aceito nem pago.</span>
        </div>
        <p className="muted small full">Sem telefone, e-mail, links ou pagamento por fora: o cliente paga pela Nexo e tem a mesma garantia, entrega e disputa de qualquer pedido.</p>
        <Err s={state} />
        <button className="btn btn-primary full" type="submit" disabled={pending}>{pending ? "Salvando…" : id ? "Salvar nova versão" : "Criar proposta e gerar link"}</button>
      </div>
    </form>
  );
}

export function CancelProposal({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <div className="stack" style={{ gap: 6 }}>
      <button
        type="button"
        className="btn btn-danger btn-sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancelar esta proposta? O link deixa de funcionar e pagamentos em aberto são cancelados.")) return;
          start(async () => setErr((await cancelProposalAction(id))?.error ?? ""));
        }}
      >
        {pending ? "Cancelando…" : "Cancelar proposta"}
      </button>
      {err && <p className="alert" role="alert">{err}</p>}
    </div>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  // O endereço completo só existe no navegador; no servidor fica o caminho (evita diferença na hidratação).
  const [full, setFull] = useState(url);
  useEffect(() => setFull(new URL(url, location.origin).toString()), [url]);
  return (
    <div className="copy-row">
      <input className="input" readOnly value={full} aria-label="Link da proposta" onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(full);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            /* sem permissão: a pessoa copia do campo */
          }
        }}
      >
        <Icon name="copy" />{copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/** O comprador confirma que leu as condições da versão que está vendo. */
export function AcceptProposal({ token, version }: { token: string; version: number }) {
  const [state, run, pending] = useActionState<ProposalState, FormData>(acceptProposalAction.bind(null, token), undefined);
  const keep = useKeepForm(state, run);
  return (
    <form action={run} {...keep} className="stack" style={{ gap: 12 }}>
      <input type="hidden" name="version" value={version} />
      <label className="check"><input type="checkbox" name="agree" required />Li e aceito as condições desta proposta.</label>
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? "Aguarde…" : <>Aceitar e ir para o pagamento <Icon name="arrow" /></>}</button>
    </form>
  );
}
