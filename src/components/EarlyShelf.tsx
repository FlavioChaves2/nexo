import Link from "next/link";
import { FOUNDER } from "@/lib/titles";
import { Icon } from "./Icon";

// Vitrine vazia ou quase: em vez de "nada encontrado", dois caminhos reais.
// Quem compra deixa o pedido no Quero comprar; quem vende anuncia primeiro e disputa a vaga de Fundador.
// Visitante sem conta que quer vender vai para a landing de cadastro, já com o jogo no título.
export function EarlyShelf({ game, foundersLeft, logged }: { game?: { slug: string; name: string } | null; foundersLeft: number; logged: boolean }) {
  const q = game ? `?jogo=${game.slug}` : "";
  return (
    <div className="early">
      <div className="early-card">
        <span className="early-ic"><Icon name="search" /></span>
        <h3>{game ? `Procurando algo de ${game.name}?` : "Procurando algo?"}</h3>
        <p className="muted small">Diga o que quer e quanto paga. Os vendedores mandam ofertas e você escolhe a melhor, com o pagamento protegido.</p>
        <Link className="btn btn-primary" href={`/quero-comprar/novo${q}`}>Publicar pedido grátis</Link>
      </div>
      <div className="early-card sell">
        <span className="early-ic"><Icon name="tag" /></span>
        <h3>{game ? `Tem conta ou item de ${game.name}?` : "Tem algo para vender?"}</h3>
        <p className="muted small">
          Anuncie grátis e apareça aqui primeiro, sem concorrência.
          {foundersLeft > 0 && <> {FOUNDER.emoji} Restam <b>{foundersLeft} de {FOUNDER.maxHolders}</b> vagas de Fundador para quem concluir a primeira venda.</>}
        </p>
        <Link className="btn btn-ghost" href={logged ? "/vender" : `/comecar${q}`}>Ser o primeiro a vender</Link>
      </div>
    </div>
  );
}
