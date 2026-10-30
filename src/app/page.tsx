import Link from "next/link";
import type { CSSProperties } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { favoriteIds, visibleListing } from "@/lib/queries";
import { withOrbitFirst } from "@/lib/orbit";
import { LISTING_TYPES, TYPE_PLURAL } from "@/lib/constants";
import { feeBps } from "@/lib/format";
import { HeroArt } from "@/components/HeroArt";
import { ListingCard } from "@/components/ListingCard";
import { Icon } from "@/components/Icon";
import { Ticker } from "@/components/Ticker";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  // Uma rodada só de consultas: cada ida ao banco custa uma viagem de rede.
  const [games, featured, favs, listingsCount, sellersCount] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" } }),
    withOrbitFirst(visibleListing, [{ featured: "desc" }, { soldCount: "desc" }, { createdAt: "desc" }], 8, 4),
    favoriteIds(user?.id),
    db.listing.count({ where: visibleListing }),
    db.user.count({ where: { listings: { some: visibleListing } } }),
  ]);
  const stats = { listings: listingsCount.toLocaleString("pt-BR"), sellers: sellersCount.toLocaleString("pt-BR") };
  const fee = (feeBps() / 100).toString().replace(".", ",");

  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">O seu universo, conectado.</span>
          <h1>
            Seu próximo nível
            <br />
            começa <em>aqui.</em>
          </h1>
          <p>Contas, skins, moedas e gift cards de jogador para jogador. O pagamento fica protegido até você receber.</p>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/busca">
              Explorar ofertas <Icon name="arrow" />
            </Link>
            <Link className="btn btn-ghost" href="/como-funciona">
              <Icon name="shield" />
              Como funciona
            </Link>
          </div>
          <div className="hero-meta">
            <span><b>{stats.listings}</b> ANÚNCIOS</span>
            <span><b>{stats.sellers}</b> LOJAS</span>
            <span><b>{games.length}</b> JOGOS</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <div style={{ marginTop: 22 }}><Ticker /></div>

      <div className="perks">
        <div className="perk"><Icon name="diamond" /><div><b>Encontre seu próximo upgrade</b><span>Contas, itens, moedas e serviços de {games.length} jogos</span></div></div>
        <div className="perk"><Icon name="swap" /><div><b>De jogador para jogador</b><span>Chat direto com o vendedor em cada pedido</span></div></div>
        <div className="perk"><Icon name="shield" /><div><b>Dinheiro protegido</b><span>O vendedor só recebe depois que você confirma</span></div></div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Escolha seu universo <Icon name="spark" /></h2>
          <Link className="linkish" href="/busca">Ver todos <Icon name="arrow" /></Link>
        </div>
        <div className="unis">
          {games.map((g) => (
            <Link key={g.slug} className="uni" href={`/busca?jogo=${g.slug}`} style={{ "--c1": g.c1 } as CSSProperties}>
              <span className="letra">{g.letter}</span>
              <div><b>{g.name}</b><small>Explorar <Icon name="arrow" /></small></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">O próximo drop é seu</span><h2>Explore os destaques</h2></div>
        </div>
        <div className="pills">
          <Link className="pill on" href="/busca">Todos</Link>
          {LISTING_TYPES.map((t) => (
            <Link key={t} className="pill" href={`/busca?tipo=${t}`}>{TYPE_PLURAL[t]}</Link>
          ))}
        </div>
        <div className="cards">
          {featured.map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}
        </div>
      </section>

      <section className="section" id="garantia">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Garantia Nexo</span><h2>Seu dinheiro fica com a gente até você receber</h2></div>
        </div>
        <div className="steps">
          <div className="panel step"><span className="n">01</span><b>Você paga via Pix</b><p>O valor fica retido na Nexo, não vai direto para o vendedor.</p></div>
          <div className="panel step"><span className="n">02</span><b>O vendedor entrega</b><p>Pelo quadro de entrega do pedido ou de forma automática, em segundos.</p></div>
          <div className="panel step hl"><span className="n">03</span><b>Você confirma</b><p>Testou e está tudo certo? Confirme. Deu problema? Abra uma disputa.</p></div>
          <div className="panel step"><span className="n">04</span><b>O vendedor recebe</b><p>Só então o valor vai para o saldo do vendedor, pronto para saque.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="sell-band">
          <div className="stack" style={{ gap: 14 }}>
            <span className="eyebrow">Sua loja começa aqui</span>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)" }}>Anuncie de graça e saque por Pix quando a venda for confirmada.</h2>
            <p>Você só paga a taxa quando vende. Boas avaliações deixam sua loja mais forte.</p>
            <div><Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link></div>
          </div>
          <div className="sell-facts">
            <div><b>R$ 0</b><span>para anunciar</span></div>
            <div><b>{fee}%</b><span>por venda concluída</span></div>
            <div><b>Pix</b><span>para sacar o saldo</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
