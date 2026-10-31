"use client";

import { useState } from "react";

const MAX_CENTS = 5_000_000; // mesmo limite do anúncio: R$ 50.000,00
/** Só números, vírgula e ponto; passou de R$ 50.000, o campo vira 50.000,00 sozinho. */
export function capPrice(raw: string) {
  const v = raw.replace(/[^\d.,]/g, "");
  const cents = Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  return cents > MAX_CENTS ? "50.000,00" : v;
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "Quanto eu recebo?": o vendedor digita o preço e vê a taxa e o valor líquido. */
export function FeeSimulator({ feeBps }: { feeBps: number }) {
  const [price, setPrice] = useState("100,00");
  const typed = Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  const cents = Math.min(Math.max(typed, 0), MAX_CENTS);
  const fee = Math.round((cents * feeBps) / 10000);
  return (
    <div className="panel box fee-sim">
      <h3>Quanto eu recebo?</h3>
      <div className="field">
        <label htmlFor="sim-price">Preço do anúncio (R$)</label>
        <input className="input mono" id="sim-price" inputMode="decimal" maxLength={10} value={price} onChange={(e) => setPrice(capPrice(e.target.value))} />
        <span className="hint">Máximo R$ 50.000,00 por anúncio.</span>
      </div>
      <dl className="kv">
        <dt>Preço de venda</dt><dd className="num">{BRL.format(cents / 100)}</dd>
        <dt>Taxa Nexo ({(feeBps / 100).toString().replace(".", ",")}%)</dt><dd className="num">−{BRL.format(fee / 100)}</dd>
        <dt style={{ fontWeight: 700, color: "var(--ink)" }}>Você recebe</dt><dd className="price" style={{ fontSize: 22 }}>{BRL.format((cents - fee) / 100)}</dd>
      </dl>
    </div>
  );
}
