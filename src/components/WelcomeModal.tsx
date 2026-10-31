"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { WELCOME_COOKIE } from "@/lib/welcome";

type Welcome = { email: string; sent: boolean };

/** Boas-vindas logo depois do cadastro: avisa que a conta foi criada e que o e-mail de confirmação saiu. */
export function WelcomeModal() {
  const path = usePathname();
  const [data, setData] = useState<Welcome | null>(null);

  // O cadastro grava um cookie curto; lemos uma vez e apagamos, para não aparecer de novo.
  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${WELCOME_COOKIE}=`));
    if (!raw) return;
    document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; path=/`;
    try {
      setData(JSON.parse(decodeURIComponent(raw.slice(WELCOME_COOKIE.length + 1))));
    } catch {
      setData({ email: "", sent: false });
    }
  }, [path]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setData(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [data]);

  if (!data) return null;
  const close = () => setData(null);
  return createPortal(
    <div className="ios-guide" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={close}>
      <div className="ios-card welcome-card" onClick={(e) => e.stopPropagation()}>
        <button className="ios-close" type="button" onClick={close} aria-label="Fechar">×</button>
        <img className="welcome-bot" src="/brand/nexinho-festa.webp" alt="" />
        <h3 id="welcome-title">Conta criada! Bem-vindo à Nexo 🎉</h3>
        {data.sent ? (
          <p className="muted small">
            Enviamos um link de confirmação para <b className="welcome-mail">{data.email}</b>. Abra o e-mail e toque em <b>Confirmar e-mail</b> para poder vender e sacar. Não chegou? Olhe no spam ou peça outro em <Link className="lime" href="/conta" onClick={close}>Minha conta</Link>.
          </p>
        ) : (
          <p className="muted small">Você já pode comprar. Para vender e sacar, confirme seu e-mail em <Link className="lime" href="/conta" onClick={close}>Minha conta</Link>.</p>
        )}
        <div className="welcome-actions">
          <button className="btn btn-primary" type="button" onClick={close}>{path === "/conta/perfil" ? "Completar meu perfil" : "Começar a explorar"}</button>
          {path === "/conta/perfil" ? (
            <Link className="btn btn-ghost" href="/vender" onClick={close}>Criar meu primeiro anúncio</Link>
          ) : (
            <Link className="btn btn-ghost" href="/conta/perfil" onClick={close}>Completar meu perfil</Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
