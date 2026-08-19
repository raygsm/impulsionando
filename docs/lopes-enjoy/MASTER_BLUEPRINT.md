# Lopes Enjoy — Master Blueprint

## Objetivo
Construir uma camada imobiliária completa sobre o Core universal da Impulsionando, reutilizando CRM, omnichannel, agentes, identidade de contatos, jornadas, analytics, segurança e automações existentes, sem criar um segundo Core paralelo.

Domínio previsto: https://lopesenjoy.impulsionando.com.br
Slug técnico: lopes-enjoy

## Princípios inegociáveis
1. Nenhum recurso de front-end existe sem suporte real no back-end.
2. Nenhum dado imobiliário crítico pode ser inventado.
3. Todo contato vira identidade unificada e histórico auditável no CRM.
4. Toda ação importante gera evento, responsável, SLA e trilha de auditoria.
5. Toda automação deve admitir handoff humano e fallback seguro.
6. Isolamento de dados por cliente, RLS e service-role server-side.
7. Mudanças de produção são aditivas, reversíveis e validadas antes de merge/deploy.
8. Integrações externas entram por adapters; falha externa não pode corromper estado interno.
9. LGPD by design: minimização, consentimento, finalidade, retenção e exclusão governadas.
10. Impulsionito é o orquestrador central; Lopes Enjoy recebe uma instância especializada, nunca um cérebro paralelo.

## Comitê de agentes
- Orquestrador: Impulsionito Core
- Produto & Estratégia Imobiliária
- UX/CX & Acessibilidade
- Growth/SEO/Mídia
- CRM & Revenue Operations
- Operação de Compra e Venda
- Locação & Administração
- Jurídico/Documental
- Financeiro, Comissões & Repasses
- Dados, BI & Forecast
- Automação/N8N & Integrações
- Segurança, Privacidade & QA

Cada especialista opera sobre o mesmo estado do cliente e registra recomendações/decisões em artefatos auditáveis. Nenhum agente pode executar uma transição irreversível sem regra de permissão e, quando aplicável, aprovação humana.

## Públicos e jornadas

### 1. Comprador
Descoberta -> busca -> filtros -> favoritos -> comparação -> interesse -> qualificação -> financiamento/simulação -> corretor -> visita -> feedback -> proposta -> contraproposta -> documentação -> assinatura -> fechamento -> pós-venda -> indicação.

### 2. Vendedor / proprietário
Captação -> estimativa/avaliação -> reunião -> documentação -> autorização -> onboarding do imóvel -> fotos/mídia -> publicação -> distribuição -> leads -> visitas -> feedback -> propostas -> negociação -> fechamento -> documentos -> pós-venda.

### 3. Locatário
Busca -> interesse -> qualificação -> visita -> proposta -> análise cadastral -> garantias -> aprovação -> contrato -> vistoria -> entrada -> chamados -> renovação/reajuste -> saída/vistoria final.

### 4. Proprietário locador
Captação -> onboarding -> documentação -> definição de preço -> publicação -> seleção de interessado -> análise -> contrato -> administração -> cobrança -> repasse -> manutenção -> inadimplência -> reajuste -> renovação/saída.

### 5. Investidor
Perfil -> tese -> orçamento -> regiões -> oportunidades -> comparáveis -> yield/cap rate quando houver dados -> cenários -> visita -> oferta -> aquisição -> estratégia de locação/revenda -> acompanhamento de performance.

### 6. Corretor
Onboarding -> cadastro e validação -> carteira -> distribuição de leads -> SLA -> tarefas -> agenda -> atendimento -> visitas -> propostas -> follow-up -> comissão -> ranking saudável -> treinamento -> reativação.

### 7. Gestor
Funil -> equipes -> distribuição -> SLAs -> estoque -> qualidade de anúncios -> produtividade -> propostas -> forecast -> receita -> comissões -> auditoria -> alertas -> coaching.

### 8. Construtora / incorporadora
Onboarding B2B -> empreendimentos -> unidades -> tabelas -> materiais -> disponibilidade -> campanhas -> leads -> corretores -> visitas -> reservas -> propostas -> vendas -> conciliação.

### 9. Parceiros
Correspondentes, crédito, seguros, cartórios, fotografia, vistoria, manutenção e demais parceiros: cadastro -> escopo -> aceite -> acionamento -> SLA -> entrega -> avaliação -> pagamento/conciliação quando aplicável.

### 10. Pós-venda e relacionamento
NPS/CSAT -> pendências -> documentos -> indicação -> cross-sell -> recompra -> investimento -> reativação.

## Domínios funcionais

### Portal público
- Home segmentada por intenção
- Busca robusta por venda/locação
- Mapa e regiões
- Página de imóvel com galeria, vídeo/360 quando disponível, ficha, localização, custos e CTA contextual
- Favoritos e comparação
- Landing pages por bairro, tipologia, empreendimento e campanha
- Área Luxury sem duplicar infraestrutura
- Conteúdo/SEO
- Captação de imóvel
- Cadastro de interesse
- Agenda de visita
- Conversa com agente/corretor

### CRM imobiliário
- Pessoa/empresa unificada
- Identidades por canal
- Leads, oportunidades e negócios
- Origem/UTM/campanha
- Segmentos e scoring
- Dono atual e histórico de distribuição
- SLA de primeiro contato e follow-up
- Timeline completa
- Tarefas, notas, anexos e consentimentos
- Motivos de perda, reativação e próximos passos

### Catálogo e estoque imobiliário
- Imóveis, empreendimentos e unidades
- Proprietários e relações de titularidade
- Endereço e geolocalização
- Características, comodidades e diferenciais
- Status comercial e operacional
- Preço e histórico
- Condomínio, IPTU e demais custos quando fornecidos
- Mídia, documentos e qualidade do anúncio
- Regras de publicação e canais
- Dedupe e versionamento

### Agenda e visitas
- Disponibilidade de corretor/proprietário/unidade
- Agendamento e confirmação
- Lembretes
- Check-in e no-show
- Feedback do visitante e do corretor
- Reagendamento
- Rotas/lotes de visita quando aplicável

### Propostas e negociação
- Valor e condições
- Participantes
- Validade
- Contrapropostas versionadas
- Aprovações
- Documentos associados
- Linha do tempo completa
- Resultado e motivo

### Documental e jurídico
- Checklist por transação
- Cofre documental com acesso por função
- Versionamento
- Pendências e vencimentos
- Assinatura via adapter quando houver fornecedor homologado
- Logs de acesso e download
- Nunca interpretar juridicamente documento como substituição de profissional humano

### Locação e administração
- Contratos
- Garantias
- Vistorias
- Cobranças e repasses
- Reajustes
- Inadimplência e régua de cobrança
- Chamados/manutenção
- Prestadores
- Renovação e encerramento

### Financeiro e comissões
- Receitas previstas/realizadas
- Comissões por negócio
- Split por participantes e regras
- Aprovações e conciliação
- Repasses
- Relatórios gerenciais
- Sem movimentar dinheiro sem integração financeira homologada e controles de autorização

### Marketing e Growth
- UTM end-to-end
- Landing pages
- Formulários inteligentes
- Campanhas e públicos
- Lead source attribution
- SEO local e programático governado
- Remarketing apenas com consentimento/base legal adequada
- Conteúdo e páginas de região
- Indicadores CAC, CPL, taxa de contato, visita, proposta e fechamento

### Omnichannel
- Web chat
- E-mail
- WhatsApp quando provider estiver conectado
- Instagram quando adapter estiver conectado
- Futuras integrações sem quebrar o modelo central
- Histórico único por contato
- Handoff humano preservando contexto

## Agente especializado Lopes Enjoy
Nome provisório interno: `lopes-enjoy-concierge` até definição de identidade comercial pelo projeto.
Tipo: CLIENT_INSTANCE
Root: Impulsionito
Knowledge scope: tenant
Cross-tenant access: false
Capabilities iniciais: discovery, qualification, property_search, visit_scheduling, lead_routing, followup, seller_capture, rental_capture, human_handoff.
Proibições: inventar disponibilidade, preço, documentação, aprovação de crédito, status de proposta ou condições contratuais.

## Modelo de dados mínimo específico
- real_estate_properties
- real_estate_property_owners
- real_estate_developments
- real_estate_units
- real_estate_media
- real_estate_publications
- real_estate_price_history
- real_estate_leads (link para contact/CRM)
- real_estate_preferences
- real_estate_favorites
- real_estate_visits
- real_estate_visit_feedback
- real_estate_offers
- real_estate_offer_versions
- real_estate_documents
- real_estate_transactions
- real_estate_broker_assignments
- real_estate_commission_rules
- real_estate_commissions
- real_estate_leases
- real_estate_inspections
- real_estate_maintenance_tickets
- real_estate_rent_ledger
- real_estate_partner_referrals

Todas as tabelas específicas devem conter tenant_id quando aplicável, timestamps, created_by/updated_by quando necessário e políticas RLS coerentes com o Core.

## Eventos canônicos
- lead.created
- lead.qualified
- lead.assigned
- lead.first_contact_due
- property.created
- property.ready_for_publication
- property.published
- property.price_changed
- visit.requested
- visit.confirmed
- visit.completed
- visit.no_show
- offer.created
- offer.countered
- offer.accepted
- offer.rejected
- transaction.document_pending
- transaction.closed
- lease.application_created
- lease.approved
- lease.signed
- rent.due
- rent.overdue
- owner.payout_due
- maintenance.opened
- maintenance.resolved
- customer.nps_due

## Automações prioritárias
1. Novo lead -> dedupe -> identidade -> scoring -> distribuição -> SLA -> primeiro contato.
2. Lead sem contato -> alertas/escalonamento -> redistribuição governada.
3. Favorito/interesse repetido -> recomendação e corretor.
4. Visita -> confirmações -> lembretes -> check-in -> feedback -> próximo passo.
5. Proposta sem resposta -> follow-up conforme política.
6. Proprietário captado -> checklist -> mídia -> publicação -> relatórios de performance.
7. Anúncio sem performance -> alerta de qualidade/preço para análise humana.
8. Locação -> vencimentos -> cobrança -> repasse -> comprovantes/status.
9. Documento pendente/vencendo -> alertas por papel.
10. Pós-fechamento -> satisfação -> indicação -> relacionamento.

## Distribuição de leads
Motor auditável com disponibilidade, região, especialidade, carga, SLA, performance e regras comerciais. Round-robin pode ser fallback, nunca caixa-preta. Toda atribuição registra motivo e permite supervisão/override.

## Dashboards
- Diretoria: GMV quando disponível, receita, pipeline, forecast, conversão, ciclo, produtividade, estoque, aging.
- Comercial: leads, contato, qualificação, visitas, propostas, fechamentos, perdas.
- Corretor: fila, tarefas, agenda, oportunidades, SLA, negócios e comissão prevista.
- Proprietário: desempenho do imóvel, contatos/visitas/propostas em nível permitido, pendências e relatórios.
- Locação: contratos, cobrança, inadimplência, repasses, chamados.
- Marketing: origem, CPL/CAC, qualidade, conversão por campanha/página/região.
- Operação: documentos, SLAs, pendências e exceções.

## Segurança
- Tenant isolation
- RLS
- Server-side privileged access only
- RBAC/ABAC por perfil e vínculo
- MFA para perfis sensíveis quando suportado
- Rate limiting e anti-abuse
- Logs de auditoria
- Secrets fora do cliente
- Upload validation/antimalware adapter quando disponível
- URLs assinadas para documentos privados
- Backups e rollback conforme infraestrutura central
- Data retention e LGPD

## Papéis previstos
public, lead, customer, owner, tenant_customer, broker, broker_manager, operations, legal, finance, marketing, partner, admin, platform_admin.

## Critério de front/back parity
Toda CTA deve responder a 8 perguntas antes de entrar em produção:
1. Qual entidade altera?
2. Quem pode executar?
3. Qual validação?
4. Qual evento dispara?
5. Quem recebe responsabilidade/SLA?
6. Qual automação/handoff?
7. Onde fica o histórico?
8. Qual métrica comprova funcionamento?

## Fases de entrega
### F0 — Descoberta e baseline
Auditar Core, padrões existentes, integrações e disponibilidade real de dados.

### F1 — Fundação
Tenant/brand/agent, RBAC/RLS, modelos específicos, eventos, auditoria.

### F2 — Portal + catálogo + CRM
Busca, imóvel, captação, lead, qualificação, roteamento, favoritos, SEO base.

### F3 — Agenda + visita + propostas
Workflow completo, notificações, feedback, negociação versionada.

### F4 — Locação + documentos + financeiro
Contratos, vistoria, cobranças/repasses, comissões e controles.

### F5 — Agente IA + automações
Tool-first, sem alucinação de dados, handoff e journeys.

### F6 — BI + Growth
Dashboards, attribution, forecast e otimização.

### F7 — QA/go-live
Smoke, E2E, segurança, performance, acessibilidade, observabilidade, rollback e evidências.

## Definition of Done
Só é 🟢 TESTADO E FUNCIONAL quando houver evidência em ambiente alvo de:
- rota pública respondendo;
- dados reais consultáveis;
- autenticação e autorização;
- isolamento RLS;
- lead -> CRM -> distribuição;
- agenda/visita;
- proposta;
- handoff do agente;
- automações essenciais;
- logs/auditoria;
- smoke + E2E;
- monitoramento/rollback.

Até lá, usar 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE, 🟠 PARCIAL, 🔴 AUSENTE ou ⚫ BLOQUEADO.
