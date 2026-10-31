import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { sellerDashboard } from "@/lib/seller-stats";
import { inOrbit } from "@/lib/orbit-plans";
import { DayChart } from "@/components/DayChart";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Painel de vendas", robots: { index: false } };
export const dynamic = "force-dynamic";

const PERIODS: [string, string, number][] = [["7d", "7 dias", 7], ["30d", "30 dias", 30], ["90d", "90 dias", 90]];
const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const me = await requireUser("/conta/painel");
  const [pk, plabel, days] = PERIODS.find(([k]) => k === sp.periodo) ?? PERIODS[1];
  const d = await sellerDashboard(me.id, days);
  const t = d.totals;

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/conta">Conta</Link><span>/</span><span>Painel de vendas</span></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap">
          <span className="eyebrow">Sua loja em números</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Painel de vendas</h1>
        </div>
        <nav className="pills" aria-label="Período">
          {PERIODS.map(([k, l]) => <Link key={k} className={`pill${k === pk ? " on" : ""}`} href={`/conta/painel?periodo=${k}`}>{l}</Link>)}
        </nav>
      </div>

      <div className="stack" style={{ paddingBlock: "16px 40px", gap: 18 }}>
        <div className="dash-kpis">
          <div className="panel"><span className="muted small">Recebido ({plabel})</span><b>{money(t.net)}</b><small className="muted">já sem a taxa</small></div>
          <div className="panel"><span className="muted small">Vendas concluídas</span><b>{t.sales}</b><small className="muted">ticket médio {money(t.avgTicket)}</small></div>
          <div className="panel"><span className="muted small">Visitas nos anúncios</span><b>{t.views.toLocaleString("pt-BR")}</b><small className="muted">{t.paid} {t.paid === 1 ? "pedido pago" : "pedidos pagos"}</small></div>
          <div className="panel"><span className="muted small">Conversão</span><b>{t.views ? pct(t.conversion) : "—"}</b><small className="muted">pedidos pagos ÷ visitas</small></div>
        </div>
        {t.open > 0 && (
          <Link className="note" href="/conta?aba=vendas"><Icon name="clock" /><span><b>{t.open} {t.open === 1 ? "pedido em andamento" : "pedidos em andamento"}.</b> Entregue rápido para receber antes.</span></Link>
        )}

        <div className="dash-charts">
          <div className="panel box">
            <div className="row"><h3>Recebido por dia</h3><span className="muted small">{money(t.net)}</span></div>
            <DayChart kind="bar" money label="Recebido por dia" points={d.points.map((p) => ({ day: p.day, value: p.net, note: `${p.sales} ${p.sales === 1 ? "venda" : "vendas"}` }))} />
          </div>
          <div className="panel box">
            <div className="row"><h3>Visitas por dia</h3><span className="muted small">{t.views.toLocaleString("pt-BR")}</span></div>
            <DayChart kind="area" label="Visitas por dia" points={d.points.map((p) => ({ day: p.day, value: p.views }))} />
          </div>
        </div>

        <div className="panel box">
          <div className="row"><h3><Icon name="orbit" /> Órbita</h3><Link className="linkish small" href="/conta?aba=anuncios">Colocar um anúncio em órbita <Icon name="arrow" /></Link></div>
          {d.orbit.used ? (
            <div className="dash-orbit">
              <div><span className="muted small">Gasto no período</span><b>{money(d.orbit.spent)}</b></div>
              <div><span className="muted small">Visitas por dia em órbita</span><b className="lime">{d.orbit.avgIn.toFixed(1).replace(".", ",")}</b></div>
              <div><span className="muted small">Visitas por dia fora da órbita</span><b>{d.orbit.avgOut.toFixed(1).replace(".", ",")}</b></div>
              <div><span className="muted small">Diferença</span><b>{d.orbit.avgOut ? `${d.orbit.avgIn >= d.orbit.avgOut ? "+" : ""}${pct(((d.orbit.avgIn - d.orbit.avgOut) / d.orbit.avgOut) * 100)}` : "—"}</b></div>
            </div>
          ) : (
            <p className="muted small">Você ainda não usou a Órbita. Quando usar, aqui aparece quantas visitas a mais seus anúncios tiveram nos dias em órbita.</p>
          )}
        </div>

        <div className="panel">
          <div className="box" style={{ paddingBottom: 0 }}><h3>Seus anúncios ({plabel})</h3></div>
          {d.listings.length ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead><tr><th>Anúncio</th><th>Visitas</th><th>Vendas</th><th>Recebido</th><th>Conversão</th></tr></thead>
                <tbody>
                  {d.listings.map((l) => (
                    <tr key={l.id}>
                      <td><Link href={`/anuncio/${l.id}`}>{l.title}</Link>{inOrbit(l) && <span className="chip auto" style={{ marginLeft: 6 }}>Em órbita</span>}{l.status !== "ATIVO" && <span className="chip" style={{ marginLeft: 6 }}>Pausado</span>}</td>
                      <td>{l.views.toLocaleString("pt-BR")}</td>
                      <td>{l.sales}</td>
                      <td>{money(l.net)}</td>
                      <td>{l.views ? pct((l.sales / l.views) * 100) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small box">Você ainda não tem anúncios. <Link className="lime" href="/vender">Criar o primeiro</Link></p>
          )}
        </div>
        <p className="muted small">Visitas contam quem abriu a página do anúncio (as suas não contam). Os dias seguem o horário de Brasília.</p>
      </div>
    </div>
  );
}
