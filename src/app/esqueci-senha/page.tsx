import Link from "next/link";
import { ForgotForm } from "@/components/EmailForms";

export const metadata = { title: "Esqueci a senha" };

export default function EsqueciSenhaPage() {
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap"><span className="eyebrow">Acesso</span><h1 style={{ fontSize: 34 }}>Esqueci a senha</h1><p className="muted">Enviamos um link para você criar uma nova senha.</p></div>
        <ForgotForm />
        <Link className="linkish small" href="/entrar">← Voltar para entrar</Link>
      </div>
    </div>
  );
}
