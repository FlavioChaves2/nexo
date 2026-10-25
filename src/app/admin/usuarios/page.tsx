import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { riskFlags } from "@/lib/trust";
import { SuspendControls, VerificationReview } from "@/components/admin/TrustAdminForms";

export const metadata = { title: "Usuários" };

const FILTROS = [
  ["verificacao", "Verificação pendente"],
  ["alertas", "Com alertas"],
  ["suspensos", "Suspensos"],
  ["todos", "Todos"],
] as const;

const cpfMask = (c: string | null) => (c ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : "—");

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ ver?: string; q?: string }> }) {
  const sp = await searchParams;
  const ver = FILTROS.some(([k]) => k === sp.ver) ? sp.ver! : "verificacao";
  const q = (sp.q ?? "").trim().slice(0, 80);

  const where: Prisma.UserWhereInput = {
    ...(ver === "verificacao" && { verification: "PENDENTE" }),
    ...(ver === "suspensos" && { suspendedAt: { not: null } }),
    ...(q && { OR: [{ username: { contains: q } }, { email: { contains: q } }, { fullName: { contains: q } }] }),
  };
  const users = await db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: ver === "alertas" ? 300 : 100 });
  const withRisk = await Promise.all(users.map(async (u) => ({ u, risk: await riskFlags(u.id) })));
  const rows = ver === "alertas" ? withRisk.filter((r) => r.risk.flags.some((f) => f !== "Conta nova")) : withRisk;

  return (
    <div className="stack">
      <div className="row">
        <div className="pills">
          {FILTROS.map(([k, n]) => (
            <Link key={k} className={`pill${ver === k ? " on" : ""}`} href={`/admin/usuarios?ver=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{n}</Link>
          ))}
        </div>
        <form action="/admin/usuarios" className="search" style={{ minWidth: 260 }}>
          <input type="hidden" name="ver" value={ver} />
          <input name="q" type="search" defaultValue={q} placeholder="Usuário, e-mail ou nome" aria-label="Buscar usuários" />
        </form>
      </div>
      {rows.length ? (
        <div className="panel list">
          {rows.map(({ u, risk }) => (
            <div key={u.id} className="list-row" style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}>
              <div className="stack" style={{ gap: 6 }}>
                <div>
                  <b>
                    <Link href={`/loja/${u.username}`}>{u.username}</Link>
                    {u.role === "ADMIN" && <span className="chip auto" style={{ marginLeft: 8 }}>Admin</span>}
                    {u.suspendedAt && <span className="chip bad" style={{ marginLeft: 8 }}>Suspenso</span>}
                    {u.verification === "APROVADO" && <span className="chip ok" style={{ marginLeft: 8 }}>Verificado</span>}
                  </b>
                  <span className="muted small">
                    {u.email} · desde {dateTime(u.createdAt)} · saldo {money(u.balanceCents)} · {risk.sales} vendas · {risk.disputesAgainst} disputas contra · {risk.disputesOpened} abertas por ele
                  </span>
                </div>
                {risk.flags.length > 0 && <div className="row" style={{ justifyContent: "flex-start", gap: 6 }}>{risk.flags.map((f) => <span key={f} className="chip bad">{f}</span>)}</div>}
                {u.suspendedAt && <span className="error">Suspenso: {u.suspendReason}</span>}
                {u.verification === "PENDENTE" && (
                  <div className="panel box" style={{ gap: 8, background: "var(--surface-2)" }}>
                    <span className="small"><b>{u.fullName}</b> · CPF <span className="mono">{cpfMask(u.cpf)}</span> · nascimento {u.birthDate.split("-").reverse().join("/")}</span>
                    <VerificationReview userId={u.id} />
                  </div>
                )}
              </div>
              {u.role !== "ADMIN" && <SuspendControls userId={u.id} suspended={!!u.suspendedAt} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel empty"><p className="muted">Ninguém neste filtro.</p></div>
      )}
    </div>
  );
}
