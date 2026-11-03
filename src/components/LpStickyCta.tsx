"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Botão fixo no rodapé do celular na landing: some quando o formulário de cadastro está na tela. */
export function LpStickyCta({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const form = document.getElementById("cadastro");
    if (!form) return;
    let formVisible = true;
    const update = () => setShow(!formVisible && window.scrollY > 300);
    const io = new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); });
    io.observe(form);
    window.addEventListener("scroll", update, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", update); };
  }, []);
  return (
    <div className={`lp-sticky${show ? " on" : ""}`} aria-hidden={!show}>
      <a className="btn btn-primary btn-block" href="#cadastro" tabIndex={show ? 0 : -1}>{label} <Icon name="arrow" /></a>
    </div>
  );
}
