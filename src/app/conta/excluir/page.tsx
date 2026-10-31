import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { deleteBlockers } from "@/lib/delete-account";
import { DeleteAccount } from "@/components/DeleteAccount";

export const metadata = { title: "Excluir conta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ExcluirContaPage() {
  const me = await requireUser("/conta/excluir");
  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/conta">Conta</Link><span>/</span><span>Excluir conta</span></nav>
      <div className="order-head" style={{ paddingTop: 10 }}>
        <div className="grid-gap"><span className="eyebrow">Minha conta</span><h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Excluir conta</h1></div>
      </div>
      <div className="sup-wrap"><DeleteAccount blockers={await deleteBlockers(me.id)} /></div>
    </div>
  );
}
