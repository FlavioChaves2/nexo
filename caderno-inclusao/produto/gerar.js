// Gera as imagens das fichas (para a landing page) e os PDFs (exemplo preenchido e fichas em branco).
// Uso: NODE_PATH=<pasta com puppeteer e sharp> node gerar.js
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SRC = pathToFileURL(path.join(__dirname, 'fichas.html')).href;
const IMG = path.join(__dirname, '..', '..', 'public', 'caderno-inclusao', 'img');
const PDF = path.join(__dirname, 'pdf');
fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(PDF, { recursive: true });

(async () => {
  const b = await puppeteer.launch();
  const p = await b.newPage();
  await p.setViewport({ width: 900, height: 1300, deviceScaleFactor: 2 });
  for (const vazia of [false, true]) {
    await p.goto(SRC, { waitUntil: 'networkidle0' });
    await p.evaluate(v => { document.body.className = v ? 'vazia' : ''; }, vazia);
    await p.evaluateHandle('document.fonts.ready');
    const secs = await p.$$('section');
    for (let i = 0; i < secs.length; i++) {
      const buf = await secs[i].screenshot({ type: 'png' });
      const nome = `ficha${i + 1}${vazia ? '-branco' : ''}`;
      await sharp(buf).resize({ width: 900 }).webp({ quality: 80 }).toFile(path.join(IMG, nome + '.webp'));
    }
    await p.emulateMediaType('print');
    await p.pdf({ path: path.join(PDF, vazia ? 'Fichas-em-branco.pdf' : 'Exemplo-preenchido-caso-ficticio.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await p.emulateMediaType('screen');
  }
  // Amostra gratuita: só a Ficha 1 preenchida (1 página)
  await p.goto(SRC, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await p.emulateMediaType('print');
  await p.pdf({ path: path.join(__dirname, '..', '..', 'public', 'caderno-inclusao', 'amostra-ficha-observacao.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, pageRanges: '1' });
  await b.close();
  console.log('ok');
})();
