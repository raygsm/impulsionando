# RioMed — Auditoria Fase 1 (Inventário + Diagnóstico)

> Nenhuma alteração foi feita. Este documento é o relatório técnico solicitado para validação antes de qualquer mudança estrutural (Fase 2).

---

## 1. Inventário atual

### 1.1 Banco de dados (Supabase) — 62 tabelas `riomed_*`

| Domínio | Tabelas | Volume hoje |
|---|---|---|
| **Comercial / CRM** | `riomed_sellers` (5), `riomed_seller_assignments`, `riomed_seller_leads`, `riomed_seller_notifications`, `riomed_lead_routing_rules`, `riomed_distribution_config`, `riomed_rr_pointer`, `riomed_commission_rules`, `riomed_commissions`, `riomed_quotes` (0), `riomed_quote_items`, `riomed_checkout_sessions`, `riomed_cart_items`, `riomed_public_carts`, `riomed_funnel_automations` | 5 vendedores, 0 cotações |
| **Clientes / Portais** | `riomed_hospital_accounts` (0), `riomed_hospital_requests`, `riomed_team`, `riomed_user_scopes`, `riomed_role_templates` | 0 hospitais cadastrados |
| **Produtos / Catálogo** | `riomed_products` (812), `riomed_product_variants`, `riomed_product_embeddings`, `riomed_embedding_jobs`, `riomed_prices`, `riomed_price_lists`, `riomed_supplier_offers`, `riomed_suppliers` (0), `riomed_showcase`, `riomed_showcase_items`, `riomed_search_queries` | 812 produtos, 0 fornecedores |
| **Estoque / Logística** | `riomed_warehouses`, `riomed_stock_levels`, `riomed_stock_movements`, `riomed_stale_stock_rules` | vazio |
| **Financeiro / Fiscal** | `riomed_ar_invoices` (0), `riomed_ap_invoices`, `riomed_fiscal_sequences` | vazio |
| **PDV (POS)** | `riomed_pos_terminals`, `riomed_pos_sessions`, `riomed_pos_sales` (0), `riomed_pos_sale_items`, `riomed_pos_movements` | vazio |
| **Suporte / Técnica** | `riomed_support_tickets` (0), `riomed_technicians`, `riomed_technician_assignments`, `riomed_candidates` | vazio |
| **Marketing** | `riomed_campaigns`, `riomed_campaign_items`, `riomed_whatsapp_broadcasts`, `riomed_whatsapp_clicks`, `riomed_site_settings` | vazio |
| **IA / Automação** | `riomed_ai_agents`, `riomed_ai_runs`, `riomed_automation_runs`, `riomed_n8n_workflows` (0), `riomed_n8n_executions`, `riomed_operational_events`, `riomed_governance_policies`, `riomed_audit_log`, `riomed_import_jobs`, `riomed_import_mappings` | 0 workflows registrados |

**Totais:** 62 tabelas, ~880 colunas. Só 3 tabelas têm dados reais (`products`, `sellers`, `companies`). RLS habilitada em todas.

### 1.2 Páginas (rotas) — 55 arquivos

**Públicas (19 em `src/routes/riomed.*`):**
`index`, `productos`, `cotizar`, `cotizacion.$token`, `carrinho`, `checkout`, `hospitales`, `hospital.portal`, `pacientes`, `alquiler`, `servicio-tecnico`, `soporte`, `vendedor`, `vendedores.cadastro`, `tecnico.cadastro`, `fornecedor.cadastro`, `trabalhe-conosco`, `v.$slug`, `riomed` (layout).

**Admin/operação (36 em `_authenticated/admin.clientes.riomed.*`):**
`dashboard`, `master-dashboard`, `dashboards`, `crm`, `vendedores`, `comissoes`, `pedidos`, `carrinhos`, `marketplace`, `produtos`, `precos-listas`, `estoque-almoxarifados`, `locacao`, `financeiro`, `fiscal`, `pos`, `pos-relatorio`, `operacoes`, `assistencia`, `marketing`, `n8n`, `automacao`, `agentes`, `assistente`, `busca-ia`, `jornadas`, `parceiros`, `portal`, `permissoes`, `routing`, `governanca`, `relatorios`, `implantacao`, `importacoes`, `configuracoes-campos`.

### 1.3 Server functions — 24 arquivos `src/lib/riomed-*.functions.ts` (~5.1k linhas)
ai, automation, commercial, customer-area, finance, fiscal, governance, import, journeys, marketing, master, n8n, operations, partners, portal, pos, public, reports, roles, sales, search, sellers + auth/index.

### 1.4 N8N — 5 workflows desenhados (JSON em `docs/n8n/riomed-0*.json`)
`01-novo-lead`, `02-ticket-tecnico`, `03-cotacao-fria`, `04-recuperacao-carrinho`, `05-cobranca-ar`. **Nenhum importado/registrado em `riomed_n8n_workflows`.**

### 1.5 Integrações registradas (`core_integrations`)
| Slug | Status | Ativo |
|---|---|---|
| `mercadopago` | not_configured | sim |
| `n8n` | not_configured | sim |

**Não registradas:** Facebook, Instagram, WhatsApp Cloud API, GitHub, Google, e-mail transacional, fiscal Bolívia (SIN/Siat).

---

## 2. Problemas encontrados

### 2.1 Duplicação / sobreposição
- **Dashboards triplicados:** `dashboard`, `dashboards`, `master-dashboard` — três telas, sem diferenciação clara de papel (operacional vs gerencial vs C-level).
- **Automação fragmentada em 4 telas:** `automacao`, `agentes`, `assistente`, `n8n` — todas tocam o mesmo domínio (IA + workflows) sem hierarquia.
- **Cadastro de vendedores em 3 lugares:** rota pública `riomed.vendedores.cadastro`, rota pública `riomed.vendedor`, admin `riomed.vendedores`.
- **Comercial dividido:** `crm`, `pedidos`, `carrinhos`, `comissoes`, `marketplace`, `vendedores` — sem subnav/agrupamento, vira lista plana de 6+ menus.
- **Server functions sobrepostas:** `riomed-commercial`, `riomed-sales`, `riomed-sellers`, `riomed-partners` — fronteiras pouco claras; `riomed-master` e `riomed-governance` também flertam.

### 2.2 Tabelas vazias / de uso incerto
- 0 linhas em 9 tabelas-chave (`hospital_accounts`, `quotes`, `tickets`, `ar_invoices`, `pos_sales`, `suppliers`, `n8n_workflows`, `warehouses`, `campaigns`). Boa parte dos módulos é "casca" — UI existe, fluxo de entrada de dado não.
- `riomed_rr_pointer` (3 colunas) e `riomed_distribution_config` parecem redundantes com `riomed_lead_routing_rules`.
- `riomed_role_templates` + `riomed_user_scopes` + `core` `user_roles` = 3 camadas de RBAC; risco de divergência.

### 2.3 Campos / processos faltantes
- **Hospitais (B2B):** sem CNPJ/NIT, sem endereço fiscal, sem limite de crédito, sem condições de pagamento.
- **Produtos:** sem campo de equivalência/compatibilidade estruturado (apesar de existir busca por imagem). Sem unidade fiscal (Bolívia exige código SIN).
- **Financeiro:** sem conciliação bancária, sem fluxo de caixa projetado, sem repasses a fornecedor.
- **Logística:** não há tabela de expedição/transporte/rastreio — só `stock_movements`.
- **Suporte:** sem SLA, sem garantia vinculada a venda, sem peças trocadas.
- **Localização Bolívia:** sem tabela de moeda/câmbio dedicada (existe `cotacao_bob_usd` no schema global, não integrada), sem departamentos/municípios bolivianos no fluxo de cadastro (existem `geo_bo_*` mas não usados em formulários).

### 2.4 Riscos de arquitetura
1. **Falta de domínio explícito.** Tudo está nivelado em `admin.clientes.riomed.*` — 36 rotas planas. Sem agrupamento, escala para 60-80 telas e vira inutilizável.
2. **N8N desconectado.** 5 fluxos JSON existem mas nenhum está cadastrado, monitorado ou versionado pelo app. `riomed_n8n_executions` e `webhook_runs` não recebem dado.
3. **Integrações sociais ausentes.** Não há entrada em `core_integrations` para Facebook/Instagram/WhatsApp — qualquer fluxo de marketing/lead depende dessas, e elas não existem nem como stub.
4. **POS sem terminal cadastrado.** Existem 5 tabelas para PDV, zero dados, zero processo de abertura/fechamento testado — risco de retrabalho quando a loja física entrar.
5. **Fiscal Bolívia.** `riomed_fiscal_sequences` existe mas não há integrador SIN/Siat. Toda venda B2B na Bolívia exige fatura fiscal — bloqueio operacional real.
6. **Search por imagem (`product_embeddings`, `embedding_jobs`)** sem job runner ativo e sem fila monitorada — funcionalidade declarada mas não verificada.
7. **RBAC triplo** (`user_roles` core + `riomed_user_scopes` + `riomed_role_templates`) sem documento de "fonte da verdade" → risco de escalonamento de privilégio.

---

## 3. Proposta de arquitetura ideal (para validação)

### 3.1 Reorganização por 7 domínios (alinhado ao pedido)

```
RIOMED
├── 01. COMERCIAL        leads · crm · orçamentos · vendedores · metas · comissões · follow-up
├── 02. CLIENTES         empresas (hospitais) · contatos · histórico · contratos · atendimento · pós-venda
├── 03. PRODUTOS         catálogo · estoque · compatibilidades · equivalências · busca imagem · fornecedores
├── 04. FINANCEIRO       AR · AP · comissões · repasses · fluxo caixa · conciliação · fiscal SIN
├── 05. LOGÍSTICA        separação · expedição · transporte · entrega · confirmação · devolução
├── 06. SUPORTE          chamados · garantias · manutenção · assistência técnica · SLA
└── 07. INTELIGÊNCIA     BI · indicadores · IA comercial · alertas · auditoria · governança
```

Cada domínio vira um **subnav próprio** sob `admin.clientes.riomed.<dominio>.<tela>` — elimina a lista plana atual.

### 3.2 Mapa de telas atuais → domínio futuro

| Atual | Domínio | Ação |
|---|---|---|
| crm, vendedores, comissoes, pedidos, carrinhos, marketplace, routing | 01 Comercial | agrupar |
| portal, parceiros, hospital.portal, hospitales | 02 Clientes | agrupar + criar "Empresas (Hospitais)" |
| produtos, precos-listas, busca-ia, importacoes | 03 Produtos | agrupar; criar `fornecedores` e `compatibilidades` |
| estoque-almoxarifados, locacao | 03 + 05 | dividir: cadastro→Produtos, movimentação→Logística |
| financeiro, fiscal, pos, pos-relatorio | 04 Financeiro | agrupar; PDV vira subdomínio |
| (novo) expedicao, transporte, rastreio | 05 Logística | **criar** |
| assistencia | 06 Suporte | renomear "Chamados"; criar `garantias`, `sla` |
| dashboard, dashboards, master-dashboard, relatorios | 07 Inteligência | **fundir em 1 BI + 1 Executivo** |
| automacao, agentes, assistente, n8n, jornadas | 07 Inteligência | reagrupar em "IA & Workflows" |
| governanca, permissoes, configuracoes-campos, implantacao | (core) | mover para Core, fora de RioMed |

**Resultado:** ~36 rotas → ~24 telas distribuídas em 7 domínios + 4 telas core.

### 3.3 Banco — mudanças propostas (Fase 2, não agora)

**Novas tabelas:**
- `riomed_product_compatibility (product_id, compatible_with_id, type)`
- `riomed_product_equivalence (product_id, equivalent_id, supplier_id)`
- `riomed_shipments`, `riomed_shipment_items`, `riomed_carriers`, `riomed_tracking_events`
- `riomed_warranties (sale_id, product_id, starts_at, ends_at, terms)`
- `riomed_sla_policies`, `riomed_ticket_sla_events`
- `riomed_cash_flow_forecast`, `riomed_bank_reconciliation`
- `riomed_fiscal_invoices_bo` (integração SIN/Siat) + `riomed_fiscal_log`
- `riomed_credit_limits (hospital_id, limit, used)`

**Tabelas a deprecar/fundir:**
- `riomed_rr_pointer` + `riomed_distribution_config` → fundir em `riomed_lead_routing_rules`.
- `riomed_role_templates` + `riomed_user_scopes` → migrar para `user_roles` core + view derivada.

**Campos a adicionar:**
- `riomed_hospital_accounts`: `nit`, `razon_social`, `direccion_fiscal`, `departamento_id`, `municipio_id`, `condicion_pago`, `limite_credito`.
- `riomed_products`: `codigo_sin`, `unidad_medida_fiscal`, `peso_kg`, `dimensoes`.
- `riomed_quotes`: `validade_dias`, `condicao_pagamento`, `prazo_entrega_dias`, `incoterm`.

### 3.4 Integrações — estado atual × ideal

| Canal | Hoje | Ideal Fase 2 |
|---|---|---|
| **Supabase** | conectado (core do app) | — |
| **GitHub** | conectado (deploy) | — |
| **N8N** | registrado, **not_configured** | URL + API key + 5 workflows registrados em `riomed_n8n_workflows` com health-check |
| **Mercado Pago** | registrado, **not_configured** | credenciais Bolívia + webhook + sandbox testado |
| **WhatsApp Cloud API** | **ausente** | criar integração + templates aprovados + roteamento por vendedor |
| **Facebook Lead Ads** | **ausente** | criar; lead cai em `marketing_leads`+`crm_leads` |
| **Instagram Direct** | **ausente** | via WhatsApp Cloud (mesma BSP) |
| **Site RioMed** | conectado (rotas públicas) | adicionar formulários servidos por `createServerFn` com captcha |
| **SIN/Siat (fiscal BO)** | **ausente** | integrador obrigatório para operar B2B na Bolívia |
| **E-mail transacional** | parcial (templates) | provedor configurado + domínio verificado |
| **Câmbio BOB/USD** | tabela existe, sem job | cron diário via N8N |

### 3.5 Perfis (RBAC) — proposta única

`master` · `admin_riomed` · `gerente_comercial` · `vendedor` · `gerente_operacoes` · `expedicao` · `financeiro` · `tecnico_suporte` · `hospital_comprador` (portal externo) · `paciente` (portal externo).

Única fonte: `user_roles` + `has_role()`. `riomed_user_scopes` vira **view** derivada, `role_templates` é descontinuado.

---

## 4. O que NÃO foi feito (conforme pedido)

- ❌ Nenhuma migration criada.
- ❌ Nenhum workflow N8N alterado/importado.
- ❌ Nenhum dado movido/removido.
- ❌ Nenhuma rota renomeada.

---

## 5. Próximos passos sugeridos (Fase 2 — só após seu OK)

1. Migration de **reorganização lógica** (cria domínios no `core_admin_menu`, sem mexer em rota).
2. Migration de **schema** (novas tabelas + campos + deprecações).
3. Cadastro real das 5 integrações sociais/fiscais em `core_integrations` + UI de configuração.
4. Registro dos 5 workflows N8N em `riomed_n8n_workflows` com health-check.
5. Consolidação dos 3 dashboards em 2 telas (Operacional + Executivo).
6. Migração de RBAC para fonte única.

**Aguardando sua validação para iniciar Fase 2.**
