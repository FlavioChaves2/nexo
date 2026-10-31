import { db } from "@/lib/db";
import { visibleListing } from "@/lib/queries";
import { GamesBrowser } from "@/components/GamesBrowser";

export const metadata = {
  title: "Todos os jogos",
  description: "Contas, itens, moedas, gift cards e serviços de centenas de jogos, com o pagamento protegido pela Garantia Nexo.",
};
export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const games = await db.game.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true, letter: true, c1: true, sort: true, _count: { select: { listings: { where: visibleListing } } } },
  });
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Escolha seu universo</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Todos os jogos</h1>
          <p className="muted">{games.length} jogos, lojas e gift cards. Não achou o seu? Anuncie em “Outros jogos” e diga qual é no título.</p>
        </div>
      </div>
      <GamesBrowser games={games.map((g) => ({ slug: g.slug, name: g.name, letter: g.letter, c1: g.c1, popular: g.sort < 30, count: g._count.listings }))} />
    </div>
  );
}
