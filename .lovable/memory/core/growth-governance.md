---
name: Core Growth Governance — funil Impulsionando para todos os tenants
description: Réguas, automações N8N, agentes IA e módulos devem captar, converter e relacionar pela ótica Impulsionando — todo tenant (imob, eventos, bar, clínica, advocacia, etc.) alimenta o funil corporativo
type: feature
---

Todo recurso do core (módulo, workflow N8N, agente Python, régua, template,
dashboard) deve operar pela ótica do **funil Impulsionando**: captar,
converter, relacionar, reter, expandir. Nenhum cliente é "sistema isolado" —
imobiliárias, eventos, bar/restaurante, clínicas, advocacia, contabilidade,
cervejaria, educação e verticais futuras são **leads/contas** do funil
Impulsionando.

Regras práticas:

1. Tenant novo gera lead em `marketing_leads` / `crm_opportunities`
   (source = `tenant_signup`).
2. Réguas (`billing_dunning_policy`, `core_reschedule_rules`,
   `clube_journey_steps`) têm variante obrigatória por `niche_code`; fallback
   genérico só sem nicho mapeado.
3. Workflows N8N registram em `n8n_workflow_runs` E publicam evento no funil
   correspondente (`crm_activities` / `aff_crm_events` / `clube_journey_log`).
4. Agentes IA carregam contexto `{tenant_id, niche, funnel_stage, plan_tier,
   mrr, lifecycle_days, last_touch, growth_goal}` — prompts cruos sem esse
   contexto são rejeitados.
5. KPI macro do core é GMV + MRR Impulsionando (holding), drill-down por
   tenant. Dashboards em `core_dashboard_widgets` / `bi_master`.
6. Vitrine pública, Marketplace B2B, Ecossistema e Clube referrals são
   canais de aquisição para a Impulsionando — todo engajamento alimenta
   `marketing_leads`.

Checklist de aceitação (qualquer feature nova): capta? converte? relaciona?
reporta? varia por nicho? documentada em `docs/CORE_GROWTH_GOVERNANCE.md`?
Se algum item faltar, não entra em produção.

Mapa N8N → estágio do funil, contrato dos agentes Python, fluxo de captação
cruzada e tabela de "onde editar cada coisa" estão em
`docs/CORE_GROWTH_GOVERNANCE.md`.
