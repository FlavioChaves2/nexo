// Criativos v2 da Ceia de Natal: 7 vídeos 1080x1920 + 3 imagens 1080x1080.
// Cenas com comida e preparo (fotos/vídeos do Pexels, uso livre), páginas reais do kit e a planilha real funcionando.
// Uso: NODE_PATH=<scratchpad>/node_modules node gerar-v2.js [CT01 ... IMG]
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const puppeteer = require('puppeteer');
const ffmpeg = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const STOCK = process.env.STOCK || 'C:/Users/FLAVIO/AppData/Local/Temp/claude/256eed88fc62288d/13d54d9f-2970-4458-9c06-7bf2dc998bd5/scratchpad/stock';
const OUT = path.join(__dirname, 'v2');
const TMP = path.join(OUT, '_tmp');
fs.mkdirSync(TMP, { recursive: true });
const PAG = path.join(OUT, 'paginas');
const PUB = path.join(__dirname, '..', '..', 'public', 'ceia-natal');
const PLAN = JSON.parse(fs.readFileSync(path.join(__dirname, 'planilha-real.json'), 'utf8'));
const W = 1080, H = 1920, FPS = 30;
const F_VOZ = 'pt-BR-FranciscaNeural', A_VOZ = 'pt-BR-AntonioNeural';
const b64 = (f) => 'data:' + (f.endsWith('.png') ? 'image/png' : f.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
const foto = (id) => path.join(STOCK, 'f', id + '.jpg');
const clipf = (id) => path.join(STOCK, 'v', id + '.mp4');
const pag = (n) => path.join(PAG, 'p' + String(n).padStart(2, '0') + '.png');
const TREE = b64(path.join(PUB, 'arvore.svg'));
const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const NOTA = 'Preços de referência de nov/2026 · variam por região · sem óleo, sal e temperos';

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent;font-family:Nunito,Arial,sans-serif}
.cap{position:absolute;left:60px;right:60px;top:250px;display:flex;justify-content:center}
.cap span{background:rgba(20,14,12,.82);color:#fff;font-weight:900;font-size:72px;line-height:1.12;padding:22px 34px;border-radius:26px;text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.cap.low{top:auto;bottom:520px}
.tag{position:absolute;left:60px;top:160px;background:#fff;color:#a8241c;font-weight:900;font-size:30px;letter-spacing:1px;padding:8px 18px;border-radius:999px}
.ilus{position:absolute;right:28px;bottom:420px;color:#fff;font-size:22px;font-weight:700;opacity:.8;text-shadow:0 1px 4px #000}
.nota{position:absolute;left:60px;right:60px;bottom:370px;text-align:center;color:#fff;font-size:24px;font-weight:700;text-shadow:0 1px 6px #000}
.bgr{position:absolute;inset:0;background:linear-gradient(170deg,#b3261e,#7d1611)}
.bgg{position:absolute;inset:0;background:linear-gradient(170deg,#24704a,#123b26)}
.bgc{position:absolute;inset:0;background:linear-gradient(170deg,#fbf3e6,#efdfc6)}
.panel{position:absolute;left:40px;right:40px;top:600px;background:#fffdf8;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,.35);overflow:hidden}
.serif{font-family:Fraunces,Georgia,serif}
/* planilha */
.xl{font-family:Arial,sans-serif;color:#222}
.xl .bar{background:#1f6b3a;color:#fff;font-size:34px;font-weight:800;padding:18px 24px}
.xl .np{display:flex;align-items:center;gap:20px;padding:24px;font-size:44px;font-weight:800}
.xl .cell{min-width:140px;text-align:center;background:#fff3a6;border:5px solid #222;font-size:64px;font-weight:800;padding:2px 18px;color:#1d4ed8}
.xl table{width:100%;border-collapse:collapse;font-size:42px}
.xl th{background:#a8241c;color:#fff;text-align:left;padding:14px 18px;font-size:32px}
.xl td{border-bottom:2px solid #ead9c3;padding:18px 18px;font-weight:700}
.xl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.xl tr.tot td{background:#f3fbf5;font-weight:900;font-size:50px;border-top:4px solid #1f6b3a}
.hl{background:#fff3a6!important;transition:none}
/* lista */
.ls .hd{padding:26px 30px 10px}
.ls .row{display:flex;align-items:center;gap:22px;padding:16px 30px;border-bottom:2px solid #f0e4d2;font-size:38px;font-weight:800;color:#2b2320}
.ls .row small{margin-left:auto;font-size:30px;color:#6b625c;font-weight:700}
.box{flex:0 0 54px;height:54px;border:5px solid #1f6b3a;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:40px}
.box.on{background:#1f6b3a}
/* calendario */
.day{display:flex;gap:28px;padding:30px}
.dbox{flex:0 0 220px;background:#1f6b3a;color:#fff;border-radius:24px;text-align:center;padding:24px 10px}
.dbox b{display:block;font-size:110px;line-height:1;font-family:Fraunces,serif}
.dbox i{font-style:normal;font-size:34px;font-weight:800}
.tasks{display:grid;gap:16px;align-content:start}
.tasks div{font-size:38px;font-weight:800;color:#2b2320;line-height:1.2;display:flex;gap:14px}
.tasks div:before{content:"✓";color:#1f6b3a}
/* final */
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;padding:0 70px}
.end .t1{color:#fff;font-weight:900;font-size:80px;line-height:1.08;text-shadow:0 4px 18px rgba(0,0,0,.5)}
.end .price{background:#ffc93c;color:#3a2600;font-weight:900;font-size:62px;white-space:nowrap;border-radius:30px;padding:22px 46px;box-shadow:0 20px 40px rgba(0,0,0,.4)}
.end .sm{color:#fff;font-size:34px;font-weight:800;text-shadow:0 2px 8px #000}
`;

// ---------- cenas ----------
// tipos: clip{id, ss}, photo{id, dir}, page{n, crop:[x,y,w,h] frações}, lista, sheet{...}, day{...}, trio, end{photo}
const END = (fotoId) => ['Conheça o kit digital por dezenove e noventa. Toque em Saiba mais.', { t: 'end', photo: fotoId }];
const LISTA_ECO = [['Frango inteiro', '2 frangos de ~1,8 kg'], ['Arroz', '1 pacote de 1 kg'], ['Milho ou ervilha', '2 latas'], ['Cenoura', '1 kg'], ['Batata', '1 kg'], ['Ovos', '1 bandeja com 6'], ['Maionese', '2 potes de 250 g'], ['Farinha de mandioca', '1 pacote de 500 g'], ['Gelatina', '4 caixas']];
const VIDEOS = {
  CT01: { voz: F_VOZ, cenas: [
    ['Antes de comprar a ceia, monte a lista.', { t: 'clip', id: 8799885, ss: 1, cap: 'Antes de comprar a ceia, monte a lista' }],
    ['No kit, a lista já vem pronta, item por item, com a quantidade certa.', { t: 'lista', cap: 'A lista vem pronta, item por item' }],
    ['Você marca o que já tem em casa e leva só o que falta.', { t: 'clip', id: 8801827, ss: 2, cap: 'Marque o que já tem e leve só o que falta' }],
    ['Cada item vira um prato: frango recheado, farofa, arroz colorido.', { t: 'photo', id: 5956831, cap: 'Cada item vira um prato da ceia' }],
    ['Tem lista para os três cardápios do kit.', { t: 'page', n: 2, crop: [0, 0, 1, 0.47], cap: 'Lista para os 3 cardápios' }],
    END(5718025)] },
  CT02: { voz: A_VOZ, cenas: [
    ['Vai organizar a ceia? Olha o que já vem pronto.', { t: 'page', n: 0, crop: [0, 0, 1, 1], cap: 'Vai organizar a ceia? Olha o que já vem pronto', bg: 5813715 }],
    ['Primeiro, os três cardápios, cada um com o custo de referência.', { t: 'page', n: 1, crop: [0, 0.13, 1, 0.33], cap: '1. Os cardápios', nota: true }],
    ['Depois, a lista de compras, item por item.', { t: 'page', n: 2, crop: [0, 0, 1, 0.47], cap: '2. A lista de compras' }],
    ['As receitas vêm passo a passo, com tempo de preparo.', { t: 'page', n: 4, crop: [0, 0, 1, 0.5], cap: '3. As receitas' }],
    ['E o cronograma dos dias vinte e dois, vinte e três e vinte e quatro.', { t: 'page', n: 9, crop: [0, 0, 1, 0.62], cap: '4. O cronograma' }],
    END(5956828)] },
  CT03: { voz: F_VOZ, cenas: [
    ['Frango recheado, lombo ou pernil: qual combina com o seu Natal?', { t: 'trio', cap: 'Frango recheado, lombo ou pernil?' }],
    ['No Econômico, frango assado recheado, arroz colorido e farofa.', { t: 'photo', id: 5718025, cap: 'Econômico: frango recheado' }],
    ['No Clássico, lombo com laranja, salpicão e rabanada.', { t: 'photo', id: 36673992, cap: 'Clássico: lombo com laranja' }],
    ['No Caprichado, pernil assado, farofa de banana e pavê.', { t: 'photo', id: 10710971, cap: 'Caprichado: pernil assado' }],
    ['Os três cardápios estão incluídos, com lista e receitas de cada um.', { t: 'page', n: 1, crop: [0, 0.13, 1, 0.33], cap: 'Os 3 cardápios estão no kit', nota: true }],
    END(6210960)] },
  CT04: { voz: A_VOZ, cenas: [
    ['Mudou de oito para doze convidados?', { t: 'clip', id: 3198251, ss: 0, cap: 'Mudou de 8 para 12 convidados?' }],
    ['Na planilha do kit, você troca o número de pessoas.', { t: 'sheet', mode: 'pessoas', cap: 'Troque o número de pessoas' }],
    ['E as quantidades se ajustam: o frango passa de dois para três.', { t: 'sheet', mode: 'qtd', cap: 'As quantidades se ajustam' }],
    ['O total de referência do cardápio Econômico vai de cento e treze para cento e setenta e dois reais.', { t: 'sheet', mode: 'total', cap: 'O total é recalculado', nota: true }],
    ['A lista já sai no tamanho da sua família.', { t: 'clip', id: 9015590, ss: 1, cap: 'Lista no tamanho da sua família' }],
    END(5813715)] },
  CT05: { voz: F_VOZ, cenas: [
    ['O que você pode adiantar antes do dia vinte e quatro?', { t: 'clip', id: 8801878, ss: 0, cap: 'O que dá para adiantar antes do dia 24?' }],
    ['No dia vinte e dois, separe as travessas, pique os legumes e rale a cenoura.', { t: 'day', d: '22', h: '3 horas', tasks: ['Separe assadeiras e travessas', 'Pique e guarde cebola, alho e cenoura', 'Rale a cenoura da farofa'], cap: 'Dia 22: pré-preparo' }],
    ['No dia vinte e três, tempere a carne e faça a sobremesa.', { t: 'clip', id: 6107304, ss: 0, cap: 'Dia 23: tempere a carne' }],
    ['A farofa e a maionese também podem ficar prontas na véspera.', { t: 'day', d: '23', h: '4 horas', tasks: ['Tempere o frango, o lombo ou o pernil', 'Cozinhe batata, cenoura e ovos', 'Faça a sobremesa e a farofa'], cap: 'Dia 23: véspera' }],
    ['No dia vinte e quatro, o cronograma mostra a hora de cada etapa.', { t: 'day', d: '24', h: 'dia da ceia', tasks: ['17h30 · frangos recheados no forno', '19h30 · arroz e saladas', '21h · ceia servida'], cap: 'Dia 24: hora a hora' }],
    ['Assim o trabalho fica dividido em três dias.', { t: 'clip', id: 37312840, ss: 0, cap: 'Trabalho dividido em 3 dias' }],
    END(5956831)] },
  CT06: { voz: A_VOZ, cenas: [
    ['Quanto essa lista vai dar no caixa?', { t: 'clip', id: 8801827, ss: 6, cap: 'Quanto essa lista vai dar no caixa?' }],
    ['A planilha do kit traz um preço de referência para cada item.', { t: 'sheet', mode: 'ref', cap: 'Preço de referência em cada item', nota: true }],
    ['Você troca pelo preço do seu mercado.', { t: 'sheet', mode: 'precos', cap: 'Troque pelo preço do seu mercado' }],
    ['E o total se atualiza na hora.', { t: 'sheet', mode: 'totalp', cap: 'O total se atualiza', nota: true }],
    ['Assim você tem uma estimativa antes de ir às compras.', { t: 'clip', id: 8799885, ss: 6, cap: 'Uma estimativa antes das compras' }],
    END(5718025)] },
  CT07: { voz: F_VOZ, cenas: [
    ['Hora de servir a ceia.', { t: 'clip', id: 3198217, ss: 0, cap: 'Hora de servir a ceia' }],
    ['Uma mesa caseira e caprichada começa pelo cardápio.', { t: 'clip', id: 6269870, ss: 0, cap: 'Mesa caprichada começa pelo cardápio' }],
    ['Frango assado recheado...', { t: 'photo', id: 6210960, cap: 'Frango assado recheado' }],
    ['lombo com laranja...', { t: 'photo', id: 36673992, cap: 'Lombo com laranja' }],
    ['e uma farofa caprichada.', { t: 'photo', id: 16976659, cap: 'Farofa caprichada' }],
    ['Essas receitas estão no kit da Ceia de Natal Econômica, com lista e cronograma.', { t: 'page', n: 4, crop: [0, 0, 1, 0.5], cap: 'As receitas estão no kit', bg: 5813715 }],
    END(5813717)] },
};

// ---------- áudio ----------
const dur = (f) => { const r = spawnSync(ffmpeg, ['-i', f], { encoding: 'utf8' }); const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr); return +m[1] * 3600 + +m[2] * 60 + +m[3]; };
async function tts(text, file, voz) {
  if (fs.existsSync(file)) return;
  for (let k = 0; k < 4; k++) {
    try {
      const t = new MsEdgeTTS(); await t.setMetadata(voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const dir = file + '_d'; fs.mkdirSync(dir, { recursive: true }); await t.toFile(dir, text); t.close();
      execFileSync(ffmpeg, ['-y', '-i', path.join(dir, 'audio.mp3'), '-af', 'atempo=1.2,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', file], { stdio: 'ignore' });
      fs.rmSync(dir, { recursive: true, force: true }); return;
    } catch (e) { console.log('tts retry', e.message || e); }
  }
  throw new Error('TTS falhou: ' + text);
}
function musica(file, secs) {
  const notas = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 493.88];
  const step = 0.42, sr = 44100, n = sr * secs, L = notas.length * step; const buf = Buffer.alloc(44 + n * 2);
  for (let s = 0; s < n; s++) { const t = s / sr, m = t % L; let v = 0; for (let i = 0; i < notas.length; i++) for (const off of [0, L]) { const dt = m - i * step + off; if (dt >= 0 && dt < 1.6) v += Math.sin(2 * Math.PI * notas[i] * t) * Math.exp(-3 * dt) + 0.3 * Math.sin(4 * Math.PI * notas[i] * t) * Math.exp(-5 * dt); } const fade = Math.min(1, t / 0.5, (secs - t) / 1); buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 0.25 * fade * 32767))), 44 + s * 2); }
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40); fs.writeFileSync(file, buf);
}

// ---------- HTML das cenas ----------
const cap = (c, low) => c.cap ? `<div class="cap${low ? ' low' : ''}"><span>${c.cap}</span></div>` : '';
const nota = (c) => c.nota ? `<div class="nota">${NOTA}</div>` : '';
function sheetHTML(mode) {
  const a = PLAN.eco8, b = mode === 'pessoas' || mode === 'qtd' || mode === 'total' ? PLAN.eco12 : PLAN.eco8alt;
  const keys = ['Frango inteiro', 'Batata', 'Cenoura', 'Maionese']; const P = mode === 'ref' || mode === 'precos' || mode === 'totalp';
  const row = (r) => r.rows.find((x) => x.item === r.__k);
  const linhas = keys.map((k) => { const ra = a.rows.find((x) => x.item === k), rb = b.rows.find((x) => x.item === k);
    const chQ = ra.k !== rb.k, chP = ra.preco !== rb.preco;
    return `<tr><td>${k === 'Frango inteiro' ? 'Frango' : k}</td>${P ? `<td class="n" data-col="p" data-a="${brl(ra.preco)}" data-b="${brl(rb.preco)}" data-hl="${chP ? 1 : 0}">${brl(ra.preco)}</td>` : `<td class="n" data-col="q" data-a="${ra.k}" data-b="${rb.k}" data-hl="${chQ ? 1 : 0}">${ra.k}</td>`}<td class="n" data-a="${brl(ra.sub)}" data-b="${brl(rb.sub)}">${brl(ra.sub)}</td></tr>`; }).join('');
  const nA = 8, nB = mode === 'pessoas' || mode === 'qtd' || mode === 'total' ? 12 : 8;
  return `<div class="panel xl"><div class="bar">Cardápio Econômico — lista de compras (planilha do kit)</div>
    <div class="np">Número de pessoas → <span class="cell" data-a="${nA}" data-b="${nB}" data-hl="${nA !== nB ? 1 : 0}">${nA}</span></div>
    <table><tr><th>Item</th><th style="text-align:right">${P ? 'Preço (R$/un.)' : 'Comprar'}</th><th style="text-align:right">Subtotal</th></tr>${linhas}
    <tr><td colspan="3" style="font-size:30px;color:#6b625c;font-weight:700">+ outros 7 itens da lista</td></tr>
    <tr class="tot"><td>Total</td><td colspan="2" class="n" data-a="${brl(a.total)}" data-b="${brl(b.total)}" data-hl="1">${brl(a.total)}</td></tr></table></div>`;
}
function sceneHTML(c) {
  if (c.t === 'clip' || c.t === 'photo') return `<div class="tag">KIT DIGITAL</div>${cap(c)}<div class="ilus">Imagem ilustrativa</div>${nota(c)}`; // overlay transparente
  if (c.t === 'page') {
    const [x, y, w, h] = c.crop;
    const bg = c.bg ? `<div style="position:absolute;inset:0;background:url(${b64(foto(c.bg))}) center/cover;filter:blur(14px) brightness(.55);transform:scale(1.1)"></div>` : '<div class="bgr"></div>';
    return `${bg}<div class="tag">KIT DIGITAL</div>${cap(c)}<div class="mv" data-z="1" style="position:absolute;left:50px;right:50px;top:560px;bottom:470px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.45)">
      <div style="position:absolute;inset:0;background:url(${b64(pag(c.n))}) no-repeat;background-size:${100 / w}% auto;background-position:${x === 0 ? 0 : (x / (1 - w)) * 100}% ${y === 0 ? 0 : (y / (1 - h)) * 100}%"></div></div>${nota(c)}`;
  }
  if (c.t === 'lista') return `<div class="bgc"></div><div class="tag">KIT DIGITAL</div>${cap(c)}<div class="panel ls"><div class="hd serif" style="font-size:44px;color:#a8241c;font-weight:800">Lista de compras · 8 pessoas</div><div style="padding:0 30px 10px;font-size:30px;color:#1f6b3a;font-weight:800">Cardápio Econômico</div>${LISTA_ECO.map((r, i) => `<div class="row"><span class="box" data-i="${i}"></span>${r[0]}<small>${r[1]}</small></div>`).join('')}</div>`;
  if (c.t === 'sheet') return `<div class="bgg"></div><div class="tag">KIT DIGITAL</div>${cap(c)}${sheetHTML(c.mode)}${nota(c)}`;
  if (c.t === 'day') return `<div class="bgc"></div><div class="tag">KIT DIGITAL</div>${cap(c)}<div class="panel"><div class="day"><div class="dbox"><i>DEZ</i><b>${c.d}</b><i>${c.h}</i></div><div class="tasks">${c.tasks.map((t, i) => `<div data-i="${i}">${t}</div>`).join('')}</div></div></div>`;
  if (c.t === 'trio') return `<div style="position:absolute;inset:0;display:grid;grid-template-rows:1fr 1fr 1fr">${[5718025, 36673992, 10710971].map((id, i) => `<div class="mv" data-z="${i}" style="background:url(${b64(foto(id))}) center/cover;position:relative"><span style="position:absolute;left:40px;bottom:30px;background:#fff;color:#a8241c;font-weight:900;font-size:40px;padding:8px 20px;border-radius:14px">${['Frango recheado', 'Lombo com laranja', 'Pernil assado'][i]}</span></div>`).join('')}</div><div class="tag">KIT DIGITAL</div>${cap(c)}<div class="ilus" style="bottom:60px">Imagens ilustrativas</div>`;
  if (c.t === 'end') return `<div style="position:absolute;inset:0;background:url(${b64(foto(c.photo))}) center/cover;filter:blur(10px) brightness(.5);transform:scale(1.1)"></div><div class="end"><img class="mv" data-z="1" src="${b64(pag(0))}" style="width:420px;border-radius:16px;box-shadow:0 30px 60px rgba(0,0,0,.5);transform:rotate(-3deg)"><div class="t1">Conheça o kit digital<br>da Ceia de Natal</div><div class="price">Kit digital por R$ 19,90</div><div class="sm">Toque em Saiba mais 👇<br><span style="font-size:26px;font-weight:700">PDF + planilha · não é comida pronta</span></div></div>`;
}
// animação por tempo (t em s dentro da cena, d = duração)
const ANIM = `window.__frame=(t,d,mode)=>{
  const e=(x)=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
  const c=document.querySelector('.cap span'); if(c){c.style.opacity=e(t/0.35);c.style.transform='translateY('+(30*(1-e(t/0.35)))+'px)';}
  document.querySelectorAll('.mv').forEach(m=>{m.style.transform=(m.style.transform.replace(/scale\\([^)]*\\)/,'')+' scale('+(1+0.06*t/d)+')').trim();});
  document.querySelectorAll('.box').forEach(b=>{const i=+b.dataset.i;const on=t>0.5+i*((d-1)/9);b.classList.toggle('on',on);b.textContent=on?'✓':'';});
  document.querySelectorAll('.tasks div').forEach(x=>{const i=+x.dataset.i;x.style.opacity=e((t-0.4-i*0.6)/0.4);});
  const tc=d*0.45; const sw=t>tc;
  document.querySelectorAll('[data-a]').forEach(x=>{const show= mode==='ref'?false:sw; x.textContent=show?x.dataset.b:x.dataset.a;
    const hl= x.dataset.hl==='1' && show && ((mode==='pessoas'&&x.classList.contains('cell'))||(mode==='qtd'&&x.dataset.col==='q')||(mode==='total'&&x.closest('.tot'))||(mode==='precos'&&x.dataset.col==='p')||(mode==='totalp'&&(x.closest('.tot')||x.dataset.col==='p')));
    x.classList.toggle('hl',!!hl);});
  if(mode==='pessoas'||mode==='precos'){/* destaca a célula editável antes da troca */document.querySelectorAll('.cell').forEach(x=>{if(mode==='pessoas'&&!sw)x.style.outline=(Math.floor(t*3)%2?'6px solid #1d4ed8':'none');else x.style.outline='none';});}
};`;

// ---------- render ----------
async function renderFrames(b, c, d, dir) {
  const p = await b.newPage(); await p.setViewport({ width: W, height: H });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Nunito:wght@700;800;900&display=block"><style>${CSS}</style></head><body>${sceneHTML(c)}<script>${ANIM}</script></body></html>`, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(d * FPS);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t, d, m) => window.__frame(t, d, m), i / FPS, d, c.mode || '');
    await p.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 88 });
  }
  await p.close();
}
async function renderOverlay(b, c, file) {
  const p = await b.newPage(); await p.setViewport({ width: W, height: H });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Nunito:wght@700;800;900&display=block"><style>${CSS}</style></head><body>${sceneHTML(c)}</body></html>`, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await p.screenshot({ path: file, omitBackground: true }); await p.close();
}
const ENC = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', String(FPS), '-an'];
async function segmento(b, c, d, file) {
  if (c.t === 'clip' || c.t === 'photo') {
    const ov = file + '.png'; await renderOverlay(b, c, ov);
    const n = Math.round(d * FPS);
    let input, vf;
    if (c.t === 'clip') { input = ['-stream_loop', '-1', '-ss', String(c.ss || 0), '-i', clipf(c.id)]; vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},eq=brightness=-0.03`; }
    else { input = ['-loop', '1', '-i', foto(c.id)]; vf = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='1+0.0009*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS}`; }
    execFileSync(ffmpeg, ['-y', ...input, '-loop', '1', '-i', ov, '-filter_complex', `[0:v]${vf},setsar=1[bg];[1:v]format=rgba,fade=t=in:st=0:d=0.35:alpha=1[ov];[bg][ov]overlay=0:0:shortest=0[v]`, '-map', '[v]', '-frames:v', String(n), ...ENC, file], { stdio: 'ignore' });
  } else {
    const dir = file + '_f'; await renderFrames(b, c, d, dir);
    execFileSync(ffmpeg, ['-y', '-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), ...ENC, file], { stdio: 'ignore' });
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
async function video(b, nome, cfg) {
  const cenas = [];
  for (let i = 0; i < cfg.cenas.length; i++) { const f = path.join(TMP, `${nome}-${i}.wav`); await tts(cfg.cenas[i][0], f, cfg.voz); cenas.push({ f, d: +(dur(f) + 0.35).toFixed(2) }); }
  let t0 = 0; cenas.forEach((c) => { c.t = t0; t0 += c.d; }); const total = t0;
  const segs = [];
  for (let i = 0; i < cfg.cenas.length; i++) { const s = path.join(TMP, `${nome}-seg${i}.mp4`); await segmento(b, cfg.cenas[i][1], cenas[i].d, s); segs.push(s); }
  const lst = path.join(TMP, nome + '-list.txt'); fs.writeFileSync(lst, segs.map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));
  const vid = path.join(TMP, nome + '-v.mp4'); execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid], { stdio: 'ignore' });
  const mus = path.join(TMP, nome + '-mus.wav'); musica(mus, Math.ceil(total) + 1);
  const args = ['-y']; cenas.forEach((c) => args.push('-i', c.f)); args.push('-i', mus);
  const filt = cenas.map((c, i) => `[${i}]adelay=${Math.round((c.t + 0.1) * 1000)}:all=1[a${i}]`).join(';') + `;[${cenas.length}]volume=0.04[m];` + cenas.map((_, i) => `[a${i}]`).join('') + `[m]amix=inputs=${cenas.length + 1}:normalize=0:duration=longest,atrim=0:${total.toFixed(2)}[out]`;
  const wav = path.join(TMP, nome + '-mix.wav'); execFileSync(ffmpeg, [...args, '-filter_complex', filt, '-map', '[out]', '-ar', '44100', wav], { stdio: 'ignore' });
  execFileSync(ffmpeg, ['-y', '-i', vid, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', path.join(OUT, `${nome}-v2-1080x1920.mp4`)], { stdio: 'ignore' });
  console.log('ok', nome, total.toFixed(1) + 's');
}

// ---------- imagens 1080x1080 ----------
const SQCSS = `*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1080px;overflow:hidden;font-family:Nunito,Arial,sans-serif}
.h{font-weight:900;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.55)}.sup{font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.price{display:inline-block;background:#ffc93c;color:#3a2600;font-weight:900;border-radius:22px;padding:16px 30px;box-shadow:0 14px 30px rgba(0,0,0,.35)}
.ilus{position:absolute;right:16px;bottom:12px;color:#fff;font-size:16px;font-weight:700;opacity:.85;text-shadow:0 1px 4px #000}`;
const IMGS = {
  IMG01: () => `<div style="position:absolute;inset:0;background:url(${b64(foto(5956831))}) center/cover"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,0) 42%,rgba(0,0,0,0) 55%,rgba(0,0,0,.75) 100%)"></div>
    <div style="position:absolute;left:60px;right:60px;top:56px" class="h"><div style="font-size:66px;line-height:1.08">Seu cardápio de Natal já pode estar planejado</div></div>
    <img src="${b64(pag(0))}" style="position:absolute;right:56px;bottom:200px;width:250px;border-radius:12px;transform:rotate(4deg);box-shadow:0 20px 40px rgba(0,0,0,.5)">
    <div style="position:absolute;left:60px;bottom:64px;display:grid;gap:18px"><div class="sup" style="font-size:38px">3 cardápios + 14 receitas + lista de compras</div><div><span class="price" style="font-size:52px">Kit digital por R$ 19,90</span></div></div><div class="ilus">Imagem ilustrativa</div>`,
  IMG02: () => `<div style="position:absolute;inset:0;background:linear-gradient(170deg,#1f6b3a,#123b26)"></div>
    <div style="position:absolute;left:56px;right:56px;top:48px" class="h"><div style="font-size:60px;line-height:1.08">O que comprar. Quanto preparar. Quando começar.</div><div class="sup" style="font-size:34px;margin-top:12px;color:#ffe8c2">Cardápios, lista e cronograma</div></div>
    <div style="position:absolute;left:40px;right:40px;top:300px;height:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 24px 50px rgba(0,0,0,.45)"><div style="position:absolute;inset:0;background:url(${b64(pag(2))}) no-repeat;background-size:140% auto;background-position:0 0"></div></div>
    <img src="${b64(pag(0))}" style="position:absolute;left:56px;bottom:40px;width:150px;border-radius:10px;transform:rotate(-4deg);box-shadow:0 14px 30px rgba(0,0,0,.5)">
    <div style="position:absolute;right:50px;bottom:48px;text-align:right"><span class="price" style="font-size:54px">Kit digital por R$ 19,90</span></div>`,
  IMG03: () => `<div style="position:absolute;inset:0;background:url(${b64(foto(5718025))}) center/cover"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,0) 58%,rgba(0,0,0,.78) 100%)"></div>
    <div style="position:absolute;left:60px;right:60px;top:56px" class="h"><div style="font-size:70px;line-height:1.06">Seu Natal também pode ter frango recheado</div></div>
    <div style="position:absolute;right:56px;bottom:210px;width:260px;height:200px;border-radius:18px;border:6px solid #fff;background:url(${b64(foto(16976659))}) center/cover;box-shadow:0 18px 36px rgba(0,0,0,.5)"><span style="position:absolute;left:10px;bottom:10px;background:#fff;color:#a8241c;font-weight:900;font-size:24px;padding:4px 12px;border-radius:10px">+ farofa</span></div>
    <div style="position:absolute;left:60px;bottom:64px;display:grid;gap:18px"><div class="sup" style="font-size:40px">Conheça o cardápio Econômico</div><div><span class="price" style="font-size:52px">Kit digital por R$ 19,90</span></div></div><div class="ilus">Imagens ilustrativas</div>`,
};

(async () => {
  const q = process.argv.slice(2);
  const b = await puppeteer.launch();
  if (!q.length || q.includes('IMG')) for (const [n, f] of Object.entries(IMGS)) {
    const p = await b.newPage(); await p.setViewport({ width: 1080, height: 1080 });
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=block"><style>${SQCSS}</style></head><body>${f()}</body></html>`, { waitUntil: 'networkidle0' });
    await p.evaluateHandle('document.fonts.ready'); await p.screenshot({ path: path.join(OUT, `${n}-v2-1080x1080.png`) }); await p.close(); console.log('ok', n);
  }
  for (const [n, cfg] of Object.entries(VIDEOS)) if (!q.length || q.includes(n)) await video(b, n, cfg);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
