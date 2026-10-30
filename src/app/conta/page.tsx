import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, dateTime } from "@/lib/format";
import { sellerNet, settleExpired } from "@/lib/orders";
import { cardInclude } from "@/lib/queries";
import { ORDER_STATUS, TYPE_LABEL, type OrderStatus } from "@/lib/constants";
import { Art } from "@/components/Art";
import { ListingCard } from "@/components/ListingCard";
import { WithdrawForm } from "@/components/WithdrawForm";
import { VerificationForm } from "@/components/TrustForms";
import { Icon } from "@/components/Icon";
import { VerifyBanner } from "@/components/EmailForms";
import { emailEnabled } from "@/lib/email";
import { logout } from "@/app/actions/auth";
import { toggleListingStatus } from "@/app/actions/listings";

export const metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

const ABAS = [
  ["compras", "Compras"],
  ["vendas", "Vendas"],
  ["anuncios", "Meus anúncios"],
  ["favoritos", "Favoritos"],
  ["saldo", "Saldo e saques"],
] as const;

const statusChip = (s: string) => (s === "CONCLUIDO" ? "ok" : s === "DISPUTA" || s === "CANCELADO" || s === "REEMBOLSADO" ? "bad" : "auto");

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const aba = (await searchParams).aba ?? "compras";
  const user = await requireUser(`/conta?aba=${aba}`);
  await settleExpired({ OR: [{ buyerId: user.id }, { sellerId: user.id }] });

  const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const pending = await db.order.aggregate({
    where: { sellerId: user.id, status: { in: ["PAGO", "ENTREGUE", "DISPUTA"] } },
    _sum: { totalCents: true, feeCents: true, discountCents: true, planCents: true, cardFeeCents: true },
  });
  // Mesma conta do sellerNet: plano VIP e taxa do cartão ficam com a Nexo, não com o vendedor.
  const s = pending._sum;
  const pendingCents = (s.totalCents ?? 0) + (s.discountCents ?? 0) - (s.feeCents ?? 0) - (s.planCents ?? 0) - (s.cardFeeCents ?? 0);

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap"><span className="eyebrow">Minha conta</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Olá, {fresh.username}</h1></div>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" href={`/loja/${fresh.username}`}>Ver minha loja</Link>
          <Link className="btn btn-ghost btn-sm" href="/conta/perfil"><Icon name="edit" />Editar perfil</Link>
          <Link className="btn btn-ghost btn-sm" href="/conta/taxas"><Icon name="tag" />Taxas</Link>
          <Link className="btn btn-primary btn-sm" href="/conta/convites"><Icon name="heart" />Convide e ganhe 3%</Link>
          <Link className="btn btn-ghost btn-sm" href="/conta/seguranca"><Icon name="shield" />{fresh.totpEnabled ? "2 etapas ativo" : "Ativar 2 etapas"}</Link>
          <form action={logout}><button className="btn btn-ghost btn-sm" type="submit">Sair</button></form>
        </div>
      </div>

      <section className="section">
        {emailEnabled() && !fresh.emailVerifiedAt && <VerifyBanner email={fresh.email} />}
        <div className="stat-tiles">
          <div className="panel"><span className="eyebrow dim">Saldo disponível</span><b className="lime">{money(fresh.balanceCents)}</b><span className="muted small">Pronto para saque</span></div>
          <div className="panel"><span className="eyebrow dim">A liberar</span><b>{money(pendingCents)}</b><span className="muted small">Vendas aguardando confirmação</span></div>
        </div>
        <nav className="tabs">
          {ABAS.map(([k, n]) => <Link key={k} href={`/conta?aba=${k}`} className={aba === k ? "on" : undefined}>{n}</Link>)}
        </nav>
        <Aba aba={aba} userId={user.id} />
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
