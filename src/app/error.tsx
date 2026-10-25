"use client";

import Link from "next/link";
import { useEffect } from "react";

// Erro inesperado numa página: mensagem amigável no lugar da tela padrão do Next.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="wrap" style={{ paddingBlock: "80px", textAlign: "center", display: "grid", gap: 16, justifyItems: "center" }}>
      <span className="eyebrow">Algo deu errado</span>
      <h1 style={{ fontSize: "clamp(26px,4vw,40px)" }}>Não conseguimos abrir esta página</h1>
      <p className="muted" style={{ maxWidth: 460 }}>Pode ter sido uma falha momentânea. Tente de novo; se continuar, fale com o suporte{error.digest ? ` e informe o código ${error.digest}` : ""}.</p>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-primary" type="button" onClick={reset}>Tentar de novo</button>
        <Link className="btn btn-ghost" href="/">Voltar ao início</Link>
      </div>
    </div>
  );
}
