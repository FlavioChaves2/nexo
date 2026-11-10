import Link from "next/link";
import { FOUNDER } from "@/lib/titles";
import { Icon } from "./Icon";

// Vitrine vazia ou quase: em vez de "nada encontrado", dois caminhos reais.
// Quem compra deixa o pedido no Quero comprar; quem vende anuncia primeiro e disputa a vaga de Fundador.
// Visitante sem conta que quer vender vai para a landing de cadastro, já com o jogo no título.
export function EarlyShelf({ game, foundersLeft, logged, search, tipo }: { game?: { slug: string; name: string } | null; foundersLeft: number; logged: boolean; search?: string; tipo?: string }) {
  const q = game ? `?jogo=${game.slug}` : "";
  // O pedido já abre com o que a pessoa buscou (jogo, tipo e texto).
  const p = new URLSearchParams();
  if (game) p.set("jogo", game.slug);
  if (tipo) p.set("tipo", tipo);
  if (search) p.set("titulo", search);
  const pedido = `/quero-comprar/novo${p.size ? `?${p}` : ""}`;
  return (
    <div className="early">
      <div className="early-card">
        <span className="early-ic"><Icon name="search" /></span>
        <h3>{search ? <>Diga que você procura “{search}”</> : game ? `Diga o que você procura de ${game.name}` : "Diga o que você procura"}</h3>
        <p className="muted small">Leva 30 segundos: o que quer e quanto paga. Os vendedores mandam ofertas, você escolhe a melhor e só paga com a Garantia Nexo. Avisamos assim que chegar oferta.</p>
        <Link className="btn btn-primary" href={pedido}>Dizer o que procuro <Icon name="arrow" /></Link>
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
