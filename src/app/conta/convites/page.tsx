import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { dateTime, money } from "@/lib/format";
import { REFERRAL_BPS, FIRST_SALE_BONUS_CENTS, FIRST_SALE_BONUS_MIN_CENTS } from "@/lib/referrals";
import { WELCOME_FEE_HOURS } from "@/lib/welcome-fee";
import { Icon } from "@/components/Icon";
import { CopyField } from "@/components/OrderPanel";

export const metadata = { title: "Convide e ganhe", robots: { index: false } };
export const dynamic = "force-dynamic";

const pct = `${(REFERRAL_BPS / 100).toString().replace(".", ",")}%`;
const bonus = money(FIRST_SALE_BONUS_CENTS);

export default async function ConvitesPage() {
  const me = await requireUser("/conta/convites");
  const [base, invited, total, earnings] = await Promise.all([
    appUrl(),
    db.user.findMany({ where: { referredById: me.id }, select: { username: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.referralEarning.aggregate({ where: { referrerId: me.id }, _sum: { amountCents: true }, _count: true }),
    db.referralEarning.findMany({ where: { referrerId: me.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const link = `${base}/convite/${me.username}`;
  // Mensagem pronta para mandar: o argumento que mais convence o amigo é vender sem taxa nos primeiros dias.
  const pitch = `Tô vendendo na Nexo: anúncio grátis, pagamento protegido e saque no Pix. Conta nova vende com TAXA ZERO nos primeiros ${WELCOME_FEE_HOURS / 24} dias. Cria a sua por aqui: ${link}`;

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Convide e ganhe</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Ganhe <span className="lime">{bonus}</span> por amigo que vender, e mais {pct} de tudo que ele movimentar</h1>
          <p className="muted">Seu amigo concluiu a primeira venda? {bonus} no seu saldo. E toda compra e venda concluída dele rende {pct} para você, para sempre. Ele ainda vende com <b>taxa zero</b> nos primeiros {WELCOME_FEE_HOURS / 24} dias.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack">
          <div className="panel box">
            <h3>Seu link de convite</h3>
            <CopyField value={link} label="Copiar meu link de convite" done="Link copiado! Agora é só mandar" aria="Seu link de convite" />
            <div className="share-row">
              <a className="btn btn-primary" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(pitch)}`} target="_blank" rel="noopener noreferrer"><Icon name="send" />Mandar no WhatsApp</a>
              <a className="btn btn-ghost" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(pitch.replace(` Cria a sua por aqui: ${link}`, ""))}`} target="_blank" rel="noopener noreferrer"><Icon name="send" />Telegram</a>
            </div>
            <CopyField value={pitch} label="Copiar mensagem pronta" done="Mensagem copiada! Cole no grupo ou no Discord" aria="Mensagem de convite pronta" />
            <p className="hint">Mande no WhatsApp, Discord, grupo do jogo ou na bio. Quem abrir o link e criar a conta em até 30 dias fica ligado a você.</p>
          </div>
          <div className="panel box">
            <h3>Como funciona</h3>
            <ol className="pix-how">
              <li><span>1</span><span>Seu amigo cria a conta pelo seu link</span></li>
              <li><span>2</span><span>Ele anuncia e vende com taxa zero nos primeiros {WELCOME_FEE_HOURS / 24} dias</span></li>
              <li><span>3</span><span>Primeira venda concluída: <b>{bonus} de bônus</b> no seu saldo</span></li>
              <li><span>4</span><span>E <b>{pct} do valor</b> de cada compra e venda dele, para sempre</span></li>
            </ol>
            <p className="hint">Quem paga a comissão é a Nexo, da taxa dela: seu amigo não paga nada a mais. Pedido cancelado ou reembolsado não gera comissão. O bônus de {bonus} vale para a primeira venda de pelo menos {money(FIRST_SALE_BONUS_MIN_CENTS)} do convidado, comprada por outra pessoa (não por você), com limite de 20 bônus por mês.</p>
          </div>
          {earnings.length > 0 && (
            <div className="panel">
              {earnings.map((e) => (
                <div key={e.id} className="notif">
                  <Icon name="heart" />
                  <div><b>+{money(e.amountCents)}</b><p className="muted small">{e.side === "BONUS" ? "Bônus: primeira venda de um convidado" : `${e.side === "COMPRA" ? "Compra" : "Venda"} de um convidado`}</p></div>
                  <span className="muted small">{dateTime(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="stack">
          <div className="panel box">
            <div className="qc-stats" style={{ paddingTop: 0 }}>
              <div><b>{invited.length}</b><span>{invited.length === 1 ? "amigo convidado" : "amigos convidados"}</span></div>
              <div><b>{money(total._sum.amountCents ?? 0)}</b><span>ganhos com convites</span></div>
            </div>
          </div>
          <div className="panel box">
            <h3>Quem entrou pelo seu link</h3>
            {invited.length ? (
              <ul className="fee-list">
                {invited.map((u) => <li key={u.username}><Icon name="user" /><span><b>{u.username}</b> <span className="muted small">· {dateTime(u.createdAt)}</span></span></li>)}
              </ul>
            ) : (
              <p className="muted small">Ninguém ainda. Mande seu link para os amigos!</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
