// Vídeo curto (sem som, ~25s) mostrando as fichas REAIS sendo preenchidas com o exemplo fictício.
// Cada campo aparece em sequência, como se a professora fosse preenchendo. Nada além do que o material tem.
// Uso: NODE_PATH=<pasta com puppeteer, sharp e ffmpeg-static> node gerar-video.js
const puppeteer = require('puppeteer');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SRC = pathToFileURL(path.join(__dirname, 'fichas.html')).href;
const OUT = path.join(__dirname, '..', '..', 'public', 'caderno-inclusao', 'video');
const TMP = path.join(__dirname, 'video-frames');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const CENAS = [
  { sec: 'p1', leg: '1 · Anote os fatos de cada dia', passo: 0.24 },
  { sec: 'p2', leg: '2 · Defina o objetivo e os apoios', passo: 0.5 },
  { sec: 'p3', leg: '3 · Revise o período', passo: 0.4 },
  { sec: 'p4', leg: '4 · A devolutiva sai dos registros', passo: 0.5 },
];

(async () => {
  const b = await puppeteer.launch();
  const p = await b.newPage();
  await p.setViewport({ width: 800, height: 1131, deviceScaleFactor: 1 });
  await p.goto(SRC, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  // Mostra uma ficha por vez, ocupando a tela, com uma faixa de legenda no topo.
  await p.addStyleTag({ content: `
    body{background:#173D38;margin:0}
    section{display:none;margin:0 auto!important;transform-origin:top center}
    section.cur{display:block}
    .leg{position:fixed;left:0;right:0;top:0;z-index:9;background:#173D38;color:#fff;font:700 30px Inter,Arial,sans-serif;padding:20px 28px;letter-spacing:.01em}
    .leg small{display:block;font:500 17px Inter,Arial,sans-serif;color:#F3B79C;margin-top:4px}
    .hid{visibility:hidden!important}
    .chk span.off:before{content:"☐ "!important;color:#173D38!important}
    .scale span.off{border-color:#D9D3C6!important;background:none!important;color:inherit!important;font-weight:400!important}
  ` });
  let n = 0, lista = [];
  async function frame(dur) {
    const f = path.join(TMP, `f${String(n++).padStart(3, '0')}.png`);
    await p.screenshot({ path: f });
    lista.push(`file '${f.replace(/\\/g, '/')}'\nduration ${dur}`);
  }
  for (const c of CENAS) {
    const total = await p.evaluate((c) => {
      document.querySelectorAll('section').forEach(s => s.classList.toggle('cur', s.id === c.sec));
      let leg = document.querySelector('.leg');
      if (!leg) { leg = document.createElement('div'); leg.className = 'leg'; document.body.appendChild(leg); }
      leg.innerHTML = c.leg + '<small>Caderno de Inclusão Escolar · exemplo fictício</small>';
      const sec = document.getElementById(c.sec);
      // A página A4 fica inteira abaixo da faixa de legenda (100px), reduzida para caber.
      document.body.style.paddingTop = '104px';
      sec.style.transform = `scale(${Math.min(1, (1131 - 112) / sec.offsetHeight)})`;
      // Esconde tudo o que é preenchimento; depois revela um por um, na ordem da página.
      const itens = [...sec.querySelectorAll('.v, .chk span.on, .scale span.on')];
      itens.forEach(e => { if (e.classList.contains('v')) e.classList.add('hid'); else e.classList.add('off'); });
      window.__itens = itens;
      return itens.length;
    }, c);
    await frame(1.0);
    for (let i = 0; i < total; i++) {
      await p.evaluate(i => { const e = window.__itens[i]; e.classList.remove('hid'); e.classList.remove('off'); }, i);
      await frame(c.passo);
    }
    await frame(1.6);
  }
  await b.close();
  // concat precisa repetir o último arquivo
  lista.push(lista[lista.length - 1].split('\n')[0]);
  const txt = path.join(TMP, 'lista.txt');
  fs.writeFileSync(txt, lista.join('\n'));
  const mp4 = path.join(OUT, 'preenchimento.mp4');
  execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', txt, '-vf', 'fps=24,scale=720:-2,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-movflags', '+faststart', '-an', mp4], { stdio: 'ignore' });
  // Poster: último quadro da primeira ficha
  fs.copyFileSync(path.join(TMP, 'lista.txt'), path.join(TMP, 'lista.bak'));
  const sharp = require('sharp');
  const primeiraCompleta = lista.findIndex(l => l.includes('duration 1.6'));
  const posterSrc = lista[primeiraCompleta].split('\n')[0].replace(/^file '|'$/g, '');
  await sharp(posterSrc).resize({ width: 720 }).webp({ quality: 72 }).toFile(path.join(OUT, 'poster.webp'));
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('ok', (fs.statSync(mp4).size / 1024).toFixed(0) + ' KB');
})();
