# Lojas de vendedor, propostas, origem da venda e verificação externa

Registro do projeto "trazer vendedores com clientes próprios para a Nexo".
Ramo: `feature/lojas-vendedor`. Nada aqui foi publicado nem aplicado ao banco de produção.

## Progresso

| Etapa | Situação |
|---|---|
| 0. Inspeção, banco de testes local, desenho do banco | feito |
| 1. Loja do vendedor + proposta por link | em andamento |
| 2. Origem da venda (atribuição) + comissão configurável + simulação | pendente |
| 3. Verificação de perfil externo | pendente |
| 4. Cupons da loja, recompra, seguir loja, programa de primeiros vendedores | pendente |
| 5. Testes e relatório | pendente |

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
