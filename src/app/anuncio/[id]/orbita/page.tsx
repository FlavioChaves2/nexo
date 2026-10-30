import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { cardInclude } from "@/lib/queries";
import { inOrbit } from "@/lib/orbit-plans";
import { ListingCard } from "@/components/ListingCard";
import { OrbitForm } from "@/components/OrbitForm";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Órbita: destaque do anúncio", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrbitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(`/anuncio/${id}/orbita`);
  const [l, balance, boosts] = await Promise.all([
    db.listing.findUnique({ where: { id }, include: cardInclude }),
    db.user.findUniqueOrThrow({ where: { id: me.id }, select: { balanceCents: true } }),
    db.boost.findMany({ where: { listingId: id, userId: me.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  if (!l || l.sellerId !== me.id || l.status === "REMOVIDO") notFound();
  const active = inOrbit(l);
  const canBoost = l.status === "ATIVO" && l.stock > 0 && !l.reservedForId;

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/conta?aba=anuncios">← Meus anúncios</Link></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap">
          <span className="eyebrow"><Icon name="orbit" /> Órbita Nexo</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Coloque seu anúncio em órbita</h1>
          <p className="muted">Seu anúncio sobe para o topo da Nexo e fica girando entre os primeiros que todo mundo vê.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          {active && (
            <div className="note"><Icon name="orbit" /><span><b>Em órbita até {dateTime(l.orbitUntil!)}.</b> Quer mais tempo? Os dias novos são somados.</span></div>
          )}
          {canBoost ? (
            <OrbitForm listingId={l.id} balanceCents={balance.balanceCents} active={active} />
          ) : (
            <div className="note warn"><Icon name="alert" /><span>Este anúncio precisa estar <b>ativo e com estoque</b> para entrar em órbita. {l.status === "PAUSADO" ? "Reative-o em Meus anúncios." : "Aumente o estoque editando o anúncio."}</span></div>
          )}

          <div className="panel box">
            <h3>O que a Órbita faz</h3>
            <ul className="fee-list">
              <li><Icon name="spark" /><span><b>Topo da página inicial.</b> Aparece em “Explore os destaques”, a primeira vitrine que quem chega vê.</span></li>
              <li><Icon name="search" /><span><b>Primeiros resultados da busca.</b> Na busca do seu jogo e do seu tipo de anúncio, em “Mais relevantes”.</span></li>
              <li><Icon name="orbit" /><span><b>Selo “Em órbita”</b> e brilho no card, para chamar o olho.</span></li>
              <li><Icon name="swap" /><span><b>Revezamento justo.</b> Quando há vários anúncios em órbita, eles se revezam nas primeiras posições a cada visita.</span></li>
            </ul>
            <p className="hint">A Órbita aumenta quem <b>vê</b> o anúncio, mas não garante a venda: preço, fotos e boas avaliações continuam fazendo a diferença. O valor pago não é devolvido se você pausar ou vender tudo antes do fim.</p>
          </div>

          {boosts.length > 0 && (
            <div className="panel">
              <div className="box" style={{ paddingBottom: 0 }}><h3>Histórico deste anúncio</h3></div>
              {boosts.map((b) => (
                <div key={b.id} className="notif">
                  <Icon name="orbit" />
                  <div><b>{b.days} {b.days === 1 ? "dia" : "dias"} · {money(b.amountCents)}</b><p className="muted small">Até {dateTime(b.endsAt)}</p></div>
                  <span className="muted small">{dateTime(b.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="stack">
          <span className="eyebrow dim">Como vai aparecer</span>
          <div className="orbit-preview"><ListingCard l={{ ...l, orbitUntil: new Date(Date.now() + 86_400_000) }} /></div>
        </aside>
      </div>
    </div>
  );
}
