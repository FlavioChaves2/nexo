// Criativos da estratégia 1-1-10 (Ceia de Natal Econômica): 7 vídeos 1080x1920 narrados + 3 imagens 1080x1080.
// Roteiro de cada vídeo: gancho -> o que recebe + dor -> preço -> urgência (diferente em cada) -> "Clique em Saiba mais" + afirmação.
// Narração: voz neural pt-BR (msedge-tts) acelerada 1,2x; trilha sintetizada aqui mesmo, bem baixa.
// Uso: NODE_PATH=<scratchpad>/node_modules node gerar-1-1-10.js [CT01 CT02 ... IMG]
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const puppeteer = require('puppeteer');
const ffmpeg = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const OUT = path.join(__dirname, '1-1-10');
const TMP = path.join(OUT, '_tmp');
fs.mkdirSync(TMP, { recursive: true });
const pub = path.join(__dirname, '..', '..', 'public', 'ceia-natal');
const b64 = (f) => 'data:' + (f.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
const TREE = b64(path.join(pub, 'arvore.svg'));
const IMG = (n) => b64(path.join(pub, 'kit', n + '.jpg'));
const VOICE = 'pt-BR-FranciscaNeural';
// Variações de fundo e voz para diversificar os criativos (os que tendem a performar menos).
const TEMA = { CT04: { voz: 'pt-BR-AntonioNeural', cls: 'verde' }, CT05: { voz: 'pt-BR-AntonioNeural', cls: 'creme' }, CT07: { voz: 'pt-BR-AntonioNeural', cls: 'verde' } };
const TEMA_CSS = `
body.verde{background:linear-gradient(165deg,#2E8B57,#14472A)}
body.creme{background:linear-gradient(165deg,#FFF6E8,#F1DEC2)}
body.creme .big{color:#B3261E}
body.creme .sub{color:#1F6B3A}
body.creme [style*="color:#fff"]{color:#2B2320!important}
body.creme .fine{color:#5a4a3a}
body.creme .chk,body.creme .card{border:3px solid #E2CBA6}
`;

const CSS = `

*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:var(--H);overflow:hidden}
body{font-family:Nunito,sans-serif;color:#2B2320;background:linear-gradient(165deg,#C7362C,#8E1B15)}
.serif{font-family:'Playfair Display',Georgia,serif}
.lights{position:absolute;left:0;right:0;top:0;height:60px}
.lights i{position:absolute;width:18px;height:18px;border-radius:50%}
.scene{position:absolute;left:0;top:var(--T);width:1080px;height:var(--A);padding:0 64px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.big{color:#fff;font-size:92px;line-height:1.02}
.sub{color:#FFE8C2;font-size:40px;font-weight:800;margin-top:22px}
.card{background:#FFF8EC;border-radius:28px;box-shadow:0 24px 50px rgba(0,0,0,.35)}
.chk{background:#FFF8EC;border-radius:20px;padding:20px 24px;margin:9px 0;font-size:38px;font-weight:900;display:flex;gap:18px;align-items:center;box-shadow:0 10px 24px rgba(0,0,0,.2);width:900px;text-align:left}
.chk b{flex:0 0 54px;height:54px;border-radius:50%;background:#1F6B3A;color:#fff;display:grid;place-items:center;font-size:32px}
.phone{width:400px;height:700px;background:#1b1b1b;border-radius:56px;padding:18px;box-shadow:0 24px 50px rgba(0,0,0,.45)}
.phone div{width:100%;height:100%;border-radius:40px;overflow:hidden;background:#fff;position:relative}
.phone img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.btn{background:#FFC93C;color:#3a2600;border-radius:30px;padding:30px 44px;font-weight:900;font-size:50px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.cap{position:absolute;left:70px;right:70px;top:var(--C);text-align:center}
.cap span{display:inline;background:rgba(0,0,0,.72);color:#fff;font-size:40px;font-weight:900;line-height:1.55;padding:6px 14px;-webkit-box-decoration-break:clone;box-decoration-break:clone;border-radius:10px}
.fine{position:absolute;left:64px;right:64px;top:var(--F);color:#ffe;opacity:.8;font-size:24px;text-align:center}
`;
const lights = () => '<div class="lights">' + Array.from({ length: 20 }, (_, i) => { const c = ['#FFC93C', '#5BB8F0', '#fff', '#7CD992'][i % 4]; return `<i style="left:${i * 56 + 14}px;top:${16 + Math.sin(i) * 7}px;background:${c};box-shadow:0 0 16px ${c}"></i>`; }).join('') + '</div>';
const A = (cls, d, html, st = '') => `<div class="${cls}" data-d="${d}" style="${st}">${html}</div>`;

// ---------- blocos visuais ----------
const V = {
  hook: (t, s = '') => A('up', 0, `<div class="big serif">${t}</div>`) + (s ? A('up', 0.5, `<div class="sub">${s}</div>`) : ''),
  hookImg: (t, imgs) => A('up', 0, `<div class="big serif" style="font-size:80px">${t}</div>`) + A('up', 0.4, `<div class="phone" style="margin-top:40px;width:340px;height:560px"><div>${imgs.map((n, k) => `<img class="fade" data-d="${0.4 + k * 1.1}" src="${IMG(n)}">`).join('')}</div></div>`),
  notinha: () => `<div style="display:flex;gap:26px;align-items:flex-start;width:960px">
    ${A('up', 0, `<div style="font-size:26px;font-weight:900;color:#6B625C">CEIA TRADICIONAL</div><div style="font-size:22px;color:#6B625C">média 2025 (IPC-Fipe)</div><div style="font-size:26px;color:#6B625C;line-height:1.6;margin:18px 0">Peru, bacalhau,<br>castanhas, pernil…</div><div class="serif" style="font-size:64px;color:#B3261E;position:relative">R$ 453${A('pop', 1.0, '', 'position:absolute;left:-8px;right:-8px;top:50%;height:8px;background:#B3261E;transform:rotate(-8deg)')}</div>`, 'flex:0 0 400px;background:#fff;border-radius:22px;padding:30px;transform:rotate(-3deg);box-shadow:0 18px 40px rgba(0,0,0,.3)')}
    ${A('up', 1.4, `<div style="font-size:26px;font-weight:900;color:#1F6B3A">CEIA ECONÔMICA</div><div style="font-size:22px;color:#6B625C">8 pessoas · lista do kit</div><img src="${TREE}" style="width:90px;margin:16px auto"><div class="serif" style="font-size:72px;color:#1F6B3A">R$ 113</div><div style="font-size:30px;font-weight:900;color:#B3261E">≈ R$ 14 por pessoa*</div>`, 'flex:1;background:#FFF8EC;border-radius:22px;padding:30px;border:5px solid #1F6B3A;box-shadow:0 18px 40px rgba(0,0,0,.3)')}
  </div>`,
  checklist: (items, t0 = 0, title = '') => (title ? A('up', t0, `<div class="sub" style="color:#fff;font-size:46px;margin:0 0 18px">${title}</div>`) : '') + items.map((c, k) => A('up chk', t0 + 0.3 + k * 0.45, `<b>✓</b>${c}`)).join(''),
  phone: (imgs, side = '') => `<div style="display:flex;gap:34px;align-items:center">${A('up', 0, `<div class="phone"><div>${imgs.map((n, k) => `<img class="fade" data-d="${k * 1.3}" src="${IMG(n)}">`).join('')}</div></div>`)}${side}</div>`,
  price: (sub = 'Pagamento único · Pix ou cartão') => A('pop card', 0, `<div style="font-size:40px;font-weight:900;color:#1F6B3A;letter-spacing:1px">KIT COMPLETO POR</div><div class="serif" style="font-size:210px;line-height:1;color:#B3261E">R$ 19<span style="font-size:110px">,90</span></div><div style="font-size:38px;font-weight:800;color:#2B2320;margin-top:8px">${sub}</div>`, 'padding:34px 60px 40px') + A('up', 0.6, '<div class="sub" style="color:#fff">⚡ Acesso na hora no seu e-mail · 🛡️ Garantia de 7 dias</div>'),
  cards: () => `<div class="sub" style="color:#fff;margin:0 0 26px">3 cardápios para 8 pessoas</div><div style="display:flex;gap:20px;width:960px">${[['Econômico', 'Frango assado recheado', '14,21'], ['Clássico', 'Lombo com laranja', '21,60'], ['Caprichado', 'Pernil assado', '29,48']].map((c, k) => A('up', k * 0.45, `<div class="serif" style="font-size:40px;color:#1F6B3A">${c[0]}</div><div style="font-size:24px;color:#6B625C;font-weight:800;min-height:64px;margin-top:6px">${c[1]}</div><div class="serif" style="font-size:56px;color:#B3261E">R$ ${c[2]}</div><div style="font-size:24px;font-weight:800;color:#6B625C">por pessoa*</div>`, `flex:1;background:#fff;border-radius:22px;padding:26px 14px;box-shadow:0 14px 30px rgba(0,0,0,.3);${k === 0 ? 'border:6px solid #FFC93C' : ''}`)).join('')}</div>`,
  familia: () => `<div style="display:flex;gap:18px;width:960px">${[['6 pessoas', '85,23'], ['8 pessoas', '113,64'], ['12 pessoas', '170,46']].map((c, k) => A('up', k * 0.5, `<div style="font-size:52px">${'👤'.repeat(k + 2)}</div><div class="serif" style="font-size:42px;color:#1F6B3A;margin-top:8px">${c[0]}</div><div class="serif" style="font-size:52px;color:#B3261E">R$ ${c[1]}</div>`, 'flex:1;background:#FFF8EC;border-radius:22px;padding:26px 10px;box-shadow:0 14px 30px rgba(0,0,0,.3)')).join('')}</div>` + A('up', 1.6, '<div class="sub" style="color:#fff">A planilha recalcula tudo sozinha 📊</div>'),
  cron: () => ['22', '23', '24'].map((d, k) => A('up', k * 0.5, `<div class="serif" style="flex:0 0 150px;font-size:76px;color:#B3261E">${d}/12</div><div style="font-size:36px;font-weight:900;text-align:left">${['Compras e pré-preparo', 'Sobremesas e marinadas', 'Assados e mesa posta'][k]}</div>`, 'display:flex;gap:26px;align-items:center;background:#FFF8EC;border-radius:24px;padding:26px 34px;margin:12px 0;width:900px;box-shadow:0 14px 30px rgba(0,0,0,.3)')).join(''),
  urg: (emoji, t) => A('pop', 0, `<div style="font-size:150px">${emoji}</div>`) + A('up', 0.3, `<div class="big serif" style="font-size:74px">${t}</div>`),
  cta: (afirm) => A('pop btn', 0, 'Clique em <u>Saiba mais</u> 👇') + A('up', 0.6, `<div class="sub" style="color:#fff;font-size:50px;margin-top:40px">${afirm}</div>`) + A('fade', 0.9, `<img src="${TREE}" style="width:120px;margin-top:30px">`),
};
const ITENS = ['3 cardápios para 8 pessoas', 'Lista de compras pronta', '14 receitas passo a passo', 'Cronograma dos dias 22, 23 e 24', 'Planilha que calcula tudo'];

// ---------- roteiros: [fala, visual, legenda opcional] ----------
const PRECO = 'E tudo isso custa só dezenove e noventa, pagamento único, no Pix ou no cartão.';
const VIDEOS = {
  CT01: [
    ['A ceia de Natal tradicional passou de quatrocentos e cinquenta reais no ano passado.', V.hook('A ceia de Natal passou de R$ 450*', 'média 2025, IPC-Fipe')],
    ['Com a lista desse kit, a mesma ceia pra oito pessoas sai por uns cento e treze reais. Menos de quinze reais por pessoa.', V.notinha()],
    ['Você recebe três cardápios, a lista de compras pronta, catorze receitas e o cronograma da véspera.', V.checklist(ITENS)],
    [PRECO, V.price()],
    ['Em dezembro o mercado lota e os preços sobem. Quem planeja agora, compra melhor.', V.urg('🛒', 'Quem planeja agora, compra melhor')],
    ['Clique em Saiba mais e garanta a sua ceia. Esse Natal vai ser farto e sem aperto.', V.cta('Esse Natal vai ser farto e sem aperto ✨')],
  ],
  CT02: [
    ['Ainda não sabe o que fazer na ceia de Natal?', V.hook('Ainda não sabe o que fazer na ceia de Natal? 👀')],
    ['Todo ano é a mesma coisa: a lista não fecha e o dinheiro some no mercado.', V.hook('A lista não fecha…', 'e o dinheiro some no mercado 😩')],
    ['Nesse kit eu te entrego tudo pronto: cardápio, lista de compras, receitas passo a passo e uma planilha que faz as contas.', V.phone(['capa', 'lista', 'receita'], `<div style="width:460px">${ITENS.slice(1).map((c, k) => A('up chk', 0.4 + k * 0.4, `<b>✓</b>${c}`, 'width:460px;font-size:30px')).join('')}</div>`)],
    [PRECO, V.price()],
    ['Faltam poucas semanas pro Natal, e deixar pra última hora é o que faz a gente gastar mais.', V.urg('⏳', 'Deixar pra última hora sai mais caro')],
    ['Clique em Saiba mais e baixe o seu kit. Esse ano a sua ceia vai ser linda.', V.cta('Esse ano a sua ceia vai ser linda 🎄')],
  ],
  CT03: [
    ['Ceia de Natal completa a partir de quinze reais por pessoa. Sim, é possível.', V.hook('Ceia completa a partir de R$ 15 por pessoa*', 'Sim, é possível.')],
    ['São três cardápios pra oito pessoas, cada um com a lista e o valor de referência.', V.cards()],
    ['Frango assado recheado, lombo com laranja ou pernil, com acompanhamentos e sobremesa.', V.phone(['receita', 'trocas', 'sobras'])],
    [PRECO, V.price()],
    ['O kit é digital: você paga e recebe agora no seu e-mail, e já pode começar a lista hoje.', V.urg('⚡', 'Recebe agora e já começa a lista hoje')],
    ['Clique em Saiba mais e monte a sua ceia. Você merece um Natal bonito sem estourar o orçamento.', V.cta('Natal bonito sem estourar o orçamento 💚')],
  ],
  CT04: [
    ['Família grande e dinheiro curto no Natal?', V.hook('Família grande e dinheiro curto no Natal? 👨‍👩‍👧‍👦')],
    ['A planilha do kit recalcula as quantidades e o total pra quantas pessoas você quiser.', V.familia()],
    ['E ainda vem a lista de compras, as receitas e o cronograma dos dias vinte e dois, vinte e três e vinte e quatro.', V.checklist(ITENS.slice(1))],
    [PRECO, V.price()],
    ['Quanto antes você souber quanto vai gastar, mais tempo tem pra separar o dinheiro.', V.urg('📅', 'Saiba hoje quanto vai gastar')],
    ['Clique em Saiba mais e organize a sua ceia. Vai ter comida pra todo mundo.', V.cta('Vai ter comida pra todo mundo 🍗')],
  ],
  CT05: [
    ['Todo ano é a mesma correria na véspera de Natal.', V.hook('Todo ano a mesma correria na véspera… 😮‍💨')],
    ['Com esse kit você divide tudo em três dias, com o cronograma pronto do que fazer em cada um.', V.cron()],
    ['Junto vem a lista de compras, as receitas passo a passo e a planilha de custos.', V.phone(['cronograma', 'lista', 'comece'])],
    [PRECO, V.price()],
    ['Comece o planejamento agora e chegue no dia vinte e quatro com tudo pronto, sem correria.', V.urg('🎯', 'Chegue no dia 24 com tudo pronto')],
    ['Clique em Saiba mais e baixe o seu kit. Nesse Natal você vai curtir a sua família.', V.cta('Nesse Natal você curte a família 🥂')],
  ],
  CT06: [
    ['Não comece janeiro pagando a ceia de Natal.', V.hook('Não comece janeiro pagando a ceia de Natal 💳')],
    ['Esse kit mostra exatamente o que comprar e quanto vai custar, antes de você pisar no mercado.', V.phone(['lista', 'capa', 'receita'], `<div style="width:460px">${A('up card', 0.5, '<div style="font-size:30px;font-weight:900;color:#1F6B3A">Ceia para 8 pessoas</div><div class="serif" style="font-size:80px;color:#B3261E">R$ 113</div><div style="font-size:26px;font-weight:800;color:#6B625C">cardápio Econômico*</div>', 'padding:30px')}</div>`)],
    ['São três cardápios, catorze receitas, cronograma e a planilha que soma tudo.', V.checklist(ITENS)],
    [PRECO, V.price()],
    ['A fatura de janeiro chega rápido. Decida agora quanto a sua ceia vai custar.', V.urg('🧾', 'Decida agora quanto a ceia vai custar')],
    ['Clique em Saiba mais e garanta o seu kit. Esse ano você começa janeiro no azul.', V.cta('Comece janeiro no azul 💙')],
  ],
  CT07: [
    ['Ceia de Natal bonita não precisa ser cara.', V.hookImg('Ceia bonita não precisa ser cara 🎄', ['capa', 'receita', 'trocas'])],
    ['Olha o que vem no kit: cardápios, lista pronta, receitas, ideias de trocas pra economizar e como aproveitar as sobras.', V.checklist(['3 cardápios para 8 pessoas', 'Lista de compras pronta', '14 receitas passo a passo', 'Trocas para economizar', 'Ideias para as sobras'])],
    ['Tudo com valores de referência, a partir de quinze reais por pessoa.', V.cards()],
    [PRECO, V.price()],
    ['As compras de Natal começam agora. Com a lista em mãos, você aproveita as promoções do mês.', V.urg('🏷️', 'Com a lista em mãos, aproveite as promoções')],
    ['Clique em Saiba mais e faça a sua ceia. A sua mesa vai ficar linda.', V.cta('A sua mesa vai ficar linda ✨')],
  ],
};
const FINE = '*Preços de referência de nov/2026; variam por região.';

// ---------- áudio ----------
const dur = (f) => { const r = spawnSync(ffmpeg, ['-i', f], { encoding: 'utf8' }); const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr); return +m[1] * 3600 + +m[2] * 60 + +m[3]; };
async function tts(text, file, voz = VOICE) {
  if (fs.existsSync(file)) return;
  for (let tent = 0; tent < 4; tent++) {
    try {
      const t = new MsEdgeTTS();
      await t.setMetadata(voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const dir = file + '_d'; fs.mkdirSync(dir, { recursive: true });
      await t.toFile(dir, text);
      t.close();
      execFileSync(ffmpeg, ['-y', '-i', path.join(dir, 'audio.mp3'), '-af', 'atempo=1.2,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', file], { stdio: 'ignore' });
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (e) { console.log('tts retry', e.message || e); }
  }
  throw new Error('TTS falhou: ' + text);
}
// trilha original: arpejo de sinos suave em loop (gerado, sem direitos de terceiros)
function musica(file, secs) {
  const notas = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 493.88];
  const step = 0.42, sr = 44100, n = sr * secs, L = notas.length * step;
  const buf = Buffer.alloc(44 + n * 2);
  for (let s = 0; s < n; s++) {
    const t = s / sr, m = t % L; let v = 0;
    for (let i = 0; i < notas.length; i++) {
      for (const off of [0, L]) { const dt = m - i * step + off; if (dt >= 0 && dt < 1.6) v += Math.sin(2 * Math.PI * notas[i] * t) * Math.exp(-3 * dt) + 0.3 * Math.sin(4 * Math.PI * notas[i] * t) * Math.exp(-5 * dt); }
    }
    const fade = Math.min(1, t / 0.5, (secs - t) / 1);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 0.25 * fade * 32767))), 44 + s * 2);
  }
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  fs.writeFileSync(file, buf);
}

async function video(b, nome, roteiro) {
  const H = 1920, T = 230, AH = 1100;
  // 1) narração por cena
  const cenas = [];
  for (let i = 0; i < roteiro.length; i++) {
    const f = path.join(TMP, `${nome}-${(TEMA[nome] || {}).voz ? 'm-' : ''}${i}.wav`);
    await tts(roteiro[i][0], f, (TEMA[nome] || {}).voz);
    cenas.push({ f, d: dur(f) + 0.25 });
  }
  let t0 = 0.3; cenas.forEach((c) => { c.t = t0; t0 += c.d; });
  const total = t0 + 0.6;
  // 2) quadros
  const html = `${lights()}${roteiro.map((r, i) => `<div class="scene" data-s="${cenas[i].t}" data-e="${i + 1 < cenas.length ? cenas[i + 1].t : 999}">${r[1]}</div>`).join('')}
    ${roteiro.map((r, i) => `<div class="cap" data-s="${cenas[i].t}" data-e="${i + 1 < cenas.length ? cenas[i + 1].t : 999}"><span>${(r[2] || r[0])}</span></div>`).join('')}
    <div class="fine">${FINE}</div>`;
  const p = await b.newPage(); await p.setViewport({ width: 1080, height: H });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@600;700;800;900&display=block"><style>:root{--H:${H}px;--T:${T}px;--A:${AH}px;--C:${T + AH + 20}px;--F:${H - 290}px}${CSS}${TEMA_CSS}</style></head><body class="${(TEMA[nome] || {}).cls || ''}">${html}</body></html>`, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await p.evaluate(() => {
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const blocos = [...document.querySelectorAll('[data-s]')].map((s) => ({ s, a: +s.dataset.s, z: +s.dataset.e, kids: [...s.querySelectorAll('.up,.fade,.pop')].map((e) => ({ e, d: +(e.dataset.d || 0), k: e.classList.contains('pop') ? 'pop' : e.classList.contains('up') ? 'up' : 'fade', tr: e.style.transform || '' })) }));
    window.__frame = (t) => {
      for (const b of blocos) {
        const vis = t >= b.a && t < b.z; b.s.style.display = vis ? '' : 'none';
        if (!vis) continue;
        const lt = t - b.a;
        b.s.style.opacity = Math.min(1, lt / 0.15);
        for (const x of b.kids) {
          const du = x.k === 'fade' ? 0.5 : x.k === 'pop' ? 0.45 : 0.55;
          const pr = Math.max(0, Math.min(1, (lt - x.d) / du)), e = ease(pr);
          x.e.style.opacity = x.k === 'fade' ? pr : e;
          x.e.style.transform = x.tr + (x.k === 'up' ? ` translateY(${40 * (1 - e)}px)` : x.k === 'pop' ? ` scale(${0.6 + 0.4 * Math.min(1, e * 1.05)})` : '');
        }
      }
    };
  });
  const dir = path.join(TMP, nome + '_frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const fps = 30, n = Math.ceil(total * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => { window.__frame(t); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, i / fps);
    await p.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 86 });
  }
  await p.close();
  // 3) áudio: narração posicionada + trilha a ~4%
  const mus = path.join(TMP, nome + '-mus.wav'); musica(mus, Math.ceil(total));
  const args = ['-y'];
  cenas.forEach((c) => args.push('-i', c.f));
  args.push('-i', mus);
  const filt = cenas.map((c, i) => `[${i}]adelay=${Math.round(c.t * 1000)}:all=1[a${i}]`).join(';') + `;[${cenas.length}]volume=0.045[m];` + cenas.map((_, i) => `[a${i}]`).join('') + `[m]amix=inputs=${cenas.length + 1}:normalize=0:duration=longest,atrim=0:${total.toFixed(2)}[out]`;
  const wav = path.join(TMP, nome + '-mix.wav');
  execFileSync(ffmpeg, [...args, '-filter_complex', filt, '-map', '[out]', '-ar', '44100', wav], { stdio: 'ignore' });
  execFileSync(ffmpeg, ['-y', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'), '-i', wav, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', path.join(OUT, `${nome}-1080x1920.mp4`)], { stdio: 'ignore' });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok', nome, total.toFixed(1) + 's');
}

// ---------- 3 imagens quadradas (preço + quantidade) ----------
const SQ = {
  IMG01: `${lights()}<div class="scene" style="--A:1080px;top:0;height:1080px">
    <div class="big serif" style="font-size:78px">Ceia de Natal completa</div>
    <div class="sub" style="color:#fff;font-size:44px;margin-top:10px">para 8 pessoas, a partir de R$ 15 por pessoa*</div>
    <div style="display:flex;gap:18px;margin-top:36px">${[['3', 'cardápios'], ['14', 'receitas'], ['1', 'lista pronta'], ['3', 'dias de cronograma']].map((c) => `<div class="card" style="padding:20px 18px;width:210px"><div class="serif" style="font-size:84px;line-height:1;color:#B3261E">${c[0]}</div><div style="font-size:26px;font-weight:900">${c[1]}</div></div>`).join('')}</div>
    <div class="btn" style="margin-top:44px;font-size:56px">Tudo por R$ 19,90</div>
    <div style="color:#ffe;opacity:.85;font-size:22px;margin-top:22px">*Preços de referência de nov/2026; variam por região.</div></div>`,
  IMG02: `${lights()}<div class="scene" style="top:0;height:1080px;flex-direction:row;gap:40px;text-align:left">
    <div class="phone" style="width:360px;height:640px;flex:0 0 360px"><div><img src="${IMG('capa')}"></div></div>
    <div><div class="big serif" style="font-size:72px">Kit Ceia de Natal Econômica</div>
    ${['3 cardápios para 8 pessoas', 'Lista de compras pronta', '14 receitas passo a passo', 'Cronograma 22, 23 e 24', 'Planilha que calcula tudo'].map((c) => `<div class="chk" style="width:540px;font-size:28px;padding:14px 18px;margin:8px 0"><b style="flex:0 0 40px;height:40px;font-size:24px">✓</b>${c}</div>`).join('')}
    <div class="btn" style="margin-top:18px;font-size:46px;display:inline-block;white-space:nowrap">R$ 19,90 · na hora</div></div></div>`,
  IMG03: `${lights()}<div class="scene" style="top:0;height:1080px">
    <div style="color:#FFE8C2;font-size:40px;font-weight:900">CEIA DE NATAL PARA 8 PESSOAS</div>
    <div style="display:flex;gap:30px;margin-top:30px;align-items:center">
      <div style="background:#fff;border-radius:22px;padding:28px;transform:rotate(-3deg);width:380px;box-shadow:0 18px 40px rgba(0,0,0,.3)"><div style="font-size:26px;font-weight:900;color:#6B625C">TRADICIONAL</div><div style="font-size:22px;color:#6B625C">média 2025 (IPC-Fipe)</div><div class="serif" style="font-size:80px;color:#B3261E;position:relative">R$ 453<span style="position:absolute;left:-8px;right:-8px;top:50%;height:8px;background:#B3261E;transform:rotate(-8deg)"></span></div></div>
      <div style="background:#FFF8EC;border-radius:22px;padding:28px;width:420px;border:6px solid #1F6B3A;box-shadow:0 18px 40px rgba(0,0,0,.3)"><div style="font-size:26px;font-weight:900;color:#1F6B3A">COM A LISTA DO KIT</div><div class="serif" style="font-size:96px;color:#1F6B3A">R$ 113</div><div style="font-size:28px;font-weight:900;color:#B3261E">≈ R$ 14 por pessoa*</div></div>
    </div>
    <div class="sub" style="color:#fff;margin-top:34px">3 cardápios · 14 receitas · lista e cronograma</div>
    <div class="btn" style="margin-top:30px;font-size:54px">Kit completo: R$ 19,90</div>
    <div style="color:#ffe;opacity:.85;font-size:22px;margin-top:20px">*Cardápio Econômico; preços de referência de nov/2026; variam por região.</div></div>`,
};

(async () => {
  const quais = process.argv.slice(2);
  const b = await puppeteer.launch();
  if (!quais.length || quais.includes('IMG')) {
    for (const [nome, body] of Object.entries(SQ)) {
      const p = await b.newPage(); await p.setViewport({ width: 1080, height: 1080 });
      await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@600;700;800;900&display=block"><style>:root{--H:1080px;--T:0px;--A:1080px}${CSS}</style></head><body>${body}</body></html>`, { waitUntil: 'networkidle0' });
      await p.evaluateHandle('document.fonts.ready');
      await p.screenshot({ path: path.join(OUT, `${nome}-1080x1080.png`) });
      await p.close(); console.log('ok', nome);
    }
  }
  for (const [nome, rot] of Object.entries(VIDEOS)) if (!quais.length || quais.includes(nome)) await video(b, nome, rot);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
