"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Quantidade com + e −, total ao vivo e barra fixa de compra no celular. */
export function BuyForm({ listingId, priceCents, stock }: { listingId: string; priceCents: number; stock: number }) {
  const max = Math.min(stock, 50);
  const [qty, setQty] = useState(1);
  const set = (n: number) => setQty(Math.max(1, Math.min(max, n || 1)));
  const total = BRL.format((priceCents * qty) / 100);
  const formId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <form id={formId} action={`/checkout/${listingId}`} className="stack" style={{ gap: 12 }}>
      {max > 1 && (
        <div className="row">
          <label className="label" htmlFor="qtd">Quantidade</label>
          <div className="stepper">
            <button type="button" aria-label="Diminuir" onClick={() => set(qty - 1)} disabled={qty <= 1}>−</button>
            <input id="qtd" name="qtd" type="number" min={1} max={max} value={qty} onChange={(e) => set(Number(e.target.value))} />
            <button type="button" aria-label="Aumentar" onClick={() => set(qty + 1)} disabled={qty >= max}>+</button>
          </div>
        </div>
      )}
      {qty > 1 && <div className="row small"><span className="muted">Total</span><b className="num" key={qty} style={{ animation: "pop .35s" }}>{total}</b></div>}
      <button className="btn btn-primary btn-block buy-go" type="submit">Comprar agora <Icon name="arrow" /></button>
      {/* Fora do painel: animações com transform prenderiam o position: fixed dentro dele. */}
      {mounted &&
        createPortal(
          <div className="buy-bar">
            <div><span className="muted small">{qty > 1 ? `${qty} unidades` : "Total"}</span><b className="num">{total}</b></div>
            <button className="btn btn-primary" type="submit" form={formId}>Comprar <Icon name="arrow" /></button>
          </div>,
          document.body,
        )}
    </form>
  );
}
