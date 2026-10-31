import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { PROGRAM_STATUS, PROGRAM_STEPS } from "@/lib/admin-growth";
import { storeLink } from "@/lib/store";
import { AddToProgram, ProgramRow } from "@/components/admin/ProgramForms";

export const metadata = { title: "Primeiros vendedores" };
export const dynamic = "force-dynamic";

// Acompanhamento interno. Nada aqui é publicado: sem benefícios, vagas ou prazos até haver definição comercial.
export default async function ProgramaPage() {
  const [rows, admins, history] = await Promise.all([
    db.sellerProgram.findMany({
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, username: true, storeName: true, bio: true, avatarId: true, storeBannerId: true, completedSales: true, createdAt: true, _count: { select: { listings: { where: { status: "ATIVO", reservedForId: null } } } } } }, owner: { select: { username: true } } },
    }),
    db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, username: true } }),
    db.adminAction.findMany({ where: { kind: { startsWith: "PROGRAMA_" } }, orderBy: { createdAt: "desc" }, take: 20, include: { admin: { select: { username: true } } } }),
  ]);
  const firstSales = await db.order.groupBy({ by: ["sellerId"], where: { sellerId: { in: rows.map((r) => r.userId) }, status: "CONCLUIDO" }, _min: { completedAt: true } });
  const firstSale = new Map(firstSales.map((f) => [f.sellerId, f._min.completedAt]));
  const statuses = Object.entries(PROGRAM_STATUS);
  const steps = Object.entries(PROGRAM_STEPS) as [keyof typeof PROGRAM_STEPS, string][];

  return (
    <div className="stack">
      <div className="note"><span>Acompanhamento interno dos primeiros vendedores. Os dados ao lado de cada etapa vêm do site (anúncios, loja e vendas reais); o checklist é marcado pela equipe. Nada daqui aparece para o público, e nenhuma mensagem é enviada automaticamente.</span></div>
      <AddToProgram />
      {rows.length ? (
        <div className="panel list">
          {rows.map((r) => {
            const u = r.user;
            const storeParts = [u.avatarId && "foto", u.storeBannerId && "capa", u.bio && "descrição", u.storeName && "nome"].filter(Boolean);
            const fs = firstSale.get(u.id);
            const hints = {
              stepListings: `${u._count.listings} anúncio(s) ativo(s)`,
              stepStore: storeParts.length ? `tem ${storeParts.join(", ")}` : "loja sem foto, capa e descrição",
              stepMaterial: "imagem e link abaixo",
              stepFirstSale: fs ? `primeira venda concluída em ${dateTime(fs)}` : `${u.completedSales} venda(s) concluída(s)`,
            };
            return (
              <div key={r.id} className="list-row program-row">
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <b><Link className="lime" href={`/loja/${u.username}`}>{u.storeName || u.username}</Link> <span className="muted small">@{u.username} · na Nexo desde {dateTime(u.createdAt)} · responsável: {r.owner ? `@${r.owner.username}` : "ninguém"}</span></b>
                  <span className="small">Material: link <span className="mono">nexopoint.com.br{storeLink(u.username)}</span> · <a className="lime" href={`/loja/${u.username}/opengraph-image`} target="_blank" rel="noopener">imagem da loja (dados reais)</a></span>
                  <ProgramRow p={r} admins={admins} statuses={statuses} steps={steps} hints={hints} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="muted">Ninguém no programa ainda.</p>}
      {history.length > 0 && (
        <div className="panel list">
          {history.map((h) => (
            <div key={h.id} className="list-row" style={{ gridTemplateColumns: "1fr" }}>
              <div><b>{dateTime(h.createdAt)} · @{h.admin.username} · {h.label}</b><span className="muted small">{h.kind === "PROGRAMA_ENTRADA" ? "entrou no programa" : h.note}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
