# Lojas de vendedor, propostas, origem da venda e verificação externa

Registro do projeto "trazer vendedores com clientes próprios para a Nexo".
Ramo: `feature/lojas-vendedor`. Nada aqui foi publicado nem aplicado ao banco de produção.

## Progresso

| Etapa | Situação |
|---|---|
| 0. Inspeção, banco de testes local, desenho do banco | feito |
| 1. Loja do vendedor + proposta por link | feito |
| 2. Origem da venda (atribuição) + comissão configurável + simulação | feito (modalidade reduzida desligada) |
| 3. Verificação de perfil externo | feito |
| 4. Cupons da loja, recompra, seguir loja, programa de primeiros vendedores | feito |
| 5. Testes e relatório | feito (ver abaixo) |

## Como testar sem tocar em produção

O `.env` aponta para o banco de produção. Para os testes deste projeto use o Postgres local:

```bash
# 1. sobe um Postgres local (porta 54329) — script em scratchpad/pgdev/start.mjs
# 2. aponte o Prisma e o Next para ele só nesta janela:
DATABASE_URL=postgresql://nexo:nexo-dev-local@localhost:54329/nexo_dev DIRECT_URL=postgresql://nexo:nexo-dev-local@localhost:54329/nexo_dev npx prisma db push
```

Para aplicar em produção é preciso autorização do dono: `npx prisma db push` com o `.env` normal.
Todas as mudanças são **aditivas** (tabelas e colunas novas com valor padrão); nenhuma coluna existente é apagada ou alterada.

## Decisões de produto

- **Endereço da loja:** `/loja/<usuário>` (o nome de usuário já é único e não muda). Link de divulgação do vendedor: `/v/<usuário>`.
- **Nomes proibidos** em usuário e nome da loja: termos que imitam a equipe ou contas oficiais (`nexo`, `admin`, `suporte`, `oficial`, `moderador`, `equipe`, `staff`, `ggmax`…). Ver `src/lib/store-names.ts`.
- **Comissão:** a cobrança atual (9,79%) continua. A modalidade reduzida para vendas vindas do link do vendedor existe, mas fica **desligada** até o admin definir a taxa e a janela. Nenhum percentual ou prazo novo foi inventado.
- **Programa de primeiros vendedores:** só acompanhamento interno (checklist, responsável, status, observações). Nenhum benefício, vaga ou prazo é publicado.

## Política de atribuição (origem da venda)

Objetivo: dar a comissão reduzida só quando o vendedor realmente trouxe o comprador, de forma conservadora.

1. **Pontos de contato** são gravados no servidor (tabela `AttributionTouch`), nunca só na URL:
   - `LINK_VENDEDOR`: a pessoa abriu o link de divulgação `/v/<usuário>` ou aceitou uma proposta do vendedor.
   - `MARKETPLACE`: a pessoa viu um anúncio ou a loja desse vendedor navegando pela Nexo (busca, página inicial, categorias, links internos).
   O navegador é identificado por um cookie aleatório (`nexo_vid`) e, quando a pessoa está logada, também pela conta.
2. **Primeiro contato vence** dentro da janela configurada: só é venda do link do vendedor se o contato mais antigo com aquele vendedor, dentro da janela, for `LINK_VENDEDOR`.
   Assim, quem chegou pelo marketplace e depois abriu o link do vendedor continua com comissão normal.
3. **Múltiplos links do mesmo vendedor:** vale o primeiro; abrir de novo não renova a janela.
   Links de vendedores diferentes não interferem entre si (a origem é sempre por vendedor).
4. **Sem dados** (cookie apagado, outro aparelho, aba anônima, acesso direto digitando o endereço): origem `MARKETPLACE`, comissão normal.
   Não há rastreamento entre aparelhos; isso é dito ao vendedor.
5. **Parâmetro na URL não dá desconto**: `?ref=`, `?via=` etc. são ignorados. Só o contato gravado no servidor conta.
6. A decisão é tomada **no servidor ao criar o pedido** e **fica fixada no pedido** (`origin`, `feeBps`, `policyId`). Mudar a política depois não altera pedidos antigos.
7. Com a modalidade desligada, a origem continua sendo registrada (para relatório), mas a comissão é sempre a normal.
8. Propostas por link contam como `LINK_VENDEDOR` quando aceitas, seguindo a mesma regra do primeiro contato.

## Propostas por link

- Link com código aleatório e longo (`/proposta/<código>`); não mostra dados pessoais de ninguém, só o nome público da loja.
- O primeiro comprador logado que aceitar fica vinculado; depois disso só ele vê e paga.
- Editar preço, quantidade, prazo, condições ou validade gera uma **nova versão** e exige nova aceitação; pagamentos em aberto da versão anterior são cancelados.
- Aceitar cria um anúncio reservado (mesmo mecanismo do "Quero comprar") e o pedido segue o checkout, a entrega, a disputa e a mediação normais.
  As condições aceitas são copiadas para o pedido (`Order.terms`) e aparecem para comprador, vendedor e mediador.
- Proposta cancelada ou vencida não pode ser aceita nem paga; Pix pago depois do cancelamento é estornado pelo fluxo atual.
- Clique duplo e avisos repetidos do Asaas não geram pedidos nem cobranças em dobro (um pagamento em aberto por proposta; estoque 1 reservado na aprovação).

## Para publicar (precisa de autorização do dono)

1. **Primeiro o banco**, depois o site. O código novo lê tabelas e colunas novas; publicar o site antes quebra as páginas.
    com o  normal (produção). Só cria tabelas/colunas novas com valor padrão: CommissionPolicy, AttributionTouch, Proposal, StoreFollow, StoreCoupon, StoreCouponUse, ExternalProfile, SellerProgram; colunas novas em User, Listing e Order.
2. Depois juntar o ramo  na  e enviar (a Vercel publica).
3. Nenhuma variável de ambiente nova.

## O que fica ligado e desligado

- Ligado: loja nova, link /v/, seguir, compartilhar, propostas, cupons da loja, recompra, verificação externa, programa (só admin), registro da origem da venda, comissão configurável.
- Desligado até decisão comercial: comissão reduzida do link do vendedor (sem taxa nem janela definidas). Todas as vendas seguem com 9,79%.
- Nada publicado sobre benefícios, vagas ou prazos do programa de primeiros vendedores.

## Testes executados (banco local, pagamento simulado)

- 31 verificações de proposta e origem (scratchpad/t-stage12.ts): versão, aceite duplo, pagamento em aberto reaproveitado, alteração cancela pagamento, Pix da versão antiga não aprova, aviso de pagamento repetido, cancelada/vencida, acesso de outro comprador/vendedor, primeiro contato, janela, política fixada no pedido.
- 39 verificações (scratchpad/t-stage34.ts): URLs de perfil externo, aprovação/recusa/revogação com histórico, cupons (limite com dois compradores ao mesmo tempo, cliques simultâneos do mesmo comprador, devolução ao cancelar e ao vencer o Pix, jogo, mínimo, agendado, teto de R$ 1, loja errada, cupom da Nexo), validação da política e simulação, programa.
- Navegador no tamanho de celular: criar proposta, abrir link deslogado, aceitar logado, pagar (simulado), condições no pedido; bloqueio 404 de proposta/pedido/gestão para outras contas e do admin para não-admin; loja com filtros, seguir e link /v/ gravando a origem; telas de admin.
- Não testado: o webhook real do Asaas (só funciona com o Asaas de produção); a repetição foi testada chamando a aprovação duas vezes.

## Limitações conhecidas

- A origem não acompanha a pessoa entre aparelhos, a menos que ela esteja logada quando abre o link.
- A loja mostra o perfil externo verificado só como nome e plataforma (sem link clicável), para não abrir caminho de negociação por fora.
- Provas de entrega continuam sendo o quadro de entrega e o chat do pedido (sem anexo de imagem no chat).
