import Link from "next/link";
import type { CSSProperties } from "react";
import { currentFeeBps } from "@/lib/attribution";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cardInclude, favoriteIds, visibleListing } from "@/lib/queries";
import { withOrbitFirst } from "@/lib/orbit";
import { FOUNDER } from "@/lib/titles";
import { HOME_GAMES } from "@/lib/game-catalog";
import { gameCover, gameIcon, MOST_SEARCHED } from "@/lib/game-art";
import { openWanted } from "@/lib/wanted";
import { LISTING_TYPES, TYPE_PLURAL } from "@/lib/constants";
import { money } from "@/lib/format";
import { HeroArt } from "@/components/HeroArt";
import { ListingCard } from "@/components/ListingCard";
import { FeeSimulator } from "@/components/FeeSimulator";
import { Icon, type IconName } from "@/components/Icon";
import { Ticker } from "@/components/Ticker";

export const dynamic = "force-dynamic";

/** "O que você procura?": um cartão por tipo de anúncio, com exemplos do que se encontra. */
const TYPES: { tipo: string; icon: string; desc: string; ex: string }[] = [
  { tipo: "CONTA", icon: "user", desc: "Contas prontas para jogar", ex: "Rank alto · skins raras · full acesso" },
  { tipo: "MOEDA", icon: "diamond", desc: "Moedas e recargas", ex: "Robux · V-Bucks · Diamantes · VP" },
  { tipo: "ITEM", icon: "spark", desc: "Itens e skins", ex: "Skins de CS2 · pets · frutas · armas" },
  { tipo: "GIFT", icon: "tag", desc: "Gift cards e assinaturas", ex: "Steam · PlayStation · Xbox · Nitro" },
  { tipo: "SERVICO", icon: "bolt", desc: "Serviços de jogador", ex: "Elo boost · coaching · upar conta" },
];

const FAQ: [string, string][] = [
  ["É seguro comprar de outro jogador?", "Sim. O seu Pix fica retido pela Nexo e só é liberado ao vendedor depois que você confirma que recebeu. Se der problema, abra uma disputa: uma pessoa da equipe analisa e o dinheiro pode voltar para você."],
  ["Quem compra paga alguma taxa?", "Não no Pix: você paga só o preço do anúncio. Os planos VIP, com mais dias de proteção e cashback, são opcionais."],
  ["Quanto custa vender?", "Anunciar é grátis. Quando a venda é concluída, a Nexo fica com 9,79%, uma das taxas mais baixas do mercado. O resto vai para o seu saldo e você saca por Pix."],
  ["Em quanto tempo recebo o que comprei?", "Anúncios com entrega automática entregam na hora. Nos outros, o vendedor entrega pelo chat do pedido, e você recebe um aviso no celular."],
  ["Não achei o jogo ou o item que eu quero.", "Use o Quero comprar: diga o que procura e quanto quer pagar, e os vendedores mandam ofertas para você."],
];

export default async function Home() {
  const feeNow = await currentFeeBps();
  const user = await getCurrentUser();
  // Uma rodada só de consultas: cada ida ao banco custa uma viagem de rede.
  const [games, gamesCount, featured, favs, listingsCount, sellersCount, founders, wanted] = await Promise.all([
    db.game.findMany({ orderBy: { sort: "asc" }, take: 40, include: { _count: { select: { listings: { where: visibleListing } } } } }),
    db.game.count(),
    withOrbitFirst(visibleListing, [{ featured: "desc" }, { soldCount: "desc" }, { createdAt: "desc" }], 8, 4),
    favoriteIds(user?.id),
    db.listing.count({ where: visibleListing }),
    db.user.count({ where: { listings: { some: visibleListing } } }),
    db.userTitle.count({ where: { title: { auto: FOUNDER.auto } } }),
    db.wanted.findMany({ where: { ...openWanted(), buyer: { suspendedAt: null } }, include: { game: { select: { slug: true, name: true, c1: true } }, _count: { select: { offers: true } } }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const foundersLeft = FOUNDER.maxHolders - founders;
  const stats = { listings: listingsCount.toLocaleString("pt-BR"), sellers: sellersCount.toLocaleString("pt-BR") };
  const fee = (feeNow / 100).toString().replace(".", ",");
  // Vitrine: os primeiros jogos do catálogo que têm capa oficial. Atalhos: os mais buscados.
  const withCover = games.filter((g) => gameCover(g.slug));
  const popular = withCover.slice(0, HOME_GAMES);
  const hot = MOST_SEARCHED.map((slug) => games.find((g) => g.slug === slug)).filter((g) => g !== undefined);
  // Top 7: quem tem mais anúncios; sem anúncios, a ordem de popularidade do catálogo (sem repetir a vitrine).
  const top = [...withCover].sort((a, b) => b._count.listings - a._count.listings || a.sort - b.sort).filter((g) => !popular.includes(g) || g._count.listings > 0).slice(0, 7);
  // Fileiras por jogo: os dois jogos com mais anúncios (só aparecem quando há anúncios).
  const rowGames = games.filter((g) => g._count.listings >= 2).sort((a, b) => b._count.listings - a._count.listings).slice(0, 2);
  const rows = await Promise.all(rowGames.map((g) => db.listing.findMany({ where: { ...visibleListing, gameSlug: g.slug }, include: cardInclude, orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }], take: 4 })));

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
            {listingsCount > 0 && <span><b>{stats.listings}</b> ANÚNCIOS</span>}
            {sellersCount > 0 && <span><b>{stats.sellers}</b> LOJAS</span>}
            <span><b>{gamesCount}</b> JOGOS</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <nav className="hot-games" aria-label="Mais buscados">
        <span className="hot-label"><Icon name="search" />Mais buscados</span>
        {hot.map((g) => {
          const ic = gameIcon(g.slug);
          return (
            <Link key={g.slug} className="hot-chip" href={`/busca?jogo=${g.slug}`} style={{ "--c1": g.c1 } as CSSProperties}>
              {ic ? <img className="game-ic" src={ic} alt="" /> : <span className="let">{g.letter}</span>}
              {g.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 22 }}><Ticker /></div>

      {foundersLeft > 0 && (
        <Link className="home-founders" href="/fundadores">
          <span aria-hidden="true">👑</span>
          <span><b>Restam {foundersLeft} de {FOUNDER.maxHolders} vagas de Fundador.</b> Conclua sua primeira venda e ganhe o título para sempre.</span>
          <span className="go-txt">Quero a minha <Icon name="arrow" /></span>
        </Link>
      )}

      <div className="perks">
        <div className="perk"><Icon name="diamond" /><div><b>Encontre seu próximo upgrade</b><span>Contas, itens, moedas e serviços de {gamesCount} jogos</span></div></div>
        <div className="perk"><Icon name="swap" /><div><b>De jogador para jogador</b><span>Chat direto com o vendedor em cada pedido</span></div></div>
        <div className="perk"><Icon name="shield" /><div><b>Dinheiro protegido</b><span>O vendedor só recebe depois que você confirma</span></div></div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Categorias populares <Icon name="spark" /></h2>
        </div>
        <div className="covers">
          {popular.map((g) => (
            <Link key={g.slug} className="cover-card" href={`/busca?jogo=${g.slug}`} style={{ "--c1": g.c1 } as CSSProperties}>
              <div className="cover-img"><img src={gameCover(g.slug)!} alt={g.name} loading="lazy" decoding="async" /></div>
              <div className="cover-name">{g.name}{g._count.listings > 0 && <span className="cover-count">{g._count.listings} {g._count.listings === 1 ? "anúncio" : "anúncios"}</span>}</div>
            </Link>
          ))}
        </div>
        <div className="see-all"><Link className="btn btn-ghost" href="/jogos">Ver todas as {gamesCount} categorias <Icon name="arrow" /></Link></div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Do jeito que você joga</span><h2>O que você procura?</h2></div>
        </div>
        <div className="types">
          {TYPES.map((t) => (
            <Link key={t.tipo} className="type-card" href={`/busca?tipo=${t.tipo}`} data-type={t.tipo}>
              <span className="type-ic"><Icon name={t.icon as IconName} /></span>
              <b>{TYPE_PLURAL[t.tipo]}</b>
              <span className="type-desc">{t.desc}</span>
              <small>{t.ex}</small>
              <span className="type-go" aria-hidden="true"><Icon name="arrow" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">O próximo drop é seu</span><h2>Explore os destaques</h2></div>
        </div>
        {featured.length > 0 && <div className="pills">
          <Link className="pill on" href="/busca">Todos</Link>
          {LISTING_TYPES.map((t) => (
            <Link key={t} className="pill" href={`/busca?tipo=${t}`}>{TYPE_PLURAL[t]}</Link>
          ))}
        </div>}
        {featured.length ? (
          <div className="cards">
            {featured.map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}
          </div>
        ) : (
          <div className="panel empty">
            <h3>A vitrine está esperando os primeiros vendedores</h3>
            <p className="muted">A Nexo acabou de abrir. Anuncie de graça e apareça aqui primeiro{foundersLeft > 0 ? `: os ${FOUNDER.maxHolders} primeiros a concluir uma venda viram 👑 Fundadores` : ""}.</p>
            <p className="muted">Procurando algo? Publique um pedido em Quero comprar e receba ofertas.</p>
            <div className="copy-row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/vender">Criar meu anúncio</Link>
              <Link className="btn btn-ghost" href="/quero-comprar/novo">Quero comprar</Link>
            </div>
          </div>
        )}
      </section>

      {rowGames.map((g, i) => (
        <section key={g.slug} className="section">
          <div className="section-head">
            <h2 className="row-title">{gameIcon(g.slug) && <img className="game-ic" src={gameIcon(g.slug)!} alt="" />}{g.name}</h2>
            <Link className="linkish" href={`/busca?jogo=${g.slug}`}>Ver todos <Icon name="arrow" /></Link>
          </div>
          <div className="cards">{rows[i].map((l) => <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />)}</div>
        </section>
      ))}

      <section className="section">
        <div className="section-head">
          <h2>Top 7 {top.some((g) => g._count.listings) ? "jogos em alta" : "mais jogados"} <Icon name="bolt" /></h2>
        </div>
        <ol className="top7">
          {top.map((g, i) => (
            <li key={g.slug}>
              <Link href={`/busca?jogo=${g.slug}`} className="top7-item" style={{ "--c1": g.c1 } as CSSProperties}>
                <span className="top7-n" aria-hidden="true">{i + 1}</span>
                <span className="top7-img"><img src={gameCover(g.slug)!} alt="" loading="lazy" decoding="async" /></span>
                <span className="top7-name">{g.name}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="wanted-band">
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Exclusivo da Nexo · Quero comprar</span>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)" }}>Não achou? Diga o que quer e os vendedores vêm até você.</h2>
            <p className="muted">Publique o que procura e quanto quer pagar. Os vendedores mandam ofertas, você escolhe a melhor e paga com a mesma Garantia Nexo.</p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <Link className="btn btn-primary" href="/quero-comprar/novo">Publicar meu pedido <Icon name="arrow" /></Link>
              <Link className="btn btn-ghost" href="/quero-comprar">Ver pedidos</Link>
            </div>
          </div>
          {wanted.length ? (
            <div className="wanted-mini">
              {wanted.map((w) => (
                <Link key={w.id} href={`/quero-comprar/${w.id}`} className="wanted-mini-item" style={{ "--c1": w.game.c1 } as CSSProperties}>
                  {gameIcon(w.game.slug) ? <img className="game-ic" src={gameIcon(w.game.slug)!} alt="" /> : <span className="dot" />}
                  <span className="wm-txt"><b>{w.title}</b><small>{w.game.name} · {w._count.offers} {w._count.offers === 1 ? "oferta" : "ofertas"}</small></span>
                  <span className="wm-price">até {money(w.maxCents)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <ol className="wanted-steps">
              <li><span>1</span><div><b>Você publica</b><small>“Conta de Valorant Imortal até R$ 300”</small></div></li>
              <li><span>2</span><div><b>Vendedores ofertam</b><small>Cada um manda preço e o que inclui</small></div></li>
              <li><span>3</span><div><b>Você escolhe e paga</b><small>Com o dinheiro protegido até receber</small></div></li>
            </ol>
          )}
        </div>
      </section>

      <section className="section" id="garantia">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Garantia Nexo</span><h2>Seu dinheiro fica com a gente até você receber</h2></div>
          <Link className="linkish" href="/como-funciona">Como funciona <Icon name="arrow" /></Link>
        </div>
        <div className="steps">
          <div className="panel step"><span className="n">01</span><b>Você paga via Pix</b><p>O valor fica retido na Nexo, não vai direto para o vendedor.</p></div>
          <div className="panel step"><span className="n">02</span><b>O vendedor entrega</b><p>Pelo quadro de entrega do pedido ou de forma automática, em segundos.</p></div>
          <div className="panel step hl"><span className="n">03</span><b>Você confirma</b><p>Testou e está tudo certo? Confirme. Deu problema? Abra uma disputa.</p></div>
          <div className="panel step"><span className="n">04</span><b>O vendedor recebe</b><p>Só então o valor vai para o saldo do vendedor, pronto para saque.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="why">
          <div><b>{fee}%</b><span>de taxa só quando você vende, uma das mais baixas do mercado</span></div>
          <div><b>R$ 0</b><span>de taxa no Pix para quem compra</span></div>
          <div><b>{gamesCount}</b><span>jogos, lojas e gift cards para comprar e vender</span></div>
          <div><b>100%</b><span>do pagamento retido até você confirmar a entrega</span></div>
        </div>
      </section>

      <section className="section">
        <div className="sell-band">
          <div className="stack" style={{ gap: 14 }}>
            <span className="eyebrow">Sua loja começa aqui</span>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)" }}>Anuncie de graça e saque por Pix quando a venda for confirmada.</h2>
            <p>Você só paga {fee}% quando vende. Sem calote: o comprador paga antes de você entregar. Digite um preço ao lado e veja quanto fica para você.</p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link>
              <Link className="btn btn-ghost" href="/conta/taxas">Taxas e prazos</Link>
            </div>
          </div>
          <FeeSimulator feeBps={feeNow} />
        </div>
      </section>

      <section className="section">
        <div className="app-band">
          <div className="band-bot">
            <img src="/brand/nexinho-festa.webp" alt="Nexinho comemorando" loading="lazy" />
            <span className="band-bot-shadow" aria-hidden />
            <span className="band-ping" aria-hidden>💰 Vendeu!</span>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">App da Nexo</span>
            <h2 style={{ fontSize: "clamp(22px,3vw,30px)" }}>Venda avisada na hora, direto no seu celular.</h2>
            <p className="muted">Instale em 10 segundos, sem loja de aplicativos. Receba aviso de venda, de mensagem e de dinheiro liberado.</p>
            <div><Link className="btn btn-primary" href="/app"><Icon name="bolt" />Baixar o app</Link></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Dúvidas</span><h2>Perguntas frequentes</h2></div>
          <Link className="linkish" href="/ajuda">Central de ajuda <Icon name="arrow" /></Link>
        </div>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q} className="panel">
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
