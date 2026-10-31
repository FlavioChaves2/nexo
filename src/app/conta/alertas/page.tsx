import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { describeAlert, MAX_ALERTS } from "@/lib/alerts";
import { gameIcon } from "@/lib/game-art";
import { deleteAlertAction } from "@/app/actions/alerts";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Meus alertas", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const me = await requireUser("/conta/alertas");
  const alerts = await db.savedAlert.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } });
  const games = await db.game.findMany({ where: { slug: { in: alerts.map((a) => a.gameSlug).filter((s): s is string => !!s) } }, select: { slug: true, name: true } });
  const gameOf = (slug: string | null) => games.find((g) => g.slug === slug) ?? null;
  const busca = (a: (typeof alerts)[number]) => `/busca?${new URLSearchParams(Object.entries({ q: a.q, jogo: a.gameSlug ?? "", tipo: a.type ?? "", max: a.maxCents ? (a.maxCents / 100).toFixed(2) : "" }).filter(([, v]) => v)).toString()}`;

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/conta">Conta</Link><span>/</span><span>Meus alertas</span></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap">
          <span className="eyebrow"><Icon name="bell" /> Me avise quando aparecer</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Meus alertas</h1>
          <p className="muted">Quando alguém anunciar algo que combina com um alerta, você recebe um aviso no sino e no celular. Até {MAX_ALERTS} alertas.</p>
        </div>
      </div>
      <div className="sup-wrap">
        {alerts.length ? (
          <div className="panel list">
            {alerts.map((a) => (
              <div key={a.id} className="list-row alert-row">
                {a.gameSlug && gameIcon(a.gameSlug) ? <img className="uni-ic" src={gameIcon(a.gameSlug)!} alt="" /> : <span className="alert-ic"><Icon name="bell" /></span>}
                <div>
                  <b>{describeAlert({ ...a, game: gameOf(a.gameSlug) })}</b>
                  <span className="muted small">Criado em {dateTime(a.createdAt)} · {a.hits ? `${a.hits} ${a.hits === 1 ? "aviso enviado" : "avisos enviados"}, o último em ${dateTime(a.lastHitAt!)}` : "nenhum anúncio novo ainda"}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <Link className="btn btn-ghost btn-sm" href={busca(a)}>Ver busca</Link>
                  <form action={deleteAlertAction.bind(null, a.id)}><button className="btn btn-ghost btn-sm" type="submit">Apagar</button></form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel empty">
            <h3>Nenhum alerta ainda</h3>
            <p className="muted">Faça uma busca (por exemplo, “conta Valorant até R$ 200”) e toque em <b>Me avise quando aparecer</b>.</p>
            <Link className="btn btn-primary" href="/busca">Ir para a busca</Link>
          </div>
        )}
      </div>
    </div>
  );
}
