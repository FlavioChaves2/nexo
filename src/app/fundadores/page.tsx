import Link from "next/link";
import { db } from "@/lib/db";
import { monthYear } from "@/lib/format";
import { FOUNDER, founderTitle } from "@/lib/titles";
import { Avatar } from "@/components/Avatar";
import { HeroArt } from "@/components/HeroArt";
import { Icon } from "@/components/Icon";

export const metadata = {
  title: "Seja um dos 20 Fundadores da Nexo",
  description: "Os 20 primeiros vendedores a concluir uma venda na Nexo ganham o título 👑 Fundador para sempre ao lado do nome.",
};
export const dynamic = "force-dynamic";

export default async function FundadoresPage() {
  const title = await founderTitle();
  const holders = await db.userTitle.findMany({
    where: { titleId: title.id },
    include: { user: { select: { username: true, storeName: true, avatarId: true } } },
    orderBy: { createdAt: "asc" },
  });
  const max = title.maxHolders ?? FOUNDER.maxHolders;
  const left = Math.max(0, max - holders.length);
  const seats = Array.from({ length: max }, (_, i) => holders[i]);

  return (
    <div className="wrap how founders">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Campanha dos Fundadores</span>
          <h1>
            20 vagas.
            <br />
            <em>Para sempre.</em>
          </h1>
          <p>Os 20 primeiros vendedores da Nexo ganham o título <b>👑 Fundador</b> ao lado do nome, em todo anúncio, card e na loja. Não tem sorteio nem inscrição: <b>concluiu a primeira venda, garantiu a vaga.</b> Só criar a conta ou anunciar ainda não vale.</p>
          <div className="hero-ctas">
            {left > 0 ? (
              <Link className="btn btn-primary" href="/vender">Garantir minha vaga <Icon name="arrow" /></Link>
            ) : (
              <Link className="btn btn-primary" href="/vender">Criar meu anúncio <Icon name="arrow" /></Link>
            )}
            <a className="btn btn-ghost" href="#vagas">Ver as vagas</a>
          </div>
          <div className="hero-meta">
            <span><b>{left}</b> {left === 1 ? "VAGA RESTANTE" : "VAGAS RESTANTES"}</span>
            <span><b>{holders.length}</b> DE {max} OCUPADAS</span>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="section" id="vagas">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Ao vivo</span><h2>{left > 0 ? `Restam ${left} de ${max} vagas` : "Todas as vagas foram ocupadas"}</h2></div>
        </div>
        <div className="fund-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={holders.length} aria-label="Vagas ocupadas">
          <span style={{ width: `${(holders.length / max) * 100}%` }} />
        </div>
        <div className="fund-seats">
          {seats.map((h, i) => (
            <div key={i} className={`panel fund-seat${h ? " taken" : ""}`}>
              <span className="fund-n">#{String(i + 1).padStart(2, "0")}</span>
              {h ? (
                <Link href={`/loja/${h.user.username}`} className="fund-who">
                  <Avatar user={h.user} />
                  <b>{h.user.storeName || h.user.username}</b>
                  <small className="muted">desde {monthYear(h.createdAt)}</small>
                </Link>
              ) : (
                <span className="fund-free">👑<small>Vaga livre</small></span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="grid-gap"><span className="eyebrow">Como garantir</span><h2>3 passos, e a vaga é sua</h2></div>
        </div>
        <div className="how-steps">
          <div className="panel how-step"><span className="how-n">1</span><Icon name="tag" /><b>Anuncie de graça</b><p>Crie a conta e publique conta, item, moeda, gift card ou serviço, de qualquer jogo da Nexo.</p></div>
          <div className="panel how-step"><span className="how-n">2</span><Icon name="bag" /><b>Faça a primeira venda</b><p>Entregue o pedido e espere o comprador confirmar (ou o prazo de conferência acabar).</p></div>
          <div className="panel how-step hl"><span className="how-n">3</span><Icon name="star" /><b>O 👑 é seu</b><p>Quando a venda é concluída e o dinheiro entra no seu saldo, se ainda houver vaga, o título aparece sozinho e você recebe um aviso. Para sempre.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="how-grid">
          <div className="panel box"><Icon name="verified" /><b>Selo para sempre</b><p className="muted small">O 👑 Fundador fica ao lado do seu nome em todo card, anúncio e na sua loja.</p></div>
          <div className="panel box"><Icon name="eye" /><b>Mais confiança</b><p className="muted small">Comprador vê que você está aqui desde o começo. Isso pesa na hora de escolher de quem comprar.</p></div>
          <div className="panel box"><Icon name="spark" /><b>Saia na frente</b><p className="muted small">Com pouca concorrência no início, seus anúncios aparecem mais e você junta avaliações antes de todo mundo.</p></div>
          <div className="panel box"><Icon name="shield" /><b>Venda protegida</b><p className="muted small">O comprador paga antes da entrega: não tem calote. Você recebe quando ele confirma.</p></div>
        </div>
        <p className="muted small">Regras: vale para contas reais (contas de teste não contam), uma vaga por pessoa, na ordem em que a primeira venda é concluída (pedido cancelado ou reembolsado não conta). Só criar a conta ou publicar anúncio não garante vaga. A equipe pode retirar o título de contas suspensas por golpe.</p>
      </section>

      <section className="section how-end">
        <h2>{left > 0 ? `Ainda dá tempo: ${left} ${left === 1 ? "vaga" : "vagas"}` : "As vagas acabaram, mas a Nexo está só começando"}</h2>
        <p className="muted">Anuncie de graça. Você só paga a taxa quando vende.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/vender"><Icon name="tag" />Criar meu anúncio</Link>
          <Link className="btn btn-ghost" href="/como-funciona">Como funciona</Link>
        </div>
      </section>
    </div>
  );
}
