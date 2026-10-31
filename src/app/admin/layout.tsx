import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: { default: "Admin", template: "%s · Admin Nexo" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [disputes, withdrawals, reports, verifications, support, external] = await Promise.all([
    db.order.count({ where: { status: "DISPUTA" } }),
    db.withdrawal.count({ where: { status: "PENDENTE" } }),
    db.listing.count({ where: { reports: { some: { status: "ABERTA" } } } }),
    db.user.count({ where: { verification: "PENDENTE" } }),
    db.supportTicket.count({ where: { status: "ABERTO", waiting: true } }),
    db.externalProfile.count({ where: { status: "PENDENTE" } }),
  ]);
  return (
    <div className="wrap">
      <div className="order-head">
        <div className="grid-gap">
          <span className="eyebrow">Equipe Nexo</span>
          <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Painel de admin</h1>
        </div>
      </div>
      <div className="section" style={{ paddingTop: 18 }}>
        <AdminNav disputes={disputes} withdrawals={withdrawals} reports={reports} verifications={verifications} support={support} external={external} />
        {children}
      </div>
    </div>
  );
}
