import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { WANTED_DAYS } from "@/lib/wanted";
import { Icon } from "@/components/Icon";
import { WantedForm } from "@/components/WantedForms";

export const metadata = { title: "Publicar pedido" };

export default async function NovoPedidoPage({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  await requireUser("/quero-comprar/novo");
  const [games, sp] = await Promise.all([db.game.findMany({ orderBy: { sort: "asc" }, select: { slug: true, name: true } }), searchParams]);
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap"><span className="eyebrow">Quero comprar</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Diga o que você procura</h1></div>
      </div>
      <div className="two-col">
        <WantedForm games={games} gameSlug={sp.jogo} />
        <aside className="stack">
          <div className="note"><Icon name="shield" /><span>Os vendedores mandam ofertas aqui. Ao aceitar, você paga pelo checkout normal e o dinheiro fica guardado até você receber.</span></div>
          <p className="muted small">O pedido fica aberto por {WANTED_DAYS} dias. Não coloque telefone, e-mail ou links.</p>
        </aside>
      </div>
    </div>
  );
}
