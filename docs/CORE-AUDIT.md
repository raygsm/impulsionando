# CORE Impulsionando — Auditoria (Fase 0)

> **Conclusão executiva:** O CORE já está construído. ~120 tabelas, ~22 rotas `/core/*`, perfis, RLS, cobrança recorrente, fila multicanal, trials/demos e Agentes IA já existem. A próxima rodada deve ser **validação + polimento + preenchimento de gaps pontuais**, não reconstrução.

---

## 1. Mapa tabelas pedidas × tabelas existentes

| Prompt pediu       | Já existe como                                  | Status |
|--------------------|-------------------------------------------------|--------|
| empresas           | `companies` (34 colunas, 4 policies)            | ✅ |
| usuarios           | `user_profiles` + `auth.users`                  | ✅ |
| perfis             | `profiles`                                      | ✅ |
| permissoes         | `permissions` + `profile_permissions` + `user_permission_overrides` | ✅ |
| nichos             | `niches`                                        | ✅ |
| modulos            | `modules` (45 colunas) + `module_versions`      | ✅ |
| planos             | `billing_plans` (28 colunas)                    | ✅ |
| plano_modulos      | Relação dentro de `billing_plans` / `modules`   | ✅ |
| empresa_modulos    | `company_modules`                               | ✅ |
| assinaturas        | `subscriptions` + `billing_contracts`           | ✅ |
| faturas            | `billing_invoices`                              | ✅ |
| pagamentos         | `infinitepay_payments` + `fin_payments`         | ✅ |
| setups             | Coberto por `billing_contracts.setup_amount`    | ✅ |
| templates_email    | `message_templates`                             | ✅ |
| automacoes         | `billing_dunning_policy` + triggers + pgmq      | ✅ |
| logs               | `audit_logs` (8 policies)                       | ✅ |
| dashboards         | Tabelas BI agregam — sem tabela própria, ok     | ✅ |
| configuracoes_empresa | `company_settings`                           | ✅ |
| configuracoes_core | `setting_definitions`                           | ✅ |
| clientes_pf        | `customers`                                     | ✅ |
| leads              | `crm_leads` + `marketing_leads`                 | ✅ |
| crm_etapas         | `crm_stages` + `crm_pipelines`                  | ✅ |
| crm_atividades     | `crm_activities`                                | ✅ |
| agendas/agendamentos | `agenda_*` (7 tabelas)                        | ✅ |
| profissionais      | `agenda_professionals`                          | ✅ |
| servicos           | `agenda_services`                               | ✅ |
| produtos           | `inv_products`                                  | ✅ |
| pedidos            | `sales_orders` + `sales_order_items`            | ✅ |
| eventos/ingressos  | —                                               | ❌ Gap |
| afiliados          | `aff_*` (17 tabelas)                            | ✅ |
| indicacoes         | `aff_links` / `aff_sales`                       | ✅ |
| vaquinhas          | —                                               | ❌ Gap |
| fidelidade         | —                                               | ❌ Gap |
| sorteios           | —                                               | ❌ Gap |
| consumo            | `sales_*` + `customers`                         | Parcial |
| dados_consolidados | Views BI (a confirmar)                          | Parcial |

**Gaps reais:** Eventos/ingressos, vaquinhas, fidelidade, sorteios, marketplace. **Tudo o mais já existe.**

---

## 2. Rotas CORE já em produção

```
core.tsx                           layout
core.index.tsx                     hub
core.clientes.tsx                  CRUD empresas
core.cliente.$id.tsx               detalhe empresa
core.cliente.$id.paginas.tsx       páginas geradas por cliente
core.cliente.$id.paginas.$pageId.tsx
core.cliente.$id.modulo.$slug.configurar.tsx
core.modulos.tsx                   catálogo de módulos
core.modulos.$slug.tsx             detalhe módulo
core.planos.tsx                    CRUD planos
core.parametros.tsx                config global (salário mínimo, etc.)
core.templates.tsx                 templates de e-mail/WhatsApp
core.prompts.tsx                   prompts IA
core.financeiro-master.tsx         dashboard financeiro consolidado
core.implantacoes.tsx              lista de implantações
core.nova-implantacao.tsx          wizard novo cliente
core.criar-projeto.tsx
core.instalar-modulo.tsx
core.finalizacao-comercial.tsx
core.eventos.tsx
core.saude.tsx                     status do sistema
core.testes.tsx
```

Outros painéis admin reaproveitáveis:
- `/admin/billing-contracts` — contratos recorrentes
- `/admin/billing-policy` — régua de cobrança
- `/admin/trials` — trials/demos
- `/admin/modulos/clonagem` — clonagem de módulos
- `/admin/uptime` — monitoramento
- `/bi/master`, `/bi/niches`, `/bi/company` — dashboards BI 3 camadas (✅ já em 3 camadas como o prompt pede)
- `/adm/agentes` — Central de Agentes IA

---

## 3. Funções de banco já implementadas (não recriar)

- `is_super_admin`, `is_impulsionando_staff`, `user_has_permission`, `has_role`
- `handle_new_user`, `tg_block_master_profile_escalation`
- `billing_run_cycle` (D-7/D-1/D0 + suspensão + reativação)
- `billing_mark_paid`, `billing_check_company_status`
- `subscription_suspend_overdue`
- `trial_create`, `trial_convert`, `trial_cancel`, `trial_regularize`, `trial_advance_status`, `trial_check_abuse`
- `enqueue_message`, `company_identity_payload`, `render_template`
- `customer_anonymize`, `tg_audit`, `tg_notify_*` (welcome, lead, appointment, sale)
- Bootstrap automático de fin/inventory por empresa

---

## 4. Régua de cobrança (validação)

`billing_run_cycle()` já entrega o que o prompt pede:
- Gera fatura quando vencimento ≤ +7 dias
- Dispara mensagens D-7, D-1, D0 conforme `billing_dunning_policy.steps`
- Marca `overdue` após vencimento
- Suspende contrato + desliga `company_modules` após `suspend_offset_days`
- `billing_mark_paid` reativa módulos e move `next_due_date` +1 mês

Vencimento padrão dia 5 → configuração de `billing_contracts.next_due_date`; CORE pode editar em `/admin/billing-contracts`. ✅

---

## 5. Gaps reais para próximas fases

Prioridade alta:
1. **Eventos & ingressos** (bares/restaurantes/cervejarias) — tabela + tela + check-in.
2. **Fidelidade** (pontos/cashback) — bares e clínicas.
3. **Vaquinha online** — página pública + pagamento + meta.
4. **Sorteios** — campanha + cupons + auditoria.
5. **Marketplace B2B/B2C** — vitrine pública de empresas/produtos.

Prioridade média (polimento):
- Confirmar cron `pg_cron` chamando `billing_run_cycle()` diariamente.
- Revisar templates `billing_*` com identidade visual Impulsionando.
- View `core_dashboard_stats` para KPIs unificados (MRR, churn, adesão por módulo).
- Flag `is_demo` em `companies` + função `core_provision_demo` para 1-click demo.

Prioridade baixa:
- Mercado Pago (prompt mencionou, mas o gateway ativo é InfinitePay — confirmar antes de tocar).

---

## 6. Recomendação

**Não há justificativa para CORE "novo".** Próxima rodada deveria:
1. Você (cliente) validar as 22 rotas `/core/*` no preview e listar o que **não funciona** ou está confuso.
2. Eu corrijo os bugs apontados.
3. Em paralelo, iniciar Fase 5 (gerador de demo por nicho) e os 5 gaps reais, **um módulo por rodada**, na ordem que você priorizar.

Construir tudo de uma vez quebra o que já funciona e gasta crédito à toa.
