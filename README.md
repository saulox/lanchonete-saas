# Lanchonete SaaS V5

Base SaaS/web app de lanchonete em **Next.js + Supabase** com foco em operação real e subida rápida ao Git.

## Entregas desta versão

- painel desktop para operação
- layout mobile para cliente e equipe
- cadastro/login por e-mail
- fila de pedidos em tempo real
- módulo de promoções
- perfis de acesso
- carrinho funcional no mobile
- criação de pedido pela tela mobile
- troca de status com botões
- controle de tenant por loja
- impressão de pedido/cozinha
- cupom aplicado no carrinho
- preparo para pagamento via PIX
- subtotal, desconto e total persistidos no banco
- impressão térmica mais próxima do uso real
- **status de pagamento separado do status do pedido**
- **referência de pagamento por pedido**
- **endpoint de webhook para confirmação automática**
- **painel financeiro por loja**

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth (Email + senha / OTP)
- Supabase Postgres
- Supabase Realtime

## Estrutura principal

```txt
app/
  (auth)/login
  (auth)/verify
  (dashboard)/dashboard
  (dashboard)/dashboard/finance
  (shop)/m
  api/orders
  api/orders/[id]/status
  api/orders/[id]/payment
  api/payments/webhook
components/
  mobile-shop.tsx
  order-board.tsx
  print-button.tsx
lib/
  payments.ts
  store.ts
supabase/schema.sql
```

## Fluxos prontos

### Mobile

- cliente navega no cardápio
- adiciona itens ao carrinho
- aplica cupom promocional
- escolhe forma de pagamento
- informa nome + telefone
- marca consentimento para promoções
- envia pedido pela API
- recebe PIX copia e cola quando o pagamento for PIX
- acompanha pedidos em tempo real
- visualiza se o pagamento está pendente, aguardando confirmação ou pago

### Operação desktop

- fila de pedidos por loja ativa
- cards mostram total, desconto, cupom, método e status de pagamento
- botões para avançar status: novo → em preparo → pronto → finalizado
- botão para confirmar pagamento manualmente
- botão para marcar falha de pagamento
- link de impressão da cozinha por pedido
- impressão com layout estreito para impressora térmica

### Financeiro

- painel `/dashboard/finance`
- visão de volume bruto, recebido e a receber
- lista de últimos pedidos com método e status de pagamento
- leitura por tenant/loja ativa

### Tenant por loja

- tabela `stores`
- tabela `store_memberships`
- `products`, `promotions`, `marketing_leads` e `orders` ligados à loja
- seleção da loja ativa por `NEXT_PUBLIC_DEFAULT_STORE_SLUG`

## Como rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kutphlzojpyidtttscuw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__a2quqgxdSeTKLXvtu31qQ_qn86rLFa
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEFAULT_STORE_SLUG=matriz
NEXT_PUBLIC_PIX_KEY=
NEXT_PUBLIC_PIX_HOLDER=Lanchonete SaaS
NEXT_PUBLIC_PIX_CITY=SAO LUIS
NEXT_PUBLIC_PIX_QR_CODE_URL=
PAYMENT_PROVIDER_NAME=pix_manual
PAYMENT_WEBHOOK_SECRET=
```

4. No Supabase:
- mantenha o provider de **Email** ativo no Supabase
- ajuste o template de e-mail se desejar
- rode o SQL de `supabase/schema.sql`

5. Inicie o projeto:

```bash
npm run dev
```

## Webhook de pagamento

Endpoint:

```txt
POST /api/payments/webhook
```

Header obrigatório:

```txt
x-webhook-secret: SEU_SEGREDO
```

Payload de exemplo:

```json
{
  "order_id": "UUID_DO_PEDIDO",
  "reference": "PED-ABC12345",
  "provider": "pix_gateway",
  "status": "paid"
}
```

Isso atualiza `payment_status`, `payment_reference`, `payment_provider` e `paid_at`.

## Rotas importantes

- `/dashboard`
- `/dashboard/operations`
- `/dashboard/operations/print/[id]`
- `/dashboard/finance`
- `/dashboard/promotions`
- `/dashboard/users`
- `/m`
- `/login`
- `/verify`
- `/auth/callback`

## Observações técnicas

- o carrinho usa `localStorage` por loja
- a atualização da fila usa Realtime sobre mudanças em `orders`
- o backend valida cupom ativo por loja
- o pedido salva `subtotal_amount`, `discount_amount`, `total_amount`, `coupon_code`, `payment_method` e `payment_status`
- o PIX desta versão ainda é um **preparo operacional**, mas a base já prevê confirmação automática por webhook
- para produção, o passo seguinte é conectar um provedor real e enviar os callbacks para `/api/payments/webhook`

## Subindo ao Git

```bash
git init
git add .
git commit -m "feat: lanchonete saas v4 com financeiro e webhook de pagamento"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

## Próximas evoluções recomendadas

- PIX dinâmico com provedor real
- dashboard financeiro com filtros por período
- painel de entregas
- estoque por insumo
- impressão automática via impressora térmica
- troca de tenant por subdomínio ou slug na URL
