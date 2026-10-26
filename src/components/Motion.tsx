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
    let tilted: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      el.classList.remove("tilting");
    };
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const panel = t.closest?.<HTMLElement>("main .panel");
      if (panel) {
        const r = panel.getBoundingClientRect();
        panel.classList.add("glow");
        panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
        panel.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      // Cartas de jogo e anúncios holográficos inclinam em 3D seguindo o mouse
      const card = t.closest?.<HTMLElement>(".uni, .card.holo");
      if (tilted && tilted !== card) reset(tilted);
      tilted = card;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const max = card.classList.contains("uni") ? 14 : 7;
      card.classList.add("tilting");
      card.style.setProperty("--rx", `${(0.5 - y) * max}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * max}deg`);
      card.style.setProperty("--px", `${x * 100}%`);
      card.style.setProperty("--py", `${y * 100}%`);
    };
    const leave = () => {
      if (tilted) reset(tilted);
      tilted = null;
    };
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return null;
}
