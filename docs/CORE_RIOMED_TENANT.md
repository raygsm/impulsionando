# RioMed — Tenant do Core Impulsionando

> Status: **Fase 1 concluída** (provisionamento). Demais fases planejadas abaixo.

## Identidade
- Razão: RioMed Equipos Médicos S.R.L. · País: BO · Idioma: es-BO · Moeda: BOB
- Subdomínio: `riomed.impulsionando.com.br`
- Plano: Enterprise · Taxa de Intermediação Digital Impulsionando: **0,75%**
- Aliases de e-mail (futuros): `ventas@`, `soporte@`, `alquiler@`, `mantenimiento@`
- Nicho: `medico-hospitalar` (macro Saúde)

## Acesso administrativo
- Dossiê master: `/admin/clientes/riomed` (vertente Clientes → grupo Diretório no Menu Master)
- Toda gestão (módulos, plano, taxa, branding, integrações) feita pelo Core Impulsionando.

## Fase 1 — Provisionamento (DONE)
- `companies` ← tenant RioMed (`company_kind=real`, status comercial/financeiro/técnico).
- `core_tenant_identity` ← subdomínio + metadados (país, idioma, moeda, plano, taxa, aliases).
- `company_modules` ← 19 módulos base: dashboard, administracao, crm, erp, estoque, financeiro, commerce, agenda, automacao, bi, area_cliente, configuracoes, auditoria, perfis, usuarios, setores, unidades, empresas, nichos.
- `crm_pipelines` + `crm_stages` ← 4 funis (Vendas / Locação / Assistência Técnica / B2B) com estágios completos.
- `core_admin_menu` ← entrada RioMed (Clientes → Diretório).

## Fases seguintes (ordem recomendada)

### Fase 2 — Importação & Estoque
- Módulo `imports`: CSV `;`/XLSX/TXT (ES+PT), mapeamento auto, dry-run com diff (novos/atualizados/duplicidades/erros), logs em `audit_logs`.
- Multi-almoxarifado em `inv_*`: loja, depósito, manutenção, locação, reservado, vendido, indisponível, em revisão.
- Categorias médicas seed: equipamentos, home care, cardiologia, oxímetros, ECG/holter, sensores, cabos, braçadeiras, papéis térmicos, consumíveis, outlet, AT, locação.
- Importar: produtos, estoque, categorias, marcas, modelos, preços, clientes, fornecedores, vendedores, contratos, equipamentos de locação.

### Fase 3 — Vendedores & Distribuição de leads
- Tabela `crm_lead_routing_rules` (estratégias: rodízio, randômico, segmento, carteira, disponibilidade, performance, manual, híbrido).
- Cadastro de vendedores (perfil, segmento editável, horários, limite diário, prioridade, performance).
- Segmentos editáveis pelo admin do tenant.

### Fase 4 — Loja virtual + Outlet + Recuperação
- Rotas públicas no subdomínio RioMed (loja, produto, carrinho, checkout, outlet).
- Integração com `mp_*` e `mpago_*` (já existentes no core).
- Jornadas de carrinho abandonado: 15min / 2h / 24h / 48h (`core_funnel_rules` + `core_funnel_dispatch_queue`).
- Recuperação PIX/boleto/cartão/orçamento (jornadas dedicadas).

### Fase 5 — Locação + Assistência Técnica
- Tabelas: `rental_assets`, `rental_contracts`, `rental_checklists`, `service_orders`, `service_order_parts`.
- Status, número patrimonial, série, fotos, checklist obrigatório para retorno ao estoque.
- OS: chamado → triagem → diagnóstico → orçamento → aprovação → manutenção → teste → entrega.

### Fase 6 — Templates ES-BO + Jornadas + Agente IA
- `message_templates` populado com 24+ templates (boas-vindas, orçamento, pagamento, locação, manutenção, pós-venda, outlet, campanhas).
- Variáveis dinâmicas: cliente, vendedor, produto, valor, link de pagamento, vencimento.
- Jornadas B2C / B2B / Técnica / Locação em `core_funnel_rules`.
- Agente IA via Lovable AI Gateway: intenções (comprar, alugar, AT, catálogo, orçamento, etc.), escalonamento.

### Fase 7 — Dashboards + Permissões + Marketplace + Domínio próprio
- Dashboards: geral, comercial, estoque, marketing, locação, AT, Core Impulsionando.
- Perfis: Admin Core, Suporte Impulsionando, Admin RioMed, Diretor, Gerente, Vendedor, Atendimento, Estoque, Financeiro, Técnico, Logística, Marketing, Visualizador.
- Publicação no Marketplace Impulsionando (categoria "Equipamentos e Suprimentos Médicos").
- Migração para domínio próprio + configuração de email domain real.

## Governança & Cobrança
- Tudo administrável pelo Core (módulos ativos/inativos, plano, taxa, percentuais).
- Replicável para outros clientes médico-hospitalares via duplicação da estrutura.
- Auditoria em `audit_logs` para toda mudança de configuração.
