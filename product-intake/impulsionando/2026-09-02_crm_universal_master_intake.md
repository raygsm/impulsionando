# SUPERPROMPT MESTRE — CRM UNIVERSAL IMPULSIONANDO — PRODUCT INTAKE

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**ESCOPO:** Core CRM Universal do Ecossistema Impulsionando  
**CANAIS PRIORITÁRIOS:** WhatsApp + E-mail  
**AGENTE CENTRAL:** Impulsionito no tenant master; agentes especializados nos tenants clientes  

> **NÃO EXECUTAR AUTOMATICAMENTE.** Este documento é especificação de Product Intake para futura implementação. Auditar o estado real, preservar o que estiver correto, consolidar duplicidades, eliminar mocks e só considerar concluído aquilo que estiver integrado, publicado, testado e auditável.

## 1. MISSÃO
Construir um CRM universal extremamente poderoso por baixo e extremamente simples por cima, capaz de atender realidades muito diferentes — Impulsionando, RioMed, Ana Madú, CHRISMED, Enjoy Imóveis, Colors, WMP, bares/restaurantes e futuros tenants — sem criar CRMs separados por cliente.

## 2. PRINCÍPIO DE PRODUTO
**CORE CRM UNIVERSAL → CONFIGURAÇÃO DO NICHO → TENANT → PÚBLICOS → OBJETOS → CAMPOS → PIPELINES → JORNADAS → WHATSAPP/E-MAIL → AGENTE → N8N → ERP → BI.**

## 3. REGRA DE SIMPLICIDADE
O usuário comum não deve enxergar complexidade técnica. Tudo que puder ser parametrizado deve ser apresentado como **SIM/NÃO**, escolha simples, slider, campo ou wizard guiado.

## 4. REGRA DE PROFUNDIDADE
A simplicidade da UI não pode significar falta de profundidade. O Core deve suportar automações, múltiplos pipelines, canais, permissões, auditoria, integrações, regras, eventos, templates, SLA, scoring, campanhas e BI.

## 5. BENCHMARK
Usar como referência funcional, sem copiar identidade/código, os pontos fortes de Voxuy, SellFlux, Octadesk, Trello, RD Station CRM, Kommo, Zoho CRM, Pipedrive e HubSpot: WhatsApp no centro da operação, funis automáticos, inbox omnichannel, automação visual, Kanban simples, histórico, tarefas, follow-up, campanhas, IA, templates, relatórios, múltiplos canais e integrações.

## 6. DIFERENCIAL IMPULSIONANDO
Unir **contato + empresa + negócio + comunicação + tarefa + campanha + automação + agente especializado + ERP + billing + suporte + BI**, evitando silos e sistemas paralelos.

## 7. NAVEGAÇÃO PRINCIPAL
Para maioria dos usuários: **Hoje | CRM | Comunicação | Campanhas | Inteligência**. Recursos avançados aparecem conforme perfil/permissão.

## 8. HOME “HOJE”
Mostrar quem precisa de resposta, leads parados, propostas vencendo, tarefas do dia, conversas aguardando humano, SLAs em risco, campanhas fracas e oportunidades quentes, sempre com ação direta.

## 9. PRÓXIMA AÇÃO
Toda oportunidade relevante deve ter `next_action`, `next_action_at`, responsável e SLA. Nenhum lead importante sem próxima ação.

## 10. OBJETOS UNIVERSAIS
Pessoa, Empresa, Lead, Oportunidade/Negócio, Tarefa, Atividade, Conversa, Campanha, Produto/Serviço, Proposta, Contrato, Ticket, Evento e objetos verticais.

## 11. OBJETOS VERTICAIS SIM/NÃO
Paciente, Médico, Corretor, Proprietário, Imóvel, Vendedor, Equipamento, Afiliado, Parceiro, DJ, Evento, Mesa/Comanda etc.

## 12. CUSTOMER 360
Cadastro único consolida identidade, contatos, consentimentos, origem, campanhas, negócios, WhatsApp, e-mails, tarefas, propostas, compras, pagamentos, tickets, NPS e histórico.

## 13. DEDUPLICAÇÃO
E-mail, telefone, documento e identificadores contextuais, sem fusão automática em casos ambíguos.

## 14. CAMPOS PERSONALIZÁVEIS
Texto, número, moeda, data, seleção, múltipla seleção, booleano, relacionamento, arquivo, URL e fórmulas controladas.

## 15. CAMPOS OBRIGATÓRIOS POR ETAPA
Gestão define requisitos para avanço no funil.

## 16. FORM BUILDER
Formulários vinculados ao CRM com campos condicionais e origem rastreada.

## 17. PIPELINES
Múltiplos por tenant, operação, unidade, produto ou público.

## 18. KANBAN
Clareza inspirada no Trello: cards compactos, valor, responsável, próxima ação, SLA, origem, tags e alertas.

## 19. VISÕES
Kanban, tabela, lista e calendário.

## 20. TIMELINE
Linha cronológica única de todas as interações.

## 21. TAGS E SEGMENTOS
Tags manuais/automáticas e segmentos dinâmicos por campos, comportamento, origem, estágio, compras, inadimplência, engajamento e localização.

## 22. LEAD SCORING
Fit + comportamento + estágio, explicável e auditável.

## 23. PRIORIDADE
QUENTE/MORNO/FRIO ou nomenclatura customizável, com critérios visíveis.

## 24. ROTEAMENTO
Round-robin, região, produto, especialidade, carga, unidade, disponibilidade e regras específicas.

## 25. SLA E ESCALONAMENTO
SLA por origem/pipeline/equipe/prioridade; ao vencer, lembrar, escalar, redistribuir ou abrir exceção.

## 26. TAREFAS E CHECKLISTS
Contextuais, com prazo, responsável, prioridade, vínculo, conclusão e modelos reutilizáveis.

## 27. AUTOMAÇÕES DE TAREFA
Mudança de etapa, mensagem recebida, proposta enviada, ausência de resposta, agenda e outros eventos.

## 28. CONFIGURAÇÃO SIM/NÃO
Admin habilita/desabilita Empresas, Leads, Oportunidades, Produtos, Propostas, Agenda, Campanhas, WhatsApp, E-mail, SMS, Voz, Tickets, NPS, Parceiros, Afiliados, ERP, BI, automações, IA e módulos verticais.

## 29. FEATURE FLAGS
Configuração central; não usar `if tenant === ...` espalhado.

## 30. WHATSAPP PRIMEIRA CLASSE
WhatsApp é parte central do CRM, não plugin periférico.

## 31. DUAS MODALIDADES WHATSAPP
**QR Code**, quando permitido pela solução adotada, e **WhatsApp Business Platform/API oficial Meta**, recomendada para escala e automação.

## 32. TRANSPARÊNCIA QR
Explicar claramente limitações e diferenças em relação à API oficial.

## 33. API OFICIAL META
Priorizar para múltiplos atendentes, campanhas, templates, webhooks e operação profissional.

## 34. WIZARD META
**Já possui Business Portfolio/BM? → conectar existente / iniciar configuração oficial → selecionar/criar WABA → adicionar número → validar permissões → webhook → templates → teste → ativar.**

## 35. EMBEDDED SIGNUP
Quando Meta/provider homologado suportar onboarding incorporado oficial, preferir esse fluxo.

## 36. AÇÕES QUE EXIGEM PROPRIEDADE
Autenticação, aceite e verificação empresarial devem ser guiados, não burlados/automatizados indevidamente.

## 37. STATUS WHATSAPP
`NOT_CONFIGURED`, `PENDING`, `CONNECTED`, `DEGRADED`, `DISCONNECTED`, `ACTION_REQUIRED`.

## 38. HEALTHCHECK WHATSAPP
Número, modalidade, provider, webhook, templates, última mensagem, erros e custos quando disponíveis.

## 39. MÚLTIPLOS NÚMEROS
Por tenant, equipe ou unidade.

## 40. INBOX UNIFICADA
WhatsApp + e-mail como núcleo; demais canais habilitáveis.

## 41. FILAS DA INBOX
Não atribuídas, Minhas, Equipe, IA atendendo, Humano atendendo, Aguardando cliente, Aguardando equipe, SLA vencendo, Urgente, Suporte e Financeiro.

## 42. HANDOFF IA/HUMANO
Resumo automático e contexto preservado; cliente não repete tudo.

## 43. RESUMO E EXTRAÇÃO
IA pode resumir conversa e sugerir preenchimento de campos, com validação para dados críticos.

## 44. RESPOSTAS RÁPIDAS
Biblioteca por tenant/equipe/pipeline/etapa.

## 45. TEMPLATES WHATSAPP
Gerenciar aprovados, status, idioma, categoria, variáveis e uso.

## 46. MENSAGENS INTERATIVAS
Botões, listas, carrosséis e flows quando API permitir.

## 47. BROADCAST/CAMPANHAS WHATSAPP
Segmentado, consentido e dentro das regras do provider.

## 48. ANTI-SPAM
Opt-in, opt-out, frequência, quiet hours, dedupe e supressão.

## 49. E-MAIL PRIMEIRA CLASSE
Mesmo peso operacional do WhatsApp para jornadas formais e de relacionamento.

## 50. CONEXÃO DE E-MAIL
SMTP/API por tenant, domínio/remetente, validação e healthcheck.

## 51. EDITOR DE E-MAIL
Visual, responsivo, blocos reutilizáveis, HTML seguro e preview.

## 52. BRANDING AUTOMÁTICO
Logo, cores, tipografia segura, assinatura, rodapé, CTA e identidade do tenant.

## 53. TEMPLATES DE E-MAIL
Boas-vindas, follow-up, proposta, cobrança, evento, agenda, pós-venda, NPS, documentos, suporte, reativação e campanhas.

## 54. TRACKING DE E-MAIL
Entrega, bounce, abertura/clique quando apropriado, resposta e conversão.

## 55. CAMPANHAS — HUB CENTRAL
Campanha reúne canais físicos e digitais em uma única entidade.

## 56. CAMPOS DA CAMPANHA
Nome, objetivo, período, orçamento, público, oferta, CTA, responsável, metas, tags e status.

## 57. CANAIS DE CAMPANHA
WhatsApp, E-mail, Flyer, QR Code, Google, Meta, Instagram, SMS, Voz, Evento, Indicação, Afiliado, Orgânico e canais customizados.

## 58. CRIATIVOS
Múltiplas versões por canal.

## 59. FLYER IMPRESSO
Tiragem, custo, custo unitário, região, ponto de distribuição, responsável, datas, QR/código e quantidade distribuída.

## 60. QR / URL / UTM
QR por campanha/canal/criativo/local; URL curta; UTM padronizada.

## 61. CUPONS E CÓDIGOS
Integração com atribuição e checkout/ERP.

## 62. ATRIBUIÇÃO
First-touch, last-touch, linear ou modelo configurável, sempre transparente.

## 63. FUNIL DE CAMPANHA
**Alcance/Distribuição → Interação → Lead → Qualificação → Oportunidade → Proposta → Venda → Receita.**

## 64. MÉTRICAS DE CAMPANHA
Leads, oportunidades, vendas, receita, conversão, CAC, CPL, ticket, ROI/ROAS quando aplicável e tempo de conversão.

## 65. FÍSICO VS DIGITAL
Comparar flyer/QR/evento com WhatsApp/e-mail/ads sem planilha paralela.

## 66. A/B TEST
Assunto, CTA, mensagem, flyer, landing page e outros criativos quando aplicável.

## 67. AUDIÊNCIA E EXCLUSÕES
Segmentos salvos, listas importadas, filtros dinâmicos, opt-out, já convertidos e listas de supressão.

## 68. PREVIEW E APROVAÇÃO
Antes do disparo: público, canal, mensagem, variáveis, custo estimado quando disponível e checklist de conformidade. Campanhas críticas podem exigir aprovação.

## 69. N8N — MOTOR DE JORNADAS
Event-driven, state-aware e idempotente.

## 70. EVENTOS CRM
`lead.created`, `lead.assigned`, `stage.changed`, `message.received`, `email.opened`, `proposal.sent`, `task.overdue`, `customer.won`, `campaign.converted`, `ticket.opened` etc.

## 71. STATE-AWARE
Antes do follow-up, consultar estado atual.

## 72. CANCELAR AÇÕES OBSOLETAS
Mudança de estágio invalida timers e mensagens incompatíveis.

## 73. IDEMPOTÊNCIA / RETRY / DLQ
Nenhuma duplicidade; falhas temporárias com retry controlado e dead-letter/alerta.

## 74. BUILDER DE AUTOMAÇÃO
UI: **Quando acontecer X → se condição Y → executar Z**.

## 75. AÇÕES
Criar tarefa, mudar etapa, atribuir, enviar WhatsApp, enviar e-mail, adicionar tag, atualizar campo, criar ticket, webhook/N8N e notificar gestão.

## 76. PRESETS
Novo lead, lead parado, proposta sem resposta, pós-venda, reativação, NPS, cobrança, onboarding e eventos.

## 77. RIO MED
Múltiplos vendedores, B2B/B2C, equipamentos, locação/venda, proposta, comissão, follow-up e estoque relacionado.

## 78. ANA MADÚ
Clientes, peças personalizadas, preferências, datas especiais, orçamento, produção, entrega e relacionamento premium.

## 79. IMPULSIONANDO
Lead → diagnóstico → demo → proposta → contrato → billing → onboarding → tenant → upsell/renovação, integrado a parceiros/comissões e campanhas.

## 80. ENJOY
Briefing, imóveis, corretores, visitas, propostas e automações específicas via objetos verticais.

## 81. CHRISMED/COLORS
Públicos/jornadas segmentados com separação de dados sensíveis do CRM comercial.

## 82. BARES/RESTAURANTES
CRM integrado a PDV, consumo, reservas, eventos, NPS, fidelização e reativação.

## 83. IMPORTAÇÃO/EXPORTAÇÃO
CSV/XLSX com preview, mapping, dedupe, validação, relatório de erros; exportação com permissão e auditoria.

## 84. API E WEBHOOKS
APIs internas claras; webhooks com assinatura/origem, schema, idempotência, replay protection, logs e métricas.

## 85. CATÁLOGO DE INTEGRAÇÕES
Meta/WhatsApp, e-mail, OpenAI, N8N, ERP, pagamentos, agenda, Google, Meta Ads e outras.

## 86. STATUS DE INTEGRAÇÃO
`ACTIVE`, `PARTIAL`, `ACTION_REQUIRED`, `DISCONNECTED`, `ERROR`, `UNKNOWN`.

## 87. AGENTES ESPECIALIZADOS
Cada tenant usa seu próprio agente visível; Impulsionito permanece orquestrador interno quando aplicável.

## 88. AGENTE COMO COPILOTO
Resumir, sugerir resposta, próxima ação, preencher campos, consultar dados e executar ações permitidas.

## 89. AGENTE PROATIVO
Detectar lead parado, SLA, configuração ausente, oportunidade quente, campanha fraca e integração quebrada.

## 90. AGENTE NÃO INVENTA
Nenhum status, compra, estoque, proposta ou resultado fictício.

## 91. BI EXECUTIVO
Leads, origem, conversão, pipeline, receita, CAC, ROI, tempo de resposta, SLA, campanhas, canais, vendedores, churn e retenção.

## 92. BI COMUNICAÇÃO
Mensagens, entrega, leitura quando disponível, resposta, tempo de primeira resposta, conversão e custo.

## 93. BI VENDEDOR
Leads, contatos, tarefas, SLA, propostas, conversão, receita e metas.

## 94. BI CAMPANHA
Canal, criativo, audiência, custo, leads, vendas, receita e ROI.

## 95. BI JORNADA
Gargalos, tempo por etapa e taxas de avanço.

## 96. METAS E FORECAST
Metas por pessoa/equipe/unidade/pipeline; forecast identificado como estimativa.

## 97. ALERTAS/NOTIFICAÇÕES
Lead sem contato, tarefa vencida, SLA, proposta parada, conversa sem resposta, campanha com erro, integração desconectada. Dashboard, e-mail, WhatsApp interno e push conforme configuração.

## 98. RESUMO DIÁRIO
Opcional por usuário: prioridades, leads, tarefas, propostas e exceções.

## 99. GESTÃO POR EXCEÇÃO
Gestor recebe o que exige intervenção, não ruído repetitivo.

## 100. RBAC/RLS
Perfis e permissões por tenant, campo, pipeline e unidade; zero vazamento cross-tenant.

## 101. LGPD
Finalidade, consentimento quando aplicável, minimização, retenção, opt-out, direitos e auditoria.

## 102. AUDITORIA
Login, exportação, negócio, responsável, campanha, regra, integração e permissões.

## 103. SEGURANÇA
Vault, MFA em perfis críticos, least privilege, rate limit, sessão segura, endpoints protegidos, backup/restore.

## 104. PERFORMANCE/MOBILE/ACESSIBILIDADE
Paginação, busca indexada, filas, mobile-first e WCAG AA.

## 105. DESIGN INSTRUCIONAL
Cada tela responde: onde estou, o que importa, o que aconteceu e o que faço agora.

## 106. ZERO MOCK
Produção somente com dados reais; demo isolada e identificada.

## 107. TESTE — WHATSAPP QR
Conectar sessão autorizada → status → inbound/outbound → reconexão → falha visível.

## 108. TESTE — API OFICIAL META
Onboarding → permissões → número → webhook → template → envio/recebimento → healthcheck.

## 109. TESTE — NOVO LEAD WHATSAPP
Mensagem → contato/dedupe → oportunidade → atribuição → SLA → agente/humano → histórico.

## 110. TESTE — NOVO LEAD E-MAIL
E-mail → contato → thread → responsável → oportunidade/ticket.

## 111. TESTE — MULTI-NÚMERO
Roteamento correto por tenant/equipe/número.

## 112. TESTE — HANDOFF
Cliente não repete contexto.

## 113. TESTE — PIPELINE/STATE-AWARE
Mudança de etapa executa somente automações compatíveis e cancela antigas.

## 114. TESTE — SLA
Prazo → lembrete → escalonamento.

## 115. TESTE — CAMPANHA E-MAIL
Segmento → envio → tracking → lead → venda → receita → atribuição.

## 116. TESTE — CAMPANHA WHATSAPP
Template → envio → resposta → oportunidade → conversão.

## 117. TESTE — FLYER
QR exclusivo → lead → venda → receita → atribuição ao canal físico.

## 118. TESTE — A/B
Versões com métricas independentes.

## 119. TESTE — OPT-OUT
Contato opt-out não recebe comunicação incompatível.

## 120. TESTE — IDEMPOTÊNCIA
Webhook duplicado não duplica registros/mensagens.

## 121. TESTE — PERMISSÕES
Tenant A tenta Tenant B → NEGADO + auditado.

## 122. TESTE — AGENTE
Pergunta/ação usa CRM real e respeita permissão.

## 123. TESTE — MULTICANAL
E-mail, WhatsApp, flyer e ads comparados na mesma campanha.

## 124. TESTE — RIO MED
Lead → vendedor → follow-up → proposta → venda/locação → comissão → retenção.

## 125. TESTE — ANA MADÚ
Lead → briefing → orçamento → produção/entrega → relacionamento.

## 126. TESTE — IMPULSIONANDO
Lead → proposta → contratação → tenant → onboarding → cobrança → upsell.

## 127. CRITÉRIO DE ACEITE UX
Usuário novo entende o CRM sem treinamento extenso.

## 128. CRITÉRIO DE ACEITE CONFIGURAÇÃO
Admin liga/desliga recursos sem programador.

## 129. CRITÉRIO WHATSAPP
Tenant sabe conectar por QR ou API oficial e enxerga modalidade/status/saúde.

## 130. CRITÉRIO META
Wizard reduz configuração oficial a etapas guiadas e explicita dependências externas.

## 131. CRITÉRIO E-MAIL
Templates, campanhas, tracking e conversão integrados ao CRM.

## 132. CRITÉRIO AUTOMAÇÃO
N8N age pelo estado real, não timer cego.

## 133. CRITÉRIO CAMPANHAS
Dashboard conecta disparo/distribuição a venda e receita sempre que origem identificável.

## 134. CRITÉRIO BI
Dados reais, projeções explicitamente identificadas.

## 135. CRITÉRIO CORE
Nenhum tenant crítico exige fork do CRM.

## 136. CRITÉRIO MOBILE
Vendedor opera principais jornadas no celular.

## 137. REGRA FINAL AO CAUÃ
Se o usuário precisar aprender um sistema complexo para fazer follow-up, a UX está errada. Se o WhatsApp não estiver no centro, está incompleto. Se e-mail e WhatsApp ficarem em silos, está incompleto. Se a gestão precisar pedir código para habilitar módulo, está incompleto. Se vendedor lembrar sozinho da próxima ação, está incompleto. Se campanha terminar em relatório de disparos sem receita, está incompleto. Se agente não souber contexto real, está incompleto. Se automação mandar mensagem incompatível com o estágio atual, está errado. Se o tenant não conseguir conectar a API oficial Meta por um wizard claro, está incompleto. Se QR e API oficial forem apresentados como equivalentes, está errado.

## 138. RESULTADO FINAL
O CRM Impulsionando deve operar como **memória + comunicação + orquestração + inteligência**: **CAPTA → IDENTIFICA → QUALIFICA → COMUNICA → ATRIBUI → LEMBRA → CONVERTE → FATURA → RELACIONA → RETÉM → REATIVA → MEDE → APRENDE**, com WhatsApp e e-mail como canais centrais e todos os demais módulos habilitáveis de forma parametrizada.

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.  
**NÃO EXECUTAR AUTOMATICAMENTE.**