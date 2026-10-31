import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { feeBps } from "@/lib/format";
import { REF_COOKIE, REFERRAL_BPS } from "@/lib/referrals";
import { FOUNDER } from "@/lib/titles";
import { gameIcon, MOST_SEARCHED } from "@/lib/game-art";
import { LEGAL } from "@/lib/legal";
import { AuthForm } from "@/components/AuthForm";
import { NexoSymbol, LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Landing page das campanhas de marketing: só cadastro, sem menu do site.
// Fica fora do menu e do sitemap, e pede para o Google não mostrar.
export const metadata: Metadata = {
  title: "Crie sua conta grátis e venda seus itens de jogo",
  description: "Anuncie grátis contas, skins, moedas e gift cards. Pagamento protegido, saque por Pix e 3% de comissão convidando amigos.",
  robots: { index: false, follow: false },
};

const AFTER_SIGNUP = "/conta/perfil";
const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;

export default async function ComecarPage() {
  if (await getCurrentUser()) redirect(AFTER_SIGNUP);
  const refId = (await cookies()).get(REF_COOKIE)?.value;
  const [inviter, founders, games] = await Promise.all([
    refId ? db.user.findUnique({ where: { id: refId }, select: { username: true, storeName: true } }) : null,
    db.userTitle.count({ where: { title: { auto: FOUNDER.auto } } }),
    db.game.findMany({ where: { slug: { in: MOST_SEARCHED } }, select: { slug: true, name: true } }),
  ]);
  const foundersLeft = Math.max(0, FOUNDER.maxHolders - founders);
  const fee = pct(feeBps());
  const ref = pct(REFERRAL_BPS);
  const refExample = ((1000 * REFERRAL_BPS) / 10000).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const ordered = MOST_SEARCHED.map((s) => games.find((g) => g.slug === s)).filter((g) => g && gameIcon(g.slug));

  const benefits = [
    { icon: "tag", title: "Anunciar é grátis", text: "Crie quantos anúncios quiser. Sem mensalidade e sem taxa para publicar." },
    { icon: "diamond", title: `Só ${fee} quando vende`, text: `Vendeu R$ 100? Você recebe R$ ${(100 - feeBps() / 100).toFixed(2).replace(".", ",")}. Não vendeu, não paga nada.` },
    { icon: "shield", title: "Sem calote", text: "O comprador paga antes de você entregar. O dinheiro fica guardado pela Nexo." },
    { icon: "bolt", title: "Saque por Pix", text: "Venda confirmada, o valor vai para o seu saldo e você saca direto no Pix." },
    { icon: "heart", title: `Convide e ganhe ${ref}`, text: "Ganhe uma parte de cada compra e venda dos amigos que entrarem pelo seu link." },
    { icon: "star", title: `${FOUNDER.emoji} Seja Fundador`, text: foundersLeft > 0 ? `Os ${FOUNDER.maxHolders} primeiros a vender ganham o título para sempre. Restam ${foundersLeft}.` : "Ganhe selos e títulos conforme vende e cresce na Nexo." },
  ] as const;

  return (
    <div className="lp">
      <div className="wrap lp-top">
        <span className="logo" aria-label="Nexo"><NexoSymbol /><LogoMark /></span>
        <Link className="btn btn-ghost btn-sm" href={`/entrar?next=${encodeURIComponent(AFTER_SIGNUP)}`}>Já tenho conta</Link>
      </div>

      <section className="wrap lp-hero">
        <div className="lp-pitch">
          <span className="eyebrow">Cadastro grátis · leva 1 minuto</span>
          <h1>Venda seus itens de jogo com segurança e <span className="lime">receba no Pix</span>.</h1>
          <p className="lp-sub">Contas, skins, moedas, gift cards e serviços de mais de 190 jogos. Anuncie grátis e só pague quando vender.</p>
          <ul className="lp-checks">
            <li><Icon name="check" />Anúncio grátis, taxa de {fee} só na venda</li>
            <li><Icon name="check" />Comprador paga antes, você nunca leva calote</li>
            <li><Icon name="check" />Ganhe {ref} convidando amigos</li>
          </ul>
          {ordered.length > 0 && (
            <div className="lp-games" aria-label="Alguns jogos aceitos">
              {ordered.map((g) => <img key={g!.slug} src={gameIcon(g!.slug)!} alt={g!.name} title={g!.name} />)}
              <span>+190 jogos</span>
            </div>
          )}
        </div>

        <div className="lp-form" id="cadastro">
          {inviter && <div className="note"><Icon name="heart" /><span>Você foi convidado por <b>{inviter.storeName || inviter.username}</b>. Bem-vindo à Nexo!</span></div>}
          <div className="lp-form-head">
            <h2>Crie sua conta grátis</h2>
            <p className="muted small">A mesma conta serve para comprar e vender.</p>
          </div>
          <AuthForm mode="register" next={AFTER_SIGNUP} />
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head">
          <span className="eyebrow">Por que a Nexo</span>
          <h2>Tudo o que você ganha ao criar sua conta</h2>
        </div>
        <div className="lp-benefits">
          {benefits.map((b) => (
            <div key={b.title} className="lp-card">
              <span className="lp-ic"><Icon name={b.icon} /></span>
              <h3>{b.title}</h3>
              <p className="muted small">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-invite">
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Convite de afiliado</span>
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
        <div className="lp-head">
          <span className="eyebrow">Simples assim</span>
          <h2>Comece a vender em 3 passos</h2>
        </div>
        <ol className="lp-steps">
          <li><span>1</span><div><b>Crie sua conta</b><p className="muted small">E-mail, nome de usuário e senha. Pronto.</p></div></li>
          <li><span>2</span><div><b>Anuncie</b><p className="muted small">Escolha o jogo, coloque fotos e o preço.</p></div></li>
          <li><span>3</span><div><b>Venda e receba</b><p className="muted small">O comprador confirma e o dinheiro cai no seu saldo para sacar no Pix.</p></div></li>
        </ol>
      </section>

      <section className="wrap lp-section">
        <div className="lp-head"><h2>Dúvidas rápidas</h2></div>
        <div className="lp-faq">
          <details><summary>Criar conta e anunciar custa alguma coisa?</summary><p className="muted">Não. É grátis. Você só paga {fee} quando uma venda é concluída. Quem compra não paga taxa no Pix.</p></details>
          <details><summary>Como eu recebo o dinheiro das vendas?</summary><p className="muted">Quando o comprador confirma a entrega (ou o prazo de garantia termina sem problema), o valor vai para o seu saldo e você saca por Pix.</p></details>
          <details><summary>Como sei que não vou levar calote?</summary><p className="muted">O comprador paga antes, e a Nexo guarda o dinheiro até a entrega ser confirmada. Se houver problema, a equipe analisa pela disputa.</p></details>
          <details><summary>Como funciona o convite?</summary><p className="muted">Em Conta → Convites você pega o seu link. Quem criar conta por ele fica ligado a você, e você ganha {ref} de cada pedido concluído dessa pessoa, comprando ou vendendo.</p></details>
        </div>
      </section>

      <section className="wrap lp-section">
        <div className="lp-final">
          <h2>Seu próximo item vendido começa aqui</h2>
          <a className="btn btn-primary btn-lg" href="#cadastro">Criar minha conta grátis <Icon name="arrow" /></a>
        </div>
      </section>

      <footer className="wrap lp-foot">
        <span>© 2026 {LEGAL.brand} · {LEGAL.document}</span>
        <span><Link href="/termos" target="_blank">Termos de uso</Link> · <Link href="/privacidade" target="_blank">Privacidade</Link></span>
      </footer>
    </div>
  );
}
