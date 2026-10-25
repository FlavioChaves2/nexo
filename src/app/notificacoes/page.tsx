import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const user = await requireUser("/notificacoes");
  const list = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 60 });
  // Abrir a página marca tudo como lido; os que eram novos continuam destacados nesta visita.
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });

  return (
    <div className="wrap">
      <div className="order-head"><div className="grid-gap"><span className="eyebrow">Minha conta</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Avisos</h1></div></div>
      <section className="section">
        {list.length ? (
          <div className="panel">
            {list.map((n) => (
              <Link key={n.id} href={n.href} className={`notif${n.readAt ? "" : " unread"}`}>
                <Icon name="bell" />
                <div style={{ minWidth: 0 }}><b>{n.title}</b>{n.body && <p className="muted small">{n.body}</p>}</div>
                <span className="muted small">{dateTime(n.createdAt)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel empty"><p className="muted">Nenhum aviso ainda. Vendas, entregas e mensagens aparecem aqui.</p></div>
        )}
      </section>
    </div>
  );
}
