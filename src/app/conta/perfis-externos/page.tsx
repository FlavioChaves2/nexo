import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { PLATFORMS, platformName } from "@/lib/external-profiles";
import { RequestVerification, WithdrawVerification } from "@/components/ExternalForms";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Perfis em outras plataformas" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { PENDENTE: "Aguardando conferência", APROVADO: "Verificado", RECUSADO: "Recusado", REVOGADO: "Removido" };

export default async function PerfisExternosPage() {
  const me = await requireUser("/conta/perfis-externos");
  const items = await db.externalProfile.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <div className="grid-gap" style={{ margin: "22px 0 16px" }}>
        <span className="eyebrow">Minha conta</span>
        <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Perfis em outras plataformas</h1>
        <p className="muted">Já vende em outro lugar? Mostre na sua loja que aquele perfil é seu. A equipe confere que você controla o perfil; suas vendas e avaliações de fora <b>não</b> são somadas às da Nexo.</p>
      </div>

      <ol className="app-steps" style={{ marginBottom: 18 }}>
        <li><span>1</span><div>Informe a plataforma e o link do seu perfil. Você recebe um código, como <b className="mono">NEXO-AB12CD</b>.</div></li>
        <li><span>2</span><div>Coloque o código na <b>bio ou descrição</b> desse perfil (print não vale como prova).</div></li>
        <li><span>3</span><div>A equipe abre o perfil, confere o código e aprova. Depois você pode tirar o código.</div></li>
      </ol>

      <RequestVerification platforms={Object.entries(PLATFORMS).map(([k, v]) => [k, v.name])} />

      {items.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Seus pedidos</h2></div>
          <div className="panel list">
            {items.map((p) => (
              <div key={p.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <b>{platformName(p.platform)} · {p.handle}</b>
                  <span className="muted small">{STATUS[p.status] ?? p.status} · {p.url}{p.decidedAt ? ` · ${dateTime(p.decidedAt)}` : ""}{p.note ? ` · ${p.note}` : ""}</span>
                  {p.status === "PENDENTE" && <span className="small"><Icon name="edit" /> Código para colocar no perfil: <b className="mono lime">{p.challenge}</b></span>}
                </div>
                {(p.status === "PENDENTE" || p.status === "APROVADO") && <WithdrawVerification id={p.id} label={p.status === "PENDENTE" ? "Cancelar" : "Remover da loja"} />}
              </div>
            ))}
          </div>
        </section>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>O selo na loja diz só que a equipe confirmou que você controla o perfil, na data indicada. Não é parceria com a outra plataforma nem garantia de conduta. <Link className="lime" href={`/loja/${me.username}`}>Ver minha loja</Link></p>
    </div>
  );
}
