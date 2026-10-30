"use client";

import { useEffect } from "react";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window { __nexoInstall?: InstallEvent | null }
}

/** Liga o service worker e guarda o convite de instalação do Chrome para o botão "Instalar app". */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => null);
    const onPrompt = (e: Event) => {
      e.preventDefault(); // o convite aparece pelo nosso botão, não pela barra do navegador
      window.__nexoInstall = e as InstallEvent;
      window.dispatchEvent(new Event("nexo:install"));
    };
    const onInstalled = () => {
      window.__nexoInstall = null;
      window.dispatchEvent(new Event("nexo:install"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
