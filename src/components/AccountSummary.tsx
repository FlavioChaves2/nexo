import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { dateTime, money, monthYear } from "@/lib/format";
import { sellerNet } from "@/lib/orders";
import { nextLevel, sellerLevel, type SellerRep } from "@/lib/reputation";
import { emailEnabled } from "@/lib/email";
import { Avatar } from "./Avatar";
import { SellerBadges } from "./SellerBadges";
import { Icon } from "./Icon";

export const PERIODOS = [
  ["hoje", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["tudo", "Desde o início"],
] as const;

function since(p: string) {
  const d = new Date();
  if (p === "hoje") return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (p === "7d") return new Date(Date.now() - 7 * 86_400_000);
  if (p === "30d") return new Date(Date.now() - 30 * 86_400_000);
  return new Date(0);
}

/** Aba "Resumo" da conta: saldo, pendências, perfil, vendas do período, nível e avisos. */
export async function AccountSummary({ user, periodo }: { user: User & SellerRep; periodo: string }) {
  const from = since(periodo);
  const [pending, sold, bought, referral, listingsCount, todo, notes] = await Promise.all([
    db.order.aggregate({
      where: { sellerId: user.id, status: { in: ["PAGO", "ENTREGUE", "DISPUTA"] } },
      _sum: { totalCents: true, feeCents: true, discountCents: true, planCents: true, cardFeeCents: true },
    }),
    db.order.findMany({
      where: { sellerId: user.id, status: "CONCLUIDO", completedAt: { gte: from } },
      select: { totalCents: true, discountCents: true, feeCents: true, planCents: true, cardFeeCents: true },
    }),
    db.order.count({ where: { buyerId: user.id, status: "CONCLUIDO", completedAt: { gte: from } } }),
    db.referralEarning.aggregate({ where: { referrerId: user.id }, _sum: { amountCents: true } }),
    db.listing.count({ where: { sellerId: user.id, status: { not: "REMOVIDO" } } }),
    db.order.findMany({
      where: { OR: [{ sellerId: user.id, status: "PAGO" }, { buyerId: user.id, status: { in: ["ENTREGUE", "AGUARDANDO_PAGAMENTO"] } }] },
      include: { listing: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  // Mesma conta do sellerNet: plano VIP e taxa do cartão ficam com a Nexo, não com o vendedor.
  const s = pending._sum;
  const pendingCents = (s.totalCents ?? 0) + (s.discountCents ?? 0) - (s.feeCents ?? 0) - (s.planCents ?? 0) - (s.cardFeeCents ?? 0);
  const soldCents = sold.reduce((a, o) => a + sellerNet(o), 0);

  const steps = [
    { done: !!user.avatarId, label: "Coloque uma foto de perfil", href: "/conta/perfil" },
    { done: !!user.storeName, label: "Dê um nome para sua loja", href: "/conta/perfil" },
    { done: user.bio.trim().length >= 20, label: "Escreva uma descrição da loja", href: "/conta/perfil" },
    { done: !emailEnabled() || !!user.emailVerifiedAt, label: "Confirme seu e-mail", href: "/conta" },
    { done: user.verification === "APROVADO", label: "Verifique sua identidade (libera saques)", href: "/conta?aba=saldo" },
    { done: user.totpEnabled, label: "Ative o login em 2 etapas", href: "/conta/seguranca" },
    { done: listingsCount > 0, label: "Publique seu primeiro anúncio", href: "/vender" },
  ];
  const pct = Math.round((steps.filter((x) => x.done).length / steps.length) * 100);
  const nextStep = steps.find((x) => !x.done);

  const level = sellerLevel(user);
  const next = nextLevel(user);
  const levelPct = next ? Math.min(100, Math.round((user.completedSales / Math.max(1, user.completedSales + next.salesLeft)) * 100)) : 100;

  return (
    <div className="stack">
      <div className="panel box acct-hello">
        <Avatar user={user} size="xl" />
        <div className="grid-gap" style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "clamp(22px,3vw,30px)" }}>Olá, {user.storeName || user.username}!</h1>
          <div className="row" style={{ justifyContent: "flex-start", gap: 6, flexWrap: "wrap" }}><SellerBadges rep={user} /></div>
          <span className="muted small">Na Nexo desde {monthYear(user.createdAt)}</span>
        </div>
        <div className="acct-hello-cta">
          <Link className="btn btn-ghost btn-sm" href={`/loja/${user.username}`}>Ver minha loja</Link>
          <Link className="btn btn-primary btn-sm" href="/vender">+ Novo anúncio</Link>
        </div>
      </div>

      <div className="acct-tiles">
        <Link href="/conta?aba=saldo" className="panel acct-tile main">
          <span className="eyebrow dim">Disponível</span>
          <b className="lime">{money(user.balanceCents)}</b>
          <span className="btn btn-primary btn-sm">Sacar</span>
        </Link>
        <div className="panel acct-tile">
          <span className="eyebrow dim">A liberar</span>
          <b>{money(pendingCents)}</b>
          <span className="muted small">Vendas esperando o comprador confirmar</span>
        </div>
        <Link href="/conta/convites" className="panel acct-tile">
          <span className="eyebrow dim">Ganhos com convites</span>
          <b>{money(referral._sum.amountCents ?? 0)}</b>
          <span className="small lime">Convide e ganhe 3% →</span>
        </Link>
      </div>

      {todo.length > 0 && (
        <div className="panel box acct-todo">
          <h3><Icon name="alert" />Precisa de você</h3>
          {todo.map((o) => {
            const sell = o.sellerId === user.id;
            const what = sell ? "Entregar o pedido" : o.status === "ENTREGUE" ? "Conferir e confirmar o recebimento" : "Pagar o pedido";
            return (
              <Link key={o.id} href={`/pedido/${o.code}`} className="acct-todo-row">
                <span className={`chip ${sell ? "auto" : "ok"}`}>{sell ? "Venda" : "Compra"}</span>
                <span style={{ minWidth: 0 }}><b>{what}</b><span className="muted small"> · {o.listing.title}</span></span>
                <Icon name="arrow" />
              </Link>
            );
          })}
        </div>
      )}

      <div className="acct-grid">
        <div className="panel box">
          <div className="row"><h3>Complete seu perfil</h3><span className={pct === 100 ? "lime" : "warn-txt"}>{pct}% completo</span></div>
          <div className="acct-bar"><span style={{ width: `${pct}%` }} /></div>
          {nextStep ? (
            <Link href={nextStep.href} className="acct-next"><Icon name="user" /><span>Próximo passo: <b>{nextStep.label}</b>. Perfis completos vendem mais e passam mais confiança.</span></Link>
          ) : (
            <p className="note"><Icon name="check" /><span>Perfil completo. Mandou bem!</span></p>
          )}
          <ul className="acct-checks">
            {steps.map((x) => (
              <li key={x.label} className={x.done ? "done" : ""}><Icon name={x.done ? "check" : "clock"} />{x.done ? x.label : <Link href={x.href}>{x.label}</Link>}</li>
            ))}
          </ul>
        </div>

        <div className="stack">
          <div className="panel box">
            <h3>Resumo de vendas</h3>
            <div className="pills">
              {PERIODOS.map(([k, n]) => <Link key={k} className={`pill${periodo === k ? " on" : ""}`} href={`/conta?aba=resumo&periodo=${k}`} scroll={false}>{n}</Link>)}
            </div>
            <div className="acct-sales">
              <div><b className="lime">{money(soldCents)}</b><span>recebidos em {sold.length} {sold.length === 1 ? "venda" : "vendas"}</span></div>
              <div><b>{bought}</b><span>{bought === 1 ? "compra concluída" : "compras concluídas"}</span></div>
            </div>
          </div>
          <div className="panel box">
            <div className="row"><h3>Seu nível</h3><span className={`level ${level.cls}`}>{level.name}</span></div>
            {next ? (
              <>
                <div className="acct-bar"><span style={{ width: `${levelPct}%` }} /></div>
                <span className="muted small">Faltam <b>{next.salesLeft}</b> {next.salesLeft === 1 ? "venda" : "vendas"}{next.avg ? ` e nota ${next.avg.toString().replace(".", ",")} ou mais` : ""} para <b>{next.name}</b>.</span>
              </>
            ) : (
              <span className="muted small">Você está no nível máximo. Lenda da Nexo!</span>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ padding: "14px 18px 4px" }}><h3>Últimos avisos</h3><Link className="linkish small" href="/notificacoes">Ver todos</Link></div>
        {notes.length ? (
          notes.map((n) => (
            <Link key={n.id} href={n.href} className={`notif${n.readAt ? "" : " unread"}`}>
              <Icon name="bell" />
              <div style={{ minWidth: 0 }}><b>{n.title}</b>{n.body && <p className="muted small">{n.body}</p>}</div>
              <span className="muted small">{dateTime(n.createdAt)}</span>
            </Link>
          ))
        ) : (
          <p className="muted small" style={{ padding: "8px 18px 18px" }}>Nenhum aviso ainda. Vendas, entregas e mensagens aparecem aqui.</p>
        )}
      </div>
    </div>
  );
}
