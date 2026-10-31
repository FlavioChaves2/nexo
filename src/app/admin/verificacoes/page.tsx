import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { platformName } from "@/lib/external-profiles";
import { DecideVerification } from "@/components/ExternalForms";

export const metadata = { title: "Perfis externos" };
export const dynamic = "force-dynamic";

export default async function VerificacoesPage() {
  const [pending, approved] = await Promise.all([
    db.externalProfile.findMany({ where: { status: "PENDENTE" }, orderBy: { createdAt: "asc" }, take: 100, include: { user: { select: { username: true } } } }),
    db.externalProfile.findMany({ where: { status: "APROVADO" }, orderBy: { decidedAt: "desc" }, take: 100, include: { user: { select: { username: true } }, reviewer: { select: { username: true } } } }),
  ]);
  return (
    <div className="stack">
      <div className="note"><span>Abra o link, confira se o código aparece na bio/descrição <b>do perfil</b> (print não vale) e aprove. Aprovar diz só que a pessoa controla o perfil; não verifica vendas nem conduta fora da Nexo.</span></div>
      <section className="stack">
        <h2>Aguardando conferência ({pending.length})</h2>
        {pending.length ? (
          <div className="panel list">
            {pending.map((p) => (
              <div key={p.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <b>{platformName(p.platform)} · {p.handle} · <Link className="lime" href={`/loja/${p.user.username}`}>@{p.user.username}</Link></b>
                  <span className="muted small">Código esperado: <b className="mono">{p.challenge}</b> · pedido em {dateTime(p.createdAt)}</span>
                  <a className="small lime" href={p.url} target="_blank" rel="noopener noreferrer nofollow">{p.url}</a>
                </div>
                <DecideVerification id={p.id} approved={false} />
              </div>
            ))}
          </div>
        ) : <p className="muted">Nada para conferir.</p>}
      </section>
      <section className="stack">
        <h2>Verificados ({approved.length})</h2>
        {approved.length ? (
          <div className="panel list">
            {approved.map((p) => (
              <div key={p.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <b>{platformName(p.platform)} · {p.handle} · @{p.user.username}</b>
                  <span className="muted small">Aprovado em {p.decidedAt ? dateTime(p.decidedAt) : "—"} por @{p.reviewer?.username ?? "—"} · {p.note}</span>
                  <a className="small lime" href={p.url} target="_blank" rel="noopener noreferrer nofollow">{p.url}</a>
                </div>
                <DecideVerification id={p.id} approved />
              </div>
            ))}
          </div>
        ) : <p className="muted">Nenhum perfil verificado.</p>}
      </section>
    </div>
  );
}
