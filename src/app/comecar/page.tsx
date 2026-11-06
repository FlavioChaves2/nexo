import Link from "next/link";
import { cookies } from "next/headers";
import { currentFeeBps } from "@/lib/attribution";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { REF_COOKIE, REFERRAL_BPS, FIRST_SALE_BONUS_CENTS } from "@/lib/referrals";
import { FOUNDER } from "@/lib/titles";
import { gameIcon, MOST_SEARCHED } from "@/lib/game-art";
import { LEGAL } from "@/lib/legal";
import { money } from "@/lib/format";
import { cardInclude, visibleListing } from "@/lib/queries";
import { WELCOME_FEE_HOURS } from "@/lib/welcome-fee";
import { AuthForm } from "@/components/AuthForm";
import { ListingCard } from "@/components/ListingCard";
import { LpCalc } from "@/components/LpCalc";
import { LpStickyCta } from "@/components/LpStickyCta";
import { NexoSymbol, LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Landing page das campanhas de marketing: só cadastro, sem menu do site.
// Fica fora do menu e do sitemap, e pede para o Google não mostrar.
// ?jogo=<slug> troca o título pelo jogo do anúncio (ex.: /comecar?jogo=freefire), para o texto bater com o que a pessoa clicou.
// Gatilhos só com fatos: taxa zero de 72 h (welcome-fee.ts), vagas de Fundador e anúncios vêm do banco.
// Nada de contador falso, número inventado de usuários ou depoimento de mentira.
export const metadata: Metadata = {
  title: "Venda sua conta com taxa zero nos 3 primeiros dias",
  description: "Anuncie grátis contas, skins, moedas e gift cards. Conta nova vende sem taxa nos 3 primeiros dias. Pagamento protegido e saque por Pix.",
  robots: { index: false, follow: false },
};

const AFTER_SIGNUP = "/conta/perfil";
const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;
const DAYS = WELCOME_FEE_HOURS / 24;

export default async function ComecarPage({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  const feeNow = await currentFeeBps();
  if (await getCurrentUser()) redirect(AFTER_SIGNUP);
  const { jogo } = await searchParams;
  const refId = (await cookies()).get(REF_COOKIE)?.value;
  const slug = jogo && /^[a-z0-9-]{2,40}$/.test(jogo) ? jogo : null;
  const [inviter, founders, games, adGame, fresh] = await Promise.all([
    refId ? db.user.findUnique({ where: { id: refId }, select: { username: true, storeName: true } }) : null,
    db.userTitle.count({ where: { title: { auto: FOUNDER.auto } } }),
    db.game.findMany({ where: { slug: { in: MOST_SEARCHED } }, select: { slug: true, name: true } }),
    slug ? db.game.findUnique({ where: { slug }, select: { slug: true, name: true } }) : null,
    // Anúncios reais mais novos (do jogo do anúncio primeiro): mostra que a vitrine está viva.
    db.listing.findMany({ where: visibleListing, include: cardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const foundersLeft = Math.max(0, FOUNDER.maxHolders - founders);
  const fee = pct(feeNow);
  const ref = pct(REFERRAL_BPS);
  const bonus = money(FIRST_SALE_BONUS_CENTS);
  const ordered = MOST_SEARCHED.map((s) => games.find((g) => g.slug === s)).filter((g) => g && gameIcon(g.slug));
  const adIcon = adGame ? gameIcon(adGame.slug) : null;
  const shelf = [...fresh].sort((a, b) => Number(b.gameSlug === slug) - Number(a.gameSlug === slug)).slice(0, 4);
  const cta = "Criar conta e vender com taxa zero";

  return (
    <div className="lp">
      <div className="lp-ribbon">
        <Icon name="bolt" /><span><b>Taxa ZERO</b> nas vendas dos seus {DAYS} primeiros dias · anúncio grátis · saque no Pix</span>
      </div>
      <div className="wrap lp-top">
        <span className="logo" aria-label="Nexo"><NexoSymbol /><LogoMark /></span>
        <Link className="btn btn-ghost btn-sm" href={`/entrar?next=${encodeURIComponent(AFTER_SIGNUP)}`}>Já tenho conta</Link>
      </div>

      <section className="wrap lp-hero">
        <div className="lp-pitch">
          <span className="lp-zero"><span className="lp-zero-n">0%</span><span>de taxa nos seus <b>{DAYS} primeiros dias</b> vendendo</span></span>
          {adGame ? (
            <h1>{adIcon && <img className="lp-game-ic" src={adIcon} alt="" />}Venda sua conta de <span className="lime">{adGame.name}</span> e fique com <span className="lp-hl">100% do valor</span>.</h1>
          ) : (
            <h1>Sua conta parada vale dinheiro. Venda e fique com <span className="lp-hl">100% do valor</span>.</h1>
          )}
          <p className="lp-sub">Conta nova na Nexo vende <b>sem taxa nenhuma</b> nos {DAYS} primeiros dias. O comprador paga antes, a Nexo guarda o dinheiro e você saca no Pix. Sem calote, sem golpe do comprovante falso.</p>
          <ul className="lp-chips">
            <li><Icon name="tag" />Anúncio grátis</li>
            <li><Icon name="shield" />Pagamento protegido</li>
            <li><Icon name="bolt" />Saque no Pix</li>
          </ul>
          {foundersLeft > 0 && (
            <div className="lp-scarce">
              <div className="lp-scarce-txt"><span>{FOUNDER.emoji}</span><span><b>Restam {foundersLeft} de {FOUNDER.maxHolders} vagas de Fundador.</b> Os primeiros a concluir uma venda ganham o título para sempre na loja.</span></div>
              <div className="lp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={FOUNDER.maxHolders} aria-valuenow={founders} aria-label="Vagas de Fundador ocupadas"><span style={{ width: `${Math.max(4, (founders / FOUNDER.maxHolders) * 100)}%` }} /></div>
            </div>
          )}
        </div>

        <div className="lp-form" id="cadastro">
          {inviter && <div className="note"><Icon name="heart" /><span>Você foi convidado por <b>{inviter.storeName || inviter.username}</b>. Bem-vindo à Nexo!</span></div>}
          <div className="lp-form-head">
            <span className="lp-clock"><Icon name="clock" />Seus {DAYS} dias de taxa zero começam quando você cria a conta</span>
            <h2>Crie sua conta grátis</h2>
            <p className="muted small">3 campos, 1 minuto. A mesma conta serve para comprar e vender.</p>
          </div>
          <AuthForm mode="register" next={AFTER_SIGNUP} avatar={false} submitLabel={cta} />
          <ul className="lp-trust">
            <li><Icon name="shield" />Pagamento protegido</li>
            <li><Icon name="bolt" />Saque no Pix</li>
            <li><Icon name="verified" />Empresa com CNPJ</li>
          </ul>
        </div>

        <div className="lp-proof">
          <div className="lp-phone" aria-label="Exemplo de aviso de venda na Nexo">
            <span className="lp-phone-tag">Exemplo</span>
            <div className="lp-notif"><span className="lp-notif-ic"><NexoSymbol /></span><div><b>Venda concluída!</b><span>Conta de {adGame?.name ?? "Free Fire"} · pedido #NX-00000</span></div></div>
            <div className="lp-notif money"><span className="lp-notif-ic"><Icon name="bolt" /></span><div><b>+ R$ 450,00 no seu saldo</b><span>Taxa Nexo: R$ 0,00 (primeiros {DAYS} dias)</span></div></div>
            <div className="lp-notif"><span className="lp-notif-ic"><Icon name="send" /></span><div><b>Saque enviado no Pix</b><span>Cai na sua conta do banco</span></div></div>
          </div>
          {ordered.length > 0 && (
            <div className="lp-games" aria-label="Alguns jogos aceitos">
              {ordered.map((g) => <img key={g!.slug} src={gameIcon(g!.slug)!} alt={g!.name} title={g!.name} />)}
              <span>+190 jogos</span>
            </div>
          )}
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head">
          <span className="eyebrow">Faça as contas</span>
          <h2>Quanto cai no seu Pix</h2>
        </div>
        <LpCalc feeBps={feeNow} days={DAYS} />
      </section>

      {shelf.length > 0 && (
        <section className="wrap lp-section">
          <div className="lp-head">
            <span className="eyebrow"><span className="lp-live" aria-hidden="true" />Acabou de chegar na Nexo</span>
            <h2>Vendedores já estão anunciando</h2>
          </div>
          <div className="cards lp-shelf">{shelf.map((l) => <ListingCard key={l.id} l={l} />)}</div>
          <p className="muted small" style={{ marginTop: 10 }}>A vitrine está começando: quem anuncia agora aparece primeiro, com pouca concorrência.</p>
        </section>
      )}

      <section className="wrap lp-section">
        <div className="lp-head">
          <span className="eyebrow">Por que não vender por fora</span>
          <h2>Grupo e DM é onde o golpe acontece</h2>
        </div>
        <div className="lp-vs">
          <div className="lp-vs-col bad">
            <h3>Vendendo por grupo ou DM</h3>
            <ul>
              <li><Icon name="alert" />Comprovante de Pix falso</li>
              <li><Icon name="alert" />Pede a conta “só para testar” e some</li>
              <li><Icon name="alert" />Estorno depois que você entregou</li>
              <li><Icon name="alert" />Ninguém para resolver se der problema</li>
            </ul>
          </div>
          <div className="lp-vs-col good">
            <h3>Vendendo na Nexo</h3>
            <ul>
              <li><Icon name="check" />O comprador paga antes e o Pix é conferido pelo sistema</li>
              <li><Icon name="check" />O dinheiro fica guardado até a entrega ser confirmada</li>
              <li><Icon name="check" />Disputa analisada pela equipe se der problema</li>
              <li><Icon name="check" />Suporte de gente de verdade, em português</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head">
          <span className="eyebrow">Simples assim</span>
          <h2>Da conta criada ao Pix em 3 passos</h2>
        </div>
        <ol className="lp-steps">
          <li><span>1</span><div><b>Crie sua conta</b><p className="muted small">E-mail, nome de usuário e senha. Seu relógio de taxa zero começa aqui.</p></div></li>
          <li><span>2</span><div><b>Anuncie em 2 minutos</b><p className="muted small">Escolha o jogo, coloque fotos e o preço. Grátis e sem limite de anúncios.</p></div></li>
          <li><span>3</span><div><b>Venda e saque</b><p className="muted small">O comprador confirma e o dinheiro cai no seu saldo para sacar no Pix.</p></div></li>
        </ol>
      </section>

      <section className="wrap lp-section">
        <div className="lp-invite">
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Ganhe sem vender nada</span>
            <h2>Ganhe <span className="lime">{bonus}</span> por amigo que vender, e {ref} de tudo que ele movimentar</h2>
            <p className="muted">Assim que criar a conta, você recebe o seu link de convite. Seu amigo também ganha os {DAYS} dias de taxa zero. Quando ele concluir a primeira venda, {bonus} caem no seu saldo, e cada compra e venda dele rende {ref} para você, para sempre. Quem paga é a Nexo.</p>
          </div>
          <div className="lp-invite-calc" aria-label="Exemplo de ganho com convite">
            <div><span>5 amigos fazem a 1ª venda</span><b className="lime">{money(FIRST_SALE_BONUS_CENTS * 5)}</b></div>
            <div><span>Eles vendem R$ 1.000,00</span><b className="lime">+ {money((100000 * REFERRAL_BPS) / 10000)}</b></div>
            <div><span>Eles pagam a mais</span><b>R$ 0,00</b></div>
          </div>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head"><h2>Dúvidas rápidas</h2></div>
        <div className="lp-faq">
          <details open><summary>Como funciona a taxa zero?</summary><p className="muted">Todo pedido feito nas primeiras {WELCOME_FEE_HOURS} horas depois de você criar a conta não paga taxa: o valor inteiro do anúncio é seu. Depois disso a taxa é de {fee}, cobrada só quando a venda é concluída.</p></details>
          <details><summary>Criar conta e anunciar custa alguma coisa?</summary><p className="muted">Não. É grátis e sem limite de anúncios. Quem compra também não paga taxa no Pix.</p></details>
          <details><summary>Como eu recebo o dinheiro das vendas?</summary><p className="muted">Quando o comprador confirma a entrega (ou o prazo de garantia termina sem problema), o valor vai para o seu saldo e você saca por Pix.</p></details>
          <details><summary>Como sei que não vou levar calote?</summary><p className="muted">O comprador paga antes, e a Nexo guarda o dinheiro até a entrega ser confirmada. Se houver problema, a equipe analisa pela disputa.</p></details>
          <details><summary>Quem está por trás da Nexo?</summary><p className="muted">A Nexo é uma empresa brasileira registrada: {LEGAL.document}. Os termos de uso e a política de privacidade estão no rodapé.</p></details>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-final">
          <span className="lp-zero"><span className="lp-zero-n">0%</span><span>de taxa nos {DAYS} primeiros dias</span></span>
          <h2>Seu próximo item vendido começa aqui</h2>
          {foundersLeft > 0 && <p className="muted">{FOUNDER.emoji} Ainda dá tempo de ser um dos {FOUNDER.maxHolders} Fundadores: restam {foundersLeft} vagas.</p>}
          <a className="btn btn-primary btn-lg" href="#cadastro">{cta} <Icon name="arrow" /></a>
          <span className="muted small">Grátis · sem cartão · leva 1 minuto</span>
        </div>
      </section>

      <footer className="wrap lp-foot">
        <span>© 2026 {LEGAL.brand} · {LEGAL.document}</span>
        <span><Link href="/termos" target="_blank">Termos de uso</Link> · <Link href="/privacidade" target="_blank">Privacidade</Link></span>
      </footer>

      <LpStickyCta label="Vender com taxa zero" />
    </div>
  );
}
