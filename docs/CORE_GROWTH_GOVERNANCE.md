# Governança de Crescimento — Core Impulsionando

> **Regra inegociável.** Todo cliente do ecossistema (imobiliária, serviços de
> eventos, bar/restaurante, clínica médica, escritório de advocacia,
> contabilidade, cervejaria, educação, e qualquer vertical futura) é tratado
> como **lead/conta do funil Impulsionando**. Réguas, automações, agentes IA,
> dashboards e relatórios existem para **captar, converter e relacionar** —
> sempre com objetivo de **ampliar o portfolio Impulsionando**.

Não existe "sistema isolado de cliente". Cada tenant é uma marca dentro do
core, e todo módulo deve alimentar (ou consumir) o funil corporativo.

---

## 1. Modelo conceitual

```
                ┌─────────────────────────────────────────────┐
                │  CORE IMPULSIONANDO — Funil Corporativo     │
                └─────────────────────────────────────────────┘
                                  │
   ┌──────────────┬──────────────┼──────────────┬──────────────┐
   ▼              ▼              ▼              ▼              ▼
 Captar       Converter      Relacionar      Reter         Expandir
 (Top)        (Middle)       (Bottom)        (Pós)         (Upsell/MRR)
   │              │              │              │              │
   ▼              ▼              ▼              ▼              ▼
 marketing_  trial_         consumer_      billing_       core_
 leads       subscriptions  memberships    suspensions    monetization_
 demo_leads  contract_      clube_         billing_       models
 brewery_    signatures     journey_log    dunning_       core_payout_
 lead_prefs  onboarding_    notifications  policy         ledger
 educ_leads  checklist      support_       fin_
                            tickets        commissions
```

Cada tabela acima é alimentada por **um ou mais workflows N8N** e/ou
**agentes Python** documentados nas seções 3 e 4.

---

## 2. Princípios obrigatórios

1. **Tenant é lead.** Toda criação de tenant (`companies`, `core_clientes`,
   `trial_subscriptions`) gera evento em `marketing_leads` /
   `crm_opportunities` com `source = "tenant_signup"` e nicho-alvo
   classificado.

2. **Nicho dirige a régua.** Réguas (`billing_dunning_policy`,
   `core_reschedule_rules`, `clube_journey_steps`) **devem** ter variante por
   nicho. Fallback genérico só quando o nicho não estiver mapeado.

3. **Toda automação reporta ao funil.** N8N workflows registram em
   `n8n_workflow_runs` E publicam evento no funil correspondente
   (`crm_activities`, `aff_crm_events`, `clube_journey_log`).

4. **Agente IA é agente comercial.** Qualquer prompt em `ai_prompt_library`
   ou execução em `agent_outputs` deve carregar **contexto do funil** (estágio
   do lead, nicho, plano, tier, score) — não apenas o prompt cru.

5. **KPI único: GMV + MRR Impulsionando.** Dashboards macro
   (`core_dashboard_widgets`, `bi_master`, `core_bi_ecossistema`) sempre
   consolidam Impulsionando como holding — visões por tenant são drill-downs.

6. **Captação cruzada.** Marketplace B2B, Ecossistema público e Vitrine
   pública (`companies_vitrine_public`, `eco_marketplace_listings`) **são
   canais de aquisição** para a própria Impulsionando — não apenas
   ferramentas do tenant. Cada engajamento alimenta `marketing_leads`.

---

## 3. Mapa N8N → Funil Impulsionando

Workflows em `docs/n8n/`:

| # | Workflow | Estágio | Nichos alvo | Saída no core |
|---|----------|---------|-------------|---------------|
| 01 | Captação + Lead Nurturing | Top | **todos** | `marketing_leads`, `crm_activities` |
| 02 | Conversão Trial → Onboarding | Middle | **todos** | `trial_subscriptions`, `onboarding_checklist` |
| 03 | Recuperação de Checkout | Middle | **todos** | `billing_pix_charges`, `mp_orders` |
| 04 | Onboarding Pago | Bottom | **todos** | `consumer_memberships`, `clube_journey_log` |
| 05 | Cobrança / Inadimplência | Reter | **todos** | `billing_dunning_runs`, `billing_suspensions` |
| 06 | Winback Cancelados | Reter | **todos** | `crm_opportunities`, `marketing_leads` |
| 07 | NPS / Feedback | Expandir | **todos** | `demo_survey_responses`, `support_tickets` |

**Regra:** ao criar um workflow novo, ele só entra em produção depois de
mapeado aqui com (a) estágio do funil, (b) nichos cobertos, (c) tabela de
saída no core.

### Variantes por nicho (obrigatórias)

Cada workflow acima tem um `switch` por `companies.niche_id`:

- **Imobiliária** → templates focados em captação de proprietário/locatário,
  réguas mais longas (ciclo médio 45–90 dias).
- **Eventos** → réguas curtas, gatilhos por data do evento, cross-sell de
  ticketing + clube.
- **Bar/Restaurante** → réguas diárias, foco em recorrência, Clube como
  retenção primária.
- **Clínicas Médicas** → réguas semanais, compliance LGPD reforçado, agenda
  como hook de upsell.
- **Advocacia** → réguas mensais, conteúdo educativo, contratos como gatilho
  de relacionamento.
- **Contabilidade** → ciclo fiscal (`contab_fiscal_calendar`) dispara régua.
- **Cervejaria** → marketplace B2B + relacionamento PDV como funil próprio.
- **Educação** → matrícula como gatilho, branding WL no funil.
- **Default** → régua genérica Impulsionando.

---

## 4. Agentes IA (Python) — Contrato

Todo agente registrado em `agent_demands` / `agent_outputs` segue:

```python
# Cabeçalho obrigatório de contexto Impulsionando
context = {
    "tenant_id": ...,           # company_id do tenant atendido
    "niche": ...,               # niche_code para escolha de prompt
    "funnel_stage": ...,        # "top" | "middle" | "bottom" | "retain" | "expand"
    "plan_tier": ...,           # essencial | profissional | completo
    "mrr": ...,                 # MRR atual do tenant
    "lifecycle_days": ...,      # dias desde criação
    "last_touch": ...,          # última atividade do funil
    "growth_goal": ...,         # KPI prioritário (conversão | retenção | upsell)
}
```

Agentes existentes hoje (e que devem honrar o contrato):

| Agente | Função | Estágio |
|--------|--------|---------|
| `agent.lead_qualifier` | Classifica lead/nicho/score | Top |
| `agent.trial_coach` | Orienta tenant em trial | Middle |
| `agent.dunning_advisor` | Sugere abordagem por inadimplente | Reter |
| `agent.upsell_radar` | Detecta sinais de upgrade | Expandir |
| `agent.winback_writer` | Compõe mensagem winback | Reter |
| `agent.niche_copy` | Gera copy específica por nicho | Top/Middle |

Prompts em `ai_prompt_library` **devem** ter `variant_by_niche = true` para
qualquer agente que toque funil/comunicação com tenant.

---

## 5. Marketing & Captação cruzada

| Canal | Origem | Destino no funil |
|-------|--------|------------------|
| Site público (`marketing_leads`) | Form Impulsionando | `crm_opportunities` |
| Vitrine pública de tenants | Visitante engajado | `marketing_leads` (lead Impulsionando — "vi um cliente Impulsionando funcionando") |
| Marketplace B2B | Fornecedor/comprador novo | `marketing_leads` (oportunidade de virar tenant) |
| Ecossistema | Parceiro listado | `crm_opportunities` (coprodução / WL) |
| Feira de Leads (`core_feira_leads`) | Evento offline | `marketing_leads` |
| Demos (`demo_sessions`) | Trial guiado | `trial_subscriptions` |
| Afiliados/Coprodutores | Indicação | `aff_sales` + `marketing_leads` |
| Indicações de cliente (`clube_referrals`) | Tenant indica tenant | `marketing_leads` (com tag `via_tenant`) |

---

## 6. Réguas, funis e relacionamento — onde editar

| Quero ajustar… | Edite em |
|----------------|----------|
| Régua de cobrança por nicho | `/admin/billing-policy` (`billing_dunning_policy`) |
| Funil CRM por nicho | `/crm/pipelines` (`crm_pipelines` + `crm_stages`) |
| Mensagens / templates | `/core/templates` (`core_templates`, `message_templates`) |
| Prompts IA | `/core/prompts` (`ai_prompt_library`) |
| Workflows N8N | `/core/integracoes/n8n` (+ JSON em `docs/n8n/`) |
| Métricas / KPIs do funil | `/core/metricas-reguas` |
| Variantes por nicho | `/niches` + `/core/modulos` |

---

## 7. Checklist de aceitação para qualquer novo recurso

Antes de marcar concluído, valide:

- [ ] **Capta?** Gera ou atualiza linha em `marketing_leads` /
      `crm_opportunities` quando aplicável.
- [ ] **Converte?** Avança estágio em `crm_stages` ou
      `trial_subscriptions.status` quando aplicável.
- [ ] **Relaciona?** Cria evento em `crm_activities`, `clube_journey_log` ou
      `notifications` quando aplicável.
- [ ] **Reporta?** Aparece em algum widget de
      `core_dashboard_widgets` / BI Master.
- [ ] **Varia por nicho?** Pelo menos um ponto do fluxo (template, prompt,
      régua) tem variante por `niche_code`.
- [ ] **Documentado?** Mapeado nesta página (seção 3, 4 ou 5).

Recurso que não atende esse checklist **não entra em produção**.

---

## 8. Referências

- `docs/CORE_IMPULSIONANDO_SCAFFOLDING.md` — scaffolding técnico do core.
- `docs/FABRICA_PROJETOS.md` — pipeline de criação de tenants.
- `docs/n8n/README.md` — catálogo detalhado dos workflows.
- `mem://core/scaffolding-policy` — regra de tenant.
- `mem://core/growth-governance` — esta política, sintetizada.
