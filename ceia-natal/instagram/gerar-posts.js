// Gera os posts de confiança do Instagram/Facebook (1080x1350) com as páginas reais do kit.
// Rodar: NODE_PATH=<pasta com puppeteer> node gerar-posts.js
const fs = require('fs');
const path = require('path');
const url = require('url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'posts');
const PAG = path.join(ROOT, 'ceia-natal/criativos/v2/paginas');
const KIT = path.join(ROOT, 'public/ceia-natal/kit');
const img = (p) => url.pathToFileURL(p).href;
fs.mkdirSync(OUT, { recursive: true });

const CSS = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Nunito',sans-serif;color:#2a211d}
.s{width:1080px;height:1350px;position:relative;display:flex;flex-direction:column;align-items:center;padding:70px 70px 60px;background:#f7efe3}
.s.c{justify-content:center}.s.c .id{margin-top:60px}
.s.red{background:#a8241c;color:#fff}
.s.green{background:#1d6237;color:#fff}
.tag{font-weight:900;font-size:24px;letter-spacing:.12em;text-transform:uppercase;background:#1d6237;color:#fff;padding:8px 18px;border-radius:999px}
.red .tag,.green .tag{background:#fff;color:#a8241c}
h1{font-family:'Playfair Display',serif;font-weight:800;font-size:76px;line-height:1.05;text-align:center;margin-top:34px}
h2{font-family:'Playfair Display',serif;font-weight:800;font-size:60px;line-height:1.08;text-align:center;margin-top:26px}
p.sub{font-size:36px;line-height:1.35;text-align:center;margin-top:22px;font-weight:600}
.page{margin-top:36px;flex:1;min-height:0;display:flex;justify-content:center;align-items:flex-start}
.page img{max-height:100%;max-width:100%;border-radius:14px;box-shadow:0 24px 50px -18px rgba(0,0,0,.45);border:1px solid #e6ddd2}
.num{position:absolute;top:40px;right:50px;font-weight:900;font-size:26px;opacity:.6}
.foot{font-size:24px;opacity:.75;text-align:center;margin-top:24px;font-weight:600}
.steps{margin-top:50px;display:grid;gap:26px;width:100%}
.step{display:flex;gap:28px;align-items:center;background:#fff;color:#2a211d;border-radius:22px;padding:30px 34px}
.step b{flex:0 0 84px;height:84px;border-radius:50%;background:#1d6237;color:#fff;display:grid;place-items:center;font-size:42px;font-weight:900}
.step span{font-size:35px;line-height:1.3;font-weight:700}
.big{font-size:150px;margin-top:40px}
.card{background:#fff;color:#2a211d;border-radius:24px;padding:44px 48px;margin-top:44px;width:100%;font-size:36px;line-height:1.45;font-weight:600}
.card li{margin-left:40px}
.card h3{font-family:'Playfair Display',serif;font-size:46px;margin-bottom:14px;color:#a8241c}
.pill{margin-top:40px;background:#f4c23b;color:#2a211d;font-weight:900;font-size:44px;padding:20px 40px;border-radius:18px}
.small{font-size:22px;opacity:.8;margin-top:18px;text-align:center}
.id{margin-top:auto;font-size:26px;text-align:center;opacity:.85;line-height:1.5}
`;
const page = (body, cls = '') => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@600;700;900&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="s ${cls}">${body}</div></body></html>`;

const QUEM = 'Ceia de Natal Econômica é um produto da Nexo Marketplace<br>CNPJ 64.162.695/0001-90 · contato@nexopoint.com.br';

const POSTS = {
  // Carrossel 1: o kit por dentro (páginas reais)
  'kit-dentro': [
    page(`<span class="tag">Kit digital · PDF + planilha</span><h1>Por dentro do kit da Ceia de Natal</h1><p class="sub">Arraste para ver as páginas de verdade 👉</p><div class="page"><img src="${img(path.join(PAG, 'p00.png'))}"></div>`),
    page(`<span class="num">1/6</span><h2>Os 3 cardápios para 8 pessoas</h2><div class="page"><img src="${img(path.join(PAG, 'p01.png'))}"></div><p class="foot">Preços de referência de nov/2026; variam por região</p>`),
    page(`<span class="num">2/6</span><h2>Lista de compras item por item</h2><div class="page"><img src="${img(path.join(PAG, 'p02.png'))}"></div>`),
    page(`<span class="num">3/6</span><h2>14 receitas passo a passo</h2><div class="page"><img src="${img(path.join(PAG, 'p04.png'))}"></div>`),
    page(`<span class="num">4/6</span><h2>Cronograma dos dias 22, 23 e 24</h2><div class="page"><img src="${img(path.join(PAG, 'p09.png'))}"></div>`),
    page(`<span class="num">5/6</span><h2>Trocas para gastar menos</h2><div class="page"><img src="${img(path.join(KIT, 'trocas.jpg'))}"></div>`),
    page(`<span class="num">6/6</span><h2>Ideias para as sobras do dia 25</h2><div class="page"><img src="${img(path.join(KIT, 'sobras.jpg'))}"></div>`),
    page(`<span class="tag">Kit digital</span><h1>PDF + planilha que recalcula para a sua família</h1><span class="pill">R$ 19,90 · pagamento único</span><p class="sub">Acesso no e-mail logo após o pagamento<br>Garantia de 7 dias</p><p class="sub" style="margin-top:40px">🔗 Link na bio</p><p class="id">${QUEM}</p>`, 'green c'),
  ],
  // Carrossel 2: como funciona a compra (confiança)
  'como-comprar': [
    page(`<span class="tag">Compra segura</span><h1>Como funciona a compra do kit</h1><div class="big">🧾</div><p class="sub">Do pagamento ao acesso, passo a passo 👉</p><p class="id">${QUEM}</p>`, 'red c'),
    page(`<h2>Passo a passo</h2><div class="steps">
      <div class="step"><b>1</b><span>Você toca no link da bio e vê tudo o que vem no kit</span></div>
      <div class="step"><b>2</b><span>Paga R$ 19,90 com Pix ou cartão no checkout seguro da Cakto</span></div>
      <div class="step"><b>3</b><span>O link de acesso chega no seu e-mail em poucos minutos</span></div>
      <div class="step"><b>4</b><span>Baixa o PDF e abre a planilha no celular ou no computador</span></div></div>`, 'c'),
    page(`<span class="tag">Garantia</span><h1>7 dias de garantia</h1><div class="big">🛡️</div><div class="card">Baixou, leu e não gostou? Peça o reembolso pela Cakto em até 7 dias e receba <b>100% do valor</b> de volta.</div>`, 'green c'),
    page(`<h2>Perguntas frequentes</h2><div class="card" style="font-size:31px">
      <b>É comida pronta?</b><br>Não. É um kit digital (PDF + planilha) para você planejar e preparar a ceia.<br><br>
      <b>É assinatura?</b><br>Não. Pagamento único de R$ 19,90.<br><br>
      <b>Os preços valem na minha cidade?</b><br>São preços de referência de nov/2026. Na planilha você coloca o preço do seu mercado e o total se ajusta.<br><br>
      <b>Dúvidas?</b><br>contato@nexopoint.com.br</div>`, 'c'),
  ],
  // Post 3: receita do kit, de graça
  'receita-farofa': [
    page(`<span class="tag">Receita do kit · grátis</span><h1>Farofa de cenoura</h1><p class="sub">8 porções + recheio do frango · 20 min</p>
      <div class="card"><h3>Ingredientes</h3><ul><li>500 g de farinha de mandioca</li><li>2 cenouras raladas</li><li>3 colheres (sopa) de margarina</li><li>1 cebola picada, 2 dentes de alho</li><li>Sal e cheiro-verde</li></ul></div>
      <p class="small">Modo de preparo na legenda 👇 · É uma das 14 receitas do kit</p>`, 'c'),
  ],
};

(async () => {
  const b = await puppeteer.launch();
  const pg = await b.newPage();
  await pg.setViewport({ width: 1080, height: 1350 });
  for (const [nome, slides] of Object.entries(POSTS)) {
    for (let i = 0; i < slides.length; i++) {
      const tmp = path.join(OUT, '_tmp.html'); fs.writeFileSync(tmp, slides[i]); await pg.goto(url.pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
      await pg.evaluateHandle('document.fonts.ready');
      const f = path.join(OUT, `${nome}-${String(i + 1).padStart(2, '0')}.jpg`);
      await pg.screenshot({ path: f, type: 'jpeg', quality: 90 });
      console.log(f);
    }
  }
  fs.unlinkSync(path.join(OUT, '_tmp.html')); await b.close();
})();
