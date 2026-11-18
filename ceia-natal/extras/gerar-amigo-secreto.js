// Gera o bônus "Kit de Brincadeiras para Amigo Secreto" (PDF A5, fácil de ler no celular) e a capa para a página.
// Uso: NODE_PATH=<pasta com puppeteer>/node_modules node gerar-amigo-secreto.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ARQ = 'Kit-de-Brincadeiras-para-Amigo-Secreto';

const CSS = `
:root{--verm:#B3261E;--verm2:#8E1B15;--verde:#1F6B3A;--verde2:#16502B;--creme:#FFF8EC;--ouro:#FFC93C;--tx:#2B2320;--cinza:#6B625C;--linha:#EADFCC}
@page{size:A5;margin:11mm 11mm 13mm}
*{box-sizing:border-box}
body{font-family:Nunito,Arial,sans-serif;color:var(--tx);font-size:9.9pt;line-height:1.45;margin:0}
h1,h2,h3{font-family:'Playfair Display',Georgia,serif;margin:0}
h2{color:var(--verm);font-size:18pt;line-height:1.15;margin-bottom:3mm}
h3{color:var(--verde);font-size:11.5pt;margin:3mm 0 1mm}
p{margin:0 0 2.2mm}
ul,ol{margin:0 0 2.5mm;padding-left:5mm}li{margin-bottom:1mm}
.pg{page-break-after:always}
.kick{font-size:8pt;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--verde);margin-bottom:1mm}
.capa{height:184mm;background:linear-gradient(160deg,#1E1B4B,#0D0F2E);color:#fff;border-radius:5mm;padding:14mm 11mm 11mm;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.capa:after{content:"";position:absolute;right:-26mm;bottom:-30mm;width:92mm;height:92mm;border-radius:50%;background:#2C2775}
.capa:before{content:"";position:absolute;left:-14mm;top:-16mm;width:40mm;height:40mm;border-radius:50%;background:rgba(255,201,60,.14)}
.capa>*{position:relative;z-index:1}
.capa small{letter-spacing:.2em;text-transform:uppercase;font-weight:800;font-size:8pt;opacity:.9}
.capa h1{font-size:26pt;line-height:1.05;margin:3mm 0 3mm}
.capa p{font-size:10.8pt;max-width:96mm}
.capa .gift{font-size:40pt;line-height:1}
.selo{display:inline-block;background:var(--ouro);color:#3a2600;font-weight:800;border-radius:30px;padding:2.2mm 5mm;font-size:10pt}
.capa .rod{font-size:8pt;opacity:.92}
.box{background:var(--creme);border:1px solid var(--linha);border-radius:3mm;padding:3mm 4mm;margin:2.5mm 0}
.dica{border-left:4px solid var(--verde)}
.aviso{border-left:4px solid var(--verm)}
.info{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm;margin:2mm 0 3mm}
.info div{background:var(--verde);color:#fff;border-radius:2.5mm;padding:2mm 2.5mm;font-size:8.6pt;line-height:1.3}
.info b{display:block;font-size:7pt;letter-spacing:.1em;text-transform:uppercase;opacity:.85}
.num{display:inline-flex;align-items:center;justify-content:center;width:9mm;height:9mm;border-radius:50%;background:var(--verm);color:#fff;font-weight:800;font-family:Nunito;font-size:12pt;margin-right:2mm;vertical-align:middle}
.ex{background:#fff;border:1.5px dashed var(--ouro);border-radius:3mm;padding:2.6mm 3.5mm;margin:2.5mm 0;font-size:9.8pt}
.ex b{color:var(--verm)}
table{width:100%;border-collapse:collapse;font-size:9pt;margin:2mm 0}
th{background:var(--verm);color:#fff;text-align:left;padding:1.4mm 2mm;font-size:8.6pt}
td{border-bottom:1px solid var(--linha);padding:1.4mm 2mm;vertical-align:top}
tr:nth-child(even) td{background:var(--creme)}
.sum li{margin-bottom:.6mm}
.zap{background:#E7F7EC;border:1px solid #BFE5CB;border-radius:3mm;padding:3.5mm 4mm;font-size:9.6pt;white-space:pre-wrap;line-height:1.45}
.ck{list-style:none;padding:0}.ck li{padding-left:6mm;position:relative}.ck li:before{content:"";position:absolute;left:0;top:1.2mm;width:3.2mm;height:3.2mm;border:1.4px solid var(--verde);border-radius:.7mm}
.cards{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:84mm;gap:4mm;margin-top:2mm}
.cartao{border:1.4px dashed #9a8f86;border-radius:4mm;padding:5mm 4.5mm;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.cartao .t{font-size:7.5pt;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.cartao.p .t{color:var(--verde)}.cartao.q .t{color:var(--verm)}
.cartao .f{font-family:'Playfair Display',Georgia,serif;font-size:13.5pt;line-height:1.25;font-weight:700}
.cartao .n{font-size:8pt;color:var(--cinza);display:flex;justify-content:space-between}
.cartao.p{background:linear-gradient(180deg,#F1FAF4,#fff)}
.cartao.q{background:linear-gradient(180deg,#FDF0EF,#fff)}
.corte{font-size:8pt;color:var(--cinza);text-align:center;margin-top:1mm}
.fim{text-align:center;font-family:'Playfair Display',serif;color:var(--verm);font-size:14pt;margin-top:5mm}
`;

const jogo = (n, titulo, sub, quem, mat, dur, regras, exemplo, dica) => `<section class="pg">
<div class="kick">Brincadeira ${n} de 5</div>
<h2><span class="num">${n}</span>${titulo}</h2>
<p>${sub}</p>
<div class="info"><div><b>Participantes</b>${quem}</div><div><b>Materiais</b>${mat}</div><div><b>Duração</b>${dur}</div></div>
<h3>Como funciona</h3><ol>${regras.map((r) => `<li>${r}</li>`).join('')}</ol>
<div class="ex">${exemplo}</div>
${dica ? `<div class="box dica">${dica}</div>` : ''}
</section>`;

const PISTAS = [
  'Uma comida que essa pessoa adora é…',
  'Um lugar onde é fácil encontrar essa pessoa é…',
  'Uma frase que essa pessoa vive dizendo é…',
  'Essa pessoa é ótima em…',
  'Se essa pessoa fosse um doce de Natal, seria…',
  'Um programa de fim de semana que essa pessoa curte é…',
  'Uma vez, essa pessoa me ajudou quando…',
  'Uma música ou um estilo que lembra essa pessoa é…',
  'Um objeto que essa pessoa sempre tem por perto é…',
  'Uma cor que combina com essa pessoa é…',
];
const PERGUNTAS = [
  'Essa pessoa é mais velha que você?',
  'Essa pessoa mora na mesma casa que você?',
  'Essa pessoa usa óculos?',
  'Essa pessoa gosta de cozinhar?',
  'Essa pessoa está sentada perto de você agora?',
  'Essa pessoa costuma acordar cedo?',
  'Essa pessoa veio de outra cidade para a festa?',
  'Essa pessoa prefere doce a salgado?',
  'Essa pessoa tem algum bicho de estimação?',
  'Essa pessoa faz aniversário no primeiro semestre?',
];
const cartoes = [...PISTAS.map((f) => ['p', 'Cartão de pista', f]), ...PERGUNTAS.map((f) => ['q', 'Pergunta de sim ou não', f])];
const paginasCartoes = [];
for (let i = 0; i < cartoes.length; i += 4) {
  paginasCartoes.push(`<section class="pg">${i === 0 ? '<div class="kick">Para imprimir ou copiar à mão</div><h2 style="font-size:15pt;margin-bottom:1mm">20 cartões de pistas e perguntas</h2>' : ''}<div class="cards" ${i === 0 ? 'style="grid-auto-rows:76mm"' : ''}>${cartoes.slice(i, i + 4).map(([c, t, f], k) => `<div class="cartao ${c}"><span class="t">${c === 'p' ? '🟢 ' : '🔴 '}${t}</span><span class="f">${f}</span><span class="n"><span>Amigo Secreto em Família</span><span>${i + k + 1}/20</span></span></div>`).join('')}</div><div class="corte">✂ Recorte na linha tracejada</div></section>`);
}

const ZAP = `🎄 *Amigo secreto da família!* 🎁

📅 *Quando:* [dia], às [hora]
📍 *Onde:* [endereço ou casa de quem]
💰 *Valor do presente:* até R$ [valor]
🎲 *Sorteio:* [dia ou link do sorteio]. Guarde segredo de quem você tirou! 🤫

🎉 *Na hora da revelação* vamos brincar de *[nome da brincadeira]*: [ex.: cada um dá 3 pistas sobre quem tirou e o grupo tenta adivinhar].
Ninguém é obrigado a nada: quem preferir, pode passar a vez e só entregar o presente. 😉

✅ Responda com 👍 para confirmar presença.
Qualquer dúvida, fala comigo!`;

const body = [
  `<section class="pg capa"><div><small>Bônus · Ceia de Natal Econômica</small><h1>Kit de Brincadeiras para Amigo Secreto</h1><p>5 jeitos divertidos de revelar quem tirou quem, com 20 cartões de pistas e um roteiro para o organizador.</p></div><div class="gift">🎁</div><div><span class="selo">Para toda a família, sem constrangimento</span><p class="rod" style="margin-top:4mm">Funciona com o sorteio que vocês já fizeram. Nada de comprar material extra.</p></div></section>`,

  `<section class="pg"><div class="kick">Comece por aqui</div><h2>Como usar este kit</h2>
<p>Uma brincadeira simples na hora da revelação deixa a troca de presentes mais divertida, e todo mundo participa.</p>
<ol class="sum"><li><b>Roteiro do organizador</b>: como explicar, definir a ordem e conduzir a troca (página 3).</li><li><b>5 brincadeiras de revelação</b>, cada uma com participantes, materiais, duração, regras e exemplo (páginas 4 a 8).</li><li><b>Adaptações</b> para crianças, pessoas tímidas e grupos grandes (página 9).</li><li><b>20 cartões</b> de pistas e perguntas para imprimir ou copiar à mão (páginas 10 a 14).</li><li><b>Mensagem pronta para o WhatsApp</b> e checklist (página 15).</li></ol>
<h3>As 4 regras de ouro</h3>
<ul><li><b>O sorteio continua o mesmo.</b> As brincadeiras mudam só o jeito de revelar. Ninguém troca de amigo nem de presente.</li><li><b>Só coisas boas.</b> Pistas e perguntas falam de gostos, hábitos e qualidades. Nada de segredos, apelidos que incomodam ou assuntos delicados.</li><li><b>Passar a vez é sempre permitido.</b> Quem não quiser brincar entrega o presente do jeito tradicional.</li><li><b>Sem gastos extras.</b> Tudo funciona com papel, caneta e o que já tem em casa.</li></ul>
<h3>Qual brincadeira escolher?</h3>
<table><thead><tr><th>Brincadeira</th><th>Melhor para</th><th>Tempo por pessoa</th></tr></thead><tbody>
<tr><td>1. Três pistas</td><td>Qualquer grupo</td><td>1 a 2 min</td></tr>
<tr><td>2. Sim ou não</td><td>Grupos animados</td><td>2 a 3 min</td></tr>
<tr><td>3. Mímica</td><td>Família com crianças</td><td>1 a 2 min</td></tr>
<tr><td>4. Lembrança compartilhada</td><td>Quem se conhece há tempo</td><td>2 min</td></tr>
<tr><td>5. Revelação com elogios</td><td>Momento mais emocionante</td><td>1 a 2 min</td></tr></tbody></table>
<p style="font-size:8.6pt;color:var(--cinza);margin-top:1.5mm">Escolha uma para a noite toda ou deixe cada pessoa escolher a sua.</p></section>`,

  `<section class="pg"><div class="kick">Para quem vai organizar</div><h2>Roteiro do organizador</h2>
<h3>Antes da festa</h3><ul class="ck"><li>Mande a mensagem do WhatsApp (página 15) com data, valor do presente e a brincadeira escolhida.</li><li>Confirme que todos já sabem quem tiraram e que guardaram segredo.</li><li>Imprima ou copie os cartões, se for usar (páginas 10 a 14).</li><li>Combine um lugar para deixar os presentes até a hora da troca.</li></ul>
<h3>Na hora: explique em 1 minuto</h3>
<div class="ex">“Gente, chegou a hora do amigo secreto! Hoje cada um vai revelar quem tirou de um jeito diferente: <b>[nome da brincadeira]</b>. Quem adivinhar ajuda a encontrar a pessoa. E quem preferir pode passar a vez e só entregar o presente, tudo bem.”</div>
<h3>Definindo a ordem</h3><ul><li><b>Em corrente (o jeito clássico):</b> uma pessoa começa. Quem recebe o presente é o próximo a revelar.</li><li><b>Quem começa:</b> o mais novo que já sabe ler, o dono da casa ou quem fez aniversário mais perto do Natal.</li><li><b>Se a corrente fechar antes do fim</b> (alguém revela para quem já revelou), quem acabou de receber escolhe uma pessoa que ainda não revelou.</li></ul>
<h3>Conduzindo a troca</h3><ul><li>Cada revelação leva de 1 a 3 minutos. Com 10 pessoas, reserve uns 30 minutos.</li><li>Se o grupo travar, dê uma pista extra ou peça para a pessoa dizer a primeira letra do nome.</li><li>Abrir o presente na hora é opcional. Pergunte a quem recebeu.</li><li>Fotos: combine antes se todos topam aparecer.</li></ul></section>`,

  jogo(1, 'Três pistas', 'O clássico que nunca falha: quem revela dá três pistas, da mais difícil para a mais fácil, e o grupo tenta adivinhar.', '4 a 20 pessoas', 'Nenhum (cartões de pista opcionais)', '1 a 2 min por pessoa',
    ['Quem vai revelar fica em pé ou no centro da roda, com o presente na mão.', 'Dá a <b>primeira pista</b>, bem geral. O grupo pode tentar adivinhar.', 'Se ninguém acertar, dá a <b>segunda pista</b>, um pouco mais clara.', 'A <b>terceira pista</b> deve ser fácil. Se ainda assim ninguém acertar, a pessoa revela o nome.', 'Quem foi revelado recebe o presente e é o próximo a revelar.'],
    '<b>Exemplo:</b> 1) “Essa pessoa adora começar o dia com café bem forte.” 2) “Ela é ótima em fazer bolo.” 3) “Ela está usando uma blusa vermelha hoje.” → “É a tia Rosa!”',
    '<b>Sem ideias?</b> Use os cartões de pista verdes (1 a 10): sorteie 3 e complete as frases pensando no seu amigo secreto.'),

  jogo(2, 'Perguntas de sim ou não', 'O grupo vira detetive: faz perguntas e quem revela só pode responder “sim” ou “não”.', '5 a 20 pessoas', 'Nenhum (cartões de pergunta opcionais)', '2 a 3 min por pessoa',
    ['Quem vai revelar segura o presente e diz: “Podem perguntar!”.', 'O grupo faz perguntas, uma de cada vez. A resposta é só “sim” ou “não”.', 'Vale tentar um palpite a qualquer momento, mas cada pessoa tem <b>um palpite por rodada</b>.', 'Combinem um limite de <b>10 perguntas</b>. Se ninguém acertar, a pessoa revela o nome.', 'Quem foi revelado recebe o presente e é o próximo.'],
    '<b>Exemplo:</b> “É mais velha que você?” “Sim.” “Mora com você?” “Não.” “Gosta de cozinhar?” “Sim!” “Está sentada perto de você?” “Não.” → “É o vô Antônio!”',
    '<b>Deixe os cartões vermelhos (11 a 20) no centro da mesa.</b> Quem não souber o que perguntar pega um cartão e lê.'),

  jogo(3, 'Mímica', 'Sem dizer uma palavra, quem revela imita algo típico do seu amigo secreto: um gesto, um hobby ou uma mania divertida.', '5 a 25 pessoas', 'Nenhum (celular para marcar o tempo, se quiser)', '1 a 2 min por pessoa',
    ['Quem vai revelar pensa em <b>uma coisa boa ou engraçada</b> que a pessoa faz: um esporte, um hobby, um jeito de dançar.', 'Faz a mímica sem falar e sem apontar para ninguém.', 'O grupo tem <b>1 minuto</b> para adivinhar. Vale repetir a mímica.', 'Se ninguém acertar, pode fazer uma segunda mímica ou revelar o nome.', 'Quem foi revelado recebe o presente e é o próximo.'],
    '<b>Exemplo:</b> mexer uma panela imaginária, provar e fazer cara de “perfeito!”, depois fingir tirar uma assadeira do forno → “É a mãe, que faz o pernil!”',
    '<b>Mímica é carinho, não imitação maldosa.</b> Escolha algo que a própria pessoa vai achar graça: hobbies, talentos, frases que ela adora.'),

  jogo(4, 'Lembrança compartilhada', 'Quem revela conta, sem dizer nomes, uma lembrança boa que viveu com o amigo secreto. Perfeito para famílias e amigos de longa data.', '4 a 15 pessoas', 'Nenhum', 'Cerca de 2 min por pessoa',
    ['Quem vai revelar começa com: “Eu lembro de uma vez em que…”.', 'Conta uma história curta e alegre com a pessoa, <b>sem dizer o nome</b> e sem detalhes que ela não gostaria de ver contados.', 'O grupo tenta adivinhar quem é. Quem estava na história costuma se reconhecer!', 'Se ninguém acertar, a pessoa dá um detalhe a mais ou revela o nome.', 'Quem foi revelado recebe o presente e é o próximo.'],
    '<b>Exemplo:</b> “Eu lembro de uma vez em que a gente ficou sem luz no Natal e essa pessoa organizou um jogo de adivinhação com lanterna, e foi a melhor noite.” → “Fui eu!”, diz o primo Lucas.',
    '<b>Se não tiver uma lembrança com a pessoa,</b> conte algo bonito que você sabe sobre ela (“essa pessoa sempre ajuda quem chega primeiro na festa”).'),

  jogo(5, 'Revelação com elogios', 'O jeito mais emocionante: cada um descreve o amigo secreto só com qualidades, e todo mundo se sente especial.', '4 a 20 pessoas', 'Nenhum (papel e caneta opcionais)', '1 a 2 min por pessoa',
    ['Quem vai revelar diz <b>três qualidades</b> do seu amigo secreto, uma de cada vez.', 'O grupo tenta adivinhar depois de cada qualidade.', 'Depois da terceira, a pessoa revela o nome e explica uma das qualidades com um exemplo curto.', 'Quem foi revelado recebe o presente e é o próximo.'],
    '<b>Exemplo:</b> “Essa pessoa é paciente. Ela é generosa. E ela tem a risada mais contagiante da família.” → “É a Bia!” “É, e paciente porque me ensinou a dirigir sem perder a calma!”',
    '<b>Versão escrita para tímidos:</b> escreva as três qualidades num papel e peça para alguém ler em voz alta. Muita gente guarda esse papel de lembrança.'),

  `<section class="pg"><div class="kick">Para todo mundo participar</div><h2>Adaptações</h2>
<h3>👧 Para crianças</h3><ul><li>Prefira <b>Mímica</b> ou <b>Três pistas</b>. São rápidas e não exigem leitura.</li><li>Crianças que ainda não leem podem fazer dupla com um adulto, que lê o cartão baixinho no ouvido delas.</li><li>Troque “qualidades” por perguntas simples: “Qual a comida favorita dessa pessoa?”.</li><li>Deixe as crianças começarem: elas ficam ansiosas para entregar o presente.</li></ul>
<h3>🙈 Para pessoas tímidas</h3><ul><li><b>Passar a vez é sempre permitido</b>, sem precisar explicar o motivo.</li><li>Ofereça a versão escrita: a pessoa escreve as pistas e alguém lê em voz alta.</li><li>Pode revelar em dupla com alguém de confiança.</li><li>Ninguém precisa ficar no centro da roda: dá para revelar sentado no lugar.</li></ul>
<h3>👨‍👩‍👧‍👦 Para grupos grandes (mais de 15)</h3><ul><li>Use <b>Três pistas</b> com só 2 pistas por pessoa, ou divida em duas rodas.</li><li>Marque 1 minuto por revelação no celular.</li></ul>
<h3>📱 Para quem está longe</h3><ul><li>Faça uma chamada de vídeo e coloque o celular num lugar onde a pessoa veja a roda.</li><li>Quem está longe dá as pistas em voz alta. O presente pode ser entregue depois ou enviado por aplicativo de entrega.</li></ul></section>`,

  ...paginasCartoes,

  `<section><div class="kick">Copie e cole</div><h2>Mensagem pronta para o WhatsApp</h2><p>Troque o que está entre colchetes e envie no grupo da família:</p><div class="zap">${ZAP}</div>
<h3>Checklist do dia</h3><ul class="ck"><li>Todos confirmaram presença e o valor do presente</li><li>Brincadeira escolhida e explicada na mensagem</li><li>Cartões impressos ou copiados (se for usar)</li><li>Lugar separado para os presentes</li><li>Quem começa a revelação já está definido</li></ul>
<p class="fim">Boas festas e boa revelação! 🎄</p></section>`,
].join('\n');

const html = (corpo) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Kit de Brincadeiras para Amigo Secreto</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${corpo}</body></html>`;

const CAPA_PNG = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Nunito:wght@800&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}body{width:600px;height:600px;background:radial-gradient(circle at 85% 90%,#3B2F8F 0,transparent 60%),linear-gradient(160deg,#1E1B4B,#0D0F2E);color:#fff;font-family:Nunito,Arial;position:relative;overflow:hidden;padding:56px 46px}
body:after{content:"";position:absolute;right:-110px;bottom:-130px;width:400px;height:400px;border-radius:50%;background:#2C2775;box-shadow:0 0 0 22px rgba(255,201,60,.12)}
body:before{content:"";position:absolute;left:-60px;top:-70px;width:170px;height:170px;border-radius:50%;background:rgba(255,201,60,.14)}
*{position:relative;z-index:1}small{letter-spacing:.2em;text-transform:uppercase;font-size:17px;color:#FFC93C}
h1{font-family:'Playfair Display',Georgia,serif;font-size:56px;line-height:1.04;margin:16px 0 18px}h1 em{font-style:normal;color:#FFC93C}
p{font-size:21px;line-height:1.35;max-width:430px;opacity:.92}
.g{position:absolute;right:56px;bottom:150px;font-size:110px;z-index:2;filter:drop-shadow(0 12px 18px rgba(0,0,0,.45))}
.s{position:absolute;left:46px;bottom:46px;background:#FFC93C;color:#2a1f00;border-radius:40px;padding:14px 24px;font-size:21px}
i{position:absolute;border-radius:50%;z-index:0}
</style></head><body><i style="width:10px;height:10px;background:#FFC93C;left:420px;top:70px"></i><i style="width:7px;height:7px;background:#FF6FB5;left:520px;top:130px"></i><i style="width:8px;height:8px;background:#5EE0C8;left:470px;top:300px"></i><i style="width:6px;height:6px;background:#FFC93C;left:300px;top:330px"></i><i style="width:9px;height:9px;background:#FF6FB5;left:80px;top:360px"></i><i style="width:6px;height:6px;background:#5EE0C8;left:230px;top:420px"></i><small>Bônus digital incluído</small><h1>Kit de Brincadeiras para <em>Amigo Secreto</em></h1><p>5 jeitos de revelar quem tirou quem</p><div class="g">🎁</div><div class="s">20 cartões + roteiro</div></body></html>`;

(async () => {
  const out = path.join(__dirname, 'pdf');
  fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch();
  const p = await b.newPage();
  const f = path.join(out, ARQ + '.html');
  fs.writeFileSync(f, html(body));
  await p.goto(require('url').pathToFileURL(f).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  const pdf = path.join(out, ARQ + '.pdf');
  await p.pdf({ path: pdf, format: 'A5', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font-size:7px;color:#999;text-align:center;font-family:Arial">Kit de Brincadeiras para Amigo Secreto · bônus da Ceia de Natal Econômica · <span class="pageNumber"></span>/<span class="totalPages"></span></div>' });
  const pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log('PDF', pdf, 'páginas', pages, Math.round(fs.statSync(pdf).size / 1024) + ' KB');
  // capa quadrada para a página de vendas
  const cf = path.join(__dirname, 'capas', '_amigo.html');
  fs.writeFileSync(cf, CAPA_PNG);
  await p.setViewport({ width: 600, height: 600, deviceScaleFactor: 1 });
  await p.goto(require('url').pathToFileURL(cf).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await p.screenshot({ path: path.join(__dirname, 'capas', 'amigo-secreto.png') });
  fs.unlinkSync(cf);
  // prévias das páginas (para conferência)
  console.log('capa ok');
  await b.close();
})();
