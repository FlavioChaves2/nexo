import Link from "next/link";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { WithdrawalActions } from "@/components/admin/AdminForms";

export const metadata = { title: "Saques" };

export default async function SaquesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const history = (await searchParams).ver === "historico";
  const list = await db.withdrawal.findMany({
    where: history ? { status: { not: "PENDENTE" } } : { status: "PENDENTE" },
    include: { user: { select: { username: true, balanceCents: true, createdAt: true } } },
    orderBy: history ? { processedAt: "desc" } : { createdAt: "asc" },
    take: 100,
  });

  return (
    <div className="stack">
      <div className="pills">
        <Link className={`pill${history ? "" : " on"}`} href="/admin/saques">Pendentes</Link>
        <Link className={`pill${history ? " on" : ""}`} href="/admin/saques?ver=historico">Histórico</Link>
      </div>
      {!history && list.length > 0 && (
        <p className="hint">O valor já saiu do saldo do vendedor quando ele pediu o saque. Recusar devolve o valor ao saldo.</p>
      )}
      {list.length ? (
        <div className="panel list">
          {list.map((w) => (
            <div key={w.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <b>{money(w.amountCents)} para <Link className="lime" href={`/loja/${w.user.username}`}>{w.user.username}</Link></b>
                <span className="muted small">
                  Chave Pix <span className="mono">{w.pixKey}</span> · pedido em {dateTime(w.createdAt)}
                  {history && w.processedAt ? ` · processado em ${dateTime(w.processedAt)}` : ""}
                  {w.note ? ` · ${w.note}` : ""}
                </span>
              </div>
              {history ? (
                <span className={`chip ${w.status === "PAGO" ? "ok" : "bad"}`}>{w.status === "PAGO" ? "Pago" : "Recusado"}</span>
              ) : (
                <WithdrawalActions id={w.id} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel empty"><p className="muted">{history ? "Nenhum saque processado ainda." : "Nenhum saque esperando aprovação."}</p></div>
      )}
    </div>
  );
}
