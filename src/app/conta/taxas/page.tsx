import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { feeBps } from "@/lib/format";
import { AUTO_CONFIRM_DAYS, TYPE_PLURAL } from "@/lib/constants";
import { REFERRAL_BPS } from "@/lib/referrals";
import { Icon } from "@/components/Icon";
import { FeeSimulator } from "@/components/FeeSimulator";

export const metadata = { title: "Taxas para vendedores", robots: { index: false } };

const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;

export default async function TaxasPage() {
  await requireUser("/conta/taxas");
  const fee = feeBps();
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Área do vendedor</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Taxas e prazos</h1>
          <p className="muted">Tudo o que a Nexo cobra de quem vende, sem letra miúda.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack">
          <div className="panel box fee-hero">
            <span className="muted small">Taxa por venda concluída</span>
            <b className="fee-big">{pct(fee)}</b>
            <ul className="fee-list">
              <li><Icon name="check" /><span><b>Anunciar é grátis.</b> Sem mensalidade, sem taxa de cadastro e sem cobrança por anúncio parado.</span></li>
              <li><Icon name="check" /><span>A taxa só é descontada <b>quando a venda é concluída</b>. Pedido cancelado ou reembolsado não paga nada.</span></li>
              <li><Icon name="check" /><span><b>Cupons de desconto são pagos pela Nexo.</b> Você recebe sobre o preço cheio do anúncio.</span></li>
              <li><Icon name="check" /><span><b>Planos VIP e taxas do comprador</b> são pagos por ele e não mudam o seu valor.</span></li>
              <li><Icon name="check" /><span><b>Saque por Pix sem taxa</b>, para a chave CPF da sua conta verificada. Mínimo de R$ 10,00.</span></li>
            </ul>
          </div>

          <div className="panel box">
            <h3>Quando o dinheiro fica disponível</h3>
            <p className="muted small">Depois da entrega, o comprador tem um prazo para conferir. Se ele confirmar antes, o dinheiro entra na hora. Sem resposta, a confirmação é automática no fim do prazo:</p>
            <dl className="kv">
              {Object.entries(AUTO_CONFIRM_DAYS).map(([type, days]) => (
                <span key={type} style={{ display: "contents" }}><dt>{TYPE_PLURAL[type]}</dt><dd>{days === 1 ? "1 dia" : `${days} dias`}</dd></span>
              ))}
            </dl>
            <p className="hint">Compradores com plano VIP ganham +2 dias (VIP) ou +5 dias (VIP Premium) para conferir.</p>
          </div>

          <div className="panel box">
            <h3>Ganhe mais convidando</h3>
            <p className="muted small">Traga amigos para a Nexo e ganhe <b>{pct(REFERRAL_BPS)} de cada venda e de cada compra</b> concluída deles, para sempre. Quem paga é a Nexo: seus convidados não pagam nada a mais.</p>
            <div><Link className="btn btn-primary btn-sm" href="/conta/convites">Pegar meu link de convite</Link></div>
          </div>
        </div>
        <aside className="stack">
          <FeeSimulator feeBps={fee} />
          <div className="note"><Icon name="shield" /><span>Esta página só aparece para quem está logado. As taxas podem mudar; você é avisado antes.</span></div>
        </aside>
      </div>
    </div>
  );
}
