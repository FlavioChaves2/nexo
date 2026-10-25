import Link from "next/link";
import { db } from "@/lib/db";
import { money, dateTime } from "@/lib/format";
import { Art } from "@/components/Art";
import { ReportsReview } from "@/components/admin/TrustAdminForms";

export const metadata = { title: "Denúncias" };

export default async function DenunciasPage() {
  // Agrupa as denúncias abertas por anúncio: o mais denunciado primeiro.
  const listings = await db.listing.findMany({
    where: { reports: { some: { status: "ABERTA" } } },
    include: {
      game: true,
      seller: { select: { username: true } },
      reports: { where: { status: "ABERTA" }, include: { reporter: { select: { username: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  listings.sort((a, b) => b.reports.length - a.reports.length);

  if (!listings.length) return <div className="panel empty"><p className="muted">Nenhuma denúncia aberta.</p></div>;

  return (
    <div className="stack">
      <p className="hint">Anúncios com 3 denúncias saem do ar sozinhos até você decidir. Descartar coloca de volta no ar.</p>
      {listings.map((l) => (
        <div key={l.id} className="panel box">
          <div className="list-row" style={{ padding: 0, border: 0 }}>
            <div className="thumb"><Art game={l.game} glyph={l.glyph} showName={false} /></div>
            <div>
              <Link href={`/anuncio/${l.id}`}><b>{l.title}</b></Link>
              <span className="muted small">
                {money(l.priceCents)} · por <Link className="lime" href={`/loja/${l.seller.username}`}>{l.seller.username}</Link>
                {l.status === "REMOVIDO" ? " · fora do ar" : ""}
              </span>
            </div>
            <span className="chip bad">{l.reports.length} denúncia{l.reports.length > 1 ? "s" : ""}</span>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            {l.reports.map((r) => (
              <div key={r.id} className="review">
                <div className="row"><b>{r.reason}</b><span className="muted small">{r.reporter.username} · {dateTime(r.createdAt)}</span></div>
                {r.details && <p className="small">{r.details}</p>}
              </div>
            ))}
          </div>
          <ReportsReview listingId={l.id} />
        </div>
      ))}
    </div>
  );
}
