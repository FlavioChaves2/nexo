"use client";

import { useState } from "react";
import { capPrice } from "./FeeSimulator";
import { Icon } from "./Icon";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const QUICK = ["50,00", "150,00", "450,00", "1.000,00"];

/** Landing: "quanto vale sua conta?" com o valor na taxa zero (3 primeiros dias) e depois dela. */
export function LpCalc({ feeBps, days }: { feeBps: number; days: number }) {
  const [price, setPrice] = useState("450,00");
  const cents = Math.min(Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100) || 0, 5_000_000);
  const after = cents - Math.round((cents * feeBps) / 10000);
  return (
    <div className="lp-calc">
      <div className="lp-calc-in">
        <label htmlFor="lp-price">Por quanto você venderia?</label>
        <div className="lp-calc-field">
          <span>R$</span>
          <input id="lp-price" inputMode="decimal" maxLength={10} value={price} onChange={(e) => setPrice(capPrice(e.target.value))} />
        </div>
        <div className="lp-calc-quick">
          {QUICK.map((q) => <button key={q} type="button" className={price === q ? "on" : ""} onClick={() => setPrice(q)}>R$ {q.replace(",00", "")}</button>)}
        </div>
      </div>
      <div className="lp-calc-out">
        <div className="lp-calc-best">
          <span>Vendendo nos seus {days} primeiros dias</span>
          <b>{BRL.format(cents / 100)}</b>
          <em><Icon name="check" />taxa zero: o valor inteiro é seu</em>
        </div>
        <div className="lp-calc-later">
          <span>Depois disso</span>
          <b>{BRL.format(after / 100)}</b>
          <em>taxa de {(feeBps / 100).toString().replace(".", ",")}% só quando vende</em>
        </div>
        <a className="btn btn-primary btn-block" href="#cadastro">Quero vender com taxa zero <Icon name="arrow" /></a>
      </div>
    </div>
  );
}
