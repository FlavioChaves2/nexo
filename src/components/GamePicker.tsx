"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type PickGame = { slug: string; name: string; c1: string; count?: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Escolha de jogo com busca (são centenas). Envia o slug num campo escondido `name`.
 * `allowAll` adiciona a opção "Todos os jogos" (valor vazio), usada no filtro da busca.
 */
export function GamePicker({ games, name, value, onChange, allowAll = false, id, autoSubmit = false }: {
  games: PickGame[]; name: string; value: string; onChange?: (slug: string) => void; allowAll?: boolean; id?: string; autoSubmit?: boolean;
}) {
  const [slug, setSlug] = useState(value);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const listId = useId();
  const current = games.find((g) => g.slug === slug);

  useEffect(() => setSlug(value), [value]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const list = useMemo(() => {
    const n = norm(q.trim());
    const found = n ? games.filter((g) => norm(g.name).includes(n)) : games;
    // Começa com o que foi digitado primeiro; depois quem tem mais anúncios.
    return [...found].sort((a, b) => (n ? Number(norm(b.name).startsWith(n)) - Number(norm(a.name).startsWith(n)) : 0) || (b.count ?? 0) - (a.count ?? 0)).slice(0, 60);
  }, [q, games]);
  const options: (PickGame | null)[] = allowAll && !q ? [null, ...list] : list;

  function pick(g: PickGame | null) {
    const s = g?.slug ?? "";
    setSlug(s);
    setQ("");
    setOpen(false);
    onChange?.(s);
    if (autoSubmit && hidden.current) {
      hidden.current.value = s;
      hidden.current.form?.requestSubmit();
    }
  }

  return (
    <div className={`gpick${open ? " open" : ""}`} ref={box}>
      <input type="hidden" name={name} value={slug} ref={hidden} />
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={current ? current.name : allowAll ? "Todos os jogos" : "Digite o nome do jogo"}
        value={open ? q : current?.name ?? (allowAll ? "" : "")}
        onFocus={() => { setOpen(true); setQ(""); setHi(0); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, options.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && open) { e.preventDefault(); if (options[hi] !== undefined) pick(options[hi]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul className="gpick-list" id={listId} role="listbox">
          {options.map((g, i) => (
            <li
              key={g?.slug ?? "*"}
              role="option"
              aria-selected={(g?.slug ?? "") === slug}
              className={i === hi ? "hi" : undefined}
              onMouseDown={(e) => { e.preventDefault(); pick(g); }}
              onMouseEnter={() => setHi(i)}
            >
              <span className="gpick-dot" style={{ background: g?.c1 ?? "var(--muted)" }} />
              <span className="gpick-name">{g ? g.name : "Todos os jogos"}</span>
              {g?.count ? <small className="muted">{g.count}</small> : null}
            </li>
          ))}
          {!options.length && <li className="gpick-empty">Nenhum jogo com esse nome. Escolha “Outros jogos” e diga qual é no título.</li>}
        </ul>
      )}
    </div>
  );
}
