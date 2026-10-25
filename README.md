# Nexo · marketplace gamer

Compra e venda de contas, itens, moedas, gift cards e serviços de jogos, com o pagamento retido até o comprador confirmar a entrega (Garantia Nexo).

## Rodar no seu computador

Precisa do Node.js 20 ou mais novo.

```bash
npm install
npm run setup     # cria o banco local e carrega os dados de exemplo
npm run dev       # abre em http://localhost:3000
```

Para apagar tudo e recarregar os exemplos: `npm run db:reset`.

### Contas de teste

Todas usam a senha `nexo1234`.

| E-mail | Para quê |
|---|---|
| `admin@nexo.test` | Painel de admin em `/admin` |
| `comprador@nexo.test` | Comprar e testar pedidos |
| `vendedor@nexo.test` | Criar anúncios e entregar pedidos |
| `vortexstore@nexo.test`, `pixelstore@nexo.test`, `levelup@nexo.test`… | Lojas de exemplo (entre com elas para entregar pedidos feitos nos anúncios delas) |

## O que já funciona

- Cadastro, login e sessão (cookie assinado, senha com bcrypt)
- Home, busca com filtros (jogo, tipo, entrega automática, preço) e ordenação
- Página do anúncio com dados e avaliações do vendedor, e página da loja
- Criar anúncio, com entrega automática por lista de códigos; pausar e reativar
- Checkout com Pix (QR code e copia-e-cola)
- Pedido com chat entre comprador e vendedor, quadro de entrega, confirmação, disputa e avaliação
- Garantia: o valor só entra no saldo do vendedor na confirmação (ou automaticamente 3 dias após a entrega); Pix expira em 30 minutos
- Minha conta: compras, vendas, anúncios, favoritos, saldo e pedido de saque
- Painel de admin (`/admin`, só para contas com `role = "ADMIN"`):
  - Disputas: ver motivo, entrega, conversa e histórico das partes; mandar mensagem como mediador; liberar ao vendedor ou reembolsar o comprador, com justificativa que as duas partes leem
  - Saques: aprovar e pagar, ou recusar com motivo (o valor volta ao saldo)
  - Anúncios: ver novos, buscar, remover com motivo (o vendedor vê e não consegue reativar) e restaurar
  - Toda decisão fica registrada em "Últimas ações da equipe"

- Segurança e confiança:
  - Login em duas etapas (app autenticador) em `/conta/seguranca`; **obrigatório para abrir o painel de admin**
  - Bloqueio de 15 minutos depois de 5 senhas erradas no mesmo e-mail (ou 20 no mesmo IP)
  - Denunciar anúncio; com 3 denúncias o anúncio sai do ar até a equipe decidir (aba Denúncias)
  - Verificação de vendedor (nome, CPF válido, 18+) exigida para sacar; a equipe aprova na aba Usuários
  - Suspender e reativar contas: a pessoa não entra e os anúncios somem
  - Antifraude: contas com menos de 7 dias sacam até R$ 300 por vez, um saque pendente por vez, e alertas de risco (muitas disputas, denúncias) na aba Usuários

- Experiência:
  - Fotos nos anúncios (até 5, JPG/PNG/WEBP, 3 MB) e foto de perfil; ficam em `uploads/` (em produção, trocar por Supabase Storage/S3/R2)
  - Editar anúncio (`/anuncio/<id>/editar`): textos, preço, preço "de", estoque, fotos e novos códigos automáticos
  - Perfil (`/conta/perfil`): nome da loja, descrição e foto; mostra o nível e o que falta para o próximo
  - Níveis de vendedor: Novato, Bronze (5+), Prata (25+, nota 4,5+), Ouro (100+, 4,7+), Diamante (500+, 4,8+) e selo de verificado
  - Perguntas públicas no anúncio, com bloqueio de telefone, e-mail e links
  - Avisos no sino do topo (`/notificacoes`): venda, entrega, mensagem, dinheiro liberado, avaliação, saque, disputa, verificação
  - Chat do pedido em tempo real (SSE), com volta automática para consulta a cada 4 s
  - Cupons da Nexo (aba Cupons do admin): % com teto ou valor fixo, compra mínima, limite de usos e validade; o desconto sai da taxa da Nexo e o vendedor recebe sobre o preço cheio. Exemplo: `BEMVINDO10`

A senha do admin fica em `ADMIN_PASSWORD` no `.env`. Para tornar outra conta admin, rode `npx prisma studio`, abra a tabela `User` e mude `role` para `ADMIN`.

## O que ainda é simulado

- **Pagamento.** `PAYMENT_PROVIDER="mock"` gera um Pix de teste e mostra o botão "Simular pagamento aprovado". Para cobrar de verdade, implemente o gateway em `src/lib/payments.ts` e o webhook em `src/app/api/webhooks/pagamento/route.ts`.
- **Estornos e saques.** O admin aprova, mas o dinheiro só se move de verdade quando `refundPix` e `payoutPix` em `src/lib/payments.ts` chamarem o gateway.

## Estrutura

```
prisma/schema.prisma      modelos do banco (valores em centavos)
prisma/seed.ts            dados de exemplo
src/lib/orders.ts         regras da Garantia Nexo (todas as mudanças de status)
src/lib/payments.ts       camada de pagamento (mock hoje)
src/lib/auth.ts           sessão e login
src/app/                  páginas (App Router do Next.js) e ações do servidor
src/components/           componentes visuais
```

## Próximos passos

1. Gateway real (Mercado Pago, Asaas ou Pagar.me) com Pix, webhook e saque automático
3. Banco Postgres (Supabase ou Neon): trocar `provider` no schema e a `DATABASE_URL`
4. Recuperação de senha e confirmação de e-mail
5. Upload de imagens nos anúncios
6. Chat em tempo real (hoje atualiza a cada 4 segundos)
7. Termos de uso e política de privacidade (com advogado), e deploy na Vercel
