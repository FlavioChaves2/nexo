"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nexinho3D } from "./Nexinho3D";

const COLORS = ["#C5F04A", "#E4FF8F", "#F2C94C", "#4FD6BE", "#FF8A65", "#A796FF"];

/** Nexinho comemorando com confete quando o pagamento do comprador é aprovado. */
export function PaidCelebration({ code, status }: { code: string; status: string }) {
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const k = `nexo-pedido-${code}`;
    let prev: string | null = null;
    try {
      prev = sessionStorage.getItem(k);
      sessionStorage.setItem(k, status);
    } catch {
      /* sem armazenamento: só comemora pelo ?pago=1 */
    }
    const paidNow = status === "PAGO" || status === "ENTREGUE";
    if (paidNow && (prev === "AGUARDANDO_PAGAMENTO" || params.get("pago") === "1")) {
      setShow(true);
      if (params.get("pago")) history.replaceState(null, "", location.pathname);
    }
  }, [code, status, params]);

  // Fecha sozinho; fica num efeito à parte para não ser cancelado quando a URL muda.
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div className="celebrate" role="status" onClick={() => setShow(false)}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 9) * 0.07}s`, animationDuration: `${1.8 + (i % 5) * 0.3}s` }} />
        ))}
      </div>
      <div className="celebrate-card">
        <Nexinho3D className="celebrate-bot" decor={false} interactive={false} zoom={11} celebrateOnLoad label="Nexinho comemorando" />
        <b>Pagamento aprovado!</b>
        <span>O dinheiro está protegido pela Nexo até você receber.</span>
      </div>
    </div>
  );
}
