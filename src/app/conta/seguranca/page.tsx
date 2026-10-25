import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { totpUri } from "@/lib/totp";
import { confirm2faSetup, start2faSetup } from "@/app/actions/auth";
import { CodeForm } from "@/components/CodeForm";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Segurança" };
export const dynamic = "force-dynamic";

export default async function SegurancaPage({ searchParams }: { searchParams: Promise<{ obrigatorio?: string }> }) {
  const me = await requireUser("/conta/seguranca");
  const required = (await searchParams).obrigatorio === "1";
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  const qr = user.totpSecret && !user.totpEnabled ? await QRCode.toDataURL(totpUri(user.totpSecret, user.email), { margin: 1, width: 360 }) : null;

  return (
    <div className="wrap">
      <div className="auth stack" style={{ maxWidth: 520 }}>
        <div className="grid-gap">
          <span className="eyebrow">Minha conta</span>
          <h1 style={{ fontSize: 34 }}>Login em duas etapas</h1>
          <p className="muted">Além da senha, o login pede um código que muda a cada 30 segundos no seu celular. Mesmo que alguém descubra sua senha, não entra.</p>
        </div>
        {required && !user.totpEnabled && (
          <div className="note warn"><Icon name="alert" /><span>Contas de admin precisam do login em duas etapas para abrir o painel.</span></div>
        )}
        {user.totpEnabled ? (
          <div className="panel box">
            <div className="note"><Icon name="check" /><span><b>Ativado.</b> O próximo login vai pedir o código do app.</span></div>
            {user.role === "ADMIN" && <Link className="btn btn-primary" href="/admin">Ir para o painel de admin</Link>}
          </div>
        ) : qr ? (
          <div className="panel box">
            <ol className="prose" style={{ paddingLeft: 18, margin: 0 }}>
              <li>Instale um app autenticador (Google Authenticator, Microsoft Authenticator ou Authy).</li>
              <li>No app, toque em <b>+</b> e escaneie o QR abaixo.</li>
              <li>Digite o código de 6 dígitos que aparecer.</li>
            </ol>
            <div className="pix">
              <img src={qr} alt="QR code para o app autenticador" />
              <div className="small muted">Não consegue escanear? Digite esta chave no app:<br /><code className="mono lime" style={{ wordBreak: "break-all" }}>{user.totpSecret}</code></div>
            </div>
            <CodeForm action={confirm2faSetup} label="Ativar" />
          </div>
        ) : (
          <form action={start2faSetup} className="panel box">
            <button className="btn btn-primary" type="submit"><Icon name="shield" />Configurar agora</button>
          </form>
        )}
      </div>
    </div>
  );
}
