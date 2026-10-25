// Dados de exemplo para desenvolvimento. Rode com: npm run db:seed
// Todas as contas de teste usam a senha do README.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const TEST_PASSWORD = "nexo1234";
const FEE_BPS = 990;

const GAMES = [
  { slug: "roblox", name: "Roblox", letter: "R", glyph: "RBX", c1: "#9C7BFF", c2: "#2A1F4D" },
  { slug: "valorant", name: "Valorant", letter: "V", glyph: "V", c1: "#FF5A6A", c2: "#4A1620" },
  { slug: "lol", name: "League of Legends", letter: "L", glyph: "L", c1: "#D4B26A", c2: "#3A3018" },
  { slug: "freefire", name: "Free Fire", letter: "FF", glyph: "FF", c1: "#FF9A3D", c2: "#4D2A10" },
  { slug: "minecraft", name: "Minecraft", letter: "M", glyph: "M", c1: "#6CCB5A", c2: "#1E3D1A" },
  { slug: "steam", name: "Steam", letter: "S", glyph: "STEAM", c1: "#5DB4E8", c2: "#163246" },
  { slug: "fortnite", name: "Fortnite", letter: "F", glyph: "FN", c1: "#C27BFF", c2: "#33184F" },
  { slug: "cs2", name: "Counter-Strike 2", letter: "CS", glyph: "CS2", c1: "#F0B43A", c2: "#3D3016" },
  { slug: "genshin", name: "Genshin Impact", letter: "G", glyph: "GI", c1: "#5FD6CF", c2: "#163C42" },
];

const SELLERS = [
  { username: "vortexstore", bio: "Contas de FPS e battle royale revisadas uma a uma. Todas com e-mail trocável e garantia de 7 dias contra recuperação." },
  { username: "ffcenter", bio: "Recargas de Free Fire por ID em poucos minutos e contas raras com skins de passe antigo." },
  { username: "luminacontas", bio: "Contas de RPG e MOBA com histórico limpo. Envio vídeo da conta antes da venda se você pedir." },
  { username: "pixelstore", bio: "Gift cards e códigos digitais com entrega automática 24h." },
  { username: "skinlab", bio: "Skins de CS2 entregues por oferta de troca na Steam. Float na descrição de cada anúncio." },
  { username: "levelup", bio: "Coaching e serviços com jogadores de elo alto. Agenda combinada pelo chat do pedido." },
];

type L = { s: string; j: string; tipo: string; t: string; p: number; old?: number; g?: string; auto?: boolean; est: number; dest?: boolean; d: string };
const LISTINGS: L[] = [
  { s: "vortexstore", j: "valorant", tipo: "CONTA", t: "Conta Valorant Imortal 2 · 47 skins", p: 48990, est: 1, dest: true, d: "Conta full acesso com e-mail original trocável. Rank Imortal 2 no último ato, 47 skins incluindo Vandal Reaver, Phantom Prime e faca Karambit Elderflame." },
  { s: "ffcenter", j: "freefire", tipo: "MOEDA", t: "1.060 Diamantes Free Fire · recarga por ID", p: 3990, old: 4490, g: "1060", est: 500, dest: true, d: "Recarga direto no seu ID, sem precisar de senha. Informe o ID no checkout e os diamantes caem em até 10 minutos." },
  { s: "luminacontas", j: "lol", tipo: "CONTA", t: "Conta LoL Esmeralda · 182 campeões", p: 25900, est: 1, d: "Servidor BR, elo Esmeralda III, 182 campeões e 96 skins (3 lendárias). Sem punições no histórico." },
  { s: "pixelstore", j: "roblox", tipo: "GIFT", t: "Gift card Roblox · R$ 50", p: 5000, g: "R$", auto: true, est: 12, dest: true, d: "Código digital para resgatar créditos na sua conta Roblox. Entrega automática assim que o pagamento é aprovado." },
  { s: "pixelstore", j: "steam", tipo: "GIFT", t: "Gift card Steam · R$ 100", p: 9750, old: 10000, g: "100", auto: true, est: 10, dest: true, d: "Cartão digital da Steam no valor de R$ 100 para a região Brasil. Resgate na carteira da Steam." },
  { s: "vortexstore", j: "fortnite", tipo: "CONTA", t: "Fortnite · conta com 210 skins", p: 129000, est: 1, d: "Conta da temporada 1 com Renegade Raider, Aerial Assault e 210 skins. E-mail trocável, sem PSN ou Xbox atrelados." },
  { s: "skinlab", j: "cs2", tipo: "ITEM", t: "AK-47 Redline · Testada em Campo", p: 11200, g: "AK", est: 3, d: "Float 0,21. Entrega por oferta de troca na Steam: envie seu link de troca no chat do pedido." },
  { s: "levelup", j: "valorant", tipo: "SERVICO", t: "Elojob Valorant · Ouro para Platina", p: 14990, est: 10, d: "Jogador Radiante sobe sua conta do Ouro à Platina em até 5 dias. Acompanhe cada partida pelo chat do pedido." },
  { s: "luminacontas", j: "genshin", tipo: "CONTA", t: "Genshin Impact · AR 58 · 9 personagens 5★", p: 34900, est: 1, d: "Servidor América, Adventure Rank 58, 9 personagens 5 estrelas incluindo Raiden e Nahida. E-mail trocável." },
  { s: "levelup", j: "minecraft", tipo: "SERVICO", t: "Construção personalizada · Minecraft", p: 8000, est: 5, d: "Construo sua base, castelo ou cidade no seu servidor ou mundo. Escopo combinado pelo chat." },
  { s: "pixelstore", j: "steam", tipo: "GIFT", t: "Gift card Steam · R$ 50", p: 4900, g: "50", auto: true, est: 15, d: "Cartão digital da Steam no valor de R$ 50 para a região Brasil." },
  { s: "ffcenter", j: "freefire", tipo: "CONTA", t: "Free Fire · conta com Calça Angelical", p: 18990, est: 1, d: "Conta nível 72 com Calça Angelical, 14 passes de elite e 3 armas evoluídas no máximo." },
  { s: "levelup", j: "lol", tipo: "SERVICO", t: "Coaching de LoL · sessão de 1 hora", p: 4500, est: 8, dest: true, d: "Análise de replay, rotas e macro com jogador Mestre. Horário combinado pelo chat depois da compra." },
  { s: "luminacontas", j: "roblox", tipo: "SERVICO", t: "Arte para seu avatar · Roblox", p: 3500, est: 10, d: "Ilustração do seu avatar em alta resolução, pronta para perfil e miniatura." },
  { s: "pixelstore", j: "valorant", tipo: "MOEDA", t: "1.000 Valorant Points · código Riot", p: 4200, g: "VP", auto: true, est: 20, dest: true, d: "Código de pré-pago Riot para 1.000 VP. Resgate na loja do cliente." },
  { s: "vortexstore", j: "roblox", tipo: "CONTA", t: "Roblox · conta com Headless Horseman", p: 189000, est: 1, d: "Conta de 2019 com Headless Horseman, Korblox e 38 mil Robux gastos no histórico." },
  { s: "skinlab", j: "cs2", tipo: "ITEM", t: "Karambit Doppler · Nova de Fábrica", p: 265000, g: "KAR", est: 1, d: "Fase 2, float 0,01. Entrega por oferta de troca na Steam." },
  { s: "ffcenter", j: "minecraft", tipo: "CONTA", t: "Minecraft Java Edition · conta original", p: 7990, est: 6, d: "Conta Microsoft com Minecraft Java & Bedrock, com instruções para trocar o e-mail." },
];

// Pedidos já concluídos, para as lojas terem histórico e avaliações.
const REVIEWS = [
  { buyer: "gustavo", seller: "vortexstore", n: 5, t: "Conta exatamente como na descrição. Vendedor me ajudou a trocar o e-mail pelo chat." },
  { buyer: "mariana", seller: "vortexstore", n: 5, t: "Entregou em 7 minutos. Já é a terceira compra." },
  { buyer: "thiago", seller: "vortexstore", n: 4, t: "Tudo certo, só demorou um pouco para responder de madrugada." },
  { buyer: "karina", seller: "ffcenter", n: 5, t: "Diamantes caíram em 3 minutos." },
  { buyer: "joaop", seller: "ffcenter", n: 5, t: "Rápido e sem pedir senha. Recomendo." },
  { buyer: "leticia", seller: "luminacontas", n: 5, t: "Mandou vídeo da conta antes. Muito confiável." },
  { buyer: "rafa", seller: "pixelstore", n: 5, t: "Código chegou na hora, resgatei sem problema." },
  { buyer: "bia", seller: "pixelstore", n: 5, t: "Melhor preço de gift card que achei." },
  { buyer: "vini", seller: "skinlab", n: 4, t: "Skin certinha, float igual ao anúncio." },
  { buyer: "duda", seller: "levelup", n: 5, t: "Subiu meu elo em 3 dias e ainda deu dicas." },
];

const code = () => Math.random().toString(36).slice(2, 6).toUpperCase();

async function main() {
  // Limpa na ordem das dependências.
  await db.adminAction.deleteMany();
  await db.notification.deleteMany();
  await db.question.deleteMany();
  await db.image.deleteMany();
  await db.coupon.deleteMany();
  await db.report.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.review.deleteMany();
  await db.message.deleteMany();
  await db.autoCode.deleteMany();
  await db.order.deleteMany();
  await db.favorite.deleteMany();
  await db.withdrawal.deleteMany();
  await db.listing.deleteMany();
  await db.game.deleteMany();
  await db.user.deleteMany();

  for (const [i, g] of GAMES.entries()) await db.game.create({ data: { ...g, sort: i } });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const users = new Map<string, string>();
  const mk = async (username: string, bio = "") => {
    const u = await db.user.create({ data: { username, bio, email: `${username}@nexo.test`, passwordHash } });
    users.set(username, u.id);
  };
  await mk("admin");
  // Senha própria do admin (ADMIN_PASSWORD no .env), para não ficar com a senha pública de teste.
  const adminPw = process.env.ADMIN_PASSWORD;
  await db.user.update({
    where: { username: "admin" },
    data: { role: "ADMIN", ...(adminPw && { passwordHash: await bcrypt.hash(adminPw, 10) }) },
  });
  await mk("comprador");
  await mk("vendedor", "Conta de teste para vender. Crie anúncios em /vender.");
  for (const s of SELLERS) await mk(s.username, s.bio);
  // Lojas de exemplo já verificadas; "vendedor" fica com verificação pendente para o painel.
  await db.user.updateMany({ where: { username: { in: SELLERS.map((s) => s.username) } }, data: { verification: "APROVADO" } });
  await db.user.update({ where: { username: "vendedor" }, data: { verification: "PENDENTE", fullName: "Vendedor de Teste da Silva", cpf: "52998224725", birthDate: "1998-04-12" } });
  for (const b of new Set(REVIEWS.map((r) => r.buyer))) await mk(b);

  const listingBySeller = new Map<string, string>();
  for (const l of LISTINGS) {
    const created = await db.listing.create({
      data: {
        sellerId: users.get(l.s)!,
        gameSlug: l.j,
        type: l.tipo,
        title: l.t,
        description: l.d,
        glyph: l.g,
        priceCents: l.p,
        oldPriceCents: l.old,
        stock: l.est,
        autoDelivery: !!l.auto,
        featured: !!l.dest,
        codes: l.auto ? { create: Array.from({ length: l.est }, () => ({ code: `TESTE-${code()}-${code()}` })) } : undefined,
      },
    });
    if (!listingBySeller.has(l.s)) listingBySeller.set(l.s, created.id);
  }

  let n = 10000;
  for (const r of REVIEWS) {
    const listingId = listingBySeller.get(r.seller)!;
    const listing = await db.listing.findUniqueOrThrow({ where: { id: listingId } });
    const total = listing.priceCents;
    const fee = Math.round((total * FEE_BPS) / 10000);
    const daysAgo = 2 + (n % 9);
    const at = new Date(Date.now() - daysAgo * 86_400_000);
    const order = await db.order.create({
      data: {
        code: `NX-${n++}`,
        buyerId: users.get(r.buyer)!,
        sellerId: users.get(r.seller)!,
        listingId,
        quantity: 1,
        unitPriceCents: total,
        totalCents: total,
        feeCents: fee,
        status: "CONCLUIDO",
        deliveryText: "Entregue (pedido de exemplo).",
        paidAt: at,
        deliveredAt: at,
        completedAt: at,
        createdAt: at,
      },
    });
    await db.review.create({
      data: { orderId: order.id, authorId: users.get(r.buyer)!, sellerId: users.get(r.seller)!, rating: r.n, comment: r.t, createdAt: at },
    });
    await db.user.update({ where: { id: users.get(r.seller)! }, data: { balanceCents: { increment: total - fee } } });
  }

  // Exemplos para o painel de admin: uma disputa aberta e um saque pendente.
  const contaLol = await db.listing.findFirstOrThrow({ where: { title: { contains: "Esmeralda" } } });
  const disputedAt = new Date(Date.now() - 5 * 3_600_000);
  await db.order.create({
    data: {
      code: `NX-${n++}`,
      buyerId: users.get("comprador")!,
      sellerId: contaLol.sellerId,
      listingId: contaLol.id,
      quantity: 1,
      unitPriceCents: contaLol.priceCents,
      totalCents: contaLol.priceCents,
      feeCents: Math.round((contaLol.priceCents * FEE_BPS) / 10000),
      status: "DISPUTA",
      deliveryText: "Login: conta_exemplo_lol\nSenha: Exemplo#2026",
      disputeReason: "A conta veio em elo Ouro, não Esmeralda como no anúncio, e só tem 140 campeões.",
      paidAt: new Date(disputedAt.getTime() - 3_600_000),
      deliveredAt: new Date(disputedAt.getTime() - 1_800_000),
      disputedAt,
      createdAt: new Date(disputedAt.getTime() - 3_700_000),
      messages: {
        create: [
          { body: "Pagamento aprovado. O valor fica retido pela Nexo até você confirmar o recebimento.", createdAt: new Date(disputedAt.getTime() - 3_600_000) },
          { senderId: contaLol.sellerId, body: "Dados enviados no quadro de entrega. Qualquer coisa me chama.", createdAt: new Date(disputedAt.getTime() - 1_800_000) },
          { senderId: users.get("comprador")!, body: "Entrei e a conta está no Ouro IV, e tem menos campeões do que o anúncio diz.", createdAt: new Date(disputedAt.getTime() - 600_000) },
          { senderId: contaLol.sellerId, body: "O elo caiu porque a temporada virou, mas os campeões estão certos.", createdAt: new Date(disputedAt.getTime() - 300_000) },
          { body: "Disputa aberta. Um mediador da Nexo vai analisar o caso. O valor continua retido.", createdAt: disputedAt },
        ],
      },
    },
  });
  const vortex = users.get("vortexstore")!;
  await db.user.update({ where: { id: vortex }, data: { balanceCents: { decrement: 15000 } } });
  await db.withdrawal.create({ data: { userId: vortex, amountCents: 15000, pixKey: "vortex@exemplo.com" } });

  // Denúncias de exemplo (2, abaixo do limite que tira o anúncio do ar).
  const denunciado = await db.listing.findFirstOrThrow({ where: { title: { contains: "Headless" } } });
  await db.report.create({ data: { listingId: denunciado.id, reporterId: users.get("gustavo")!, reason: "Preço abusivo", details: "Mesmo item sai por bem menos em outras lojas." } });
  await db.report.create({ data: { listingId: denunciado.id, reporterId: users.get("mariana")!, reason: "Descrição enganosa", details: "Pelo histórico, essa conta não tem Korblox." } });

  // Reputação das lojas de exemplo (vendas e notas acumuladas), para os níveis aparecerem.
  const REP: Record<string, [number, number]> = { vortexstore: [3412, 4.9], ffcenter: [1208, 4.8], luminacontas: [864, 4.8], pixelstore: [12940, 4.95], skinlab: [31, 4.6], levelup: [540, 4.75] };
  for (const [u, [sales, avg]] of Object.entries(REP)) {
    const count = Math.round(sales * 0.6);
    await db.user.update({ where: { username: u }, data: { completedSales: sales, ratingCount: count, ratingSum: Math.round(count * avg) } });
  }
  await db.coupon.create({ data: { code: "BEMVINDO10", percentOff: 10, maxDiscountCents: 2000, maxUses: 500 } });
  const lolConta = await db.listing.findFirstOrThrow({ where: { title: { contains: "Esmeralda" } } });
  await db.question.create({ data: { listingId: lolConta.id, askerId: users.get("rafa")!, body: "A conta tem e-mail trocável?", answer: "Tem sim, você recebe o e-mail original e troca na hora.", answeredAt: new Date() } });
  await db.question.create({ data: { listingId: lolConta.id, askerId: users.get("bia")!, body: "Ela tem alguma punição no histórico?" } });

  console.log(`Seed concluído: ${GAMES.length} jogos, ${users.size} usuários, ${LISTINGS.length} anúncios, ${REVIEWS.length} pedidos avaliados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
