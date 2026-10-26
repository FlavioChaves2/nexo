"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { NexinhoHandle, NexinhoOptions } from "@/lib/nexinho-scene";

// Nexinho, o mascote 3D. A cena (e o Three.js) só é baixada no navegador, depois da página,
// e a animação pausa fora da tela, com a aba escondida ou com "reduzir movimento" ligado.
export type NexinhoRef = { celebrate(): void };

export const Nexinho3D = forwardRef<NexinhoRef, NexinhoOptions & { className?: string; label?: string; celebrateOnLoad?: boolean }>(function Nexinho3D(
  { className = "nexinho", label = "Nexinho, o mascote da Nexo", celebrateOnLoad = false, ...opts },
  ref,
) {
  const box = useRef<HTMLDivElement>(null);
  const handle = useRef<NexinhoHandle | null>(null);
  const key = JSON.stringify(opts);

  useImperativeHandle(ref, () => ({ celebrate: () => handle.current?.celebrate() }), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    // Espera o navegador ficar livre: o 3D não disputa banda nem CPU com o conteúdo principal.
    const idle = () =>
      new Promise<void>((r) => {
        const go = () => ("requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 200));
        if (document.readyState === "complete") go();
        else addEventListener("load", go, { once: true });
      });
    (celebrateOnLoad ? Promise.resolve() : idle())
      .then(() => import("@/lib/nexinho-scene"))
      .then(({ createNexinho }) => {
        if (cancelled) return;
        handle.current = createNexinho(el, JSON.parse(key) as NexinhoOptions);
        el.classList.add("ready");
        if (celebrateOnLoad) setTimeout(() => handle.current?.celebrate(), 350);
      })
      .catch(() => {
        /* sem WebGL: o espaço fica só com o brilho de fundo */
      });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
      el.classList.remove("ready");
    };
  }, [key, celebrateOnLoad]);

  return <div ref={box} className={className} aria-label={label} role="img" />;
});
