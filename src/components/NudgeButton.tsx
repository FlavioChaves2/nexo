"use client";

import { useActionState } from "react";
import { sendListingNudgesAction } from "@/app/actions/admin-growth";

// Botão do painel: manda "Agora é só anunciar" para quem se cadastrou e não anunciou (7 dias).
export function NudgeButton({ count }: { count: number }) {
  const [state, action, pending] = useActionState(sendListingNudgesAction, undefined);
  return (
    <form action={action} className="panel box" style={{ display: "grid", gap: 8 }}>
      <h3>Cadastros sem anúncio · 7 dias: {count}</h3>
      <span className="muted small">Manda o e-mail “Agora é só anunciar” (com o prazo da taxa zero de cada um). Pode usar uma vez a cada 20 h.</span>
      <button className="btn btn-primary" type="submit" disabled={pending || !count} style={{ justifySelf: "start" }}>{pending ? "Enviando…" : "Enviar e-mail para eles"}</button>
      {state?.ok && <span className="lime small">{state.ok}</span>}
      {state?.error && <span className="small" style={{ color: "#ff6b6b" }}>{state.error}</span>}
    </form>
  );
}
