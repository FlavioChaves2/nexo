"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/push";
import { Icon } from "./Icon";

type Platform = "ios" | "android" | "desktop";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return /android/i.test(ua) ? "android" : "desktop";
}

/** Chave pública VAPID (base64url) no formato que o navegador pede. */
function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const STEPS: Record<Platform, string[]> = {
  ios: ["Abra nexopoint.com.br no Safari", "Toque em Compartilhar (o quadrado com a seta para cima)", "Escolha “Adicionar à Tela de Início” e toque em Adicionar"],
  android: ["Abra nexopoint.com.br no Chrome", "Toque nos três pontinhos, no canto de cima", "Escolha “Instalar app” ou “Adicionar à tela inicial”"],
  desktop: ["Abra nexopoint.com.br no Chrome ou no Edge", "Clique no ícone de instalar, no fim da barra de endereço", "Confirme em “Instalar”"],
};

export function InstallButton() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setPlatform(detect());
    setInstalled(isStandalone());
    const sync = () => setCanPrompt(!!window.__nexoInstall);
    sync();
    window.addEventListener("nexo:install", sync);
    return () => window.removeEventListener("nexo:install", sync);
  }, []);

  if (!platform) return <button className="btn btn-primary app-btn" disabled>Carregando…</button>;
  if (installed) return <p className="note"><Icon name="check" /><span>Você já está usando o app da Nexo. 🎉</span></p>;

  async function install() {
    const ev = window.__nexoInstall;
    if (!ev) return setShowHelp(true);
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    window.__nexoInstall = null;
    setCanPrompt(false);
    if (outcome === "accepted") setInstalled(true);
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <button className="btn btn-primary app-btn" type="button" onClick={install}>
        <Icon name="bolt" />{platform === "ios" ? "Instalar no iPhone" : canPrompt ? "Baixar o app grátis" : "Como instalar"}
      </button>
      {(showHelp || platform === "ios") && (
        <ol className="app-steps">
          {STEPS[platform].map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}
        </ol>
      )}
    </div>
  );
}

type PushState = "loading" | "unsupported" | "ios-browser" | "denied" | "off" | "on" | "busy";

export function PushToggle({ publicKey, loggedIn }: { publicKey: string; loggedIn: boolean }) {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // No iPhone o push só existe com o app instalado na Tela de Início.
        return setState(detect() === "ios" && !isStandalone() ? "ios-browser" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  if (!publicKey) return <p className="muted small">As notificações no celular chegam em breve.</p>;
  if (!loggedIn) return <a className="btn btn-ghost app-btn" href="/entrar?next=/app"><Icon name="bell" />Entre para ativar as notificações</a>;
  if (state === "loading") return null;
  if (state === "ios-browser") return <p className="muted small">No iPhone, instale o app primeiro (passos acima) e abra pela Tela de Início para ativar as notificações.</p>;
  if (state === "unsupported") return <p className="muted small">Este navegador não aceita notificações. Use o Chrome, o Edge ou o app instalado.</p>;
  if (state === "denied") return <p className="muted small">As notificações estão bloqueadas. Libere nas configurações do navegador (cadeado ao lado do endereço) e volte aqui.</p>;

  async function turnOn() {
    setError("");
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      const r = await savePushSubscription(sub.toJSON());
      if (r.error) {
        await sub.unsubscribe();
        setError(r.error);
        return setState("off");
      }
      setState("on");
    } catch {
      setError("Não foi possível ativar agora. Tente de novo.");
      setState("off");
    }
  }

  async function turnOff() {
    setState("busy");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {state === "on" ? (
        <>
          <p className="note"><Icon name="bell" /><span>Notificações ativadas neste aparelho.</span></p>
          <div><button className="btn btn-ghost btn-sm" type="button" onClick={turnOff}>Desativar</button></div>
        </>
      ) : (
        <button className="btn btn-ghost app-btn" type="button" onClick={turnOn} disabled={state === "busy"}>
          <Icon name="bell" />{state === "busy" ? "Ativando…" : "Ativar notificações"}
        </button>
      )}
      {error && <p className="alert" role="alert">{error}</p>}
    </div>
  );
}
