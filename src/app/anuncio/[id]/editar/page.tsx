import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { feeBps } from "@/lib/format";
import { sellerPublic } from "@/lib/queries";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Editar anúncio" };

export default async function EditarAnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(`/anuncio/${id}/editar`);
  const [listing, games, seller] = await Promise.all([
    db.listing.findUnique({ where: { id }, include: { images: { select: { id: true }, orderBy: { sort: "asc" } } } }),
    db.game.findMany({ orderBy: { sort: "asc" } }),
    db.user.findUniqueOrThrow({ where: { id: me.id }, ...sellerPublic }),
  ]);
  if (!listing || listing.sellerId !== me.id || listing.status === "REMOVIDO") notFound();

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href={`/anuncio/${id}`}>← Voltar ao anúncio</Link></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap"><span className="eyebrow">Sua loja</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Editar anúncio</h1></div>
      </div>
      <ListingForm games={games} seller={seller} feeBps={feeBps()} edit={listing} />
    </div>
  );
}
