import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/format";
import { sellerNet, settleExpired } from "@/lib/orders";
import { cardInclude } from "@/lib/queries";
import { inOrbit } from "@/lib/orbit-plans";
import { ORDER_STATUS, TYPE_LABEL, type OrderStatus } from "@/lib/constants";
import { Art } from "@/components/Art";
import { ListingCard } from "@/components/ListingCard";
import { WithdrawForm } from "@/components/WithdrawForm";
import { VerificationForm } from "@/components/TrustForms";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { ScrollToActive } from "@/components/ScrollToActive";
import { AccountSummary, PERIODOS } from "@/components/AccountSummary";
import { titlesSelect } from "@/lib/titles";
import { VerifyBanner } from "@/components/EmailForms";
import { emailEnabled } from "@/lib/email";
import { logout } from "@/app/actions/auth";
import { toggleListingStatus } from "@/app/actions/listings";

export const metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

// Menu lateral da conta: abas desta página e atalhos para as outras páginas da conta.
const MENU: { label: string; icon: string; aba?: string; href?: string; hot?: boolean }[] = [
  { aba: "resumo", label: "Resumo", icon: "spark" },
  { href: "/notificacoes", label: "Avisos", icon: "bell" },
  { aba: "compras", label: "Compras", icon: "bag" },
  { aba: "vendas", label: "Vendas", icon: "tag" },
  { href: "/conta/painel", label: "Painel de vendas", icon: "spark" },
  { aba: "anuncios", label: "Meus anúncios", icon: "diamond" },
  { aba: "favoritos", label: "Favoritos", icon: "heart" },
  { href: "/conta/alertas", label: "Meus alertas", icon: "bell" },
  { href: "/conta/propostas", label: "Propostas por link", icon: "send" },
  { href: "/conta/cupons", label: "Cupons da minha loja", icon: "tag" },
  { href: "/conta/perfis-externos", label: "Perfis em outras plataformas", icon: "verified" },
  { aba: "saldo", label: "Saldo e saques", icon: "swap" },
  { href: "/conta/convites", label: "Convide e ganhe 3%", icon: "spark", hot: true },
  { href: "/conta/taxas", label: "Taxas e prazos", icon: "copy" },
  { href: "/conta/perfil", label: "Perfil da loja", icon: "edit" },
  { href: "/conta/seguranca", label: "Segurança", icon: "shield" },
  { href: "/conta/excluir", label: "Excluir conta", icon: "alert" },
];
const ABA_NAMES: Record<string, string> = Object.fromEntries(MENU.filter((m) => m.aba).map((m) => [m.aba, m.label]));

const statusChip = (s: string) => (s === "CONCLUIDO" ? "ok" : s === "DISPUTA" || s === "CANCELADO" || s === "REEMBOLSADO" ? "bad" : "auto");

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ aba?: string; periodo?: string }> }) {
  const sp = await searchParams;
  const aba = sp.aba && ABA_NAMES[sp.aba] ? sp.aba : "resumo";
  const user = await requireUser(`/conta?aba=${aba}`);
  await settleExpired({ OR: [{ buyerId: user.id }, { sellerId: user.id }] });
  const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: titlesSelect });
  const periodo = PERIODOS.some(([k]) => k === sp.periodo) ? sp.periodo! : "30d";

  return (
    <div className="wrap acct">
      <aside className="acct-side">
        <div className="acct-who">
          <Avatar user={fresh} size="lg" />
          <div style={{ minWidth: 0 }}>
            <b>{fresh.storeName || fresh.username}</b>
            <span className="muted small">@{fresh.username}</span>
          </div>
        </div>
        <nav className="acct-nav" aria-label="Minha conta">
          {MENU.map((m) => (
            <Link key={m.label} href={m.aba ? `/conta?aba=${m.aba}` : m.href!} className={[m.aba === aba && "on", m.hot && "hot"].filter(Boolean).join(" ") || undefined}>
              <Icon name={m.icon} />{m.label}
            </Link>
          ))}
        </nav>
        <ScrollToActive selector=".acct-nav a.on" />
        <Link className="acct-help" href="/suporte"><Icon name="headset" />Falar com o suporte</Link>
        <form action={logout}><button className="acct-out" type="submit">Sair da conta</button></form>
      </aside>

      <section className="acct-main">
        <nav className="crumbs"><Link href="/conta">Conta</Link><span>/</span><span>{ABA_NAMES[aba]}</span></nav>
        {emailEnabled() && !fresh.emailVerifiedAt && <VerifyBanner email={fresh.email} />}
        {aba === "resumo" ? <AccountSummary user={fresh} periodo={periodo} /> : <Aba aba={aba} userId={user.id} />}
      </section>
    </div>
  );
}

async function Aba({ aba, userId }: { aba: string; userId: string }) {
  if (aba === "compras" || aba === "vendas") {
    const orders = await db.order.findMany({
      where: aba === "compras" ? { buyerId: userId } : { sellerId: userId },
      include: { listing: { include: { game: true } }, buyer: { select: { username: true } }, seller: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    if (!orders.length)
      return <Empty text={aba === "compras" ? "Você ainda não comprou nada." : "Você ainda não vendeu nada."} href={aba === "compras" ? "/busca" : "/vender"} cta={aba === "compras" ? "Explorar ofertas" : "Criar anúncio"} />;
    return (
      <div className="panel list">
        {orders.map((o) => (
          <Link key={o.id} className="list-row" href={`/pedido/${o.code}`}>
            <div className="thumb"><Art game={o.listing.game} glyph={o.listing.glyph} showName={false} /></div>
            <div>
              <b>{o.listing.title}</b>
              <span className="muted small">
                <span className="mono">#{o.code}</span> · {aba === "compras" ? `de ${o.seller.username}` : `para ${o.buyer.username}`} · {dateTime(o.createdAt)}
              </span>
            </div>
            <div className="grid-gap" style={{ justifyItems: "end", gap: 4 }}>
              <span className="price" style={{ fontSize: 17 }}>{money(aba === "vendas" ? sellerNet(o) : o.totalCents)}</span>
              <span className={`chip ${statusChip(o.status)}`}>{ORDER_STATUS[o.status as OrderStatus]}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (aba === "anuncios") {
    const listings = await db.listing.findMany({ where: { sellerId: userId }, include: { game: true }, orderBy: { createdAt: "desc" } });
    if (!listings.length) return <Empty text="Você ainda não tem anúncios." href="/vender" cta="Criar anúncio" />;
    return (
      <div className="panel list">
        {listings.map((l) => (
          <div key={l.id} className="list-row">
            <div className="thumb"><Art game={l.game} glyph={l.glyph} showName={false} /></div>
            <div>
              <Link href={`/anuncio/${l.id}`}><b>{l.title}</b></Link>
              <span className="muted small">{TYPE_LABEL[l.type]} · {money(l.priceCents)} · estoque {l.stock} · {l.soldCount} vendidos</span>
              {l.status === "ATIVO" && l.stock > 0 && !l.reservedForId && (
                <Link className={`orbit-link${inOrbit(l) ? " on" : ""}`} href={`/anuncio/${l.id}/orbita`}>
                  <Icon name="orbit" />{inOrbit(l) ? `Em órbita até ${dateTime(l.orbitUntil!)}` : "Colocar em órbita"}
                </Link>
              )}
              {l.status === "REMOVIDO" && <span className="error" style={{ display: "block" }}>Removido pela moderação: {l.moderationNote}</span>}
            </div>
            {l.status === "REMOVIDO" ? (
              <span className="chip bad">Removido</span>
            ) : (
              <form action={toggleListingStatus.bind(null, l.id)} className="row" style={{ gap: 8 }}>
                <span className={`chip ${l.status === "ATIVO" && l.stock > 0 ? "ok" : ""}`}>{l.stock < 1 ? "Esgotado" : l.status === "ATIVO" ? "Ativo" : "Pausado"}</span>
                <button className="btn btn-ghost btn-sm" type="submit">{l.status === "ATIVO" ? "Pausar" : "Reativar"}</button>
              </form>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (aba === "favoritos") {
    const favs = await db.favorite.findMany({ where: { userId }, include: { listing: { include: cardInclude } }, orderBy: { createdAt: "desc" } });
    if (!favs.length) return <Empty text="Toque no coração de um anúncio para guardar aqui." href="/busca" cta="Explorar ofertas" />;
    return <div className="cards">{favs.map((f) => <ListingCard key={f.listingId} l={f.listing} fav />)}</div>;
  }

  // saldo
  const [withdrawals, me] = await Promise.all([
    db.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { verification: true, verificationNote: true, cpf: true } }),
  ]);
  return (
    <div className="stack">
      {me.verification === "APROVADO" ? (
        <WithdrawForm cpfMasked={me.cpf ? `${me.cpf.slice(0, 3)}.${me.cpf.slice(3, 6)}.${me.cpf.slice(6, 9)}-${me.cpf.slice(9)}` : ""} />
      ) : me.verification === "PENDENTE" ? (
        <div className="note"><Icon name="clock" /><span><b>Identidade em análise.</b> Os saques são liberados assim que a equipe aprovar.</span></div>
      ) : (
        <>
          {me.verification === "RECUSADO" && <div className="note warn"><Icon name="alert" /><span><b>Verificação recusada:</b> {me.verificationNote}. Corrija e envie de novo.</span></div>}
          <VerificationForm />
        </>
      )}
      {withdrawals.length > 0 && (
        <div className="panel list">
          {withdrawals.map((w) => (
            <div key={w.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div><b>Saque para {w.pixKey}</b><span className="muted small">{dateTime(w.createdAt)}</span></div>
              <div className="grid-gap" style={{ justifyItems: "end", gap: 4 }}>
                <span className="price" style={{ fontSize: 17 }}>{money(w.amountCents)}</span>
                <span className={`chip ${w.status === "PAGO" ? "ok" : w.status === "RECUSADO" ? "bad" : "auto"}`}>{w.status === "PENDENTE" || w.status === "PROCESSANDO" ? "Pendente" : w.status === "PAGO" ? "Pago" : "Recusado"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="panel empty">
      <p className="muted">{text}</p>
      <Link className="btn btn-primary" href={href}>{cta}</Link>
    </div>
  );
}
