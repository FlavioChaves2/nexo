import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { founderTitle } from "@/lib/titles";
import { TitleBadge } from "@/components/SellerBadges";
import { DeleteTitle, RevokeTitle, TitleCreate, TitleGrant } from "@/components/admin/TitleForms";

export const metadata = { title: "Títulos" };

export default async function TitulosPage() {
  await founderTitle(); // garante que o Fundador aparece na lista desde o começo
  const titles = await db.title.findMany({
    orderBy: [{ auto: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
    include: { holders: { include: { user: { select: { id: true, username: true } } }, orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="stack">
      <div className="two-col" style={{ paddingBlock: 0 }}>
        <TitleCreate />
        <TitleGrant titles={titles.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, full: t.maxHolders !== null && t.holders.length >= t.maxHolders }))} />
      </div>
      <div className="panel list">
        {titles.map((t) => (
          <div key={t.id} className="list-row" style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}>
            <div className="grid-gap">
              <div className="row" style={{ justifyContent: "flex-start", gap: 10 }}>
                <TitleBadge t={t} />
                <span className="muted small">
                  {t.auto ? "Automático: os 20 primeiros vendedores reais ganham ao concluir a 1ª venda" : t.description || "Dado pela equipe"}
                  {" · "}
                  {t.holders.length}{t.maxHolders !== null ? `/${t.maxHolders}` : ""} {t.holders.length === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              {t.holders.length ? (
                <div className="title-holders">
                  {t.holders.map((h) => (
                    <span key={h.userId} className="row" style={{ gap: 4 }}>
                      <RevokeTitle titleId={t.id} userId={h.userId} username={h.user.username} />
                      <span className="muted small" title={`Desde ${dateTime(h.createdAt)}`}><Link href={`/loja/${h.user.username}`}>↗</Link></span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="muted small">Ninguém tem este título ainda.</span>
              )}
            </div>
            {!t.auto && <DeleteTitle titleId={t.id} name={t.name} />}
          </div>
        ))}
      </div>
    </div>
  );
}
