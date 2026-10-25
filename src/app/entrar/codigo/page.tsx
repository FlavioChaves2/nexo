import Link from "next/link";
import { redirect } from "next/navigation";
import { readPending2fa, safeNext } from "@/lib/auth";
import { verifyLoginCode } from "@/app/actions/auth";
import { CodeForm } from "@/components/CodeForm";

export const metadata = { title: "Código de acesso" };

export default async function CodigoPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (!(await readPending2fa())) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap">
          <span className="eyebrow">Login em duas etapas</span>
          <h1 style={{ fontSize: 34 }}>Digite o código</h1>
          <p className="muted">Abra o app autenticador no celular e digite o código da Nexo.</p>
        </div>
        <div className="panel box">
          <CodeForm action={verifyLoginCode} next={next} label="Entrar" />
        </div>
        <Link className="linkish small" href="/entrar">← Voltar</Link>
      </div>
    </div>
  );
}
