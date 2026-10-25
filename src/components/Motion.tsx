"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Animações globais: blocos sobem ao entrar na tela e painéis ganham um brilho que segue o mouse.
// Tudo é aplicado depois da página pronta, então sem JS o conteúdo aparece normalmente.
const TARGETS = "main section, main .panel, main .uni, main .step";

export function Motion() {
  const path = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pending = new Set<HTMLElement>();
    const reveal = () => {
      const limit = innerHeight * 0.92;
      for (const el of pending) {
        if (el.getBoundingClientRect().top > limit) continue;
        el.classList.remove("pre");
        pending.delete(el);
      }
    };
    // A página chega em partes (streaming): procura de novo sempre que o conteúdo muda.
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
        if (el.classList.contains("reveal") || el.getBoundingClientRect().top <= innerHeight) continue;
        el.classList.add("reveal", "pre");
        pending.add(el);
      }
    };
    const onScroll = () => {
      if (pending.size) reveal();
    };
    let t = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(t);
      t = window.setTimeout(scan, 60);
    });
    mo.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    scan();
    // Segurança: se algum evento de rolagem se perder, a checagem periódica revela mesmo assim.
    const poll = window.setInterval(onScroll, 500);
    return () => {
      clearTimeout(t);
      clearInterval(poll);
      mo.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      for (const el of pending) el.classList.remove("pre");
    };
  }, [path]);

  useEffect(() => {
    if (matchMedia("(hover: none)").matches) return;
    const move = (e: PointerEvent) => {
      const panel = (e.target as HTMLElement).closest?.<HTMLElement>("main .panel");
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      panel.classList.add("glow");
      panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
      panel.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  return null;
}
