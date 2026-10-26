import Link from "next/link";
import { Logo } from "./Logo";
import { TrustBadges } from "./TrustBadges";

export function Footer() {
  return (
    <footer>
      <div className="wrap foot-trust"><TrustBadges /></div>
      <div className="wrap foot">
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Logo />
          <p className="muted" style={{ maxWidth: "36ch" }}>
            De jogador para jogador. O dinheiro só chega ao vendedor depois que você recebe.
          </p>
        </div>
        <div>
          <h4>Comprar</h4>
          <ul>
            <li><Link href="/busca">Todos os anúncios</Link></li>
            <li><Link href="/busca?tipo=GIFT">Gift cards</Link></li>
            <li><Link href="/conta?aba=compras">Meus pedidos</Link></li>
          </ul>
        </div>
        <div>
          <h4>Vender</h4>
          <ul>
            <li><Link href="/vender">Criar anúncio</Link></li>
            <li><Link href="/conta?aba=vendas">Minhas vendas</Link></li>
            <li><Link href="/conta?aba=saldo">Saldo e saques</Link></li>
          </ul>
        </div>
        <div>
          <h4>Nexo</h4>
          <ul>
            <li><Link href="/ajuda">Central de ajuda</Link></li>
            <li><Link href="/termos">Termos de uso</Link></li>
            <li><Link href="/privacidade">Privacidade</Link></li>
          </ul>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© 2026 Nexo · Play. Trade. Repeat.</span>
        <span className="foot-pay">Pagamento via <b>Pix</b> ou <b>saldo Nexo</b> · processado pelo Asaas</span>
      </div>
    </footer>
  );
}
