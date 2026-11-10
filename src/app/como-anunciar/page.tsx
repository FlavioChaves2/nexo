import Link from "next/link";
import { currentFeeBps } from "@/lib/attribution";
import { Icon } from "@/components/Icon";

export const metadata = {
  title: "Como anunciar na Nexo: passo a passo",
  description: "Anuncie sua conta, skin, moeda ou gift card em 1 minuto: escolha o jogo, o tipo, escreva um bom título e coloque uma foto. Anunciar é grátis.",
};

// Os 5 tipos do formulário, explicados com exemplos (muita gente escolhia "Moeda" para vender conta).
const TIPOS: [string, string][] = [
  ["Conta", "A conta inteira: login do jogo com tudo que tem nela. Ex.: conta Free Fire nível 70."],
  ["Item", "Uma skin, arma, personagem ou item que você entrega dentro do jogo."],
  ["Moeda", "Diamantes, Robux, V-Bucks, gold, pontos. Só a moeda, não a conta."],
  ["Gift card", "Código de recarga ou cartão presente: Google Play, Steam, PSN, Xbox…"],
  ["Serviço", "Você faz por alguém: upar conta, subir de elo, completar missão."],
];

const EXEMPLOS: [string, string][] = [
  ["Jogo fre tiro", "Conta Free Fire nível 70 · 40 skins · 2 passes"],
  ["vendo conta", "Conta Valorant Diamante 3 · 22 skins · Vandal Reaver"],
  ["robux barato", "800 Robux · entrega em até 1 hora"],
];

export default async function ComoAnunciarPage() {
  const fee = ((await currentFeeBps()) / 100).toString().replace(".", ",");
  return (
    <div className="wrap how guide">
      <section className="section guide-hero">
        <span className="eyebrow">Passo a passo · para quem vende</span>
        <h1>Seu anúncio no ar <em>em 1 minuto.</em></h1>
        <p className="muted">São só 4 coisas: o jogo, o tipo, um título com preço e uma foto. Anunciar é <b>grátis</b>, e nos 3 primeiros dias da sua conta a taxa é <b>zero</b>. Depois, {fee}% só quando vender.</p>
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link>
          <a className="btn btn-ghost" href="#passo-1">Ver os 4 passos</a>
        </div>
      </section>

      <section className="section guide-steps">
        <div className="panel guide-step" id="passo-1">
          <span className="guide-n">1</span>
          <div className="guide-copy">
            <b>Escolha o jogo</b>
            <p>Toque no campo <b>Jogo</b> e digite o nome, por exemplo <b>Free Fire</b>. Escolha na lista. Se não achar, escolha <b>Outros jogos</b> e diga qual é no título.</p>
          </div>
          <div className="guide-mock" aria-hidden="true">
            <span className="guide-label">Jogo</span>
            <div className="guide-input focus">free fi<span className="guide-caret" /></div>
            <div className="guide-list"><div className="on">Free Fire</div><div>Free Fire MAX</div></div>
          </div>
        </div>

        <div className="panel guide-step">
          <span className="guide-n">2</span>
          <div className="guide-copy">
            <b>Escolha o tipo certo</b>
            <p>É o que o comprador recebe. Escolher errado faz o anúncio sumir da busca.</p>
            <ul className="guide-types">
              {TIPOS.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
            </ul>
          </div>
        </div>

        <div className="panel guide-step">
          <span className="guide-n">3</span>
          <div className="guide-copy">
            <b>Título que vende, descrição e preço</b>
            <p>No título, diga <b>o que é + o que tem de melhor</b>. Na descrição, conte o que vem junto e como você entrega (mínimo de 20 letras). No preço, olhe quanto anúncios parecidos cobram.</p>
            <div className="guide-compare">
              <div className="guide-col bad"><span><Icon name="alert" /> Assim ninguém acha</span>{EXEMPLOS.map(([b]) => <div key={b}>{b}</div>)}</div>
              <div className="guide-col good"><span><Icon name="check" /> Assim vende</span>{EXEMPLOS.map(([, g]) => <div key={g}>{g}</div>)}</div>
            </div>
          </div>
        </div>

        <div className="panel guide-step hl">
          <span className="guide-n">4</span>
          <div className="guide-copy">
            <b>Coloque uma foto e publique</b>
            <p>Um <b>print da conta</b> (nível, skins, inventário) ou do item. Anúncio com foto passa muito mais confiança. Depois é só tocar em <b>Publicar anúncio</b>: ele aparece na hora.</p>
            <p className="small">Quando alguém comprar, você recebe o aviso. O dinheiro do comprador já fica guardado com a Nexo, então <b>não tem calote</b>: você entrega pelo chat do pedido e recebe quando ele confirmar.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="how-grid two">
          <div className="panel box">
            <h3><Icon name="check" /> Pode anunciar</h3>
            <ul className="fee-list">
              <li><Icon name="check" /><span>Contas de jogos que são suas</span></li>
              <li><Icon name="check" /><span>Skins, itens e personagens</span></li>
              <li><Icon name="check" /><span>Moedas: diamantes, Robux, V-Bucks, gold</span></li>
              <li><Icon name="check" /><span>Gift cards e códigos de recarga</span></li>
              <li><Icon name="check" /><span>Serviços de jogo: upar, subir de elo</span></li>
            </ul>
          </div>
          <div className="panel box">
            <h3><Icon name="alert" /> Não pode anunciar</h3>
            <ul className="fee-list guide-no">
              <li><Icon name="alert" /><span>Produto físico (roupa, capacete, celular…) ou qualquer coisa fora de jogos</span></li>
              <li><Icon name="alert" /><span>Conta roubada, hackeada ou que não é sua</span></li>
              <li><Icon name="alert" /><span>Hack, cheat, bot ou programa para burlar o jogo</span></li>
              <li><Icon name="alert" /><span>Telefone, @ ou link de WhatsApp no anúncio: tudo é pela Nexo</span></li>
            </ul>
            <p className="muted small">Regras completas nos <Link className="lime" href="/termos">Termos de uso</Link>.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="panel box">
          <h3>Dicas para vender mais rápido</h3>
          <ol className="pix-how">
            <li><span>1</span><span><b>Preço justo.</b> Busque o jogo na Nexo e veja quanto cobram por algo parecido.</span></li>
            <li><span>2</span><span><b>Responda rápido.</b> Fique de olho nas notificações e no e-mail: quem responde primeiro vende primeiro.</span></li>
            <li><span>3</span><span><b>Gift card e código?</b> Marque <b>Entrega automática</b> e deixe os códigos no anúncio: o comprador recebe na hora, até de madrugada.</span></li>
            <li><span>4</span><span><b>Veja os pedidos.</b> Em <Link className="lime" href="/quero-comprar">Quero comprar</Link>, compradores dizem o que procuram. Mande uma oferta.</span></li>
          </ol>
        </div>
      </section>

      <section className="section how-end">
        <h2>Pronto para anunciar?</h2>
        <p className="muted">Leva 1 minuto. Se travar em alguma parte, fale com a gente.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link>
          <Link className="btn btn-ghost" href="/suporte"><Icon name="headset" />Falar com o suporte</Link>
        </div>
      </section>
    </div>
  );
}
