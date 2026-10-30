import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { SUPPORT_TOPICS } from "@/lib/support";

export const metadata = { title: "Suporte" };

const VIEWS = {
  aguardando: { label: "Esperando resposta", where: { status: "ABERTO", waiting: true } },
  respondidas: { label: "Respondidas", where: { status: "ABERTO", waiting: false } },
  encerradas: { label: "Encerradas", where: { status: "FECHADO" } },
} as const;

export default async function AdminSuportePage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const sp = await searchParams;
  const ver = (sp.ver && sp.ver in VIEWS ? sp.ver : "aguardando") as keyof typeof VIEWS;
  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where: VIEWS[ver].where,
      include: { user: { select: { username: true } }, messages: { where: { senderId: { not: null } }, orderBy: { createdAt: "desc" }, take: 1 } },
      // Esperando: a mais antiga primeiro (quem espera há mais tempo). Nas outras: a mais recente.
      orderBy: { lastAt: ver === "aguardando" ? "asc" : "desc" },
      take: 100,
    }),
    Promise.all(Object.values(VIEWS).map((v) => db.supportTicket.count({ where: v.where }))),
  ]);

  return (
    <div className="stack">
      <div className="pills">
        {Object.entries(VIEWS).map(([k, v], i) => (
          <Link key={k} className={`pill${k === ver ? " on" : ""}`} href={`/admin/suporte?ver=${k}`}>{v.label} <small className="muted">{counts[i]}</small></Link>
        ))}
      </div>
      {tickets.length ? (
        <div className="panel list">
          {tickets.map((t) => (
            <Link key={t.id} className="list-row" href={`/admin/suporte/${t.id}`} style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <b>{t.user.username} · {SUPPORT_TOPICS[t.topic] ?? t.topic}{t.orderCode ? ` · #${t.orderCode}` : ""}</b>
                <span className="muted small">{t.messages[0] ? `${t.messages[0].staff ? "Equipe: " : ""}${t.messages[0].body.slice(0, 110)}` : ""}</span>
              </div>
              <span className="muted small" style={{ textAlign: "right" }}>
                {dateTime(t.lastAt)}
                <br />
                {t.status === "ABERTO" && t.waiting ? <span className="chip bad">Responder</span> : t.status === "ABERTO" ? <span className="chip auto">Aguardando cliente</span> : <span className="chip">Encerrada</span>}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="panel box muted">{ver === "aguardando" ? "Ninguém esperando resposta. 🎉" : "Nada por aqui."}</p>
      )}
    </div>
  );
}
