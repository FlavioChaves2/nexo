import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money, pct, monthYear, dateTime } from "@/lib/format";
import { sellerStats } from "@/lib/orders";
import { cardInclude, displayName, favoriteIds, visibleListing } from "@/lib/queries";
import { TYPE_PLURAL, WHAT_YOU_GET } from "@/lib/constants";
import { Art } from "@/components/Art";
import { Icon, Stars } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { toggleListingStatus } from "@/app/actions/listings";
import { ReportButton } from "@/components/TrustForms";
import { AnswerForm, AskForm, GalleryViewer } from "@/components/SocialForms";
import { Avatar } from "@/components/Avatar";
import { SellerBadges } from "@/components/SellerBadges";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const l = await db.listing.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: l?.title ?? "Anúncio" };
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await db.listing.findUnique({ where: { id }, include: {
      game: true,
      seller: true,
      images: { select: { id: true }, orderBy: { sort: "asc" } },
      questions: { include: { asker: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!l) notFound();

  const user = await getCurrentUser();
  const mine = user?.id === l.sellerId;
  const [stats, reviews, similar, favs] = await Promise.all([
    sellerStats(l.sellerId),
    db.review.findMany({ where: { sellerId: l.sellerId }, include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.listing.findMany({ where: { ...visibleListing, gameSlug: l.gameSlug, id: { not: l.id } }, include: cardInclude, take: 4, orderBy: { soldCount: "desc" } }),
    favoriteIds(user?.id),
  ]);
  const available = l.status === "ATIVO" && l.stock > 0;

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Você está em">
        <Link href="/">Início</Link><span>/</span>
        <Link href={`/busca?jogo=${l.gameSlug}`}>{l.game.name}</Link><span>/</span>
        <Link href={`/busca?tipo=${l.type}`}>{TYPE_PLURAL[l.type]}</Link>
      </nav>
      <div className="two-col">
        <div className="stack">
          {l.images.length ? (
            <GalleryViewer ids={l.images.map((i) => i.id)} alt={l.title} />
          ) : (
            <div className="media">
              <Art game={l.game} glyph={l.glyph} />
              {l.autoDelivery && <div className="tags"><span className="chip auto"><Icon name="bolt" />Entrega automática</span></div>}
            </div>
          )}
          <div className="grid-gap">
            <span className="eyebrow">{TYPE_PLURAL[l.type]} · {l.game.name}</span>
            <h1 style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>{l.title}</h1>
          </div>
          <div className="panel box prose">
            <h3>Descrição</h3>
            <p>{l.description}</p>
            <h3 style={{ marginTop: 6 }}>O que você recebe</h3>
            <ul>{WHAT_YOU_GET[l.type]?.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="panel box" id="perguntas">
            <h3>Perguntas ao vendedor ({l.questions.length})</h3>
            {!mine && (user ? <AskForm listingId={l.id} /> : <Link className="linkish small" href={`/entrar?next=/anuncio/${l.id}`}>Entre para perguntar →</Link>)}
            <div>
              {l.questions.map((q) => (
                <div className="qa" key={q.id}>
                  <div className="row"><b className="small">{q.body}</b><span className="muted small">{q.asker.username.slice(0, 2)}*** · {dateTime(q.createdAt)}</span></div>
                  {q.answer ? <p className="a small">{q.answer}</p> : mine ? <AnswerForm questionId={q.id} /> : <span className="muted small">Aguardando resposta do vendedor.</span>}
                </div>
              ))}
              {!l.questions.length && <p className="muted small">Ninguém perguntou ainda.</p>}
            </div>
          </div>
          <div className="panel box">
            <div className="row"><h3>Avaliações de {displayName(l.seller)}</h3><span className="muted num">{stats.reviews ? `${pct(stats.positivePct)} positivas` : "Sem avaliações ainda"}</span></div>
            <div>
              {reviews.map((r) => (
                <div className="review" key={r.id}>
                  <div className="row"><b>{r.author.username.slice(0, 2)}***</b><Stars n={r.rating} /></div>
                  {r.comment && <p>{r.comment}</p>}
                </div>
              ))}
              {!reviews.length && <p className="muted small">As avaliações aparecem aqui depois das primeiras vendas.</p>}
            </div>
          </div>
        </div>

        <aside className="stack buybox">
          <div className="panel box">
            <div>
              <span className="price">{money(l.priceCents)}</span>
              {l.oldPriceCents ? <span className="price-old">{money(l.oldPriceCents)}</span> : null}
            </div>
            <dl className="kv">
              <dt>Entrega</dt><dd>{l.autoDelivery ? "Automática, em segundos" : "Pelo vendedor, no pedido"}</dd>
              <dt>Disponível</dt><dd className="num">{l.stock === 1 ? "Unidade única" : `${l.stock} unidades`}</dd>
              <dt>Vendidos</dt><dd className="num">{l.soldCount.toLocaleString("pt-BR")}</dd>
            </dl>
            {mine && l.status === "REMOVIDO" ? (
              <div className="note warn"><Icon name="alert" /><span><b>Removido pela moderação:</b> {l.moderationNote}</span></div>
            ) : mine ? (
              <>
                <div className="note"><Icon name="user" /><span>Este anúncio é seu. Status: <b>{l.status === "ATIVO" ? "ativo" : "pausado"}</b>.</span></div>
                <Link className="btn btn-primary btn-block" href={`/anuncio/${l.id}/editar`}><Icon name="edit" />Editar anúncio</Link>
                <form action={toggleListingStatus.bind(null, l.id)}>
                  <button className="btn btn-ghost btn-block" type="submit">{l.status === "ATIVO" ? "Pausar anúncio" : "Reativar anúncio"}</button>
                </form>
              </>
            ) : available ? (
              <form action={`/checkout/${l.id}`} className="stack" style={{ gap: 12 }}>
                {l.stock > 1 && (
                  <div className="row">
                    <label className="label" htmlFor="qtd">Quantidade</label>
                    <input className="input qty" id="qtd" name="qtd" type="number" min={1} max={Math.min(l.stock, 50)} defaultValue={1} style={{ width: 90, textAlign: "center" }} />
                  </div>
                )}
                <button className="btn btn-primary btn-block" type="submit">Comprar agora <Icon name="arrow" /></button>
              </form>
            ) : (
              <div className="note warn"><Icon name="alert" /><span>Este anúncio está indisponível no momento.</span></div>
            )}
            <div className="note"><Icon name="shield" /><span><b>Garantia Nexo:</b> o vendedor só recebe depois que você confirmar a entrega.</span></div>
            {!mine && user && <ReportButton listingId={l.id} />}
          </div>
          <Link className="panel box" href={`/loja/${l.seller.username}`}>
            <div className="seller-mini">
              <Avatar user={l.seller} size="lg" />
              <div style={{ minWidth: 0 }}><div className="row" style={{ justifyContent: "flex-start", gap: 6 }}><b>{displayName(l.seller)}</b><SellerBadges rep={l.seller} /></div><div className="muted small">Na Nexo desde {monthYear(l.seller.createdAt)}</div></div>
            </div>
            <div className="seller-stats">
              <div><b>{l.seller.completedSales}</b><span>vendas</span></div>
              <div><b>{stats.reviews ? pct(stats.positivePct) : "—"}</b><span>positivas</span></div>
              <div><b>{stats.reviews ? stats.avg.toFixed(1).replace(".", ",") : "—"}</b><span>nota</span></div>
            </div>
          </Link>
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><h2>Mais de {l.game.name}</h2></div>
          <div className="cards">{similar.map((s) => <ListingCard key={s.id} l={s} fav={favs.has(s.id)} />)}</div>
        </section>
      )}
    </div>
  );
}
