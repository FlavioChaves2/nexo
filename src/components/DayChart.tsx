"use client";

import { useState } from "react";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const W = 640, H = 200, PAD_L = 8, PAD_R = 8, PAD_T = 14, PAD_B = 26;

type Pt = { day: string; value: number; note?: string };

/** Gráfico de uma série por dia (barras ou área), com dica ao passar o mouse ou tocar. */
export function DayChart({ points, kind, money, label }: { points: Pt[]; kind: "bar" | "area"; money?: boolean; label: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const fmt = (v: number) => (money ? BRL.format(v / 100) : v.toLocaleString("pt-BR"));
  const max = Math.max(1, ...points.map((p) => p.value));
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const step = plotW / points.length;
  const x = (i: number) => PAD_L + step * i + step / 2;
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH;
  const dayLabel = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const empty = points.every((p) => p.value === 0);
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const barW = Math.max(2, Math.min(22, step - 4));
  const bar = (i: number, v: number) => {
    const h = (v / max) * plotH, x0 = x(i) - barW / 2, y0 = PAD_T + plotH - h, r = Math.min(4, h, barW / 2);
    return `M${x0},${PAD_T + plotH} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + barW - r} Q${x0 + barW},${y0} ${x0 + barW},${y0 + r} V${PAD_T + plotH} Z`;
  };
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD_T + plotH} L${x(0)},${PAD_T + plotH} Z`;
  const p = hi !== null ? points[hi] : null;

  return (
    <div className="dchart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${fmt(points.reduce((s, q) => s + q.value, 0))} no período`} onMouseLeave={() => setHi(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} className={i === 0 ? "dc-base" : "dc-grid"} />
            {i > 0 && !empty && <text x={W - PAD_R} y={y(t) - 4} textAnchor="end" className="dc-tick">{fmt(Math.round(t))}</text>}
          </g>
        ))}
        {kind === "bar"
          ? points.map((q, i) => q.value > 0 && <path key={q.day} d={bar(i, q.value)} className={`dc-bar${hi === i ? " on" : ""}`} />)
          : !empty && (
              <>
                <path d={area} className="dc-area" />
                <path d={line} className="dc-line" />
                {hi !== null && <circle cx={x(hi)} cy={y(points[hi].value)} r={5} className="dc-dot" />}
              </>
            )}
        {hi !== null && kind === "area" && <line x1={x(hi)} x2={x(hi)} y1={PAD_T} y2={PAD_T + plotH} className="dc-cross" />}
        {xLabels.map((i) => points[i] && <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="dc-tick">{dayLabel(points[i].day)}</text>)}
        {/* áreas de toque maiores que as marcas */}
        {points.map((q, i) => (
          <rect key={q.day} x={PAD_L + step * i} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setHi(i)} onTouchStart={() => setHi(i)} onClick={() => setHi(i)} />
        ))}
      </svg>
      {empty && <span className="dc-empty">Ainda sem dados neste período</span>}
      {p && (
        <div className="dc-tip" style={{ left: `${(x(hi!) / W) * 100}%` }}>
          <b>{fmt(p.value)}</b>
          <span>{dayLabel(p.day)}{p.note ? ` · ${p.note}` : ""}</span>
        </div>
      )}
    </div>
  );
}
