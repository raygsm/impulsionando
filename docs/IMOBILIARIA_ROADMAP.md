# Plataforma Imobiliária Inteligente — Roadmap

Referência: prompt mestre "Plataforma Imobiliária Inteligente / Core Imobiliárias / Garrido". A plataforma completa cobre 38 áreas e é trabalho de meses, não de um round. Este documento separa o que existe hoje, o que está parcial e o que falta, para podermos atacar em fases.

## ✅ Já disponível na base

| Capacidade | Onde |
|---|---|
| Tabelas de imóveis, perfis de busca, matching | `realestate_properties`, `realestate_search_intents`, `realestate_property_matches` |
| Matching automático com notificação WhatsApp+e-mail | função `realestate_run_match_for_property` |
| CRM de leads, atividades, pipelines, oportunidades | `crm_leads`, `crm_activities`, `crm_pipelines`, `crm_stages`, `crm_opportunities` |
| Agenda multi-profissional com bloqueios e conflito | `agenda_*`, trigger `tg_agenda_check_conflict` |
| Financeiro (contas, categorias, lançamentos, comissões) | `fin_*` |
| Comunicação WhatsApp + e-mail por outbox | `message_outbox`, `enqueue_message`, templates `crm_lead_new`, `realestate_match_found` |
| Permissões e perfis | `profiles`, `permissions`, `user_permission_overrides`, `has_role`, `user_has_permission` |
| Auditoria | `audit_logs`, trigger `tg_audit` |
| Demo pública rica | `/demo/nicho/imobiliaria` |

## 🟡 Parcial / precisa de UI dedicada

| Capacidade | O que falta |
|---|---|
| **Carteira de imóveis (CRUD)** | Página `/realestate/properties` com lista + filtros + form completo (todos os campos do prompt §7) |
| **Aprovação interna** | Workflow `rascunho → análise → aprovado → publicado` com estados e botões (hoje só `is_published`) |
| **App/PWA do corretor** | Tela mobile "O que preciso fazer agora?" com lead novo, visitas, pareceres pendentes |
| **Distribuição de leads** | Engine + UI de filas (rodízio, captador, plantão) — hoje só atribuição manual |
| **SLA de 15min** | Motor (pgcron + tabela `realestate_lead_sla`) com push, escalonamento e redistribuição |
| **Visitas com parecer** | Tabela `realestate_visits` + UI; reutilizar `agenda_appointments` ou criar específica |
| **Propostas** | Tabela `realestate_proposals` + workflow rascunho→enviada→aceita→fechada |
| **Site público de imóveis** | Rotas `/imoveis`, `/imoveis/$ref`, `/imoveis/$bairro` com busca avançada e mapa protegido |
| **Captação pelo site** | Form em `/anuncie-seu-imovel` que cria pré-cadastro |
| **Dashboards por perfil** | Painéis Diretor / Gerente / Corretor com funil real |

## 🔴 Não construído — escopo de plataforma

Cada item abaixo é uma fase independente; recomendo entregar em rounds de 1–2 semanas:

| Bloco | Esforço | Pré-requisito |
|---|---|---|
| Pré-cadastro de imóveis por voz (transcrição + extração estruturada) | Médio | Lovable AI Gateway STT + parser estruturado |
| Agente IA no site (busca por linguagem natural) | Médio | `realestate_search_intents` + AI Gateway |
| Agente IA no WhatsApp (atendimento 24/7 com handoff) | Alto | Provider WhatsApp Business API + memória de conversa |
| Captação: funil completo proprietário → publicável | Médio | Estados de aprovação acima |
| Administração de locação | Alto | Novas tabelas: `realestate_contracts`, `realestate_inspections`, `realestate_maintenance` |
| Boletos / PIX / baixa bancária / conciliação | Alto | Conector (Asaas, Iugu ou Banco) + webhook |
| Repasses + demonstrativo | Médio | Boletos funcionando |
| Área do proprietário (PWA) | Médio | Perfil `proprietario` + RLS dedicada |
| Área do inquilino (PWA) com chamados | Médio | `realestate_tickets` |
| Integração portais (Viva Real, Zap, OLX, ImovelWeb) — XML/Feed | Alto | Spec de cada portal |
| Power BI / API pública para BI externo | Médio | Token + camada de leitura controlada |
| Mensagens inteligentes por contexto + Consultor Ativo (48h) | Médio | Régua + AI Gateway para personalizar |

## Sugestão de ordem para próximos rounds

1. **CRUD completo da carteira + aprovação** (resolve operação básica diária)
2. **Captação proprietário + portal de leads no app do corretor** (fluxo crítico)
3. **Distribuição + SLA 15min** (gargalo real do mercado)
4. **Visitas + parecer por voz + sugestão de imóveis semelhantes** (diferencial do prompt)
5. **Administração de locação + boletos + repasses** (módulo financeiro completo)
6. **Agente IA WhatsApp** (escala atendimento 24/7)
7. **Integração portais + Power BI** (alimentação e saída)
