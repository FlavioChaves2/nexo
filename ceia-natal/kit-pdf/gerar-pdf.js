// Uso: NODE_PATH=<pasta com puppeteer>/node_modules node gerar-pdf.js
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const b = await puppeteer.launch();
  const p = await b.newPage();
  await p.goto(require('url').pathToFileURL(path.join(__dirname, 'kit.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  const out = path.join(__dirname, 'Ceia-de-Natal-Economica-Kit.pdf');
  await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:Arial">Ceia de Natal Econômica · <span class="pageNumber"></span>/<span class="totalPages"></span></div>' });
  console.log('Salvo:', out);
  await b.close();
})();
