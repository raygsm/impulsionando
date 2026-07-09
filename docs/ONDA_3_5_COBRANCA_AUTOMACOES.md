# Onda 3.5 — Hub de Cobrança, Mercado Pago e Automações/N8N

Fase 3.5 do Core Impulsionando. Consolidação visual e auditável da
operação financeira e das automações do ecossistema em **hubs únicos**,
sem alterar regras de cobrança nem disparar automações reais.

## Escopo entregue

- **Hub Cobrança & Mercado Pago** → `/core/hub-cobranca`
  - KPIs: MRR, contratos ativos, recebido nos últimos 30 dias, faturas
    vencidas, quantidade de cortesias Full ativas.
  - Bloco **Cortesia Full**: lista clientes com `full_courtesy_status =
    'active'`, dias restantes, marcador crítico ≤ 7 dias, link direto
    para a aba **Plano e cortesia** do Cliente 360.
  - Top 10 clientes por MRR, com status do contrato, próximo vencimento,
    faturas vencidas e recebido 30d.
  - Saúde de webhooks do Mercado Pago (recebidos, processados,
    assinatura inválida, erros) e distribuição por tipo de evento.
  - Atalhos oficiais: integração MP, eventos MP, contratos, régua de
    cobrança, saúde da cobrança, cobranças em aberto, repasses, ERP
    financeiro, financeiro master, log de webhooks financeiros.

- **Hub Automações & N8N** → `/core/hub-automacoes`
  - KPIs: execuções N8N 30d, taxa de sucesso, falhas, webhooks
    recebidos, integrações com erro.
  - Bloco **Credenciais pendentes**: integrações em
    `not_configured`/inativas e integrações com `last_error` recente.
  - Top réguas N8N com taxa de falha por régua, canais em uso, KPIs de
    WhatsApp e webhooks MP.
  - Webhooks (30d): runs, sucesso, falhas, reprocessados, top workflows.
  - Runtime & fallback: eventos e distribuição por severidade.
  - Atalhos operacionais para todas as sub-áreas de automação, N8N e
    webhooks já existentes.

- **Menu Core** atualizado (`src/routes/_authenticated/core.tsx`):
  - Grupo *Cobrança & Mercado Pago* passa a apresentar o hub como
    primeiro item e inclui **Saúde da Cobrança** e **Eventos Mercado
    Pago** que estavam órfãos.
  - Grupo *Automação & N8N* passa a apresentar o hub como primeiro item;
    o antigo `/core/automacao` foi rotulado como “Automação (técnico)”.

## Regras respeitadas

- **Nenhuma alteração de billing**: nenhuma tabela, RPC, RLS ou régua de
  cobrança foi criada/alterada; ambos os hubs consomem server functions
  já existentes (`fetchBillingOverview`,
  `getIntegrationsAutomationHealth`, `listIntegrations`) e uma leitura
  read-only em `companies` para cortesias ativas.
- **Nenhum disparo real**: os hubs são somente leitura. Ações sensíveis
  (converter cortesia, ativar régua, refund, disparar WhatsApp/e-mail)
  continuam nas telas dedicadas com auditoria própria.
- **Copy visível**: usa “cliente” / “empresa”, nunca “tenant”.
- **Auditoria preservada**: quaisquer ações continuam registradas onde
  já eram registradas (`core_courtesy_events`, `core_integration_logs`,
  `webhook_runs`, `mpago_webhook_events`, `n8n_workflow_runs` etc.).

## Arquivos alterados

- criado `src/routes/_authenticated/core.hub-cobranca.tsx`
- criado `src/routes/_authenticated/core.hub-automacoes.tsx`
- editado `src/routes/_authenticated/core.tsx` (menu Core)
- criado `docs/ONDA_3_5_COBRANCA_AUTOMACOES.md` (este documento)

## Fontes de dados reutilizadas

| Camada | Origem |
| --- | --- |
| MRR / contratos / faturas | `fetchBillingOverview` (`billing_contracts`, `billing_invoices`, `companies`) |
| Cortesia Full ativa | `companies.full_courtesy_status/ends_at/days` (Onda 3.3) |
| Webhooks MP | `mpago_webhook_events` + `mp_webhook_log` via `getIntegrationsAutomationHealth` |
| N8N / réguas / canais | `n8n_workflow_runs` |
| WhatsApp | `whatsapp_message_events` |
| Integrações & credenciais | `core_integrations` + `core_integration_logs` |
| Runtime / fallback | `runtime_events` |

## Riscos

- Hubs são pesados em leitura (agrega 30 dias de eventos); a função
  `getIntegrationsAutomationHealth` já limita a 50k linhas por tabela.
  Em tenants muito ativos pode ficar lento — mitigado por
  `useQuery` sem `refetchInterval`.
- Cortesias sem `full_courtesy_ends_at` aparecem como “ativa” sem
  contador; é comportamento correto até que a Onda 3.3 seja usada em
  produção.
- Contadores de MP dependem de webhooks reais chegarem; enquanto o
  Mercado Pago não tiver credenciais válidas em produção, os cards
  ficarão zerados (esperado).

## Pendências externas (fora do escopo desta fase)

- Ativar Mercado Pago em produção depende de credenciais reais e
  homologação em `/core/integracoes/mercadopago`.
- N8N precisa de instância + token válidos em `/core/integracoes/n8n`.
- WhatsApp / e-mail transacional dependem das credenciais em
  `core_whatsapp_credentials` e do domínio de e-mail configurado.

## Testes recomendados

1. `/core/hub-cobranca` carrega sem erros para staff Impulsionando e
   nega acesso para não-staff (garantido pelo layout `/core`).
2. Cliente com cortesia Full aparece no bloco “Clientes em Cortesia
   Full” e o link “gerenciar” abre `/admin/clientes/$slug/plano`.
3. `/core/hub-automacoes` mostra integrações com credencial pendente e
   quantifica execuções N8N nos últimos 30 dias.
4. Nenhum botão do hub dispara ação de cobrança, refund ou envio de
   mensagem — apenas navega para as telas já existentes.

## Ganchos para as próximas fases

- **Fase 3.6 (Dashboards & Analytics)**: reaproveitar os agregados
  destes hubs como widgets no Dashboard Master e no BI do Ecossistema.
- **Cortesia → cobrança**: quando a Onda 3.5 evoluir para conversão em
  larga escala, o bloco de cortesia deste hub receberá botão de ação
  em lote (hoje o fluxo é individual pelo Cliente 360).
- **Alertas proativos**: cortesias ≤ 7 dias, integrações com erro e
  taxa de falha N8N > X% devem virar notificações no `core_incidents`.
