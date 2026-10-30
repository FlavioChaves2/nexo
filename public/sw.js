// Service worker do app da Nexo: abre rápido, mostra um aviso sem internet e recebe notificações.
const VERSION = "nexo-v1";
const STATIC = ["/app/icon-192.png", "/app/icon-512.png"];

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem internet | NEXO</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111311;color:#F2F5EC;font-family:system-ui,sans-serif;text-align:center;padding:24px}
img{width:88px;height:88px;border-radius:22px}h1{font-size:22px;margin:18px 0 8px}p{color:#9AA394;margin:0 0 20px}
button{background:#C5F04A;color:#12160A;border:0;border-radius:12px;padding:12px 20px;font-weight:700;font-size:15px}</style></head>
<body><div><img src="/app/icon-192.png" alt=""><h1>Você está sem internet</h1><p>Confira a conexão e tente de novo.</p><button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Páginas: sempre da rede (preço e estoque mudam); sem internet, a tela de aviso.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
    return;
  }
  // Arquivos com nome versionado e ícones do app: guarda e reaproveita.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
  }
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || "Nexo", {
    body: data.body || "",
    icon: "/app/icon-192.png",
    badge: "/app/icon-192.png",
    data: { href: data.href || "/notificacoes" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const href = new URL(e.notification.data?.href || "/", location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
    const win = wins.find((w) => w.url.startsWith(location.origin));
    if (win) return win.navigate(href).then((w) => (w || win).focus());
    return self.clients.openWindow(href);
  }));
});
