import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { dateTime, money } from "@/lib/format";
import { REFERRAL_BPS } from "@/lib/referrals";
import { Icon } from "@/components/Icon";
import { CopyField } from "@/components/OrderPanel";

export const metadata = { title: "Convide e ganhe", robots: { index: false } };
export const dynamic = "force-dynamic";

const pct = `${(REFERRAL_BPS / 100).toString().replace(".", ",")}%`;

export default async function ConvitesPage() {
  const me = await requireUser("/conta/convites");
  const [base, invited, total, earnings] = await Promise.all([
    appUrl(),
    db.user.findMany({ where: { referredById: me.id }, select: { username: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.referralEarning.aggregate({ where: { referrerId: me.id }, _sum: { amountCents: true }, _count: true }),
    db.referralEarning.findMany({ where: { referrerId: me.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const link = `${base}/convite/${me.username}`;

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Convide e ganhe</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Ganhe {pct} de tudo que seus amigos movimentarem</h1>
          <p className="muted">Cada venda e cada compra concluída de quem entrou pelo seu link rende {pct} para você, direto no saldo. Para sempre.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack">
          <div className="panel box">
            <h3>Seu link de convite</h3>
            <CopyField value={link} label="Copiar meu link de convite" done="Link copiado! Agora é só mandar" aria="Seu link de convite" />
            <p className="hint">Mande no WhatsApp, Discord, grupo do jogo ou na bio. Quem abrir o link e criar a conta em até 30 dias fica ligado a você.</p>
          </div>
          <div className="panel box">
            <h3>Como funciona</h3>
            <ol className="pix-how">
              <li><span>1</span><span>Seu amigo cria a conta pelo seu link</span></li>
              <li><span>2</span><span>Ele compra ou vende na Nexo, e o pedido é concluído</span></li>
              <li><span>3</span><span>Você ganha <b>{pct} do valor</b> no seu saldo e recebe um aviso</span></li>
            </ol>
            <p className="hint">Quem paga a comissão é a Nexo, da taxa dela: seu amigo não paga nada a mais. Pedido cancelado ou reembolsado não gera comissão.</p>
          </div>
          {earnings.length > 0 && (
            <div className="panel">
              {earnings.map((e) => (
                <div key={e.id} className="notif">
                  <Icon name="heart" />
                  <div><b>+{money(e.amountCents)}</b><p className="muted small">{e.side === "COMPRA" ? "Compra" : "Venda"} de um convidado</p></div>
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
