import Link from "next/link";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/email";

export const metadata = { title: "Confirmar e-mail" };
export const dynamic = "force-dynamic";

export default async function VerificarEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const userId = await consumeToken((await searchParams).token ?? "", "VERIFY");
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return (
    <div className="wrap">
      <div className="auth panel empty">
        <span className="eyebrow">{userId ? "Tudo certo" : "Link inválido"}</span>
        <h1 style={{ fontSize: 30 }}>{userId ? "E-mail confirmado" : "Este link venceu ou já foi usado"}</h1>
        <p className="muted">{userId ? "Agora você pode vender e sacar na Nexo." : "Entre na sua conta e peça um novo link em Minha conta."}</p>
        <Link className="btn btn-primary" href={userId ? "/vender" : "/conta"}>{userId ? "Criar um anúncio" : "Ir para Minha conta"}</Link>
      </div>
    </div>
  );
}
