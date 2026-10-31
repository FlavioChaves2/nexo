import Link from "next/link";
import { currentFeeBps } from "@/lib/attribution";
import { AUTO_CONFIRM_DAYS, daysLabel } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import { HeroArt } from "@/components/HeroArt";
import { Icon } from "@/components/Icon";

export const metadata = {
  title: "Como funciona a Garantia Nexo",
  description: "Compre contas, itens, moedas e gift cards de outros jogadores sem medo: o seu Pix fica retido pela Nexo até você confirmar que recebeu.",
};

const PRAZOS: [string, string, string][] = [
  ["Contas", `${daysLabel(AUTO_CONFIRM_DAYS.CONTA)}`, "Tempo para trocar o e-mail, a senha e conferir se o antigo dono não tenta recuperar."],
  ["Itens e serviços", `${daysLabel(AUTO_CONFIRM_DAYS.ITEM)}`, "Para aceitar a troca no jogo ou acompanhar o serviço combinado."],
  ["Moedas e gift cards", `${daysLabel(AUTO_CONFIRM_DAYS.GIFT)}`, "Código e recarga a gente confere na hora: é só resgatar."],
];

export default async function ComoFuncionaPage() {
  const feeNow = await currentFeeBps();
  const fee = (feeNow / 100).toString().replace(".", ",");
  return (
    <div className="wrap how">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Como funciona · Garantia Nexo</span>
          <h1>
            Compre de outro jogador
            <br />
            <em>sem medo.</em>
          </h1>
          <p>Seu Pix não vai direto para o vendedor. Ele fica guardado com a Nexo e só é liberado quando você confirma que recebeu do jeito que foi anunciado.</p>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/busca">Explorar ofertas <Icon name="arrow" /></Link>
            <a className="btn btn-ghost" href="#passos"><Icon name="shield" />Ver os 3 passos</a>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="section" id="passos">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Em 3 passos</span><h2>Do Pix até o item na sua mão</h2></div>
        </div>
        <div className="how-steps">
          <div className="panel how-step">
            <span className="how-n">1</span>
            <Icon name="shield" />
            <b>Você paga, a Nexo guarda</b>
            <p>Pague com Pix ou com o saldo Nexo. O valor fica <b>retido com a gente</b>, e o vendedor recebe o aviso para entregar.</p>
          </div>
          <div className="panel how-step">
            <span className="how-n">2</span>
            <Icon name="bolt" />
            <b>O vendedor entrega</b>
            <p>Na hora, se for <b>entrega automática</b>, ou pelo quadro de entrega do pedido. Tudo pelo chat do pedido, que fica gravado.</p>
          </div>
          <div className="panel how-step hl">
            <span className="how-n">3</span>
            <Icon name="check" />
            <b>Você confirma, ele recebe</b>
            <p>Testou e está tudo certo? Confirme. Só então o dinheiro vai para o vendedor. <b>Deu problema?</b> Abra uma disputa e o valor continua retido.</p>
          </div>
        </div>
        <div className="note how-problem">
          <Icon name="alert" />
          <span><b>E se der problema?</b> No pedido, toque em “Tive um problema”. O dinheiro fica parado, uma pessoa da equipe analisa a conversa e as provas, e decide: <b>libera ao vendedor</b> ou <b>devolve para você</b>. As duas partes leem o motivo da decisão.</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Prazo para conferir</span><h2>Quanto tempo você tem depois da entrega</h2></div>
        </div>
        <div className="how-prazos">
          {PRAZOS.map(([tipo, dias, por]) => (
            <div key={tipo} className="panel how-prazo">
              <span className="muted small">{tipo}</span>
              <b>{dias}</b>
              <p className="muted small">{por}</p>
            </div>
          ))}
        </div>
        <p className="muted small">Se você não confirmar nem abrir disputa dentro do prazo, a Nexo entende que deu tudo certo e libera ao vendedor. Com os planos VIP, você ganha mais dias.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Sua proteção</span><h2>O que cuida de você em cada compra</h2></div>
        </div>
        <div className="how-grid">
          <div className="panel box"><Icon name="verified" /><b>Vendedores verificados</b><p className="muted small">Para sacar, o vendedor confirma nome, CPF e idade. O selo de verificado aparece na loja.</p></div>
          <div className="panel box"><Icon name="chat" /><b>Conversa gravada</b><p className="muted small">Tudo que é combinado no chat do pedido fica salvo e serve de prova numa disputa.</p></div>
          <div className="panel box"><Icon name="star" /><b>Avaliações reais</b><p className="muted small">Só quem comprou pode avaliar. Nível e nota do vendedor aparecem em todo anúncio.</p></div>
          <div className="panel box"><Icon name="headset" /><b>Gente de verdade</b><p className="muted small">Disputas são decididas por uma pessoa da equipe, e o suporte atende por chat no site.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Opcional no checkout</span><h2>Quer ainda mais tranquilidade?</h2></div>
        </div>
        <div className="how-grid two">
          {(["VIP", "PREMIUM"] as const).map((k) => (
            <div key={k} className={`panel box how-plan${k === "PREMIUM" ? " hl" : ""}`}>
              <div className="row"><b>{PLANS[k].name}</b><span className="chip auto">+{(PLANS[k].bps / 100).toString().replace(".", ",")}%</span></div>
              <ul className="fee-list">{PLANS[k].perks.map((p) => <li key={p}><Icon name="check" /><span>{p}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="panel box how-never">
          <h3><Icon name="alert" /> Três regras para nunca cair em golpe</h3>
          <ol className="pix-how">
            <li><span>1</span><span><b>Nunca pague fora da Nexo.</b> Pix direto para o vendedor, WhatsApp ou “link de pagamento” não têm garantia nenhuma.</span></li>
            <li><span>2</span><span><b>Não confirme antes de testar.</b> Confirmar libera o dinheiro. Entre na conta, resgate o código, confira o item.</span></li>
            <li><span>3</span><span><b>Ninguém da Nexo pede sua senha</b> ou o código de 2 etapas. Desconfie de quem pedir, mesmo dizendo ser da equipe.</span></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="sell-band">
          <div className="stack" style={{ gap: 14 }}>
            <span className="eyebrow">E para quem vende?</span>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,32px)" }}>Anuncie de graça e receba sem dor de cabeça.</h2>
            <p>O comprador já pagou antes de você entregar, então não tem calote. Quando ele confirma, o valor entra no seu saldo e você saca por Pix. Quer vender mais rápido? Coloque o anúncio em <b>Órbita</b> e apareça no topo.</p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link>
              <Link className="btn btn-ghost" href="/conta/taxas">Taxas e prazos</Link>
            </div>
          </div>
          <div className="sell-facts">
            <div><b>R$ 0</b><span>para anunciar</span></div>
            <div><b>{fee}%</b><span>só quando vende</span></div>
            <div><b>Pix</b><span>para sacar</span></div>
          </div>
        </div>
      </section>

      <section className="section how-end">
        <h2>Ficou alguma dúvida?</h2>
        <p className="muted">Veja as perguntas mais comuns ou fale com uma pessoa da equipe.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-ghost" href="/ajuda">Central de ajuda</Link>
          <Link className="btn btn-primary" href="/suporte"><Icon name="headset" />Falar com o suporte</Link>
        </div>
      </section>
    </div>
  );
}
