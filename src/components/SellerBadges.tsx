import type { CSSProperties } from "react";
import { sellerLevel, type SellerRep } from "@/lib/reputation";
import type { BadgeTitle } from "@/lib/titles";
import { Icon } from "./Icon";

/** Título dado pela equipe ou automático (ex.: Fundador), na cor escolhida no admin. */
export function TitleBadge({ t, mini = false }: { t: BadgeTitle; mini?: boolean }) {
  return (
    <span className={`title-badge${mini ? " mini" : ""}`} style={{ "--tc": t.color } as CSSProperties} title={t.description ? `${t.name}: ${t.description}` : t.name}>
      <span aria-hidden="true">{t.emoji}</span>
      {mini ? <span className="sr-only">{t.name}</span> : t.name}
    </span>
  );
}

/** Selo de verificado + nível do vendedor + títulos. No modo compacto (cards), os títulos viram só o emoji. */
export function SellerBadges({ rep, compact = false }: { rep: SellerRep; compact?: boolean }) {
  const level = sellerLevel(rep);
  return (
    <>
      {rep.verification === "APROVADO" && (
        <span className="verified" title="Vendedor verificado">
          <Icon name="verified" />
        </span>
      )}
      {(!compact || level.cls !== "novato") && <span className={`level ${level.cls}`}>{level.name}</span>}
      {rep.titles?.map(({ title }) => <TitleBadge key={title.name} t={title} mini={compact} />)}
    </>
  );
}
