import Link from "next/link";
import { Nexinho3D } from "@/components/Nexinho3D";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="auth panel empty">
        <Nexinho3D className="sad-bot" mood="sad" decor={false} interactive={false} zoom={11} label="Nexinho triste: página não encontrada" />
        <span className="eyebrow">Erro 404</span>
        <h1 style={{ fontSize: 32 }}>Essa página saiu do mapa</h1>
        <p className="muted">O link pode estar errado ou o conteúdo foi removido.</p>
        <Link className="btn btn-primary" href="/">Voltar ao início</Link>
      </div>
    </div>
  );
}
