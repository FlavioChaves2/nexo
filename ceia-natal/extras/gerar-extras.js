// Gera os PDFs dos produtos complementares (order bumps, upsell e downsell) da Ceia de Natal Econômica.
// Uso: NODE_PATH=<pasta com puppeteer>/node_modules node gerar-extras.js
// Os custos são calculados aqui mesmo, com os preços de referência abaixo (embalagens inteiras).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const CSS = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');
const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const AVISO = 'Preços de referência de nov/2026 (Procon e estimativas); variam por região. Óleo, sal, alho, cebola e temperos básicos não entram na conta.';

// ---------- catálogo de preços (unidade de compra, embalagem, preço por unidade) ----------
const CAT = {
  arroz: ['Arroz', 'kg', 1, 4.12, 'pacote de 1 kg'],
  feijao: ['Feijão carioca', 'kg', 1, 8.0, 'pacote de 1 kg'],
  frango: ['Coxa e sobrecoxa de frango', 'kg', 1, 13.0, 'bandeja de ~1 kg'],
  carne: ['Carne moída (acém)', 'kg', 0.5, 35.0, 'pacote de 500 g'],
  linguica: ['Linguiça toscana', 'kg', 0.5, 22.0, 'pacote de 500 g'],
  calabresa: ['Linguiça calabresa', 'kg', 0.25, 28.0, 'gomo de ~250 g'],
  sardinha: ['Sardinha em lata', 'lata', 1, 6.0, 'lata de 125 g'],
  ovos: ['Ovos', 'ovo', 12, 10.78 / 12, 'dúzia'],
  batata: ['Batata', 'kg', 0.5, 7.77, 'meio quilo'],
  cenoura: ['Cenoura', 'kg', 0.5, 6.0, 'meio quilo'],
  abobrinha: ['Abobrinha', 'kg', 0.5, 6.0, 'meio quilo'],
  tomate: ['Tomate', 'kg', 0.5, 7.0, 'meio quilo'],
  repolho: ['Repolho', 'un', 1, 5.0, 'unidade'],
  couve: ['Couve', 'maço', 1, 3.0, 'maço'],
  macarrao: ['Macarrão', 'pacote', 1, 4.5, 'pacote de 500 g'],
  molho: ['Molho de tomate', 'sachê', 1, 2.5, 'sachê de 300 g'],
  fuba: ['Fubá', 'kg', 1, 5.0, 'pacote de 1 kg'],
  farinha: ['Farinha de mandioca', 'kg', 0.5, 8.0, 'pacote de 500 g'],
  trigo: ['Farinha de trigo', 'kg', 1, 5.0, 'pacote de 1 kg'],
  leite: ['Leite', 'litro', 1, 5.68, 'caixa de 1 litro'],
  lentilha: ['Lentilha', 'pacote', 1, 9.0, 'pacote de 500 g'],
  milho: ['Milho ou ervilha em lata', 'lata', 1, 5.0, 'lata'],
  passa: ['Uva-passa', 'pacote', 1, 4.0, 'pacote de 100 g'],
  condensado: ['Leite condensado', 'lata', 1, 6.0, 'lata/caixa de 395 g'],
  creme: ['Creme de leite', 'caixa', 1, 3.5, 'caixinha de 200 g'],
  maracuja: ['Suco concentrado de maracujá', 'garrafa', 1, 8.0, 'garrafa de 500 ml'],
  guarana: ['Refrigerante guaraná 2 L', 'garrafa', 1, 8.0, 'garrafa de 2 litros'],
  frutas: ['Frutas para o ponche (maçã e laranja)', 'kg', 1, 7.0, '1 kg'],
};

function lista(itens) { // itens: {chave: quantidade na unidade}
  let total = 0;
  const linhas = Object.entries(itens).map(([k, q]) => {
    const [nome, un, emb, preco, desc] = CAT[k];
    const n = Math.ceil(Math.round((q / emb) * 1e4) / 1e4);
    const sub = n * emb * preco;
    total += sub;
    const qtd = emb === 1 || un === 'ovo' ? `${n * emb} ${un}${n * emb > 1 && un.length < 6 && !/s$/.test(un) ? '' : ''}` : `${(n * emb).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')} ${un}`;
    return { nome, comprar: un === 'ovo' ? `${n * emb} ovos (${n} ${n > 1 ? 'dúzias' : 'dúzia'})` : `${n} × ${desc}`, sub, qtd };
  });
  return { linhas, total };
}
function tabelaLista(l, titulo) {
  return `<table class="ck"><thead><tr><th></th><th>${titulo || 'Item'}</th><th>Comprar</th><th class="n">Ref.</th></tr></thead><tbody>
${l.linhas.map((x) => `<tr><td></td><td>${x.nome}</td><td>${x.comprar}</td><td class="n">${brl(x.sub)}</td></tr>`).join('\n')}
</tbody><tfoot><tr><td></td><td colspan="2">Total de referência</td><td class="n">${brl(l.total)}</td></tr></tfoot></table>`;
}
const capa = (tag, titulo, sub, selo) => `<section class="pg capa"><div style="position:relative;z-index:1"><small>${tag}</small><h1>${titulo}</h1><p>${sub}</p></div><div><span class="selo">${selo}</span></div><div class="rod">${AVISO}</div></section>`;
const rec = (t, tags, ing, passos) => `<div class="rec"><h3>${t}</h3><div class="meta">${tags.map((x, i) => `<span class="tag${i === 1 ? ' o' : i === 2 ? ' r' : ''}">${x}</span>`).join(' ')}</div><div class="cols"><ul>${ing.map((x) => `<li>${x}</li>`).join('')}</ul><ol>${passos.map((x) => `<li>${x}</li>`).join('')}</ol></div></div>`;
const html = (titulo, corpo) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet"><style>${CSS}
.ck{font-size:9pt}.ck td{padding:1mm 2mm}.rec{margin-bottom:4.5mm}.mini .rec .cols{grid-template-columns:42% 1fr}.dias td{font-size:9pt}</style></head><body>${corpo}</body></html>`;

const produtos = [];

// =====================================================================
// 1) CEIA DE ANO NOVO ECONÔMICA (order bump R$ 9,90)
// =====================================================================
{
  const l = lista({ frango: 3, batata: 1.5, lentilha: 1, calabresa: 0.25, arroz: 0.64, cenoura: 0.25, milho: 1, passa: 1, repolho: 1, condensado: 1, creme: 1, maracuja: 1, guarana: 2, frutas: 1 });
  const pp = l.total / 8;
  produtos.push({ arq: 'Ceia-de-Ano-Novo-Economica', total: l.total, body: [
    capa('Kit digital · Réveillon', 'Ceia de Ano Novo<br>Econômica', `Cardápio completo para 8 pessoas por cerca de <b>${brl(l.total)}</b> (≈ ${brl(pp)} por pessoa), com lista de compras, 6 receitas e o cronograma do dia 31.`, '🥂 Lentilha da sorte, frango assado, mousse e ponche'),
    `<section class="pg"><h2>Cardápio para 8 pessoas</h2>
<div class="grid3"><div class="card"><h3>Prato principal</h3>Coxa e sobrecoxa assadas com batatas</div><div class="card"><h3>Acompanhamentos</h3>Lentilha da sorte com calabresa · Arroz à grega · Salada de repolho</div><div class="card"><h3>Doce e bebida</h3>Mousse de maracujá · Ponche de frutas sem álcool</div></div>
<h3 style="margin-top:5mm">Lista de compras</h3>${tabelaLista(l)}
<div class="box aviso">${AVISO}</div>
<div class="box dica"><b>Aproveite o Natal:</b> se sobrou farofa, arroz ou maionese do dia 24, eles entram na mesa do dia 31 e o total cai ainda mais.</div></section>`,
    `<section class="pg"><h2>Receitas</h2>
${rec('Coxa e sobrecoxa assadas com batatas', ['8 porções', 'Tempero na véspera', 'Forno: 1h'], ['3 kg de coxa e sobrecoxa', '1,5 kg de batata em rodelas grossas', 'Suco de 2 limões, 5 dentes de alho', 'Sal, colorau, pimenta-do-reino', 'Fio de óleo'], ['<b>Dia 30:</b> tempere o frango com alho, limão, sal, colorau e pimenta. Guarde coberto na geladeira.', 'No dia 31, forre a assadeira com as batatas, tempere com sal e óleo e coloque o frango por cima, com a pele para cima.', 'Cubra com papel-alumínio e asse a 200 °C por 40 min.', 'Tire o papel e deixe mais 20 a 25 min, até dourar.'])}
${rec('Lentilha da sorte com calabresa', ['8 porções', '40 min'], ['500 g de lentilha', '1 gomo de calabresa (~250 g) em cubos', '1 cebola, 3 dentes de alho', 'Folha de louro, sal, cheiro-verde'], ['Deixe a lentilha de molho por 2 horas e escorra.', 'Frite a calabresa, junte cebola e alho e refogue.', 'Junte a lentilha, o louro e água até cobrir 2 dedos. Cozinhe por 20 a 25 min, até ficar macia mas inteira.', 'Acerte o sal e finalize com cheiro-verde.'])}
${rec('Arroz à grega', ['8 porções', '30 min'], ['640 g de arroz', '1 cenoura em cubinhos', '1 lata de milho ou ervilha', '1 pacote de uva-passa (opcional)', 'Cebola, alho, óleo, sal'], ['Refogue cebola e alho, junte a cenoura e depois o arroz.', 'Cubra com água fervente (2 partes de água para 1 de arroz), tempere e cozinhe tampado.', 'Desligue e misture o milho e a uva-passa.'])}
</section>`,
    `<section class="pg">
${rec('Salada de repolho', ['8 porções', '10 min'], ['1 repolho pequeno fatiado bem fino', '1 cenoura ralada', 'Suco de 1 limão, sal, azeite ou óleo'], ['Misture o repolho e a cenoura.', 'Tempere na hora de servir, para não murchar.'])}
${rec('Mousse de maracujá', ['10 porções', 'Fazer no dia 30'], ['1 lata de leite condensado', '1 caixinha de creme de leite', '1 xícara (240 ml) de suco concentrado de maracujá'], ['Bata tudo no liquidificador por 3 minutos.', 'Despeje num refratário e leve à geladeira por pelo menos 4 horas.', 'Use o resto do suco concentrado no ponche.'])}
${rec('Ponche de frutas sem álcool', ['4 litros', '10 min'], ['2 garrafas de guaraná de 2 L bem gelado', '2 maçãs e 2 laranjas em cubinhos', 'O resto do suco de maracujá', 'Gelo'], ['Coloque as frutas na jarra ou poncheira com o suco de maracujá.', 'Na hora de servir, complete com o guaraná e o gelo.'])}
<h2 style="margin-top:6mm">Cronograma</h2>
<div class="dia"><div class="d">DEZ<span>30</span></div><div><ul><li>Compras (o que faltar).</li><li>Tempere o frango e guarde na geladeira.</li><li>Faça o mousse e deixe a lentilha de molho à noite, se preferir.</li></ul></div></div>
<div class="dia"><div class="d">DEZ<span>31</span></div><div><table><tbody><tr><td>18h</td><td>Cozinhe a lentilha e faça o arroz.</td></tr><tr><td>21h30</td><td>Frango com batatas no forno (1h).</td></tr><tr><td>22h30</td><td>Salada e ponche montados; mesa posta.</td></tr><tr><td>23h</td><td>Ceia servida. A lentilha fica para a meia-noite, como manda a tradição. 🥂</td></tr></tbody></table></div></div>
</section>`,
  ].join('\n') });
}

// =====================================================================
// 2) MESA DECORADA COM ATÉ R$ 50 (order bump R$ 7,90)
// =====================================================================
{
  const estilos = [
    { nome: 'Clássico vermelho e verde', itens: [['Caminho de mesa de TNT vermelho (2 m)', 6], ['Fita de cetim verde (5 m)', 5], ['Velas brancas (pacote com 8)', 10], ['Bolas de Natal vermelhas (6 un)', 12], ['Guardanapos de papel natalinos (pacote)', 6], ['Barbante cru (rolo)', 4], ['Pinhas, galhos e folhas (coletados)', 0]] },
    { nome: 'Natural e rústico', itens: [['Papel kraft (rolo de 1 m × 5 m)', 8], ['Barbante cru (rolo)', 4], ['Velas brancas (pacote com 8)', 10], ['Laranjas para secar (1 kg)', 5], ['Canela em pau (pacote)', 5], ['Alecrim fresco (maço)', 4], ['Potes de vidro (reaproveitados)', 0], ['Pinhas e galhos (coletados)', 0]] },
    { nome: 'Branco e dourado', itens: [['Caminho de mesa de TNT branco (2 m)', 6], ['Spray dourado (lata pequena)', 15], ['Velas brancas (pacote com 8)', 10], ['Fita dourada (5 m)', 5], ['Guardanapos de papel brancos (pacote)', 4], ['Garrafas e potes de vidro (reaproveitados)', 0], ['Galhos secos e pinhas (coletados)', 0]] },
  ];
  const tab = (e) => { const t = e.itens.reduce((a, x) => a + x[1], 0); e.total = t; return `<h3>${e.nome} · ${brl(t)}</h3><table class="ck"><tbody>${e.itens.map((x) => `<tr><td></td><td>${x[0]}</td><td class="n">${x[1] ? brl(x[1]) : 'grátis'}</td></tr>`).join('')}</tbody></table>`; };
  const tabs = estilos.map(tab).join('');
  const max = Math.max(...estilos.map((e) => e.total));
  produtos.push({ arq: 'Mesa-Decorada-com-ate-R50', total: max, body: [
    capa('Kit digital · Natal', 'Mesa decorada<br>com até R$ 50', `3 estilos de mesa de Natal com lista de materiais (de ${brl(Math.min(...estilos.map((e) => e.total)))} a ${brl(max)}), 6 peças para fazer em casa e a montagem em 30 minutos.`, '🕯️ Bonita na foto, leve no bolso'),
    `<section class="pg"><h2>Escolha o estilo</h2><p>Todos os estilos usam velas, vidros reaproveitados e elementos da natureza, que não custam nada. Os valores são estimativas de papelaria e bazar; compare com as lojas de R$ 10 da sua cidade.</p>${tabs}
<div class="box dica"><b>Já tem em casa?</b> Toalha lisa (branca, bege ou vermelha), pratos, copos e talheres. A decoração entra por cima do que você já tem.</div></section>`,
    `<section class="pg"><h2>6 peças para fazer em casa</h2>
${rec('Caminho de mesa', ['10 min'], ['TNT ou papel kraft do comprimento da mesa + 40 cm', 'Tesoura', 'Fita ou barbante'], ['Corte uma faixa de 35 a 40 cm de largura.', 'Deixe sobrar 20 cm em cada ponta da mesa.', 'No kraft, desenhe estrelas ou escreva o nome dos convidados com caneta preta.'])}
${rec('Centro de mesa com velas em vidro', ['15 min'], ['3 potes de vidro de tamanhos diferentes', '3 velas', 'Sal grosso, café ou arroz cru para firmar', 'Pinhas, galhos e bolas'], ['Coloque 3 dedos de sal grosso (ou arroz) no fundo de cada pote.', 'Firme a vela no centro.', 'Arrume os potes no meio do caminho de mesa, com pinhas e galhos em volta.', '<b>Segurança:</b> deixe 10 cm entre a chama e qualquer galho, papel ou tecido, e nunca deixe vela acesa sozinha.'])}
${rec('Laranjas secas no forno', ['2h30 de forno baixo'], ['2 a 3 laranjas', 'Assadeira e papel-manteiga'], ['Corte em rodelas de meio centímetro e seque com papel-toalha.', 'Asse a 100 °C por 2h30, virando a cada 40 min.', 'Use no centro de mesa, nos guardanapos ou penduradas com barbante.'])}
${rec('Porta-guardanapo de barbante e alecrim', ['2 min cada'], ['Guardanapo de papel ou pano', 'Barbante ou fita', 'Raminho de alecrim ou canela em pau'], ['Dobre o guardanapo em retângulo.', 'Dê duas voltas de barbante e amarre com laço.', 'Prenda o alecrim ou a canela no laço. Perfuma a mesa.'])}
</section>`,
    `<section class="pg">
${rec('Marcador de lugar', ['20 min para 8'], ['Kraft ou cartolina', 'Caneta preta ou dourada', 'Pinhas pequenas ou bolas'], ['Corte cartões de 5 × 8 cm e dobre ao meio.', 'Escreva o nome de cada convidado.', 'Encaixe o cartão numa pinha ou apoie numa bola de Natal em cima do prato.'])}
${rec('Galhos dourados ou brancos', ['15 min + secagem'], ['Galhos secos', 'Spray dourado (estilo dourado) ou tinta branca', 'Garrafa de vidro'], ['Limpe e seque os galhos.', 'Pinte ao ar livre, sobre jornal, e deixe secar 1 hora.', 'Coloque numa garrafa de vidro com fita no gargalo.'])}
<h2 style="margin-top:6mm">Montagem em 30 minutos</h2>
<table><thead><tr><th>Ordem</th><th>O que fazer</th></tr></thead><tbody>
<tr><td>1</td><td>Toalha lisa e caminho de mesa no centro.</td></tr>
<tr><td>2</td><td>Centro de mesa (velas, pinhas, galhos) no meio do caminho; deixe espaço para as travessas.</td></tr>
<tr><td>3</td><td>Pratos, talheres e copos; guardanapo amarrado em cima de cada prato.</td></tr>
<tr><td>4</td><td>Marcador de lugar em cada prato.</td></tr>
<tr><td>5</td><td>Laranjas secas e bolas espalhadas nos espaços vazios.</td></tr>
<tr><td>6</td><td>Acenda as velas só na hora de sentar. Apague a luz forte e deixe uma luz amarela: a foto fica outra.</td></tr>
</tbody></table>
<div class="box aviso"><b>Valores:</b> estimativas de nov/2026 para papelaria, bazar e mercado; variam por região. Itens coletados ou reaproveitados não têm custo.</div></section>`,
  ].join('\n') });
}

// =====================================================================
// 3) 20 SOBREMESAS NATALINAS BARATAS (order bump R$ 7,90)
// =====================================================================
{
  const S = [
    ['Pudim de pão', '10 porções', '≈ R$ 12', ['6 pães amanhecidos', '1 litro de leite', '3 ovos', '1 xícara de açúcar + 1 xícara para a calda'], ['Faça a calda derretendo 1 xícara de açúcar na forma de pudim.', 'Bata no liquidificador os pães picados, o leite, os ovos e o açúcar.', 'Despeje na forma e asse em banho-maria a 180 °C por 50 min. Gele antes de desenformar.']],
    ['Rabanada de forno', '24 fatias', '≈ R$ 15', ['12 pães franceses amanhecidos', '1 litro de leite com 3 colheres de açúcar', '3 ovos', 'Açúcar e canela'], ['Fatie, molhe no leite e no ovo.', 'Asse em assadeira untada a 200 °C por 25 min, virando na metade.', 'Passe no açúcar com canela.']],
    ['Pavê de maisena', '10 porções', '≈ R$ 18', ['2 pacotes de biscoito maisena', '1 lata de leite condensado', '2 xícaras de leite + leite para molhar', '2 gemas, 2 colheres de amido de milho', '1 caixinha de creme de leite'], ['Cozinhe leite condensado, leite, gemas e amido até engrossar. Desligue e junte o creme de leite.', 'Faça camadas de biscoito molhado no leite e creme.', 'Gele por 6 horas.']],
    ['Gelatina mosaico', '10 porções', '≈ R$ 12', ['4 caixas de gelatina de sabores diferentes'], ['Prepare 3 sabores separados, gele e corte em cubos.', 'Prepare o 4º sabor, espere amornar e despeje sobre os cubos.', 'Gele até o dia seguinte.']],
    ['Mousse de maracujá', '10 porções', '≈ R$ 14', ['1 lata de leite condensado', '1 caixinha de creme de leite', '1 xícara de suco concentrado de maracujá'], ['Bata tudo por 3 minutos no liquidificador.', 'Gele por 4 horas.']],
    ['Manjar com calda de goiabada', '10 porções', '≈ R$ 16', ['1 litro de leite', '1 vidro pequeno de leite de coco', '6 colheres de amido de milho, 6 de açúcar', '200 g de goiabada + ½ xícara de água'], ['Cozinhe leite, leite de coco, amido e açúcar até engrossar. Despeje em forma molhada e gele 6 h.', 'Derreta a goiabada na água para a calda.', 'Desenforme e cubra com a calda.']],
    ['Torta de bolacha com banana', '10 porções', '≈ R$ 14', ['1 pacote de biscoito maisena', '6 bananas em rodelas', '1 lata de leite condensado', '2 xícaras de leite, 2 colheres de amido', 'Canela'], ['Faça um creme com leite condensado, leite e amido.', 'Camadas: biscoito, banana, creme. Termine com canela.', 'Gele por 3 horas.']],
    ['Doce de leite de panela', '1 pote de 500 g', '≈ R$ 12', ['2 litros de leite', '2 xícaras de açúcar', '1 pitada de bicarbonato'], ['Leve tudo ao fogo baixo, mexendo de vez em quando.', 'Quando reduzir e ficar dourado (cerca de 1h30), mexa sem parar até engrossar.', 'Guarde em pote de vidro limpo.']],
    ['Brigadeiro de travessa', '10 porções', '≈ R$ 13', ['2 latas de leite condensado', '4 colheres de chocolate em pó', '1 colher de margarina', 'Granulado (opcional)'], ['Cozinhe tudo em fogo baixo até desgrudar do fundo, mas ainda mole.', 'Despeje numa travessa e cubra com granulado.', 'Sirva com colher.']],
    ['Beijinho de colher', '10 porções', '≈ R$ 14', ['2 latas de leite condensado', '100 g de coco ralado', '1 colher de margarina'], ['Cozinhe leite condensado, margarina e metade do coco até engrossar.', 'Despeje na travessa e cubra com o resto do coco.']],
    ['Bolo de banana de liquidificador', '12 fatias', '≈ R$ 12', ['4 bananas maduras', '3 ovos', '½ xícara de óleo', '1 xícara de açúcar', '2 xícaras de farinha de trigo, 1 colher de fermento', 'Canela'], ['Bata bananas, ovos, óleo e açúcar.', 'Misture a farinha e o fermento à mão.', 'Asse a 180 °C por 40 min. Polvilhe canela.']],
    ['Arroz-doce com canela', '8 porções', '≈ R$ 10', ['1 xícara de arroz', '1 litro de leite', '1 xícara de açúcar', 'Canela em pau e em pó, cravo'], ['Cozinhe o arroz em 2 xícaras de água com canela e cravo.', 'Junte o leite e o açúcar e cozinhe em fogo baixo até ficar cremoso (~30 min).', 'Sirva com canela em pó.']],
    ['Canjica cremosa', '10 porções', '≈ R$ 15', ['500 g de canjica branca', '1 litro de leite', '1 lata de leite condensado', 'Canela em pau, amendoim (opcional)'], ['Deixe a canjica de molho por 8 h e cozinhe na pressão por 40 min.', 'Junte leite, leite condensado e canela e cozinhe por mais 15 min.']],
    ['Biscoito amanteigado de Natal', '40 biscoitos', '≈ R$ 12', ['2 xícaras de farinha de trigo', '½ xícara de açúcar', '200 g de margarina', '1 ovo', 'Cortadores (ou um copo)'], ['Misture tudo até formar uma massa lisa. Gele 30 min.', 'Abra com rolo e corte estrelas e árvores.', 'Asse a 180 °C por 12 a 15 min. Embalados em saquinho, viram lembrancinha.']],
    ['Salame de chocolate', '20 fatias', '≈ R$ 14', ['1 pacote de biscoito maisena quebrado', '1 lata de leite condensado', '4 colheres de chocolate em pó', '2 colheres de margarina'], ['Cozinhe leite condensado, chocolate e margarina por 5 min.', 'Misture o biscoito, enrole em papel-filme formando um rolo.', 'Gele 4 h e fatie.']],
    ['Pé de moleque de travessa', '20 pedaços', '≈ R$ 15', ['500 g de amendoim torrado sem pele', '2 xícaras de açúcar', '1 lata de leite condensado'], ['Derreta o açúcar até dourar, junte o amendoim e o leite condensado.', 'Mexa até desgrudar da panela e espalhe numa assadeira untada.', 'Corte ainda morno.']],
    ['Cocada de forno', '12 pedaços', '≈ R$ 16', ['200 g de coco ralado', '1 lata de leite condensado', '2 ovos', '2 colheres de margarina'], ['Misture tudo.', 'Asse em forma untada a 180 °C por 25 min, até dourar.']],
    ['Creme de abacaxi', '8 porções', '≈ R$ 15', ['1 abacaxi em cubinhos', '½ xícara de açúcar', '1 lata de leite condensado', '1 caixinha de creme de leite'], ['Cozinhe o abacaxi com o açúcar por 15 min e espere esfriar.', 'Bata leite condensado e creme de leite, misture o abacaxi e gele 3 h.']],
    ['Bolo de fubá com goiabada', '12 fatias', '≈ R$ 12', ['2 xícaras de fubá, 1 de farinha de trigo', '3 ovos, 1 xícara de óleo, 2 de açúcar, 1 de leite', '1 colher de fermento', '150 g de goiabada em cubos'], ['Bata ovos, óleo, açúcar e leite; misture fubá, farinha e fermento.', 'Despeje na forma e espalhe a goiabada por cima.', 'Asse a 180 °C por 40 min.']],
    ['Torta gelada de limão', '10 porções', '≈ R$ 16', ['1 pacote de biscoito maisena + 3 colheres de margarina', '1 lata de leite condensado', '1 caixinha de creme de leite', 'Suco de 4 limões + raspas'], ['Triture o biscoito com a margarina e forre o fundo de um refratário.', 'Bata leite condensado, creme de leite e suco de limão; despeje por cima.', 'Gele 4 h e finalize com raspas.']],
  ];
  const blocos = [];
  for (let i = 0; i < S.length; i += 4) blocos.push(S.slice(i, i + 4));
  produtos.push({ arq: '20-Sobremesas-Natalinas-Baratas', total: 0, body: [
    capa('Kit digital · Natal', '20 sobremesas<br>natalinas baratas', 'Receitas caseiras de R$ 10 a R$ 18 a receita inteira, com ingredientes de qualquer mercado e rendimento de cada uma.', '🍮 Doce na mesa sem pesar no bolso'),
    `<section class="pg"><h2>Índice e custo de cada receita</h2><table><thead><tr><th>#</th><th>Sobremesa</th><th>Rende</th><th class="n">Custo da receita</th></tr></thead><tbody>${S.map((s, i) => `<tr><td>${i + 1}</td><td>${s[0]}</td><td>${s[1]}</td><td class="n">${s[2]}</td></tr>`).join('')}</tbody></table>
<div class="box aviso">Custos estimados com preços de referência de nov/2026 (Procon e estimativas) para a receita inteira; variam por região. Açúcar, óleo e margarina contam na estimativa.</div>
<div class="box dica"><b>Dica:</b> as receitas com leite condensado ficam até 30% mais baratas com a marca própria do mercado. Gelatina, mousse, pavê e manjar podem ser feitos no dia 23.</div></section>`,
    ...blocos.map((b, j) => `<section class="${j < blocos.length - 1 ? 'pg ' : ''}mini">${j === 0 ? '<h2>Receitas</h2>' : ''}${b.map((s, k) => rec(`${j * 4 + k + 1}. ${s[0]}`, [s[1], s[2]], s[3], s[4])).join('')}</section>`),
  ].join('\n') });
}

// =====================================================================
// 4) JANEIRO SEM DÍVIDA (upsell R$ 37) e 5) LISTAS DE JANEIRO (downsell R$ 17)
// Cardápio de 30 dias (almoço e jantar) para 4 pessoas, com listas semanais calculadas.
// =====================================================================
const R = {
  frangoEnsopado: { n: 'Frango ensopado com batata', ing: { frango: 1.2, batata: 0.5, cenoura: 0.2, tomate: 0.2, arroz: 0.32, feijao: 0.15 } },
  carneLegumes: { n: 'Carne moída com legumes', ing: { carne: 0.5, cenoura: 0.15, abobrinha: 0.3, tomate: 0.15, arroz: 0.32, feijao: 0.15 } },
  macarronada: { n: 'Macarronada à bolonhesa', ing: { macarrao: 1, carne: 0.4, molho: 2 } },
  omelete: { n: 'Omelete de forno com legumes', ing: { ovos: 8, abobrinha: 0.2, tomate: 0.15, trigo: 0.05, arroz: 0.32, feijao: 0.15 } },
  sopa: { n: 'Sopa de legumes com macarrão', ing: { batata: 0.4, cenoura: 0.2, abobrinha: 0.2, macarrao: 0.5, frango: 0.3 } },
  escondidinho: { n: 'Escondidinho de carne moída', ing: { batata: 1.0, leite: 0.3, carne: 0.4 } },
  polenta: { n: 'Polenta cremosa com linguiça', ing: { fuba: 0.4, linguica: 0.5, molho: 1, tomate: 0.1 } },
  tortaSardinha: { n: 'Torta de liquidificador de sardinha', ing: { trigo: 0.3, leite: 0.4, ovos: 3, sardinha: 2, tomate: 0.15 } },
  arrozForno: { n: 'Arroz de forno com frango', ing: { arroz: 0.3, frango: 0.6, cenoura: 0.1, ovos: 2, molho: 1, milho: 1 } },
  tropeiro: { n: 'Feijão tropeiro econômico', ing: { feijao: 0.3, farinha: 0.15, ovos: 4, linguica: 0.25, couve: 1, arroz: 0.32 } },
  panqueca: { n: 'Panqueca de carne moída', ing: { trigo: 0.25, leite: 0.5, ovos: 2, carne: 0.4, molho: 2 } },
  frangoAssado: { n: 'Frango assado com legumes', ing: { frango: 1.5, batata: 0.6, cenoura: 0.2, arroz: 0.32, feijao: 0.15 } },
  ovoArroz: { n: 'Arroz, feijão, ovo e salada de repolho', ing: { ovos: 4, arroz: 0.32, feijao: 0.15, repolho: 0.5, cenoura: 0.1 } },
};
// cada dia: [almoço, jantar]; '=' no jantar significa "sobra do almoço" (a receita é feita em dobro)
const SEMANAS = [
  [['frangoEnsopado', 'sopa'], ['carneLegumes', 'omelete'], ['macarronada', '='], ['tropeiro', 'tortaSardinha'], ['polenta', '='], ['arrozForno', 'panqueca'], ['frangoAssado', '=']],
  [['ovoArroz', 'sopa'], ['escondidinho', '='], ['frangoEnsopado', 'omelete'], ['macarronada', '='], ['tropeiro', 'tortaSardinha'], ['carneLegumes', 'panqueca'], ['frangoAssado', '=']],
  [['polenta', 'sopa'], ['carneLegumes', 'omelete'], ['arrozForno', '='], ['ovoArroz', 'tortaSardinha'], ['macarronada', '='], ['tropeiro', 'panqueca'], ['frangoAssado', '=']],
  [['escondidinho', '='], ['frangoEnsopado', 'sopa'], ['ovoArroz', 'omelete'], ['macarronada', '='], ['polenta', 'tortaSardinha'], ['carneLegumes', 'panqueca'], ['frangoAssado', '=']],
  [['tropeiro', 'sopa'], ['arrozForno', '=']], // dias 29 e 30
];
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
function listaSemana(sem) {
  const soma = {};
  for (const [alm, jan] of sem) {
    const add = (id, f) => { for (const [k, q] of Object.entries(R[id].ing)) soma[k] = (soma[k] || 0) + q * f; };
    add(alm, jan === '=' ? 2 : 1);
    if (jan !== '=') add(jan, 1);
  }
  return lista(soma);
}
const LS = SEMANAS.map(listaSemana);
const totalMes = LS.reduce((a, l) => a + l.total, 0);
const porPessoaDia = totalMes / 30 / 4;
const cardapioHTML = SEMANAS.map((sem, w) => `<h3>${w < 4 ? `Semana ${w + 1} (dias ${w * 7 + 1} a ${w * 7 + 7})` : 'Dias 29 e 30'}</h3><table class="dias"><thead><tr><th>Dia</th><th>Almoço</th><th>Jantar</th></tr></thead><tbody>${sem.map(([a, j], d) => `<tr><td>Dia ${w * 7 + d + 1}</td><td>${R[a].n}</td><td>${j === '=' ? 'Sobra do almoço (já está na lista)' : R[j].n}</td></tr>`).join('')}</tbody></table>`).join('');
const listasHTML = LS.map((l, w) => `<section class="pg"><h2>Lista ${w < 4 ? `da semana ${w + 1}` : 'dos dias 29 e 30'} · ${brl(l.total)}</h2>${tabelaLista(l)}</section>`).join('');
const resumoCusto = `<table><thead><tr><th>Período</th><th class="n">Custo de referência</th></tr></thead><tbody>${LS.map((l, w) => `<tr><td>${w < 4 ? `Semana ${w + 1}` : 'Dias 29 e 30'}</td><td class="n">${brl(l.total)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total do mês (almoço e jantar, 4 pessoas)</td><td class="n">${brl(totalMes)}</td></tr></tfoot></table><p>Isso dá cerca de <b>${brl(porPessoaDia)} por pessoa por dia</b> para almoço e jantar. Café da manhã e lanches não estão incluídos.</p>`;

const receitasJan = [
  rec('Frango ensopado com batata', ['4 porções', '45 min'], ['1,2 kg de coxa e sobrecoxa', '2 batatas e 1 cenoura em cubos', '1 tomate, cebola, alho, colorau'], ['Tempere o frango e doure na panela com um fio de óleo.', 'Junte cebola, alho e tomate; cubra com água quente e cozinhe 20 min.', 'Junte batata e cenoura e cozinhe mais 15 min, até o caldo engrossar.']),
  rec('Carne moída com legumes', ['4 porções', '25 min'], ['500 g de carne moída', '1 abobrinha e 1 cenoura em cubos', '1 tomate, cebola, alho'], ['Refogue a carne até soltar água e secar.', 'Junte cebola, alho, tomate e os legumes; tampe e cozinhe 10 min.', 'Dica: faça 1 kg e congele metade para a panqueca ou o escondidinho.']),
  rec('Macarronada à bolonhesa', ['8 porções (almoço + jantar)', '30 min'], ['1 pacote de macarrão', '400 g de carne moída', '2 sachês de molho de tomate'], ['Refogue a carne com cebola e alho, junte o molho e meio copo de água; cozinhe 10 min.', 'Cozinhe o macarrão al dente e misture ao molho.']),
  rec('Omelete de forno com legumes', ['4 porções', '35 min'], ['8 ovos', '1 abobrinha ralada, 1 tomate picado', '2 colheres de farinha de trigo', 'Sal, cheiro-verde'], ['Bata os ovos com a farinha e o sal; misture os legumes.', 'Asse em forma untada a 200 °C por 25 min.']),
  rec('Sopa de legumes com macarrão', ['4 porções', '40 min'], ['300 g de frango (ou a carcaça do frango assado)', '2 batatas, 1 cenoura, 1 abobrinha', 'Meio pacote de macarrão miúdo'], ['Cozinhe o frango em 2 litros de água com sal, alho e cebola. Desfie.', 'Junte os legumes em cubos e cozinhe 15 min.', 'Junte o macarrão e cozinhe até ficar macio.']),
  rec('Escondidinho de carne moída', ['8 porções (almoço + jantar)', '50 min'], ['2 kg de batata', '600 ml de leite', '800 g de carne moída refogada'], ['Cozinhe e amasse a batata com o leite e sal, até virar purê.', 'Num refratário: metade do purê, a carne, o resto do purê.', 'Asse a 200 °C por 20 min para dourar.']),
  rec('Polenta cremosa com linguiça', ['8 porções (almoço + jantar)', '40 min'], ['800 g de fubá', '1 kg de linguiça toscana em rodelas', '2 sachês de molho de tomate'], ['Frite a linguiça, junte o molho e um pouco de água.', 'Dissolva o fubá em água fria, leve ao fogo com sal e mexa 20 min até ficar cremoso.', 'Sirva a polenta com o molho de linguiça por cima.']),
  rec('Torta de liquidificador de sardinha', ['4 porções', '50 min'], ['2 xícaras de farinha de trigo, 2 de leite, 3 ovos, ½ de óleo, 1 colher de fermento', '2 latas de sardinha', '1 tomate, cebola'], ['Bata a massa no liquidificador (fermento por último).', 'Refogue a sardinha com tomate e cebola.', 'Forma untada: metade da massa, o recheio, o resto da massa. Asse a 180 °C por 40 min.']),
  rec('Arroz de forno com frango', ['8 porções (almoço + jantar)', '40 min'], ['Arroz pronto (ou 300 g cru)', '600 g de frango cozido e desfiado', '1 lata de milho, 1 cenoura ralada, 1 sachê de molho', '2 ovos'], ['Misture o arroz com o frango, o milho, a cenoura e o molho.', 'Coloque no refratário, cubra com os ovos batidos.', 'Asse a 200 °C por 20 min.']),
  rec('Feijão tropeiro econômico', ['4 porções', '30 min'], ['Feijão cozido escorrido (300 g cru)', '150 g de farinha de mandioca', '4 ovos, 250 g de linguiça', '1 maço de couve fatiada'], ['Frite a linguiça; junte os ovos e mexa.', 'Junte o feijão escorrido e a couve; refogue 3 min.', 'Acrescente a farinha aos poucos até ficar soltinho.']),
  rec('Panqueca de carne moída', ['4 porções', '40 min'], ['1 xícara e meia de farinha, 2 xícaras de leite, 2 ovos', '400 g de carne moída refogada', '2 sachês de molho de tomate'], ['Bata a massa e faça as panquecas numa frigideira untada.', 'Recheie com a carne, enrole e coloque no refratário.', 'Cubra com o molho e aqueça no forno por 15 min.']),
  rec('Frango assado com legumes (domingo)', ['8 porções (almoço + jantar)', '1h20'], ['3 kg de coxa e sobrecoxa', '1,2 kg de batata, 2 cenouras', 'Limão, alho, colorau'], ['Tempere o frango na véspera.', 'Asse sobre os legumes, coberto, a 200 °C por 50 min; descubra e doure por 25 min.', 'Guarde a carcaça para a sopa da semana seguinte.']),
];
const regras = `<section class="pg"><h2>As 7 regras do Janeiro sem dívida</h2><ol>
<li><b>Compre uma vez por semana, com a lista.</b> Cada ida extra ao mercado custa em média mais do que o item que você foi buscar.</li>
<li><b>Cozinhe uma vez, coma duas.</b> Os pratos marcados com "sobra do almoço" já estão em dobro na lista.</li>
<li><b>Congele em porções.</b> Carne moída refogada, feijão e molho duram 3 meses no freezer em potes fechados.</li>
<li><b>Ovo é a proteína mais barata da lista.</b> Use sem medo nos dias de aperto.</li>
<li><b>Prefira a marca própria</b> do mercado em arroz, feijão, macarrão, molho e farinha.</li>
<li><b>Legume da estação é mais barato.</b> Troque abobrinha por chuchu, ou cenoura por abóbora, conforme o preço da semana.</li>
<li><b>Anote o que gastou.</b> Na última página há um quadro para comparar o gasto real com o planejado.</li></ol>
<div class="box dica"><b>Trocas que mantêm o cardápio:</b> coxa e sobrecoxa ↔ frango inteiro (corte em casa); carne moída ↔ frango moído; linguiça toscana ↔ salsicha; sardinha ↔ atum ou ovos.</div>
<div class="box aviso">${AVISO} Os valores são para 4 pessoas (2 adultos e 2 crianças, ou 3 adultos com porções médias). Cardápio de referência, não é orientação nutricional individual.</div></section>`;
const quadro = `<section><h2>Quadro de gastos de janeiro</h2><table><thead><tr><th>Semana</th><th class="n">Planejado</th><th>Gastei de verdade</th><th>Diferença</th></tr></thead><tbody>${LS.map((l, w) => `<tr><td>${w < 4 ? `Semana ${w + 1}` : 'Dias 29 e 30'}</td><td class="n">${brl(l.total)}</td><td></td><td></td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="n">${brl(totalMes)}</td><td></td><td></td></tr></tfoot></table><p style="text-align:center;margin-top:8mm;font-family:'Playfair Display',serif;font-size:15pt;color:var(--verm)">Janeiro organizado, fevereiro sem susto. 💚</p></section>`;

produtos.push({ arq: 'Janeiro-sem-Divida', total: totalMes, body: [
  capa('Kit digital · Janeiro', 'Janeiro<br>sem dívida', `Cardápio de 30 dias (almoço e jantar) para 4 pessoas, com listas de compras semanais e 12 receitas. Custo de referência: <b>${brl(totalMes)} no mês</b>, cerca de ${brl(porPessoaDia)} por pessoa por dia.`, '💚 O mês inteiro planejado depois das festas'),
  `<section class="pg"><h2>Quanto custa o mês</h2>${resumoCusto}<div class="box dica"><b>Como usar:</b> 1) leia as 7 regras; 2) toda semana, leve a lista da semana ao mercado; 3) siga o cardápio do dia; 4) anote o gasto no quadro da última página.</div></section>`,
  regras,
  `<section class="pg"><h2>Cardápio de 30 dias</h2>${cardapioHTML.split('<h3>Semana 3').join('</section><section class="pg"><h3>Semana 3')}</section>`,
  listasHTML,
  `<section class="pg mini"><h2>Receitas</h2>${receitasJan.slice(0, 4).join('')}</section>`,
  `<section class="pg mini">${receitasJan.slice(4, 8).join('')}</section>`,
  `<section class="pg mini">${receitasJan.slice(8).join('')}</section>`,
  quadro,
].join('\n') });

produtos.push({ arq: 'Listas-de-Compras-de-Janeiro', total: totalMes, body: [
  capa('Kit digital · Janeiro', 'Listas de compras<br>de janeiro', `O cardápio de 30 dias (almoço e jantar) para 4 pessoas e as 5 listas de compras prontas. Custo de referência: <b>${brl(totalMes)} no mês</b>.`, '🛒 É só levar ao mercado'),
  `<section class="pg"><h2>Quanto custa o mês</h2>${resumoCusto}<div class="box aviso">${AVISO}</div><div class="box dica">Os nomes dos pratos são receitas caseiras do dia a dia (frango ensopado, macarronada, omelete, sopa). O passo a passo completo e as regras de economia estão no kit <b>Janeiro sem dívida</b>.</div></section>`,
  `<section class="pg"><h2>Cardápio de 30 dias</h2>${cardapioHTML.split('<h3>Semana 3').join('</section><section class="pg"><h3>Semana 3')}</section>`,
  listasHTML.replace(/<section class="pg">(?![\s\S]*<section class="pg">)/, '<section>'),
].join('\n') });

// ---------- gerar ----------
(async () => {
  const out = path.join(__dirname, 'pdf');
  fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch();
  const p = await b.newPage();
  for (const pr of produtos) {
    const f = path.join(out, pr.arq + '.html');
    fs.writeFileSync(f, html(pr.arq.replace(/-/g, ' '), pr.body));
    await p.goto(require('url').pathToFileURL(f).href, { waitUntil: 'networkidle0' });
    await p.evaluateHandle('document.fonts.ready');
    await p.pdf({ path: path.join(out, pr.arq + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: `<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:Arial">${pr.arq.replace(/-/g, ' ')} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>` });
    const pages = (fs.readFileSync(path.join(out, pr.arq + '.pdf'), 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(pr.arq.padEnd(34), 'páginas', pages, pr.total ? 'total ' + brl(pr.total) : '');
  }
  console.log('Janeiro por semana:', LS.map((l) => brl(l.total)).join(' | '), '· por pessoa/dia', brl(porPessoaDia));
  await b.close();
})();
