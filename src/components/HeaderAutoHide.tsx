"use client";

import { useEffect } from "react";

/** Celular: o topo (logo, busca e abas) some ao rolar para baixo e volta ao rolar para cima,
 *  para não ocupar um quarto da tela o tempo todo. O CSS só aplica em telas estreitas. */
export function HeaderAutoHide() {
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const html = document.documentElement;
        if (y < 160) html.classList.remove("hdr-hide");
        else if (y > last + 6) html.classList.add("hdr-hide");
        else if (y < last - 6) html.classList.remove("hdr-hide");
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("hdr-hide");
    };
  }, []);
  return null;
}
