"use client";

import { useActionState } from "react";
import { acceptOffer, cancelWanted, createWanted, sendOffer, type WantedState } from "@/app/actions/wanted";
import { GamePicker, type PickGame } from "./GamePicker";
import { LISTING_TYPES, TYPE_LABEL } from "@/lib/constants";
import { Icon } from "./Icon";

function Feedback({ s }: { s: WantedState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function WantedForm({ games, gameSlug }: { games: PickGame[]; gameSlug?: string }) {
  const [state, run, pending] = useActionState(createWanted, undefined);
  const v = state?.values ?? {};
  return (
    <form action={run} className="panel box" key={JSON.stringify(v)}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="gameSlug">Jogo</label>
          <GamePicker id="gameSlug" games={games} name="gameSlug" value={v.gameSlug ?? gameSlug ?? games[0]?.slug ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="type">Tipo</label>
          <select className="input" id="type" name="type" defaultValue={v.type}>
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="title">O que você procura</label>
          <input className="input" id="title" name="title" defaultValue={v.title} required minLength={8} maxLength={80} placeholder="Ex.: Conta Valorant com Vandal Reaver" />
        </div>
        <div className="field full">
          <label htmlFor="description">Detalhes</label>
          <textarea className="input" id="description" name="description" defaultValue={v.description} rows={4} required minLength={20} maxLength={1500} placeholder="Rank, skins, região, prazo… quanto mais detalhe, melhores as ofertas." />
        </div>
        <div className="field">
          <label htmlFor="max">Pago até (R$)</label>
          <input className="input mono" id="max" name="max" defaultValue={v.max} inputMode="decimal" required placeholder="200,00" />
        </div>
        {state?.error && <p className="alert full" role="alert">{state.error}</p>}
        <div className="full"><button className="btn btn-primary" type="submit" disabled={pending}><Icon name="search" />Publicar pedido</button></div>
      </div>
    </form>
  );
}

export function OfferForm({ wantedId, price, message }: { wantedId: string; price?: string; message?: string }) {
  const [state, run, pending] = useActionState(sendOffer.bind(null, wantedId), undefined);
  const v = state?.values;
  return (
    <form action={run} className="stack" style={{ gap: 10 }} key={JSON.stringify(v ?? state?.ok ?? "")}>
      <div className="field">
        <label htmlFor="price">Seu preço (R$)</label>
        <input className="input mono" id="price" name="price" inputMode="decimal" required defaultValue={v?.price ?? price} placeholder="180,00" />
      </div>
      <div className="field">
        <label htmlFor="message">O que você entrega</label>
        <textarea className="input" id="message" name="message" rows={3} required minLength={10} maxLength={1000} defaultValue={v?.message ?? message} placeholder="Descreva o item e o prazo de entrega." />
      </div>
      <Feedback s={state} />
      <div><button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{price ? "Atualizar oferta" : "Enviar oferta"}</button></div>
    </form>
  );
}

export function AcceptButton({ offerId }: { offerId: string }) {
  const [state, run, pending] = useActionState(acceptOffer.bind(null, offerId), undefined);
  return (
    <form action={run} className="grid-gap">
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Aceitar e pagar</button>
      {state?.error && <span className="error">{state.error}</span>}
    </form>
  );
}

export function CancelWantedButton({ wantedId }: { wantedId: string }) {
  const [state, run, pending] = useActionState(cancelWanted.bind(null, wantedId), undefined);
  if (state?.ok) return <Feedback s={state} />;
  return (
    <form action={run} className="grid-gap" onSubmit={(e) => { if (!confirm("Cancelar este pedido? As ofertas serão recusadas.")) e.preventDefault(); }}>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>Cancelar pedido</button>
      {state?.error && <span className="error">{state.error}</span>}
    </form>
  );
}
