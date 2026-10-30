"use client";

import { useState } from "react";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "Quanto eu recebo?": o vendedor digita o preço e vê a taxa e o valor líquido. */
export function FeeSimulator({ feeBps }: { feeBps: number }) {
  const [price, setPrice] = useState("100,00");
  const cents = Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100) || 0;
  const fee = Math.round((cents * feeBps) / 10000);
  return (
    <div className="panel box fee-sim">
      <h3>Quanto eu recebo?</h3>
      <div className="field">
        <label htmlFor="sim-price">Preço do anúncio (R$)</label>
        <input className="input mono" id="sim-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <dl className="kv">
        <dt>Preço de venda</dt><dd className="num">{BRL.format(cents / 100)}</dd>
        <dt>Taxa Nexo ({(feeBps / 100).toString().replace(".", ",")}%)</dt><dd className="num">−{BRL.format(fee / 100)}</dd>
        <dt style={{ fontWeight: 700, color: "var(--ink)" }}>Você recebe</dt><dd className="price" style={{ fontSize: 22 }}>{BRL.format((cents - fee) / 100)}</dd>
      </dl>
    </div>
  );
}
