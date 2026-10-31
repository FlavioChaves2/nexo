"use client";

import { useActionState, useState, useTransition } from "react";
import { createStoreCouponAction, toggleStoreCouponAction, type StoreCouponState } from "@/app/actions/store-coupons";
import { useKeepForm } from "@/lib/use-keep-form";

export function StoreCouponCreate({ games, listings }: { games: { slug: string; name: string }[]; listings: { id: string; title: string }[] }) {
  const [state, run, pending] = useActionState<StoreCouponState, FormData>(createStoreCouponAction, undefined);
  const keep = useKeepForm(state, run);
  const [scope, setScope] = useState("LOJA");
  return (
    <form action={run} {...keep} className="panel box">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="code">Código</label>
          <input className="input mono" id="code" name="code" required minLength={4} maxLength={20} placeholder="CLIENTE10" style={{ textTransform: "uppercase" }} />
        </div>
        <div className="field">
          <label htmlFor="scope">Vale para</label>
          <select className="input" id="scope" name="scope" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="LOJA">Toda a loja</option>
            <option value="JOGO">Um jogo</option>
            <option value="ANUNCIO">Um anúncio</option>
          </select>
        </div>
        {scope === "JOGO" && (
          <div className="field full">
            <label htmlFor="game">Jogo</label>
            <select className="input" id="game" name="game" required defaultValue="">
              <option value="" disabled>Escolha</option>
              {games.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
          </div>
        )}
        {scope === "ANUNCIO" && (
          <div className="field full">
            <label htmlFor="listing">Anúncio</label>
            <select className="input" id="listing" name="listing" required defaultValue="">
              <option value="" disabled>Escolha</option>
              {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="percentOff">Desconto em %</label>
          <input className="input mono" id="percentOff" name="percentOff" type="number" min={1} max={90} placeholder="10" />
        </div>
        <div className="field">
          <label htmlFor="amountOff">ou valor fixo (R$)</label>
          <input className="input mono" id="amountOff" name="amountOff" inputMode="decimal" placeholder="5,00" />
        </div>
        <div className="field">
          <label htmlFor="maxDiscount">Desconto máximo (R$, opcional)</label>
          <input className="input mono" id="maxDiscount" name="maxDiscount" inputMode="decimal" />
        </div>
        <div className="field">
          <label htmlFor="minOrder">Compra mínima (R$, opcional)</label>
          <input className="input mono" id="minOrder" name="minOrder" inputMode="decimal" />
        </div>
        <div className="field">
          <label htmlFor="maxUses">Limite total de usos (opcional)</label>
          <input className="input mono" id="maxUses" name="maxUses" type="number" min={1} />
        </div>
        <div className="field">
          <label htmlFor="startsAt">Começa em (opcional)</label>
          <input className="input" id="startsAt" name="startsAt" type="date" />
        </div>
        <div className="field">
          <label htmlFor="expiresAt">Vale até (opcional)</label>
          <input className="input" id="expiresAt" name="expiresAt" type="date" />
        </div>
        <p className="muted small full">O desconto sai do valor que você recebe. Cada cliente usa cada cupom uma vez, e não dá para somar com cupom da Nexo no mesmo pedido.</p>
        {state?.error && <p className="alert full" role="alert">{state.error}</p>}
        {state?.ok && <p className="note full">{state.ok}</p>}
        <button className="btn btn-primary full" type="submit" disabled={pending}>{pending ? "Criando…" : "Criar cupom"}</button>
      </div>
    </form>
  );
}

export function StoreCouponToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => start(async () => { await toggleStoreCouponAction(id); })}>
      {active ? "Desativar" : "Reativar"}
    </button>
  );
}
