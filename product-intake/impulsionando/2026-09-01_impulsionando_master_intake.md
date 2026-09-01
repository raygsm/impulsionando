# SUPERPROMPT MESTRE — PRODUCT INTAKE IMPULSIONANDO

## IMPULSIONITO + CORE FULL — Auditoria total, ERP/RP, CRM, Financeiro, Contábil, Saúde, Agenda, Teleatendimento, Automação, Cobrança, Billing, Templates, Integrações, UX/UI, Segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**TENANT/PLATAFORMA:** Impulsionando  
**AGENTE CENTRAL E ORQUESTRADOR:** IMPULSIONITO  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, INFRAESTRUTURA, N8N, FRONTEND, BACKEND, PRODUÇÃO OU CREDENCIAIS A PARTIR DESTE REGISTRO.** Este documento é exclusivamente o Livro de Anotações / Product Intake para implementação futura pelo programador.

---

# 1. PRINCÍPIO CENTRAL

A própria Impulsionando deve ser simultaneamente:

1. plataforma SaaS/multitenant;
2. tenant master;
3. operação real da Impulsionando;
4. laboratório/homologador de todos os módulos oferecidos aos clientes;
5. showcase comercial do Plano Full;
6. centro de administração de clientes, planos, módulos, cobrança, integrações e agentes.

Nenhum módulo vendido a um cliente deve existir apenas no tenant do cliente sem existir de forma testável na Impulsionando.

A Impulsionando precisa conseguir testar, demonstrar e operar **todos os módulos verticais** do ecossistema sem transformar o dashboard em uma interface confusa.

---

# 2. REGRA DE CONTINUIDADE

Na futura execução:

**AUDITAR → MAPEAR → PRESERVAR → CORRIGIR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Regras:

- correto → preservar;
- incompleto → completar;
- errado → corrigir;
- duplicado → consolidar;
- mock → substituir por fonte real;
- inseguro → blindar;
- integração desconectada → reintegrar;
- integração apenas desenhada → não considerar pronta;
- tela sem backend → não considerar funcional;
- backend sem fluxo visível → completar jornada;
- código publicado sem front atualizado → não considerar entregue.

---

# 3. AUDITORIA MESTRE OBRIGATÓRIA

Antes de qualquer implementação, o programador deverá produzir uma matriz do estado real atual contendo, por módulo:

- existe?;
- frontend existe?;
- backend existe?;
- banco existe?;
- integração existe?;
- integração está autenticada?;
- webhook está ativo?;
- dados reais ou mock?;
- testes existentes?;
- logs?;
- segurança/RLS?;
- responsável?;
- prioridade?;
- dependências?;
- status de produção?;
- lacunas?;
- ação recomendada.

Classificar cada item como:

- PASS;
- PARCIAL;
- AUSENTE;
- BLOQUEADO;
- LEGADO;
- DUPLICADO;
- INSEGURO;
- NÃO TESTADO.

---

# 4. IMPULSIONITO — PROTAGONISTA ABSOLUTO

O Impulsionito é o cérebro vivo, orgânico e orquestrador central do ecossistema.

Ele deve compreender e conectar:

- clientes;
- tenants;
- planos;
- contratos;
- cobrança;
- inadimplência;
- suspensão;
- reativação;
- CRM;
- ERP/RP;
- financeiro;
- contábil;
- estoque;
- vendas;
- agenda;
- saúde;
- teleatendimento;
- tickets;
- N8N;
- WhatsApp;
- e-mail;
- integrações;
- agentes especializados;
- BI;
- segurança;
- auditoria;
- publicação/deploy;
- saúde de serviços.

O Impulsionito não pode ser um chatbot decorativo.

Deve ser um **orquestrador operacional com contexto, ferramentas, regras, limites, logs, permissões e handoff humano**.

---

# 5. IMPULSIONITO — CAPACIDADES MÍNIMAS

Deve poder:

- criar/consultar tarefas;
- localizar cliente;
- verificar plano;
- explicar cobrança;
- consultar status de pagamento;
- explicar suspensão;
- consultar integrações;
- identificar falha;
- orientar usuário;
- criar ticket;
- sugerir ação;
- disparar fluxos permitidos;
- gerar resumo executivo;
- consultar dashboards;
- apontar pendências;
- acessar documentação permitida;
- delegar a agentes especializados;
- coordenar handoff para humano.

Nunca:

- inventar status;
- expor segredos;
- executar ação crítica sem permissão;
- ultrapassar tenant isolation;
- declarar integração ativa sem evidência.

---

# 6. ARQUITETURA DE AGENTES

Impulsionito = root/orchestrator.

Agentes especializados de tenants devem ser instâncias subordinadas, com:

- chave OpenAI própria por agente/tenant quando esse for o padrão definido;
- segredo armazenado no Supabase Vault;
- runtime próprio;
- escopo de conhecimento próprio;
- permissões próprias;
- logs;
- identificação clara;
- ligação ao Impulsionito;
- fallback/handoff.

Criar painel central de agentes mostrando:

- tenant;
- agente;
- status;
- modelo;
- chave configurada? (sem exibir segredo);
- última chamada;
- erros;
- custo/uso quando disponível;
- knowledge base;
- integrações;
- healthcheck.

---

# 7. PLANOS IMPULSIONANDO

Auditar integralmente os planos atuais.

Cada plano deve ter:

- nome;
- preço;
- periodicidade;
- módulos incluídos;
- limites;
- usuários;
- suporte;
- integrações;
- SLA;
- regras de upgrade/downgrade;
- contrato;
- política de cobrança;
- inadimplência;
- suspensão;
- reativação;
- vigência;
- customizações incluídas.

Não manter regras espalhadas por componentes ou hard-coded.

Criar **catálogo central parametrizável de planos**.

---

# 8. PLANO FULL

O Plano Full deve funcionar como suíte máxima do ecossistema.

Deve poder habilitar, conforme tenant e setor:

- CRM;
- ERP/RP;
- financeiro;
- contábil;
- estoque;
- vendas;
- compras;
- PDV;
- e-commerce;
- agenda;
- profissionais;
- pega-agenda;
- saúde;
- prontuário eletrônico;
- teleatendimento;
- eventos;
- NPS;
- tickets;
- ouvidoria;
- automações;
- N8N;
- e-mail;
- WhatsApp;
- SMS;
- VoIP quando aplicável;
- BI;
- relatórios;
- IA/agente especializado;
- contratos;
- assinatura eletrônica;
- cobrança;
- NF;
- integrações;
- marketplace/vitrine/clube quando aplicável.

A Impulsionando deve conseguir **ativar/desativar módulos por feature flags e plano**, sem bifurcar código por cliente.

---

# 9. CICLO DE VIDA DO CLIENTE/TENANT

Jornada completa:

**lead → proposta → contratação → aceite → pagamento → criação automática do tenant → subdomínio → usuários → plano → módulos → onboarding → operação → cobrança recorrente → suporte → expansão → suspensão quando cabível → reativação → encerramento.**

Tudo auditável.

---

# 10. CRIAÇÃO DE CLIENTE

Dashboard master deve permitir:

- criar cliente manualmente;
- importar clientes em lote;
- duplicar configuração-base por template;
- selecionar segmento;
- selecionar plano;
- escolher módulos;
- domínio/subdomínio;
- branding;
- usuários iniciais;
- agente especializado;
- integrações;
- contrato;
- cobrança;
- ambiente.

Criar wizard progressivo, não formulário monstruoso.

---

# 11. IMPORTAÇÃO EM MASSA

Permitir CSV/XLSX com:

- preview;
- mapeamento de campos;
- validação;
- deduplicação;
- normalização;
- regras de conflito;
- relatório de erros;
- rollback lógico quando possível;
- auditoria.

Aplicável a:

- clientes;
- leads;
- produtos;
- estoque;
- fornecedores;
- profissionais;
- contatos;
- usuários;
- transações permitidas.

---

# 12. CRM FULL

CRM deve cobrir:

- leads;
- contatos;
- empresas;
- negócios/oportunidades;
- pipelines;
- tarefas;
- atividades;
- reuniões;
- origem;
- UTM;
- campanhas;
- scoring;
- tags;
- segmentos;
- histórico;
- consentimento;
- jornadas;
- NPS;
- churn;
- indicação.

Criar visão 360º real.

---

# 13. FUNIL IMPULSIONANDO

Pipeline da própria Impulsionando:

**lead → qualificado → diagnóstico → demonstração → proposta → negociação → contrato → pagamento → onboarding → ativo → expansão/upsell → renovação.**

Medir conversão por etapa.

---

# 14. GROWTH

Comitê de growth deve analisar:

- aquisição;
- ativação;
- conversão;
- retenção;
- expansão;
- indicação;
- churn;
- CAC;
- LTV;
- payback;
- MRR;
- ARR;
- ARPA;
- NRR;
- GRR.

Dashboards devem distinguir métricas reais de estimativas.

---

# 15. ERP/RP — PRINCÍPIO

O ERP/RP da Impulsionando deve ser **mais simples, mais integrado e mais inteligente que um ERP tradicional**, mantendo profundidade.

Deve evitar telas burocráticas e duplicação de cadastro.

Um cadastro único deve alimentar CRM + ERP + financeiro + fiscal + comunicação + BI.

---

# 16. ERP/RP — MÓDULOS

No mínimo:

- clientes;
- fornecedores;
- produtos;
- serviços;
- estoque;
- compras;
- vendas;
- pedidos;
- faturamento;
- contas a pagar;
- contas a receber;
- fluxo de caixa;
- centros de custo;
- categorias;
- conciliação;
- NF;
- impostos/parametrização;
- relatórios;
- auditoria.

---

# 17. FINANCEIRO

Dashboard financeiro:

- saldo;
- contas a receber;
- contas a pagar;
- vencidos;
- previstos;
- fluxo de caixa;
- receita recorrente;
- receita por plano;
- despesa por categoria;
- margem;
- inadimplência;
- projeções.

---

# 18. CONCILIAÇÃO BANCÁRIA

Criar arquitetura para:

- extrato bancário;
- importação OFX/CSV quando necessário;
- Open Finance/API bancária quando disponível;
- matching automático;
- regras de conciliação;
- divergências;
- reconciliação manual assistida;
- histórico.

Nunca declarar integração bancária ativa sem fonte real.

---

# 19. ÁREA DO CONTADOR

Criar perfil **CONTADOR / ESCRITÓRIO CONTÁBIL** replicável para qualquer tenant.

O contador deve ter acesso exclusivo e segregado ao que precisa, podendo visualizar conforme permissão:

- faturamento;
- notas fiscais;
- contas;
- extratos;
- conciliação bancária;
- relatórios financeiros;
- documentos fiscais;
- DRE gerencial;
- centros de custo;
- exportações;
- pendências;
- fechamento mensal.

Não deve acessar CRM comercial, mensagens privadas, prontuários, dados sensíveis não necessários ou administração técnica.

---

# 20. PORTAL DO CONTADOR

Dashboard próprio:

- fechamento do mês;
- NF emitidas;
- NF com erro;
- conciliação pendente;
- documentos faltantes;
- contas classificadas;
- inconsistências;
- exportações disponíveis;
- alertas.

Permitir comentários/solicitações ao financeiro sem usar WhatsApp paralelo como fonte principal.

---

# 21. DRE GERENCIAL

Implementar DRE gerencial com:

- receita bruta;
- deduções;
- receita líquida;
- custos diretos;
- margem bruta;
- despesas operacionais;
- resultado operacional;
- outras receitas/despesas;
- resultado.

Parametrizável por tenant e regime gerencial.

Não confundir DRE gerencial com obrigação fiscal oficial sem validação contábil.

---

# 22. COBRANÇA / BILLING

Auditar toda cobrança da Impulsionando.

Deve existir:

- criação da assinatura;
- cobrança inicial;
- recorrência;
- Pix/cartão/boleto quando provider permitir;
- webhook;
- retry;
- dunning;
- falha;
- inadimplência;
- conciliação;
- recibo/NF;
- suspensão;
- reativação;
- cancelamento;
- upgrade/downgrade;
- prorrata quando aplicável.

---

# 23. SUSPENSÃO AUTOMÁTICA

Regras devem ser centralizadas e parametrizadas.

Fluxo sugerido:

**pagamento vencido → régua de lembrete → grace period → suspensão parcial/total conforme contrato → aviso → pagamento identificado → reativação automática.**

Nunca apagar dados por inadimplência.

---

# 24. REATIVAÇÃO

Pagamento confirmado por webhook/conciliação:

- atualizar status;
- remover suspensão;
- restaurar acesso;
- registrar evento;
- enviar mensagem;
- gerar auditoria.

Idempotência obrigatória.

---

# 25. NF AUTOMÁTICA

Criar parametrização por tenant:

- emissão automática;
- emissão manual;
- emissão por serviço/pagamento;
- série;
- natureza;
- município;
- regras fiscais;
- cancelamento;
- retry;
- erro;
- armazenamento;
- envio.

Nunca duplicar NF em retries.

---

# 26. GESTÃO DE CONTRATOS

Contratos versionados por:

- plano;
- tenant;
- módulo;
- serviço;
- usuário/profissional quando aplicável.

Guardar aceite, data/hora, versão, evidência e provedor de assinatura se houver.

---

# 27. DASHBOARD MASTER IMPULSIONANDO

Deve ser extremamente organizado.

Primeira tela deve responder:

- o que exige atenção agora?;
- quantos clientes ativos?;
- quais inadimplentes?;
- quais suspensos?;
- quais integrações falharam?;
- quais tickets críticos?;
- quais tenants com erro?;
- qual MRR/ARR?;
- quais novos leads?;
- quais deploys pendentes?;
- quais agentes com falha?;
- quais módulos com incidentes?

Não despejar todos os módulos na home.

---

# 28. ARQUITETURA DE NAVEGAÇÃO MASTER

Organizar por domínios:

1. Visão Geral
2. Clientes/Tenants
3. Comercial/CRM
4. Financeiro/Billing
5. ERP/RP
6. Contábil
7. Comunicação
8. Automações
9. Agentes/IA
10. Integrações
11. Módulos Verticais
12. Suporte
13. BI/Relatórios
14. Segurança/Auditoria
15. Plataforma/Deploy
16. Configurações

Submenus contextuais e busca global.

---

# 29. COMMAND CENTER

Criar central operacional com estados:

- P0 crítico;
- P1 alto;
- P2 atenção;
- P3 informativo.

Eventos:

- tenant fora do ar;
- pagamento falhando;
- webhook falhando;
- NF falhando;
- integração desconectada;
- agente indisponível;
- N8N com erro;
- e-mail/WhatsApp com falha;
- deploy divergente;
- backup falho.

---

# 30. MÓDULOS VERTICAIS — REGRA

A própria Impulsionando precisa poder habilitar e testar todos os módulos verticais existentes.

Eles devem existir como **módulos do Core**, não como código isolado de cliente.

---

# 31. MÓDULO SAÚDE

A Impulsionando deve possuir ambiente de homologação funcional para:

- pacientes;
- profissionais de saúde;
- especialidades;
- agenda;
- prontuário;
- teleatendimento;
- prescrições/documentos quando juridicamente permitido;
- exames/documentos;
- consentimentos;
- pagamentos;
- retornos;
- eventos;
- ocupacional quando aplicável.

Dados de homologação devem ser explicitamente demo/teste, nunca dados clínicos reais misturados.

---

# 32. PRONTUÁRIO ELETRÔNICO

Módulo testável pela Impulsionando com:

- identificação do paciente;
- histórico;
- atendimentos;
- notas clínicas;
- documentos;
- anexos;
- alergias;
- medicamentos;
- diagnósticos/códigos quando aplicável;
- consentimentos;
- autoria;
- assinatura;
- trilha de auditoria;
- restrição de acesso.

Prontuário exige segurança e segregação máximas.

---

# 33. TELEATENDIMENTO

Módulo com:

- agendamento;
- sala segura;
- link temporário;
- autenticação;
- consentimento;
- check-in;
- vídeo/áudio via provider adequado;
- fallback;
- registro do atendimento;
- encerramento;
- pós-atendimento.

Não armazenar vídeo por padrão sem necessidade, consentimento e política definida.

---

# 34. AGENDA UNIVERSAL

Agenda como módulo Core reutilizável para:

- reuniões;
- consultas;
- serviços;
- profissionais;
- manutenção;
- eventos;
- reservas;
- tarefas.

Motor deve suportar:

- disponibilidade;
- duração;
- intervalo;
- buffers;
- deslocamento;
- recorrência;
- bloqueios;
- feriados;
- timezone;
- conflito;
- recursos físicos.

---

# 35. PEGA-AGENDA UNIVERSAL

Framework reaproveitável para oportunidades de agenda:

- profissional elegível;
- disponibilidade;
- região;
- especialidade;
- prioridade;
- aceite;
- lock transacional;
- fallback;
- cancelamento;
- reoferta.

---

# 36. EVENTOS

Módulo universal:

- criação;
- convites;
- segmentação;
- inscrição;
- confirmação;
- QR/check-in;
- capacidade;
- lista de presença;
- pesquisa;
- NPS;
- relatórios;
- comunicação.

---

# 37. PDV

Módulo testável para varejo/bar/restaurante:

- produtos;
- preços;
- estoque;
- comandas;
- mesas;
- pagamento;
- fechamento;
- NF/cupom quando integrado;
- baixa de estoque;
- CRM do consumidor;
- BI;
- pesquisa pós-consumo.

---

# 38. ESTOQUE

Core universal:

- múltiplos depósitos;
- saldo;
- reservado;
- disponível;
- mínimo;
- lote;
- validade quando aplicável;
- entrada;
- saída;
- transferência;
- ajuste;
- inventário;
- custo médio;
- rastreabilidade.

---

# 39. E-COMMERCE / CHECKOUT

Framework para:

- catálogo;
- carrinho;
- cupom;
- cliente;
- checkout transparente quando provider permitir;
- pagamento;
- pedido;
- estoque;
- frete;
- tracking;
- CRM;
- abandono;
- recuperação.

---

# 40. LOGÍSTICA / FRETE

Módulo Core preparado para providers como Melhor Envio ou outros:

- cotação;
- etiqueta;
- despacho;
- código de rastreio;
- eventos;
- entrega;
- exceção;
- devolução;
- logística reversa.

---

# 41. WHATSAPP

Auditar:

- QR/pairing quando solução permitir;
- API oficial;
- inbound;
- outbound;
- templates;
- consentimento;
- opt-out;
- rate limits;
- webhook;
- roteamento por tenant;
- agentes;
- handoff humano.

---

# 42. E-MAIL

Framework central com:

- domínio/remetente por tenant;
- SMTP/API;
- templates;
- branding;
- variáveis;
- fila;
- retry;
- bounce;
- complaint;
- unsubscribe quando aplicável;
- tracking permitido;
- logs.

---

# 43. TEMPLATES DE E-MAIL

Criar biblioteca global + override por tenant.

Tipos:

- boas-vindas;
- convite;
- cadastro;
- cobrança;
- vencimento;
- suspensão;
- reativação;
- pagamento;
- NF;
- agenda;
- alteração de horário;
- cancelamento;
- remarcação;
- suporte;
- segurança;
- relatório;
- NPS;
- contrato;
- recuperação.

Branding correto, responsivo e acessível.

---

# 44. SMS / VOIP

Módulos opcionais por provider, com feature flag.

Não ativar custo externo sem autorização/configuração.

---

# 45. N8N

Auditar conexão real e todos os workflows.

Cada fluxo deve ter:

- nome;
- tenant;
- trigger;
- propósito;
- inputs;
- outputs;
- secrets;
- owner;
- logs;
- retry;
- idempotência;
- erro/dead-letter;
- status.

Criar catálogo de workflows no dashboard.

---

# 46. EVENT BUS

Padronizar eventos de negócio:

- lead.created;
- customer.created;
- subscription.created;
- payment.approved;
- payment.failed;
- subscription.past_due;
- tenant.suspended;
- tenant.reactivated;
- invoice.issued;
- appointment.created;
- order.created;
- shipment.dispatched;
- ticket.opened;
- nps.received;
- agent.error.

Evitar integrações ponto-a-ponto caóticas.

---

# 47. API GATEWAY

Centralizar integrações externas.

Requisitos:

- autenticação;
- autorização;
- rate limiting;
- logs;
- secrets;
- versionamento;
- timeout;
- retry;
- circuit breaker quando aplicável;
- idempotência;
- healthcheck.

---

# 48. WEBHOOKS

Todo webhook:

- verificar assinatura/origem;
- validar schema;
- registrar payload de forma segura;
- idempotência;
- evitar replay;
- retry;
- DLQ;
- métricas;
- auditoria.

---

# 49. INTEGRAÇÕES — INVENTÁRIO

Criar inventário central das ferramentas atuais e desejadas, incluindo, conforme existência real:

- OpenAI;
- Supabase;
- GitHub;
- Cloudflare;
- Hostinger;
- Mercado Pago;
- N8N;
- Google Analytics;
- Google Ads;
- Meta;
- WhatsApp;
- e-mail;
- Melhor Envio;
- MaisFy;
- B3/Open Finance em verticais aplicáveis;
- providers fiscais;
- bancos;
- calendários;
- storage;
- assinatura eletrônica.

Para cada uma: ACTIVE / PARTIAL / DISCONNECTED / UNKNOWN / DEPRECATED.

---

# 50. REINTEGRAÇÕES

Qualquer ferramenta antes conectada e hoje ausente deve ser identificada e classificada:

- necessária?;
- substituída?;
- duplicada?;
- obsoleta?;
- credencial vencida?;
- webhook quebrado?;
- código legado?

Somente reintegrar após diagnóstico.

---

# 51. BI MASTER

Dashboard executivo da Impulsionando:

- MRR;
- ARR;
- receita;
- inadimplência;
- churn;
- NRR;
- clientes ativos;
- novos clientes;
- tenants por plano;
- tickets;
- SLA;
- uso de módulos;
- integrações;
- agentes;
- falhas;
- deploys;
- consumo de IA quando disponível.

---

# 52. BI POR TENANT

Master pode drill-down para:

- saúde operacional;
- receita;
- uso;
- CRM;
- automações;
- comunicação;
- erros;
- tickets;
- agentes;
- integrações.

Respeitar isolamento e auditoria.

---

# 53. RELATÓRIOS

Todos os relatórios relevantes devem ser exportáveis conforme permissão e possuir:

- data/hora;
- filtros;
- fonte;
- tenant;
- período;
- responsável;
- versão quando necessário.

---

# 54. CENTRAL DE COMUNICAÇÃO

Unificar:

- e-mail;
- WhatsApp;
- SMS;
- notificações;
- templates;
- segmentos;
- campanhas;
- transacionais;
- logs.

Separar marketing de mensagens transacionais.

---

# 55. CAMPANHAS

Permitir:

- audiência;
- filtros;
- exclusões;
- template;
- agendamento;
- limite;
- consentimento;
- preview;
- aprovação;
- resultado;
- conversão.

---

# 56. SUPORTE

Tickets universais:

- técnico;
- financeiro;
- integração;
- acesso;
- cobrança;
- produto;
- incidente;
- sugestão;
- ouvidoria.

SLA configurável por plano.

---

# 57. OUVIDORIA

Módulo separado quando necessário:

- protocolo;
- categoria;
- gravidade;
- responsável;
- prazo;
- evidências;
- resposta;
- encerramento;
- auditoria.

---

# 58. KNOWLEDGE BASE

Base de conhecimento por:

- Core;
- produto;
- módulo;
- tenant;
- agente;
- suporte.

Versionada e com status de publicação.

---

# 59. UX/UI — PRINCÍPIO

A plataforma master deve reduzir carga cognitiva.

Aplicar:

- design system;
- hierarquia;
- progressive disclosure;
- dashboards por função;
- menus por domínio;
- breadcrumbs;
- busca global;
- atalhos;
- filtros persistentes;
- mobile responsivo;
- acessibilidade WCAG AA.

---

# 60. DESIGN INSTRUCIONAL

Toda tela precisa responder:

- Onde estou?;
- O que aconteceu?;
- O que exige atenção?;
- O que posso fazer?;
- Qual é o próximo passo?

---

# 61. PERSONAS DO DASHBOARD MASTER

Criar experiência específica para:

- CEO/direção;
- comercial;
- financeiro;
- contador;
- suporte;
- operações;
- programador/infra;
- marketing/growth;
- master Impulsionando.

Não mostrar tudo para todos.

---

# 62. SEGURANÇA

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- MFA;
- secrets manager/Vault;
- criptografia;
- princípio do menor privilégio;
- logs;
- auditoria;
- backups;
- restore tests;
- rate limiting;
- proteção de endpoints;
- sessões seguras;
- políticas de senha;
- bloqueio/brute force;
- monitoramento.

---

# 63. DADOS DE SAÚDE

Prontuários e dados sensíveis devem ter camada reforçada:

- acesso mínimo;
- logging;
- segregação;
- consentimentos;
- políticas de retenção;
- LGPD;
- controles de exportação.

---

# 64. AUDITORIA GLOBAL

Registrar ações críticas:

- login;
- alteração de plano;
- criação de tenant;
- suspensão;
- reativação;
- NF;
- pagamento;
- permissões;
- secrets metadata;
- integrações;
- exportações;
- prontuário;
- contratos;
- deploys;
- agentes.

---

# 65. OBSERVABILIDADE

Criar painel de saúde de:

- frontend;
- APIs;
- Supabase;
- Edge Functions;
- N8N;
- pagamentos;
- e-mail;
- WhatsApp;
- OpenAI/agentes;
- storage;
- deploy;
- banco;
- backups;
- webhooks.

---

# 66. DEPLOY E PUBLICAÇÃO

A maior regra operacional:

**commit não significa publicação.**

Dashboard técnico deve mostrar:

- branch;
- SHA esperado;
- SHA em produção;
- build;
- deploy;
- domínio;
- healthcheck;
- cache/CDN;
- data/hora.

Só concluir quando a versão correta estiver servida.

---

# 67. FEATURE FLAGS

Módulos por tenant devem ser controlados por feature flags/configuração central.

Evitar `if tenant === ...` espalhado.

---

# 68. CONFIGURAÇÃO POR TENANT

Centralizar:

- branding;
- plano;
- módulos;
- moeda;
- timezone;
- e-mail;
- WhatsApp;
- pagamentos;
- fiscal;
- agente;
- integrações;
- contratos;
- SLA;
- templates.

---

# 69. MULTITENANCY

Validar isolamento extremo:

Tenant A nunca deve acessar:

- dados;
- documentos;
- mensagens;
- pagamentos;
- usuários;
- prontuários;
- arquivos;
- logs operacionais

do Tenant B.

---

# 70. TESTE — CRIAÇÃO DE TENANT

Simular:

**novo cliente → plano → pagamento → tenant → subdomínio → usuário → branding → módulos → agente → onboarding.**

---

# 71. TESTE — BILLING

Cenários:

- pagamento aprovado;
- cartão recusado;
- Pix expirado;
- boleto vencido;
- webhook duplicado;
- retry;
- inadimplência;
- suspensão;
- pagamento posterior;
- reativação.

---

# 72. TESTE — CONTÁBIL

Simular:

- venda;
- cobrança;
- pagamento;
- NF;
- extrato;
- conciliação;
- classificação;
- DRE;
- acesso do contador.

---

# 73. TESTE — ERP

Simular venda de produto e serviço:

- pedido;
- cliente;
- estoque;
- financeiro;
- NF;
- CRM;
- BI;
- comunicação.

---

# 74. TESTE — SAÚDE

Em ambiente demo/homologação:

**paciente teste → agenda → teleatendimento → prontuário → documento → encerramento → relatório.**

Zero dado clínico real de terceiro em demo.

---

# 75. TESTE — AGENDA

Validar:

- horários;
- intervalos;
- buffers;
- conflito;
- recorrência;
- cancelamento;
- remarcação;
- timezone;
- profissional;
- recurso.

---

# 76. TESTE — COMUNICAÇÃO

Validar:

- e-mail transacional;
- template;
- branding;
- WhatsApp;
- unsubscribe quando aplicável;
- bounce;
- retry;
- logs.

---

# 77. TESTE — IMPULSIONITO

Perguntas/ações de teste:

- “Quais tenants estão com problema hoje?”
- “Quais cobranças falharam?”
- “Quais integrações estão desconectadas?”
- “Qual cliente está suspenso e por quê?”
- “Qual foi a última NF emitida?”
- “Quais workflows N8N falharam?”
- “Quais agentes estão sem chave configurada?”
- “Quais módulos ainda não foram homologados?”

Toda resposta deve vir de fontes reais.

---

# 78. TESTE — PERMISSÕES

Contador tenta CRM → NEGADO.  
Financeiro tenta prontuário → NEGADO.  
Suporte tenta secret → NEGADO.  
Tenant A tenta Tenant B → NEGADO.  
Usuário comum tenta suspensão → NEGADO.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 79. TESTE — INTEGRAÇÕES

Para cada integração:

- credencial existe?;
- healthcheck?;
- webhook?;
- fluxo real?;
- retry?;
- erro visível?;
- logs?;
- fallback?;
- última execução?

---

# 80. TESTE — PUBLICAÇÃO

Após alteração de front:

- commit correto;
- branch correta;
- build correto;
- deploy correto;
- SHA em produção;
- cache invalidado;
- domínio correto;
- screenshot/healthcheck;
- smoke test.

---

# 81. ZERO MOCK EM PRODUÇÃO

Produção não pode usar:

- clientes fictícios misturados;
- pagamentos fictícios;
- dashboards inventados;
- NF fake;
- estoque fake;
- prontuário fake sem marcação demo;
- agente respondendo dados inexistentes.

---

# 82. AMBIENTE DEMO/HOMOLOGAÇÃO

A Impulsionando deve ter modo demo claro para testar todos os módulos.

Elementos demo devem ser identificados visualmente e isolados da operação real.

---

# 83. COMITÊ MULTIESPECIALISTA

Toda revisão deve considerar perspectivas de:

- arquitetura de software;
- backend;
- frontend;
- DevOps;
- segurança;
- banco de dados;
- UX;
- UI;
- design instrucional;
- growth;
- CRM;
- CX;
- vendas;
- financeiro;
- contábil;
- fiscal;
- jurídico;
- privacidade/LGPD;
- saúde quando módulo aplicável;
- logística;
- atendimento;
- IA/agentes.

---

# 84. ANÁLISE CRÍTICA OBRIGATÓRIA

O programador não deve apenas executar checklist.

Para cada área deverá responder:

1. O que existe hoje?
2. O que está funcionando?
3. O que está tecnicamente ruim?
4. O que está confuso na UX?
5. O que está duplicado?
6. O que pode ser universalizado no Core?
7. O que está específico demais por cliente?
8. O que falta integrar?
9. O que falta testar?
10. O que deve ser removido/deprecado?
11. O que é risco P0/P1?
12. Qual é a melhor arquitetura futura?

---

# 85. PRIORIDADES

Classificar backlog:

- P0: segurança, perda de dados, indisponibilidade, billing incorreto, isolamento quebrado;
- P1: jornada crítica quebrada, publicação, pagamento, NF, acesso;
- P2: funcionalidade importante incompleta;
- P3: melhoria UX/eficiência;
- P4: otimização/futuro.

---

# 86. CRITÉRIO DE GO-LIVE MASTER

A plataforma só pode ser considerada pronta quando:

- tenant lifecycle PASS;
- CRM PASS;
- ERP/RP PASS;
- financeiro PASS;
- billing PASS;
- NF PASS;
- contador PASS;
- agenda PASS;
- módulo saúde demo PASS;
- prontuário demo PASS;
- teleatendimento demo PASS;
- comunicação PASS;
- N8N PASS;
- integrações críticas PASS;
- Impulsionito PASS;
- agentes PASS;
- RBAC/RLS PASS;
- auditoria PASS;
- backup/restore PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 87. ACEITE POR PERSONA

**CEO:** consigo entender a empresa em menos de 2 minutos?  
**Comercial:** consigo conduzir lead até contratação sem planilhas paralelas?  
**Financeiro:** consigo faturar, cobrar, conciliar e controlar inadimplência?  
**Contador:** consigo acompanhar fechamento e documentos sem depender de troca manual?  
**Suporte:** consigo enxergar incidente, cliente e histórico?  
**Programador:** consigo identificar health, integração e deploy sem adivinhação?  
**Cliente:** consigo usar seu tenant sem enxergar complexidade do Core?  
**Impulsionito:** consigo orquestrar com dados reais, permissões e logs?

Se qualquer resposta crítica for “não”, permanece aberto.

---

# 88. RESULTADO FINAL ESPERADO

A Impulsionando deve operar como uma plataforma única e coerente:

**CAPTAÇÃO → CRM → CONTRATAÇÃO → BILLING → TENANT → MÓDULOS → IMPULSIONITO → OPERAÇÃO → ERP/RP → FINANCEIRO → CONTÁBIL → COMUNICAÇÃO → AUTOMAÇÃO → BI → SUPORTE → RETENÇÃO.**

E, simultaneamente, como laboratório completo:

**AGENDA + SAÚDE + PRONTUÁRIO + TELEATENDIMENTO + PDV + ESTOQUE + E-COMMERCE + LOGÍSTICA + EVENTOS + PROFISSIONAIS + PEGA-AGENDA + RELATÓRIOS + IA.**

O objetivo é que a Impulsionando consiga demonstrar, testar, vender e operar qualquer módulo do ecossistema a partir de um **Core único, modular, seguro e visualmente simples**.

---

# 89. REGRA FINAL AO PROGRAMADOR

Não implementar por volume.

Implementar por coerência de plataforma.

Toda mudança deve responder:

- isso pertence ao Core?;
- é reutilizável?;
- está parametrizado?;
- respeita tenant isolation?;
- é testável pela Impulsionando?;
- tem backend real?;
- tem logs?;
- tem segurança?;
- tem UX adequada?;
- está publicado e verificável?

O objetivo final não é “ter muitos módulos”.

O objetivo é **ter um ecossistema unificado, confiável, auditável, simples para o usuário e profundamente poderoso por baixo**.

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**