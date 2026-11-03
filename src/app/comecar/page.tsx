import Link from "next/link";
import { cookies } from "next/headers";
import { currentFeeBps } from "@/lib/attribution";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { REF_COOKIE, REFERRAL_BPS } from "@/lib/referrals";
import { FOUNDER } from "@/lib/titles";
import { gameIcon, MOST_SEARCHED } from "@/lib/game-art";
import { LEGAL } from "@/lib/legal";
import { AuthForm } from "@/components/AuthForm";
import { LpStickyCta } from "@/components/LpStickyCta";
import { NexoSymbol, LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Landing page das campanhas de marketing: só cadastro, sem menu do site.
// Fica fora do menu e do sitemap, e pede para o Google não mostrar.
// ?jogo=<slug> troca o título pelo jogo do anúncio (ex.: /comecar?jogo=freefire), para o texto bater com o que a pessoa clicou.
// Gatilhos só com fatos: vagas de Fundador vêm do banco, sem contador falso nem número inventado de usuários.
export const metadata: Metadata = {
  title: "Crie sua conta grátis e venda seus itens de jogo",
  description: "Anuncie grátis contas, skins, moedas e gift cards. Pagamento protegido, saque por Pix e 3% de comissão convidando amigos.",
  robots: { index: false, follow: false },
};

const AFTER_SIGNUP = "/conta/perfil";
const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function ComecarPage({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  const feeNow = await currentFeeBps();
  if (await getCurrentUser()) redirect(AFTER_SIGNUP);
  const { jogo } = await searchParams;
  const refId = (await cookies()).get(REF_COOKIE)?.value;
  const [inviter, founders, games, adGame] = await Promise.all([
    refId ? db.user.findUnique({ where: { id: refId }, select: { username: true, storeName: true } }) : null,
    db.userTitle.count({ where: { title: { auto: FOUNDER.auto } } }),
    db.game.findMany({ where: { slug: { in: MOST_SEARCHED } }, select: { slug: true, name: true } }),
    jogo && /^[a-z0-9-]{2,40}$/.test(jogo) ? db.game.findUnique({ where: { slug: jogo }, select: { slug: true, name: true } }) : null,
  ]);
  const foundersLeft = Math.max(0, FOUNDER.maxHolders - founders);
  const fee = pct(feeNow);
  const ref = pct(REFERRAL_BPS);
  const refExample = brl((1000 * REFERRAL_BPS) / 10000);
  const net = (v: number) => brl(v - (v * feeNow) / 10000);
  const ordered = MOST_SEARCHED.map((s) => games.find((g) => g.slug === s)).filter((g) => g && gameIcon(g.slug));
  const adIcon = adGame ? gameIcon(adGame.slug) : null;
  const cta = "Criar minha conta grátis";

  return (
    <div className="lp">
      <div className="wrap lp-top">
        <span className="logo" aria-label="Nexo"><NexoSymbol /><LogoMark /></span>
        <Link className="btn btn-ghost btn-sm" href={`/entrar?next=${encodeURIComponent(AFTER_SIGNUP)}`}>Já tenho conta</Link>
      </div>

      <section className="wrap lp-hero">
        <div className="lp-pitch">
          <span className="eyebrow">Cadastro grátis · leva 1 minuto · sem cartão</span>
          {adGame ? (
            <h1>{adIcon && <img className="lp-game-ic" src={adIcon} alt="" />}Sua conta de <span className="lime">{adGame.name}</span> parada vale dinheiro. Venda com segurança e receba no Pix.</h1>
          ) : (
            <h1>Aquela conta ou skin parada no seu jogo <span className="lime">vale dinheiro</span>. Venda com segurança e receba no Pix.</h1>
          )}
          <p className="lp-sub">Anuncie grátis e só pague quando vender. Quem compra paga antes e a Nexo guarda o dinheiro: sem calote, sem golpe do comprovante falso.</p>
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
            <h2>Crie sua conta grátis</h2>
            <p className="muted small">3 campos e pronto. A mesma conta serve para comprar e vender.</p>
          </div>
          <AuthForm mode="register" next={AFTER_SIGNUP} avatar={false} submitLabel={cta} />
          <ul className="lp-trust">
            <li><Icon name="shield" />Pagamento protegido</li>
            <li><Icon name="bolt" />Saque no Pix</li>
            <li><Icon name="verified" />Empresa com CNPJ</li>
          </ul>
        </div>

        <div className="lp-proof">
          <ul className="lp-checks">
            <li><Icon name="check" />Anunciar é grátis, sem mensalidade</li>
            <li><Icon name="check" />Taxa de {fee} só quando a venda é concluída</li>
            <li><Icon name="check" />Ganhe {ref} convidando amigos</li>
          </ul>
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
        <div className="lp-money">
          {[50, 100, 300].map((v) => (
            <div key={v} className="lp-card">
              <span className="muted small">Vendeu por</span>
              <b className="lp-money-v">{brl(v)}</b>
              <span className="muted small">Você recebe <b className="lime">{net(v)}</b></span>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>Não vendeu, não paga nada. Anunciar, editar e tirar do ar é sempre grátis.</p>
      </section>

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
          <h2>Comece a vender em 3 passos</h2>
        </div>
        <ol className="lp-steps">
          <li><span>1</span><div><b>Crie sua conta</b><p className="muted small">E-mail, nome de usuário e senha. Leva 1 minuto.</p></div></li>
          <li><span>2</span><div><b>Anuncie</b><p className="muted small">Escolha o jogo, coloque fotos e o preço. Grátis.</p></div></li>
          <li><span>3</span><div><b>Venda e receba</b><p className="muted small">O comprador confirma e o dinheiro cai no seu saldo para sacar no Pix.</p></div></li>
        </ol>
      </section>

      <section className="wrap lp-section">
        <div className="lp-invite">
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Ganhe sem vender nada</span>
            <h2>Chame seus amigos e ganhe {ref} de tudo que eles compram e vendem</h2>
            <p className="muted">Assim que criar a conta, você recebe o seu link de convite. Cada pedido concluído de quem entrar por ele rende {ref} para você, direto no saldo. Sai da taxa da Nexo: seu amigo não paga nada a mais.</p>
          </div>
          <div className="lp-invite-calc" aria-label="Exemplo de ganho com convite">
            <div><span>Seu amigo vende</span><b>R$ 1.000,00</b></div>
            <div><span>Você ganha</span><b className="lime">{refExample}</b></div>
            <div><span>Ele paga a mais</span><b>R$ 0,00</b></div>
          </div>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head"><h2>Dúvidas rápidas</h2></div>
        <div className="lp-faq">
          <details><summary>Criar conta e anunciar custa alguma coisa?</summary><p className="muted">Não. É grátis. Você só paga {fee} quando uma venda é concluída. Quem compra não paga taxa no Pix.</p></details>
          <details><summary>Como eu recebo o dinheiro das vendas?</summary><p className="muted">Quando o comprador confirma a entrega (ou o prazo de garantia termina sem problema), o valor vai para o seu saldo e você saca por Pix.</p></details>
          <details><summary>Como sei que não vou levar calote?</summary><p className="muted">O comprador paga antes, e a Nexo guarda o dinheiro até a entrega ser confirmada. Se houver problema, a equipe analisa pela disputa.</p></details>
          <details><summary>Quem está por trás da Nexo?</summary><p className="muted">A Nexo é uma empresa brasileira registrada: {LEGAL.document}. Os termos de uso e a política de privacidade estão no rodapé.</p></details>
          <details><summary>Como funciona o convite?</summary><p className="muted">Em Conta → Convites você pega o seu link. Quem criar conta por ele fica ligado a você, e você ganha {ref} de cada pedido concluído dessa pessoa, comprando ou vendendo.</p></details>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-final">
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

      <LpStickyCta label={cta} />
    </div>
  );
}
