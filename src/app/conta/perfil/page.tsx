import Link from "next/link";
import { titlesSelect } from "@/lib/titles";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LEVEL_TABLE, avgRating, nextLevel, sellerLevel } from "@/lib/reputation";
import { ProfileForm } from "@/components/SocialForms";
import { SellerBadges } from "@/components/SellerBadges";

export const metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const me = await requireUser("/conta/perfil");
  const u = await db.user.findUniqueOrThrow({ where: { id: me.id }, include: titlesSelect });
  const level = sellerLevel(u);
  const next = nextLevel(u);
  const avg = avgRating(u);

  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap"><span className="eyebrow">Minha conta</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Meu perfil</h1></div>
        <Link className="btn btn-ghost btn-sm" href={`/loja/${u.username}`}>Ver minha loja</Link>
      </div>
      <div className="two-col">
        <div className="stack">
          <ProfileForm username={u.username} storeName={u.storeName} bio={u.bio} avatarId={u.avatarId} bannerId={u.storeBannerId} storeHours={u.storeHours} />
          <Link className="linkish small danger-link" href="/conta/excluir">Quero excluir minha conta →</Link>
        </div>
        <aside className="stack buybox">
          <div className="panel box">
            <div className="row"><h3>Seu nível</h3><span className="row" style={{ gap: 6 }}><SellerBadges rep={u} /></span></div>
            <dl className="kv">
              <dt>Vendas concluídas</dt><dd>{u.completedSales}</dd>
              <dt>Nota média</dt><dd>{u.ratingCount ? `${avg.toFixed(1).replace(".", ",")} (${u.ratingCount})` : "—"}</dd>
            </dl>
            {next ? (
              <p className="note small">
                Para chegar a <b>{next.name}</b>: {next.salesLeft > 0 ? `mais ${next.salesLeft} venda(s)` : "vendas ok"}
                {next.avg ? ` e nota média ${next.avg.toFixed(1).replace(".", ",")} ou mais` : ""}.
              </p>
            ) : (
              <p className="note small">Você está no nível máximo.</p>
            )}
            <table className="small" style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {LEVEL_TABLE.map((l) => (
                  <tr key={l.name} style={{ opacity: l.name === level.name ? 1 : 0.6 }}>
                    <td style={{ padding: "4px 0" }}><span className={`level ${l.cls}`}>{l.name}</span></td>
                    <td className="muted">{l.sales}+ vendas{l.avg ? ` · nota ${l.avg.toFixed(1).replace(".", ",")}+` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {u.verification !== "APROVADO" && <Link className="linkish small" href="/conta?aba=saldo">Ganhe o selo de verificado →</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
