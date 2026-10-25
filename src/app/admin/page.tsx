import Link from "next/link";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";

const KIND: Record<string, string> = {
  DISPUTA_LIBERADA: "Disputa liberada ao vendedor",
  DISPUTA_REEMBOLSADA: "Disputa reembolsada",
  SAQUE_PAGO: "Saque pago",
  SAQUE_RECUSADO: "Saque recusado",
  ANUNCIO_REMOVIDO: "Anúncio removido",
  ANUNCIO_RESTAURADO: "Anúncio restaurado",
  USUARIO_SUSPENSO: "Usuário suspenso",
  USUARIO_REATIVADO: "Usuário reativado",
  VERIFICACAO_APROVADA: "Vendedor verificado",
  VERIFICACAO_RECUSADA: "Verificação recusada",
  DENUNCIA_PROCEDENTE: "Denúncia procedente",
  DENUNCIA_DESCARTADA: "Denúncias descartadas",
  CUPOM_CRIADO: "Cupom criado",
  CUPOM_ATIVADO: "Cupom ativado",
  CUPOM_DESATIVADO: "Cupom desativado",
};

export default async function AdminHome() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [disputes, pendingW, completed, held, actions] = await Promise.all([
    db.order.count({ where: { status: "DISPUTA" } }),
    db.withdrawal.aggregate({ where: { status: "PENDENTE" }, _sum: { amountCents: true }, _count: true }),
    db.order.aggregate({ where: { status: "CONCLUIDO", completedAt: { gte: since } }, _sum: { totalCents: true, feeCents: true }, _count: true }),
    db.order.aggregate({ where: { status: { in: ["PAGO", "ENTREGUE", "DISPUTA"] } }, _sum: { totalCents: true } }),
    db.adminAction.findMany({ include: { admin: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div className="stack">
      <div className="stat-tiles">
        <Link className="panel" href="/admin/disputas">
          <span className="eyebrow dim">Disputas abertas</span>
          <b className={disputes ? "lime" : undefined}>{disputes}</b>
          <span className="muted small">Aguardando decisão</span>
        </Link>
        <Link className="panel" href="/admin/saques">
          <span className="eyebrow dim">Saques pendentes</span>
          <b className={pendingW._count ? "lime" : undefined}>{money(pendingW._sum.amountCents ?? 0)}</b>
          <span className="muted small">{pendingW._count} pedido(s) de saque</span>
        </Link>
        <div className="panel">
          <span className="eyebrow dim">Retido em pedidos</span>
          <b>{money(held._sum.totalCents ?? 0)}</b>
          <span className="muted small">Pagos e ainda não liberados</span>
        </div>
        <div className="panel">
          <span className="eyebrow dim">Vendas · 30 dias</span>
          <b>{money(completed._sum.totalCents ?? 0)}</b>
          <span className="muted small">{completed._count} pedidos · taxa {money(completed._sum.feeCents ?? 0)}</span>
        </div>
      </div>

      <div className="panel">
        <div className="box" style={{ paddingBottom: 0 }}><h3>Últimas ações da equipe</h3></div>
        {actions.length ? (
          <div className="list">
            {actions.map((a) => (
              <div key={a.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <b>{KIND[a.kind] ?? a.kind} · {a.label}</b>
                  <span className="muted small">{a.note || "Sem observação"}</span>
                </div>
                <span className="muted small" style={{ textAlign: "right" }}>{a.admin.username}<br />{dateTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small box">Nenhuma ação registrada ainda. Tudo que a equipe decidir aparece aqui.</p>
        )}
      </div>
    </div>
  );
}
