# Plano: Trial de 7 dias da Impulsionando Tecnologia

Implementação completa do plano **Trial — Teste Gratuito de 7 Dias** preservando tudo que já existe (rotas, módulos, autenticação, banco). Nenhuma rota será apagada e nada funcional será duplicado.

## 1. Padronização de nome

Substituição global de "Impulsionando Sistemas" por **"Impulsionando Tecnologia"** em todos os textos visíveis (rotas marketing, dashboards, templates de email/WhatsApp, demos, rodapés, formulários). Auditoria via `rg` antes de qualquer alteração.

## 2. Banco de dados (uma migration)

Tabelas novas no schema `public` (com GRANT + RLS conforme padrão do projeto):

- `trial_subscriptions` — uma linha por Trial: `lead_id`, `company_id?`, `user_id?`, contato (nome, empresa, email, whatsapp, doc), `chosen_plan` (essencial/integrado/avancado/sob_medida), `status` (enum abaixo), `started_at`, `ends_at`, `extended_days`, `extended_by`, `extension_reason`, `paddle_subscription_id?`, `paddle_transaction_id?`, `converted_at`, `suspended_at`, `regularized_at`, `cancelled_at`, `setup_charged`, `terms_accepted_at`, `terms_ip`.
- `trial_settings` — uma linha por empresa master (singleton) com os parâmetros SIM/NÃO da seção 6 e 14 (limites de usuários/clientes/produtos/eventos/mensagens, permitir publicação real, domínio próprio, integrações reais, exportação, credenciais reais, setup quando, extensão permitida).
- `trial_events` — histórico append-only: `trial_id`, `event_type`, `actor_user_id`, `payload jsonb`, `created_at`.
- `trial_abuse_index` — índice de email/whatsapp/doc/empresa já usados em Trials anteriores para bloquear repetição.

Enum `trial_status`: `solicitado, ativo, vence_3d, vence_1d, vence_hoje, encerrado, cobranca_gerada, pagamento_pendente, convertido, suspenso, regularizado, cancelado, expirado_sem_conversao`.

Funções/triggers:
- `trial_create(...)` SECURITY DEFINER — valida abuso, registra termos, cria linha, dispara evento `created` + enfileira comunicações via `enqueue_message`.
- `trial_advance_status()` — função chamada por cron diário para mover status (vence_3d/1d/hoje/encerrado) e disparar comunicações da régua.
- `trial_convert(trial_id, paddle_sub_id)` — converte para plano pago, aplica regras de contrato mínimo (já existentes nas regras de inadimplência).
- `trial_suspend(trial_id)` — marca suspenso e gatilha bloqueio de módulos via `company_modules.is_enabled = false` exceto módulo financeiro.
- `trial_regularize(trial_id)` — reativa módulos conforme plano contratado.
- `trial_extend(trial_id, days, reason)` — apenas Super Admin; registra responsável e motivo.

Cron (pg_cron) diário 09:00 BRT executa `trial_advance_status()`.

## 3. Templates de comunicação

Inserir no `message_templates` (já existente) novos `event_code`s para os 10 momentos da régua, com versão WhatsApp e Email cada — usando exatamente os textos do briefing. Variáveis: `nome_cliente, nome_plano, dias_restantes, link_acesso, link_pagamento, link_financeiro`.

## 4. Server functions (TanStack `createServerFn`)

`src/lib/trial.functions.ts`:
- `requestTrial` (público, sem auth) — recebe form do lead, valida com Zod, chama `trial_create`.
- `getMyTrial` (auth) — retorna o trial ativo do usuário/empresa.
- `getTrialSettings` / `updateTrialSettings` (Super Admin) — singleton de parâmetros.
- `listTrials` (staff) — lista paginada com filtros para dashboard.
- `extendTrial`, `convertTrial`, `suspendTrial`, `regularizeTrial`, `cancelTrial` (Super Admin).
- `simulateTrialPayment` (demo) — fluxo de pagamento fictício marcado claramente como demo.

Integração Paddle: ao gerar cobrança no fim do Trial, criar checkout do `price_id` conforme `chosen_plan` (planos a serem criados via `create_product`/`create_price`: `plan_essencial` R$697, `plan_integrado` R$997,90, `plan_avancado` R$1497,97, mensal e anual com 20% off).

## 5. Frontend

### Páginas públicas (marketing)
- `src/routes/trial.tsx` — landing do Trial com explicação completa (textos obrigatórios), CTA "Começar Trial de 7 dias".
- `src/routes/trial.cadastro.tsx` — formulário com todos os campos obrigatórios + 4 aceites (termos Trial, política de cobrança, regras de suspensão, consentimento de comunicação) com validação Zod.
- Atualizar `src/routes/planos.tsx` para mostrar os 4 planos com preços corretos + bloco "Comece com 7 dias grátis".

### Área autenticada
- `src/components/app/TrialBanner.tsx` — banner discreto no topo do AppShell mostrando "Trial ativo — faltam X dias" com botões (Ver planos, Escolher plano, Falar com consultor, Ir para financeiro). Variantes para "Termina amanhã" e "Terminou".
- Hook `useTrialStatus()` — busca trial atual via server fn.
- Gate `TrialSuspendedGate` em `AppShell` — quando trial estiver `suspenso` ou `expirado_sem_conversao` sem conversão, redireciona toda navegação para `/finance` exceto rotas `/finance/*`, `/auth`, `/trial/regularizar`.
- `src/routes/_authenticated/admin.trials.tsx` — dashboard com todos os indicadores da seção 16 (cards + tabela + filtros por status).
- `src/routes/_authenticated/admin.trials.$id.tsx` — detalhe do Trial com histórico, ações (estender, converter, suspender, reativar, cancelar) sujeitas a permissão Super Admin.
- `src/routes/_authenticated/admin.trial-settings.tsx` — toggles SIM/NÃO dos parâmetros (Super Admin).
- Banner `Ambiente Trial — dados de teste, sem impacto em dados reais` quando empresa em modo Trial com dados simulados.

### Demo
- Adicionar `src/routes/demo.trial.tsx` simulando o ciclo completo (criação → contagem → comunicações → cobrança → pagamento aprovado/recusado → suspensão → regularização → conversão), sempre com aviso de "Demonstração — dados fictícios".

## 6. Permissões

Novas permissões no `permissions` (seed via insert):
- `trial.create`, `trial.extend`, `trial.convert`, `trial.suspend`, `trial.reactivate`, `trial.view_all`, `trial.settings.manage`.

Mapeamento padrão:
- Super Admin Impulsionando: todas.
- Perfil "Comercial Impulsionando" (criar se não existir): `trial.view_all`, criar follow-up via CRM existente.
- Perfil "Financeiro": acesso a cobranças do Trial via `finance` (já existe).

## 7. Alertas comerciais

Triggers chamando `enqueue_message` para perfis master quando: trial criado, lead acessou 3+ módulos (instrumentar via `audit_logs`), trial vence em 3d/1d, trial terminou sem pagamento, convertido, suspenso. Reusa o pipeline de notificações existente (`notify_user` + `enqueue_message`).

## 8. Prevenção de abuso

Função `trial_check_abuse(email, whatsapp, doc, empresa)` — retorna `(allowed boolean, reason text)`. Chamada antes de `trial_create`. Mensagem padronizada do briefing exibida no form.

## 9. Aspectos técnicos resumidos

```text
db migration ─┬─ trial_subscriptions
              ├─ trial_settings (singleton)
              ├─ trial_events (audit)
              ├─ trial_abuse_index
              ├─ enum trial_status
              └─ funções + cron diário

server fns ── src/lib/trial.functions.ts (CRUD + ações + integração Paddle)

frontend ──┬─ marketing: /trial, /trial/cadastro, /planos atualizado
           ├─ shell: TrialBanner + TrialSuspendedGate
           ├─ admin: /admin/trials, /admin/trials/$id, /admin/trial-settings
           └─ demo: /demo/trial

paddle ──── create_product/create_price para 4 planos × mensal/anual
```

## 10. Riscos / pendências externas

- Webhooks Paddle já existem (PAYMENTS_*_WEBHOOK_SECRET configurados); precisarão tratar conversão de Trial para plano pago via `customData.trial_id`.
- WhatsApp/email seguem o pipeline `message_outbox` já implementado — credenciais externas continuam fora do escopo.
- Bloqueio operacional usa `company_modules.is_enabled`; verificarei se as RLS dos módulos respeitam esse flag (se não, adicionarei guard no AppShell).

## 11. Validação final

- Rodar `rg` para confirmar zero ocorrências de "Impulsionando Sistemas".
- Conferir que todas as rotas pré-existentes em `src/routes/` continuam intactas.
- Smoke-test do fluxo demo do Trial.
- Checklist da seção 26 marcada item a item no fechamento.

Total estimado: ~1 migration grande, ~15 arquivos novos, ~6 arquivos editados (AppShell, planos, nav-config, templates registry, start.ts não muda, README opcional).
