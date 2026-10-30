import { getCurrentUser } from "@/lib/auth";
import { pushPublicKey } from "@/lib/push";
import { Icon } from "@/components/Icon";
import { Nexinho3D } from "@/components/Nexinho3D";
import { InstallButton, PushToggle } from "@/components/InstallApp";

export const metadata = { title: "Baixe o app da Nexo", description: "Instale o app da Nexo no celular e receba aviso na hora de vendas, ofertas e entregas." };

const PERKS = [
  { icon: "bell", t: "Aviso na hora", d: "Venda, oferta no seu pedido, entrega e dinheiro liberado chegam como notificação." },
  { icon: "bolt", t: "Abre num toque", d: "Ícone na tela inicial, tela cheia e sem barra do navegador." },
  { icon: "shield", t: "Mesma segurança", d: "Mesma conta, mesmo saldo e a Garantia Nexo em todo pedido." },
  { icon: "spark", t: "Leve e grátis", d: "Não ocupa quase nada e se atualiza sozinho. Sem loja e sem cadastro extra." },
] as const;

export default async function AppPage() {
  const user = await getCurrentUser();
  return (
    <div className="wrap">
      <section className="qc-hero app-hero">
        <div className="qc-copy">
          <span className="qc-badge"><Icon name="bolt" />App oficial</span>
          <h1>A Nexo no seu <span className="qc-shine">bolso.</span></h1>
          <p className="muted">Instale grátis em segundos, direto do site. Funciona no Android, no iPhone e no computador.</p>
          <InstallButton />
          <PushToggle publicKey={pushPublicKey()} loggedIn={!!user} />
        </div>
        <div className="app-phone" aria-hidden="true">
          <div className="app-screen">
            <img src="/app/icon-192.png" alt="" />
            <b>Nexo</b>
            <div className="app-notif"><img src="/app/icon-192.png" alt="" /><div><b>Você vendeu! 💸</b><span>Conta Valorant Diamante · R$ 149,90</span></div></div>
            <div className="app-notif d2"><img src="/app/icon-192.png" alt="" /><div><b>Nova oferta: R$ 140,00</b><span>ffcenter respondeu seu pedido</span></div></div>
          </div>
          <Nexinho3D className="app-bot" decor={false} zoom={10} label="Nexinho" />
        </div>
      </section>
      <ul className="qc-steps app-perks">
        {PERKS.map((p) => <li key={p.t}><Icon name={p.icon} /><b>{p.t}</b><span className="muted small">{p.d}</span></li>)}
      </ul>
    </div>
  );
}
