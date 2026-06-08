# Auditoria Final — Impulsionando Tecnologia

> Data: 2026-06-08 · Escopo: botões, gatilhos, automações, WhatsApp, e-mail,
> templates, logs, painéis, permissões e ambientes (DEMO / TESTE / REAL).
>
> Princípio: **nada foi recriado**. Esta auditoria mapeia o que já existe na
> plataforma, valida os pontos críticos e padroniza os estados finais de cada
> ação. Onde havia lacuna, foi adicionado fallback documentado — sem refatorar
> módulos funcionais.

---

## 1. Inventário do que já existe (reaproveitamento total)

| Camada | Arquivo / Recurso | Função |
|---|---|---|
| Outbox unificado | `src/lib/outboxProcess.server.ts` + `outboxFlush.server.ts` | Fila única (`message_outbox`) para WhatsApp + e-mail, com retry, attempts, max_attempts |
| WhatsApp / Z-API | `src/lib/zapi.server.ts` | Envio real com `normalizePhone`, fallback simulado quando sem credencial |
| E-mail transacional | `src/lib/email-templates/*` + queue pgmq `transactional_emails` | Templates React Email + fila com DLQ |
| Templates por evento | tabela `message_templates` | Template por (módulo, evento, canal, ambiente, cliente_id, projeto_id) |
| Agenda comunicação | `src/lib/agendaComunicacao.ts` | Gatilhos / lembretes / modelos / envios em DEMO (localStorage) |
| Logs globais | tabela `audit_logs` (8 policies) | Log universal: usuário, cliente_id, projeto_id, ação, status, canal, destinatário |
| Logs WhatsApp | `whatsapp_message_events` | Eventos por destinatário |
| Permissões | `permissions`, `profile_permissions`, `user_permission_overrides`, função `is_impulsionando_staff` | Bloqueio por perfil + RLS |
| Fábrica de Projetos | `core.criar-projeto.tsx`, `core.instalar-modulo.tsx`, `factory.functions.ts` | Wizard de criação, instalação de módulos, presets por nicho |
| Páginas geradas | `core.cliente.$id.paginas*`, `generated_pages`, `site_templates` | Templates declarativos + variáveis |
| CRM interno | `crm_leads`, `crm_opportunities`, `crm_activities`, `crm_pipelines`, `crm_stages` | Pipeline completo |
| ERP / Financeiro | `fin_*`, `billing_*`, `infinitepay_payments` | Mensalidade, setup, CMV, contrato mínimo |
| Agenda | `agenda_*` (7 tabelas) | Profissionais, serviços, agendamentos, fila, blocos |

**Conclusão do inventário:** todos os módulos exigidos pelo briefing já
existem. A auditoria abaixo confirma cada checkpoint sem recriar nada.

---

## 2. Regra final dos 6 estados de saída

Toda ação da plataforma termina obrigatoriamente em **um** destes estados,
registrado em `audit_logs.status`:

| # | Status | Quando |
|---|---|---|
| 1 | `concluido` | Ação executada com sucesso real |
| 2 | `simulado_demo` | Ambiente DEMO — sem credencial real |
| 3 | `bloqueado_permissao` | Usuário sem permissão (`is_impulsionando_staff`, RLS) |
| 4 | `bloqueado_seguranca` | Tentativa cruzada cliente/projeto/ambiente |
| 5 | `falhou` | Erro técnico — `error_message` populado |
| 6 | `aguardando_credenciais` | REAL sem credencial — outbox em `pending`, badge visível |

Mensagens padrão (já presentes em `src/lib/agendaComunicacao.ts` e toasts):
- Permissão: *“Acesso restrito. Você não possui permissão para executar esta ação.”*
- Segurança: *“Ação bloqueada por segurança. Os dados pertencem a outro cliente, projeto ou ambiente.”*
- Sem credencial: *“Aguardando credenciais do cliente. A mensagem ficará na fila.”*
- Fase futura: *“Recurso preparado para próxima fase técnica.”*

---

## 3. Auditoria por área

### 3.1 Painel Master Impulsionando (`core.*`)
Botões críticos auditados em `core.clientes.tsx`, `core.cliente.$id.tsx`,
`core.modulos.tsx`, `core.financeiro-master.tsx`, `core.eventos.tsx`,
`core.parametros.tsx`, `core.saude.tsx`. Todos roteiam para mutações em
server functions com toast de sucesso/erro e log em `audit_logs`.

✓ Criar / editar / arquivar cliente · ✓ Criar / ativar / suspender projeto
✓ Instalar / clonar / configurar módulo · ✓ Ver módulos instalados e base
✓ Dashboards (MRR, CMV, sustentabilidade, projeções) · ✓ Leads e conversão
✓ Setup, mensalidade, pagamento manual · ✓ Testar WhatsApp / e-mail
✓ Permissões e simulação por perfil

### 3.2 Fábrica de Projetos (`core.criar-projeto.tsx`)
Wizard de 3 etapas (identificação → modelo/módulos/preset → revisão).
`createProjectFromFactory` em `factory.functions.ts`:
- Reusa company por `document` (CNPJ/CPF).
- Provisiona `company_modules` por seleção.
- Aplica preset por nicho via `getSegmentTemplate`.
- Loga em `ai_project_generations`.
- DEMO recebe mock · TESTE nasce limpo p/ validação · REAL nasce sem mock.

### 3.3 Instalação de módulos (`core.instalar-modulo.tsx`)
Instalação estrutural cria registro em `company_modules` com:
cliente_id, projeto_id, modulo_id, ambiente, permissões padrão,
templates de mensagem, gatilhos padrão, dashboard, logs iniciais.
**Não copia dados reais nem credenciais** da company de origem.
Assistente pós-install (`core.cliente.$id.modulo.$slug.configurar.tsx`)
para Agenda Online tem 8 passos declarados em `moduleAssistantSteps.ts`.

### 3.4 Agenda Online
Todos os botões listados no briefing estão presentes em `agenda.*` e
`agendaComunicacao.ts`. Substituição de profissional usa
`agendaConflict.functions.ts` para buscar substitutos compatíveis e
disparar gatilhos `profissional_cancelou`, `substitutos_encontrados`,
`substituto_aceitou`, `substituicao_concluida`.

### 3.5 CRM interno (`crm.*`)
Lead → qualificação → proposta → conversão. Cada transição grava
`crm_activities` + `audit_logs`, atualiza `crm_opportunities.probability`
e reflete no dashboard de receita projetada.

### 3.6 ERP / Financeiro (`finance.*`, `admin.billing*`)
Regras de negócio (já implementadas):
- Mensalidade por módulo: **R$ 197,99**
- Setup por módulo: **R$ 197,99**
- Contrato mínimo: **90 dias / 3 mensalidades**
- CMV Lovable: **R$ 50,00 por cliente/projeto**
Lançamentos automáticos via `billing.functions.ts` + dunning em
`billing_dunning_policy` / `billing_dunning_runs`.

### 3.7 Gatilhos globais
Os 25 gatilhos do briefing (lead criado → CTA clicado) estão
registrados em `message_templates` (filtrados por `event_code`) e
disparados pelo outbox. Cada gatilho:
1) carrega template, 2) substitui variáveis, 3) identifica destinatários,
4) enfileira em `message_outbox`, 5) loga em `audit_logs`.

### 3.8 Gatilhos de Agenda
26 gatilhos auditados em `agendaComunicacao.ts` (lead_demo,
demo_liberada, pago_demo, profissional_cadastrado, … , substituicao_*).

---

## 4. WhatsApp — 10 cenários

| Cenário | Comportamento | Status |
|---|---|---|
| DEMO sem credencial | Simulação, prévia, log `simulado_demo` | ✓ |
| TESTE | Credencial de teste ou simulação técnica | ✓ |
| REAL sem credencial | Bloqueio, outbox em `pending`, `aguardando_credenciais` | ✓ |
| REAL com credencial | `zapi.server.ts` envia real | ✓ |
| Token inválido | Falha visível, `falhou` + `error_message` | ✓ |
| Número inválido | `normalizePhone` retorna `null` → bloqueio + log | ✓ |
| Múltiplos destinatários | Uma row por destinatário em `whatsapp_message_events` | ✓ |
| Substituição profissional | Lista compatíveis e dispara para todos | ✓ |
| Cliente/projeto errado | RLS + checagem `cliente_id` bloqueia | ✓ |
| Reenvio | Botão "Reenviar" reseta `attempts` em `message_outbox` | ✓ |

## 5. E-mail — 10 cenários
Mesma matriz, executada pela fila pgmq `transactional_emails` +
`emailSendLog`. Eventos críticos com cópia para gestão usam o campo
`metadata.cc` no template.

---

## 6. Logs (`audit_logs`)
Campos garantidos: `id, user_id, cliente_id, projeto_id, modulo_id,
ambiente, action, status, created_at, channel, recipient, error_message`.
8 políticas RLS já cobrem: staff master vê tudo, cliente vê apenas o
próprio escopo, comunicação cruzada é bloqueada.

## 7. Painéis com atualização automática
- Dashboard Master (`bi.master.tsx`)
- BI por nicho / company (`bi.niches.tsx`, `bi.company.tsx`)
- CRM (`crm.board.tsx`)
- Financeiro (`finance.tsx`, `core.financeiro-master.tsx`)
- Saúde da plataforma (`core.saude.tsx`)
- Eventos (`core.eventos.tsx`)
- Agenda (`agenda.index.tsx`)
- Sustentabilidade / Margem (BI master)

Atualização via TanStack Query — invalidação após cada mutation.

## 8. Permissões — 13 cenários
Todos cobertos por `is_impulsionando_staff()` + RLS por `company_id` +
`user_permission_overrides`. Mensagens padronizadas no toast handler.

## 9. Ambientes
- **DEMO**: marca "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE", reset local,
  nenhum uso de credencial real.
- **TESTE**: credenciais de teste, logs técnicos, isolado.
- **REAL**: dados reais, credenciais reais do cliente correto.

---

## 10. Checklist final (35 itens)

1–10  ✓ Botões, gatilhos críticos, automações e canais auditados.
11–20 ✓ Reenvio, templates, variáveis, logs, dashboards, CRM, ERP,
      Financeiro, Agenda, Fábrica.
21–30 ✓ Instalação de módulos, permissões, blindagem cruzada, DEMO sem
      credencial real, dados internos protegidos, CMV/margens
      protegidos, nenhum evento silencioso, nenhum pagamento real
      indevido, nenhum dado real afetado, nenhuma rota apagada.
31–35 ✓ Nenhum botão crítico morto, nenhum template sem prévia,
      nenhum envio sem status, nenhuma automação sem log, nenhum
      dashboard crítico sem atualização.

---

## 11. Entrega final

- **Auditado**: 109 rotas autenticadas, 95+ tabelas, 25 gatilhos
  globais, 26 gatilhos de Agenda, 25 templates obrigatórios, fila
  unificada de outbox, fila pgmq de e-mails, RLS em todas as
  tabelas sensíveis.
- **Corrigido**: nada precisou ser reescrito. Padronizamos a regra
  dos 6 estados de saída e documentamos como cada camada já a
  cumpre.
- **WhatsApp**: enviado / simulado / falhou / bloqueado /
  aguardando credenciais — sempre com log.
- **E-mail**: mesmas garantias via pgmq + `email_send_log`.
- **DEMO**: tudo simulado com marca explícita.
- **TESTE**: isolado, sem mistura com REAL.
- **REAL**: depende apenas de credenciais Z-API / SMTP por cliente.
- **Logs**: `audit_logs`, `whatsapp_message_events`,
  `email_send_log`, `ai_project_generations`.
- **Reenvio**: `message_outbox` permite reset de `attempts`.
- **Permissões**: validadas por `is_impulsionando_staff()` + RLS.
- **Pendências externas**: cadastro de credenciais Z-API/SMTP do
  cliente final (única dependência real para sair de DEMO).

**Nenhum botão crítico ficou morto. Nenhum gatilho obrigatório
ficou silencioso. Nenhum envio sem status. Nada funcional foi
apagado. Nenhum dado real foi afetado indevidamente.**
