// Gera "Ceia-de-Natal-Economica-Planilha.xlsx".
// Uso: NODE_PATH=<pasta com exceljs>/node_modules node gerar-planilha.js
const ExcelJS = require('exceljs');
const path = require('path');

const FONTE = {
  anapolis: 'Procon Anápolis, mar/2026',
  arroz: 'Procon-SP, ago/2026 (pacote 5 kg a R$ 20,59 ÷ 5)',
  batata: 'Procon-SP, set/2026',
  biscoito: 'Procon-SP, set/2026',
  leite: 'Procon-SP, jul/2026',
  ovos: 'Procon-SP, jun/2026 (dúzia a R$ 10,78 ÷ 12)',
  est: 'Estimativa (sem pesquisa oficial)',
  pernil: 'Estimativa: pernil sem osso custa R$ 22,48/kg (Procon Anápolis, mar/2026); com osso sai mais barato',
};

// [item, usado em, unidade de compra, por pessoa, tamanho da embalagem (na unidade), embalagem, preço por unidade, fonte]
const CARDAPIOS = [
  {
    aba: '1. Econômico',
    titulo: 'Cardápio Econômico',
    pratos: 'Frango assado recheado · Arroz colorido · Maionese de batata · Farofa de cenoura · Gelatina · Refresco',
    itens: [
      ['Frango inteiro', 'Frango assado recheado', 'kg', 0.45, 1.8, 'frango inteiro de ~1,8 kg', 11.49, FONTE.anapolis],
      ['Margarina', 'Frango e farofa', 'pote', 0.125, 1, 'pote de 500 g', 9.0, FONTE.est],
      ['Arroz', 'Arroz colorido', 'kg', 0.08, 1, 'pacote de 1 kg', 4.12, FONTE.arroz],
      ['Milho ou ervilha em lata', 'Arroz colorido e maionese', 'lata', 0.25, 1, 'lata de ~170 g', 5.0, FONTE.est],
      ['Cenoura', 'Arroz, maionese e farofa', 'kg', 0.125, 0.5, 'meio quilo a granel', 6.0, FONTE.est],
      ['Batata', 'Maionese de batata', 'kg', 0.125, 0.5, 'meio quilo a granel', 7.77, FONTE.batata],
      ['Ovos', 'Maionese de batata', 'ovo', 0.5, 6, 'bandeja com 6', 10.78 / 12, FONTE.ovos],
      ['Maionese', 'Maionese de batata', 'pote', 0.25, 1, 'pote de 250 g', 5.0, FONTE.est],
      ['Farinha de mandioca', 'Farofa e recheio do frango', 'kg', 0.0625, 0.5, 'pacote de 500 g', 8.0, FONTE.est],
      ['Gelatina', 'Sobremesa', 'caixa', 0.5, 1, 'caixa de 20 g a 85 g', 2.5, FONTE.est],
      ['Refresco em pó', 'Bebida', 'sachê', 0.5, 1, 'sachê que rende 1 litro', 1.5, FONTE.est],
    ],
  },
  {
    aba: '2. Clássico',
    titulo: 'Cardápio Clássico',
    pratos: 'Lombo suíno com laranja · Arroz com uva-passa · Salpicão de frango · Farofa de bacon · Rabanada · Refrigerante',
    itens: [
      ['Lombo suíno', 'Lombo com laranja', 'kg', 0.3, 0.5, 'meio quilo no açougue', 27.64, FONTE.anapolis],
      ['Laranja', 'Molho do lombo', 'kg', 0.125, 1, '1 kg (~6 laranjas)', 5.0, FONTE.est],
      ['Arroz', 'Arroz com uva-passa', 'kg', 0.08, 1, 'pacote de 1 kg', 4.12, FONTE.arroz],
      ['Uva-passa', 'Arroz e salpicão', 'pacote', 0.125, 1, 'pacote de 100 g', 4.0, FONTE.est],
      ['Peito de frango', 'Salpicão', 'kg', 0.1, 1, 'bandeja de ~1 kg', 18.0, FONTE.est],
      ['Maionese', 'Salpicão', 'pote', 0.25, 1, 'pote de 250 g', 5.0, FONTE.est],
      ['Cenoura', 'Salpicão', 'kg', 0.05, 0.5, 'meio quilo a granel', 6.0, FONTE.est],
      ['Milho em lata', 'Salpicão', 'lata', 0.125, 1, 'lata de ~170 g', 5.0, FONTE.est],
      ['Bacon', 'Farofa de bacon', 'kg', 0.03, 0.25, 'pacote de 250 g', 40.0, FONTE.est],
      ['Farinha de mandioca', 'Farofa de bacon', 'kg', 0.0625, 0.5, 'pacote de 500 g', 8.0, FONTE.est],
      ['Pão francês (dormido)', 'Rabanada', 'kg', 0.075, 0.05, 'pão de ~50 g (12 pães)', 15.0, FONTE.est],
      ['Leite', 'Rabanada', 'litro', 0.125, 1, 'caixa de 1 litro', 5.68, FONTE.leite],
      ['Ovos', 'Rabanada', 'ovo', 0.375, 6, 'bandeja com 6', 10.78 / 12, FONTE.ovos],
      ['Açúcar', 'Rabanada', 'kg', 0.125, 1, 'pacote de 1 kg', 4.5, FONTE.est],
      ['Refrigerante 2 L', 'Bebida', 'garrafa', 0.25, 1, 'garrafa de 2 litros', 8.0, FONTE.est],
    ],
  },
  {
    aba: '3. Caprichado',
    titulo: 'Cardápio Caprichado',
    pratos: 'Pernil assado · Arroz com amendoim · Salpicão + maionese de batata · Farofa de banana com bacon · Pavê · Panetone · Espumante · Refrigerante',
    itens: [
      ['Pernil com osso', 'Pernil assado', 'kg', 0.43, 0.5, 'meio quilo no açougue', 18.9, FONTE.pernil],
      ['Arroz', 'Arroz com amendoim', 'kg', 0.08, 1, 'pacote de 1 kg', 4.12, FONTE.arroz],
      ['Amendoim torrado', 'Arroz com amendoim', 'pacote', 0.125, 1, 'pacote de 200 g', 5.0, FONTE.est],
      ['Peito de frango', 'Salpicão', 'kg', 0.1, 1, 'bandeja de ~1 kg', 18.0, FONTE.est],
      ['Maionese', 'Salpicão e maionese de batata', 'pote', 0.375, 1, 'pote de 250 g', 5.0, FONTE.est],
      ['Cenoura', 'Salpicão e maionese de batata', 'kg', 0.0625, 0.5, 'meio quilo a granel', 6.0, FONTE.est],
      ['Milho em lata', 'Salpicão', 'lata', 0.125, 1, 'lata de ~170 g', 5.0, FONTE.est],
      ['Batata', 'Maionese de batata', 'kg', 0.125, 0.5, 'meio quilo a granel', 7.77, FONTE.batata],
      ['Ovos', 'Maionese de batata', 'ovo', 0.5, 6, 'bandeja com 6', 10.78 / 12, FONTE.ovos],
      ['Bacon', 'Farofa de banana', 'kg', 0.03, 0.25, 'pacote de 250 g', 40.0, FONTE.est],
      ['Banana', 'Farofa de banana', 'kg', 0.125, 0.5, 'meio quilo (~4 bananas)', 6.0, FONTE.est],
      ['Farinha de mandioca', 'Farofa de banana', 'kg', 0.0625, 0.5, 'pacote de 500 g', 8.0, FONTE.est],
      ['Biscoito maisena', 'Pavê', 'pacote', 0.25, 1, 'pacote de 200 g', 3.61, FONTE.biscoito],
      ['Leite condensado', 'Pavê', 'lata', 0.125, 1, 'lata ou caixinha de 395 g', 6.0, FONTE.est],
      ['Creme de leite', 'Pavê', 'caixa', 0.125, 1, 'caixinha de 200 g', 3.5, FONTE.est],
      ['Leite', 'Pavê', 'litro', 0.0625, 1, 'caixa de 1 litro', 5.68, FONTE.leite],
      ['Chocolate em pó', 'Pavê', 'pacote', 0.125, 1, 'pacote de 200 g', 8.0, FONTE.est],
      ['Panetone', 'Sobremesa', 'unidade', 0.125, 1, 'panetone de ~400 g', 15.0, FONTE.est],
      ['Espumante nacional', 'Brinde', 'garrafa', 0.125, 1, 'garrafa de 750 ml', 25.0, FONTE.est],
      ['Refrigerante 2 L', 'Bebida', 'garrafa', 0.25, 1, 'garrafa de 2 litros', 8.0, FONTE.est],
    ],
  },
];

const PESSOAS = 8;
const AVISO = 'Preços de referência de nov/2026; variam por região — troque pelo preço da sua cidade.';

// Cores (mesma família quente da página de vendas: vermelho natalino + verde + creme)
const C = {
  vermelho: 'FFB3261E', verde: 'FF1F6B3A', creme: 'FFFFF8EC', amarelo: 'FFFFF2B3',
  cinza: 'FF6B6B6B', linha: 'FFE6DCCB', branco: 'FFFFFFFF', azul: 'FF0000FF',
};
const font = (o = {}) => ({ name: 'Arial', size: 10, ...o });
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const borda = { top: { style: 'thin', color: { argb: C.linha } }, bottom: { style: 'thin', color: { argb: C.linha } }, left: { style: 'thin', color: { argb: C.linha } }, right: { style: 'thin', color: { argb: C.linha } } };
const BRL = '"R$" #,##0.00';
const QTD = '#,##0.0##';

// Arredonda para cima em embalagens inteiras (mesma conta da fórmula)
const embalagens = (pp, n, tam) => Math.ceil(Math.round((pp * n / tam) * 1e4) / 1e4);

const wb = new ExcelJS.Workbook();
wb.creator = 'Ceia de Natal Econômica';
wb.calcProperties.fullCalcOnLoad = true;
const resumo = { sheet: wb.addWorksheet('Comece aqui', { views: [{ showGridLines: false }] }) };
const totais = [];

const PRIMEIRA = 9; // primeira linha de itens

for (const card of CARDAPIOS) {
  const ws = wb.addWorksheet(card.aba, { views: [{ showGridLines: false, state: 'frozen', ySplit: PRIMEIRA - 1 }] });
  ws.columns = [
    { width: 26 }, { width: 28 }, { width: 13 }, { width: 9 }, { width: 13 }, { width: 27 },
    { width: 15 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 48 },
  ];
  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = `🎄 ${card.titulo} — lista de compras`;
  ws.getCell('A1').font = font({ size: 16, bold: true, color: { argb: C.vermelho } });
  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = card.pratos;
  ws.getCell('A2').font = font({ italic: true, color: { argb: C.cinza } });

  // Campo número de pessoas
  ws.getCell('A4').value = 'Número de pessoas →';
  ws.getCell('A4').font = font({ size: 12, bold: true });
  ws.getCell('A4').alignment = { horizontal: 'right', vertical: 'middle' };
  const np = ws.getCell('B4');
  np.value = PESSOAS;
  np.font = font({ size: 16, bold: true, color: { argb: C.azul } });
  np.fill = fill(C.amarelo);
  np.alignment = { horizontal: 'center', vertical: 'middle' };
  np.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
  np.dataValidation = { type: 'whole', operator: 'between', formulae: [1, 60], allowBlank: false, showErrorMessage: true, errorTitle: 'Número de pessoas', error: 'Digite um número inteiro entre 1 e 60.' };
  np.note = 'Troque este número: as quantidades, as embalagens e o total se ajustam sozinhos.';
  ws.getRow(4).height = 30;

  const ultima = PRIMEIRA + card.itens.length - 1;
  const linhaTotal = ultima + 2;

  // Destaques: total e custo por pessoa
  ws.getCell('D4').value = 'Total da ceia';
  ws.getCell('G4').value = 'Custo por pessoa';
  for (const ref of ['D4', 'G4']) {
    ws.getCell(ref).font = font({ size: 11, bold: true, color: { argb: C.branco } });
    ws.getCell(ref).fill = fill(C.verde);
    ws.getCell(ref).alignment = { horizontal: 'right', vertical: 'middle' };
  }
  ws.mergeCells('D4:E4');
  ws.mergeCells('G4:H4'); // rótulo

  let total = 0;
  card.itens.forEach(([, , , pp, tam, , preco]) => { total += embalagens(pp, PESSOAS, tam) * tam * preco; });
  total = Math.round(total * 100) / 100;
  totais.push({ aba: card.aba, titulo: card.titulo, total, pessoas: PESSOAS });

  const t = ws.getCell('F4');
  t.value = { formula: `H${linhaTotal}`, result: total };
  const pp = ws.getCell('I4');
  pp.value = { formula: `IF(B4>0,H${linhaTotal}/B4,0)`, result: total / PESSOAS };
  for (const c of [t, pp]) {
    c.numFmt = BRL;
    c.font = font({ size: 16, bold: true, color: { argb: C.vermelho } });
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: { style: 'medium', color: { argb: C.verde } }, bottom: { style: 'medium', color: { argb: C.verde } }, left: { style: 'medium', color: { argb: C.verde } }, right: { style: 'medium', color: { argb: C.verde } } };
  }

  ws.mergeCells('A6:K6');
  ws.getCell('A6').value = `⚠ ${AVISO} Só edite as células amarelas: o número de pessoas e a coluna "Preço na sua cidade". Óleo, sal, alho, cebola e temperos básicos não entram na conta.`;
  ws.getCell('A6').font = font({ bold: true, color: { argb: C.vermelho } });
  ws.getCell('A6').alignment = { wrapText: true, vertical: 'middle' };
  ws.getRow(6).height = 30;

  const cab = ['Item', 'Usado em', 'Quanto precisa', 'Unidade', 'Comprar (embalagens)', 'Embalagem', 'Preço na sua cidade (R$ por unidade)', 'Subtotal', 'Por pessoa (base)', 'Tamanho da embalagem', 'De onde vem o preço'];
  const hr = ws.getRow(PRIMEIRA - 1);
  cab.forEach((h, i) => {
    const c = hr.getCell(i + 1);
    c.value = h;
    c.font = font({ bold: true, color: { argb: C.branco } });
    c.fill = fill(i === 6 ? 'FFB8860B' : i >= 8 ? 'FF8A8A8A' : C.vermelho);
    c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    c.border = borda;
  });
  hr.height = 42;

  card.itens.forEach(([item, uso, un, porPessoa, tam, emb, preco, fonte], i) => {
    const r = PRIMEIRA + i;
    const row = ws.getRow(r);
    const precisa = porPessoa * PESSOAS;
    const n = embalagens(porPessoa, PESSOAS, tam);
    row.getCell(1).value = item;
    row.getCell(2).value = uso;
    row.getCell(3).value = { formula: `I${r}*$B$4`, result: precisa };
    row.getCell(4).value = un;
    row.getCell(5).value = { formula: `ROUNDUP(ROUND(C${r}/J${r},4),0)`, result: n };
    row.getCell(6).value = emb;
    row.getCell(7).value = Math.round(preco * 10000) / 10000;
    row.getCell(8).value = { formula: `E${r}*J${r}*G${r}`, result: n * tam * preco };
    row.getCell(9).value = porPessoa;
    row.getCell(10).value = tam;
    row.getCell(11).value = fonte;
    for (let col = 1; col <= 11; col++) {
      const c = row.getCell(col);
      c.font = font(col >= 9 ? { color: { argb: C.cinza }, size: 9 } : {});
      c.border = borda;
      c.alignment = { vertical: 'middle', wrapText: col === 11 || col === 2 || col === 6 };
      if (i % 2 === 1 && col <= 8) c.fill = fill(C.creme);
    }
    row.getCell(3).numFmt = QTD;
    row.getCell(5).numFmt = '0';
    row.getCell(5).font = font({ bold: true });
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).numFmt = BRL;
    row.getCell(7).fill = fill(C.amarelo);
    row.getCell(7).font = font({ bold: true, color: { argb: C.azul } });
    row.getCell(8).numFmt = BRL;
    row.getCell(9).numFmt = QTD;
    row.getCell(10).numFmt = QTD;
  });

  // Linha de total
  const tr = ws.getRow(linhaTotal);
  tr.getCell(7).value = 'TOTAL';
  tr.getCell(7).font = font({ bold: true, size: 12 });
  tr.getCell(7).alignment = { horizontal: 'right' };
  tr.getCell(8).value = { formula: `SUM(H${PRIMEIRA}:H${ultima})`, result: total };
  tr.getCell(8).numFmt = BRL;
  tr.getCell(8).font = font({ bold: true, size: 12, color: { argb: C.vermelho } });

  const notas = [
    'Como a conta funciona: "Quanto precisa" = por pessoa × número de pessoas. "Comprar" arredonda para cima, em embalagens inteiras (ex.: frango inteiro de ~1,8 kg, bandeja com 6 ovos).',
    'O subtotal é o que você paga no caixa: embalagens × tamanho da embalagem × preço. Por isso pode sobrar um pouco de alguns itens — guarde para o almoço do dia 25.',
    'Regra de quantidade: carne com osso 400–500 g por pessoa; sem osso 250–300 g; arroz cru ~80 g por pessoa.',
  ];
  notas.forEach((txt, i) => {
    const r = linhaTotal + 2 + i;
    ws.mergeCells(`A${r}:K${r}`);
    ws.getCell(`A${r}`).value = txt;
    ws.getCell(`A${r}`).font = font({ size: 9, color: { argb: C.cinza } });
    ws.getCell(`A${r}`).alignment = { wrapText: true };
  });

  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  ws.pageSetup.printArea = `A1:H${linhaTotal}`;
  card.linhaTotal = linhaTotal;
}

// Aba "Comece aqui"
const ws = resumo.sheet;
ws.columns = [{ width: 4 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 4 }];
ws.mergeCells('B2:E2');
ws.getCell('B2').value = '🎄 Ceia de Natal Econômica — sua planilha de compras';
ws.getCell('B2').font = font({ size: 18, bold: true, color: { argb: C.vermelho } });
ws.mergeCells('B3:E3');
ws.getCell('B3').value = 'Ceia completa a partir de R$ 15 por pessoa (preços de referência).';
ws.getCell('B3').font = font({ size: 11, italic: true, color: { argb: C.verde } });

const passos = [
  '1. Escolha um cardápio nas abas de baixo (Econômico, Clássico ou Caprichado).',
  '2. Na aba escolhida, troque o número de pessoas (célula amarela no topo). Quantidades e total se ajustam sozinhos.',
  '3. No mercado, troque os preços da coluna amarela "Preço na sua cidade" pelo preço que você encontrar.',
  '4. Pronto: o total e o custo por pessoa aparecem em destaque no topo da aba.',
];
passos.forEach((p, i) => {
  ws.mergeCells(`B${5 + i}:E${5 + i}`);
  ws.getCell(`B${5 + i}`).value = p;
  ws.getCell(`B${5 + i}`).font = font({ size: 11 });
  ws.getCell(`B${5 + i}`).alignment = { wrapText: true, vertical: 'middle' };
  ws.getRow(5 + i).height = 30;
});

const legR = 10;
ws.getCell(`B${legR}`).value = 'Célula amarela';
ws.getCell(`B${legR}`).fill = fill(C.amarelo);
ws.getCell(`B${legR}`).font = font({ bold: true, color: { argb: C.azul } });
ws.mergeCells(`C${legR}:E${legR}`);
ws.getCell(`C${legR}`).value = '= pode editar (número de pessoas e preços). O resto calcula sozinho.';
ws.getCell(`C${legR}`).font = font();

const hR = 12;
['Cardápio', 'Pessoas', 'Total da ceia', 'Por pessoa'].forEach((h, i) => {
  const c = ws.getRow(hR).getCell(i + 2);
  c.value = h;
  c.font = font({ bold: true, color: { argb: C.branco } });
  c.fill = fill(C.verde);
  c.alignment = { horizontal: 'center' };
  c.border = borda;
});
totais.forEach((t, i) => {
  const r = hR + 1 + i;
  const ref = `'${t.aba}'`;
  const card = CARDAPIOS[i];
  const row = ws.getRow(r);
  row.getCell(2).value = { text: t.titulo, hyperlink: `#${ref}!A1` };
  row.getCell(2).font = font({ bold: true, color: { argb: C.vermelho }, underline: true });
  row.getCell(3).value = { formula: `${ref}!B4`, result: t.pessoas };
  row.getCell(4).value = { formula: `${ref}!H${card.linhaTotal}`, result: t.total };
  row.getCell(5).value = { formula: `IF(C${r}>0,D${r}/C${r},0)`, result: t.total / t.pessoas };
  row.getCell(3).alignment = { horizontal: 'center' };
  [3, 4, 5].forEach((col) => { row.getCell(col).font = font({ color: { argb: 'FF008000' }, bold: col === 5 }); });
  row.getCell(4).numFmt = BRL;
  row.getCell(5).numFmt = BRL;
  for (let col = 2; col <= 5; col++) row.getCell(col).border = borda;
});

const fimR = hR + 5;
const rodape = [
  `⚠ ${AVISO}`,
  'Fora da conta: óleo, sal, alho, cebola e temperos básicos (quase todo mundo já tem em casa).',
  'Referência: a ceia tradicional custou em média R$ 453,06 em 2025, segundo o IPC-Fipe.',
  'Dica: as sobras viram o almoço do dia 25 — a lista já considera embalagens inteiras.',
];
rodape.forEach((txt, i) => {
  const r = fimR + i;
  ws.mergeCells(`B${r}:E${r}`);
  ws.getCell(`B${r}`).value = txt;
  ws.getCell(`B${r}`).font = font({ size: 10, bold: i === 0, color: { argb: i === 0 ? C.vermelho : C.cinza } });
  ws.getCell(`B${r}`).alignment = { wrapText: true, vertical: 'middle' };
  ws.getRow(r).height = 28;
});

const saida = path.join(__dirname, 'Ceia-de-Natal-Economica-Planilha.xlsx');
wb.xlsx.writeFile(saida).then(() => {
  console.log('Salvo:', saida);
  for (const t of totais) console.log(`${t.titulo.padEnd(22)} total R$ ${t.total.toFixed(2)}  por pessoa R$ ${(t.total / t.pessoas).toFixed(2)}`);
});
