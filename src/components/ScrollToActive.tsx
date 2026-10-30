"use client";

import { useEffect } from "react";

/** Celular: o menu da conta vira uma faixa que rola para o lado; mostra a aba atual sem a pessoa procurar. */
export function ScrollToActive({ selector }: { selector: string }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(selector);
    const bar = el?.parentElement;
    if (el && bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2;
  });
  return null;
}
