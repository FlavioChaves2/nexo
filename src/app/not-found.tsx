import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="auth panel empty">
        <span className="eyebrow">Erro 404</span>
        <h1 style={{ fontSize: 32 }}>Essa página saiu do mapa</h1>
        <p className="muted">O link pode estar errado ou o conteúdo foi removido.</p>
        <Link className="btn btn-primary" href="/">Voltar ao início</Link>
      </div>
    </div>
  );
}
