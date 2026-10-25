"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Barra fina no topo enquanto a próxima página carrega. Começa no clique em links internos
// (e em formulários GET, como a busca) e termina quando a URL nova chega.
export function NavProgress() {
  const path = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const safety = useRef(0);

  useEffect(() => {
    const start = () => {
      setState("loading");
      clearTimeout(safety.current);
      safety.current = window.setTimeout(() => setState("done"), 12000);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!e.defaultPrevented && (f.getAttribute("method") ?? "get").toLowerCase() === "get" && typeof f.getAttribute("action") === "string") start();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  useEffect(() => {
    clearTimeout(safety.current);
    setState((s) => (s === "loading" ? "done" : s));
  }, [path, search]);

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 400);
    return () => clearTimeout(t);
  }, [state]);

  return <div className={`nav-progress ${state}`} aria-hidden="true"><span /></div>;
}
