# Diretriz Mestra Final - Fase 4: Cobranca, Wallet e Mercado Pago

Data: 2026-06-25  
Branch: `codex/security-autonomy-audit`  
Escopo: consolidar decisao de cobranca, fallback Pix/WhatsApp, wallet/repasses e seguranca operacional. Nao houve alteracao em producao nem execucao de migration.

## Total de fases

O plano completo tem 7 fases:

1. Auditoria do Core.
2. Criacao segura de tenants.
3. Marketplace de modulos.
4. Cobranca, wallet e Mercado Pago.
5. N8N e automacoes por tenant.
6. Reducao do Lovable a legado.
7. Validacao final de independencia.

## Objetivo da Fase 4

Garantir que o Core Impulsionando trate cobranca e pagamentos como capacidade propria, sem depender do Lovable:

- Mercado Pago como gateway oficial;
- contratos e faturas no Core;
- repasse/wallet auditavel por tenant;
- fallback Pix sem telefone fixo no codigo;
- documentacao sem contradicao entre Mercado Pago e gateways legados.

## Decisao oficial

Mercado Pago e o gateway oficial do Core Impulsionando.

InfinitePay deve ser tratado apenas como legado historico. A migration `20260621022005_bf738621-6d00-4a18-9b75-2bc250cac600.sql` ja remove `infinitepay_payments` e estende `mpago_payments` para provisionamento.

## Fonte de verdade de cobranca

Contratos e recorrencia:

- `billing_contracts`;
- `billing_invoices`;
- `billing_dunning_policy`;
- funcoes de ciclo e baixa em `billing.functions.ts` e migrations de billing.

Pagamentos Mercado Pago:

- `mpago_credentials`;
- `mpago_payments`;
- `mpago_webhook_events`;
- `mpago_refunds`;
- `mpago-create-payment`;
- `mpago-webhook`;
- `mpago-refund`.

Wallet e repasses:

- `core_monetization_models`;
- `core_revshare_rates`;
- `core_payout_events`;
- `core_payout_ledger`;
- motor puro em `src/lib/payouts.ts`.

## Correcoes aplicadas

### 1. WhatsApp de fallback deixou de ser hardcoded

Criado arquivo:

- `src/lib/payment-fallback.ts`

Ele centraliza:

- normalizacao de telefone;
- montagem segura de link `wa.me`;
- leitura de `VITE_IMPULSIONANDO_SUPPORT_WHATSAPP`.

Arquivos ajustados:

- `src/components/payments/PixFallbackDialog.tsx`;
- `src/components/payments/PixCheckoutCard.tsx`;
- `src/routes/orcamento.tsx`.

Regra atual:

- se o tenant passar um telefone valido, usa o telefone do tenant;
- se nao passar, usa `VITE_IMPULSIONANDO_SUPPORT_WHATSAPP`;
- se nenhum telefone estiver configurado, o botao de WhatsApp nao e exibido.

### 2. Variavel publica documentada

Arquivo:

- `.env.example`

Nova variavel:

- `VITE_IMPULSIONANDO_SUPPORT_WHATSAPP`

Ela nao deve conter token nem segredo. E apenas o numero publico de suporte/comercial do Core para fallback Pix.

### 3. Documentacao antiga alinhada

Arquivo:

- `docs/CORE-AUDIT.md`

Correcoes:

- pagamentos oficiais apontam para `mpago_payments`;
- Mercado Pago fica documentado como gateway oficial;
- InfinitePay fica documentado como legado historico.

## Teste adicionado

Arquivo:

- `tests/billing-mercadopago-static.test.ts`

Ele bloqueia regressao para:

- Mercado Pago sem `application_fee`;
- ausencia de `core_payout_events`;
- recorrencia fora de `billing_contracts`/`billing_invoices`;
- retorno do telefone fixo `5521972554500` nos fallbacks Pix;
- remocao da variavel `VITE_IMPULSIONANDO_SUPPORT_WHATSAPP` do `.env.example`.

## O que ainda depende de configuracao externa

Para finalizar a Fase 4 em ambiente real, o GitHub/Supabase precisam ter:

- credenciais Mercado Pago ativas por tenant em `mpago_credentials`;
- secrets do Mercado Pago guardados no Supabase/Vault, nunca no frontend;
- `VITE_IMPULSIONANDO_SUPPORT_WHATSAPP` configurado no ambiente de build;
- webhook Mercado Pago apontando para `mpago-webhook`;
- jobs/gates de seguranca passando contra o Supabase oficial.

## Validacao esperada

Validacoes de codigo:

- teste estatico de Fase 4;
- `git diff --check`;
- suite completa no GitHub Actions.

Validacoes operacionais:

- criar cobranca sandbox Mercado Pago;
- receber webhook;
- confirmar linha em `mpago_payments`;
- confirmar evento em `core_payout_events`;
- consolidar ledger em `core_payout_ledger`;
- baixar fatura vinculada em `billing_invoices`.

## Proxima fase

Fase 5 - N8N e automacoes por tenant.

Objetivo:

- mapear fluxos atuais e futuros do N8N;
- definir padrao de importacao por tenant;
- impedir automacao compartilhada sem isolamento;
- preparar webhooks assinados pelo Core;
- manter N8N como motor operacional, nao como fonte de verdade.
