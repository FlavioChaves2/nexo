import { NextResponse, type NextRequest } from "next/server";

// Identificador aleatório do navegador (nexo_vid), usado só para saber a origem da venda
// (link do vendedor ou marketplace). Não guarda dados pessoais. Ver docs/lojas-vendedor.md.
const COOKIE = "nexo_vid";

export function middleware(req: NextRequest) {
  if (req.cookies.get(COOKIE)) return NextResponse.next();
  const id = crypto.randomUUID();
  // Coloca também na própria requisição, para a página já enxergar o identificador na primeira visita.
  const headers = new Headers(req.headers);
  headers.set("cookie", [req.headers.get("cookie"), `${COOKIE}=${id}`].filter(Boolean).join("; "));
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 400 * 86_400 });
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon|icon|app/|brand/|games/|sw\\.js|manifest|robots|sitemap|opengraph-image|.*\\.(?:png|jpg|jpeg|webp|svg|ico|js|css|woff2?)$).*)"],
};
