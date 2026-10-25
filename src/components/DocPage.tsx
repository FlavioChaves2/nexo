import type { ReactNode } from "react";

/** Página de texto (termos, privacidade, ajuda). */
export function DocPage({ eyebrow, title, updated, draft, children }: { eyebrow: string; title: string; updated?: string; draft?: boolean; children: ReactNode }) {
  return (
    <div className="wrap">
      <article className="doc">
        <div className="grid-gap">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {updated && <span className="muted small">Atualizado em {updated}</span>}
        </div>
        {draft && <p className="note warn">Rascunho para revisão jurídica. Antes do lançamento, este texto precisa ser revisado por um advogado.</p>}
        {children}
      </article>
    </div>
  );
}
