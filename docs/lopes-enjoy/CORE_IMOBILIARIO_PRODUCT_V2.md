# Core Imobiliário Impulsionando — Product Architecture V2

## 1. Visão de produto

Lopes Enjoy será a primeira instância comercial real do Core Imobiliário da Impulsionando. O produto não é vendido nem transferido ao cliente: é licenciado por assinatura mensal e operado sobre o Core universal da Impulsionando.

Objetivo: oferecer portal, CRM, ERP imobiliário, automações, inteligência, documentos, vendas, locação, administração, relacionamento e BI em uma única plataforma, com front-end minimalista e back-end profundo.

A mesma base deverá atender futuras imobiliárias por configuração de marca, domínio, equipes, regiões, permissões, módulos, integrações, plano e políticas, sem forks de produto.

## 2. Princípio de paridade front/back

Nenhum componente visual pode ser cenográfico.

Toda CTA, formulário, filtro, indicador, status ou promessa apresentada no front precisa possuir:
- entidade persistente;
- permissão e escopo;
- validação;
- evento de domínio;
- responsável e SLA quando aplicável;
- histórico/auditoria;
- automação ou handoff;
- métrica correspondente;
- estado de erro e recuperação;
- política de privacidade/retenção.

## 3. Comitê de agentes

O Impulsionito continua sendo o orquestrador raiz. Os especialistas abaixo são competências do mesmo sistema e compartilham o mesmo estado canônico; não funcionam como CRMs ou bancos paralelos.

1. Produto & Estratégia Imobiliária
2. UX/CX & Acessibilidade
3. Growth, SEO & Mídia
4. CRM & Revenue Operations
5. Captação de Imóveis e Proprietários
6. Compra & Venda
7. Locação & Administração
8. Corretor & Gestão Comercial
9. Jurídico & Documental
10. Financeiro, Comissões & Repasses
11. Dados, BI, Forecast & Pricing
12. Automação/N8N & Integrações
13. Segurança, LGPD & Antifraude
14. Qualidade, Performance & Observabilidade
15. Customer Success, Fidelização & Pós-venda

Cada competência produz eventos, recomendações e work-items auditáveis. A decisão final usa o estado do Core, permissões e regras do cliente.

## 4. Modelo de assinatura

O Core Imobiliário é serviço recorrente da Impulsionando.

Estados mínimos:
- TRIAL quando comercialmente aplicável;
- ACTIVE;
- PAST_DUE;
- SUSPENDED_NONPAYMENT;
- CANCELED;
- REACTIVATING.

A suspensão por inadimplência deve interromper a operação comercial sem destruir patrimônio de dados:
- portal público suspenso/controlado;
- backoffice operacional bloqueado;
- agentes comerciais pausados;
- automações outbound pausadas;
- sincronizações não essenciais pausadas;
- operações de escrita bloqueadas salvo billing, segurança e reativação;
- dados preservados conforme contrato/LGPD/retenção;
- confirmação de pagamento dispara reativação automática e healthcheck.

## 5. Pessoas, grupos e decisões de compra

O CRM não deve modelar apenas um lead individual. Deve suportar unidade decisória/household/empresa.

Perfil 360:
- pessoa física ou jurídica;
- comprador, co-comprador, vendedor, locatário, proprietário, investidor, garantidor, procurador, corretor, parceiro;
- decisão individual ou conjunta;
- demais decisores e influenciadores explicitamente informados;
- orçamento e faixa de investimento;
- capacidade financeira informada;
- origem dos recursos: recursos próprios, financiamento, FGTS quando cabível, consórcio, venda condicionante de outro imóvel, combinação;
- situação de pré-aprovação quando disponível;
- horizonte de decisão e urgência;
- finalidade: moradia, investimento, renda, revenda, mudança, expansão, downsizing, segunda residência, temporada, operação empresarial;
- bairros/regiões desejadas;
- must-have, nice-to-have e dealbreakers;
- rotina, mobilidade, acessibilidade e pets quando voluntariamente informados e pertinentes;
- preferência de canal e horário;
- objeções, dúvidas, riscos percebidos e motivos de perda;
- data futura de reativação.

Não utilizar atributos sensíveis ou protegidos para discriminar, excluir ou direcionar oferta de moradia.

## 6. Taxonomia imobiliária

Finalidades:
- venda;
- locação;
- temporada;
- investimento;
- lançamento/pré-lançamento;
- administração;
- off-market quando contratualmente permitido.

Categorias residenciais:
- apartamento;
- casa;
- casa em condomínio;
- studio/kitnet;
- loft;
- garden;
- cobertura;
- duplex/triplex;
- vila/sobrado;
- terreno/lote.

Categorias comerciais/industriais:
- sala/conjunto;
- loja;
- escritório/laje;
- prédio;
- galpão;
- industrial/logístico;
- hotel/pousada;
- vaga/garagem;
- ponto comercial quando juridicamente aplicável.

Categorias rurais/especiais:
- sítio;
- chácara;
- fazenda;
- área rural;
- empreendimento/loteamento;
- unidades de luxo;
- temporada.

Status operacionais:
- draft;
- onboarding;
- documentação pendente;
- aguardando mídia;
- disponível;
- reservado;
- em proposta;
- em negociação;
- suspenso pelo proprietário;
- off-market;
- vendido;
- locado;
- expirado;
- despublicado;
- bloqueado por compliance.

## 7. Cadastro mestre do imóvel

Identidade única do imóvel com histórico e deduplicação.

Dados:
- código interno e códigos externos;
- proprietário(s) e percentuais quando aplicável;
- endereço normalizado e geolocalização;
- condomínio/empreendimento/bloco/unidade;
- finalidade e categoria;
- área útil/total/terreno;
- quartos/suítes/banheiros/vagas;
- andar/elevador;
- preço e histórico de preço;
- condomínio/IPTU/taxas;
- mobiliado/semimobiliado;
- ocupação e disponibilidade;
- exclusividade e vigência;
- chaves e regras de acesso;
- diferenciais;
- acessibilidade;
- mídia: fotos, vídeo, 360, planta, tour;
- documentos e situação de validação;
- integração/feeds e última sincronização;
- origem da captação e corretor captador;
- qualidade/completude do anúncio;
- performance do anúncio.

## 8. Busca e descoberta

Home orientada por intenção, não por menus internos.

Busca estruturada + linguagem natural, sempre convertendo a intenção do usuário em filtros auditáveis.

Filtros mínimos:
- comprar/alugar/temporada;
- cidade, zona, bairro, condomínio, empreendimento, mapa/polígono;
- faixa de preço;
- categoria;
- quartos, suítes, banheiros, vagas;
- área mínima/máxima;
- condomínio/IPTU máximos;
- mobiliado;
- varanda;
- piscina/lazer;
- portaria;
- elevador;
- pet;
- acessibilidade;
- vista/posição quando cadastradas;
- lançamento/novo/usado;
- data de disponibilidade;
- exclusividade;
- luxo;
- comercial/rural com filtros próprios;
- financiamento quando elegibilidade estiver confirmada por dados reais.

Recursos:
- mapa;
- favoritos persistentes;
- comparação;
- pesquisas salvas;
- alertas de novo imóvel, mudança de preço e disponibilidade;
- match score explicável;
- imóveis similares;
- histórico recente;
- compartilhamento controlado;
- páginas de bairro/condomínio/empreendimento;
- SEO estruturado e schema.org;
- conteúdo e mídia otimizados.

## 9. Captação de leads

Entradas suportadas por adapters:
- site;
- chat;
- WhatsApp quando conectado;
- e-mail;
- Instagram quando conectado;
- mídia paga;
- portais imobiliários;
- indicação;
- QR Code/offline;
- eventos;
- telefone/VoIP quando conectado;
- importação governada.

Todo lead recebe:
- identidade/deduplicação;
- origem e UTM;
- intenção;
- imóvel/contexto de entrada;
- consentimento/base legal quando necessário;
- score de completude e prioridade;
- SLA;
- etapa e próxima ação;
- histórico unificado.

## 10. Distribuição de corretores

Requisito central: seleção randômica auditável entre corretores elegíveis.

Elegibilidade antes do sorteio:
- CRECI/status profissional quando exigido;
- região;
- tipo de imóvel;
- faixa de preço/segmento;
- idioma quando pertinente;
- disponibilidade;
- carga atual;
- plantão;
- conflitos de propriedade/lead;
- regras de equipe/filial;
- pools especiais, por exemplo Luxury.

Dentro do pool elegível, aplicar sorteio ponderado por justiça operacional, evitando concentração e cherry-picking. O peso pode considerar carga/SLA sem transformar desempenho histórico em monopólio de leads.

Registrar:
- pool elegível;
- regra aplicada;
- resultado;
- timestamp;
- motivo de exclusões;
- aceite/recusa;
- tempo de resposta;
- redistribuição;
- override humano e justificativa.

Timeout de atendimento gera redistribuição e alerta ao gestor.

## 11. CRM imobiliário

Pipeline por jornada e não apenas um funil único.

Funcionalidades:
- timeline única;
- tarefas;
- SLA;
- agenda;
- notas e anexos;
- canais de conversa;
- propostas;
- visitas;
- documentos;
- imóveis apresentados/rejeitados;
- objeções;
- próxima melhor ação;
- temperatura/intenção;
- múltiplos decisores;
- duplicidade e merge;
- motivo de perda obrigatório;
- nurture e reativação;
- handoff de agente para humano;
- transferência controlada entre corretores.

## 12. Briefing inteligente

Briefing adaptativo: pergunta somente o necessário e aprofunda conforme respostas.

Comprador/locatário:
- objetivo;
- prazo;
- faixa de preço;
- forma de pagamento;
- compra sozinho ou com terceiros;
- necessidade de vender outro imóvel antes;
- regiões;
- tipo e metragem;
- quartos/vagas;
- essenciais e rejeições;
- visita presencial/remota;
- canal preferido.

Proprietário:
- intenção vender/alugar/ambos;
- prazo;
- ocupação;
- documentação disponível;
- exclusividade;
- expectativa de preço;
- necessidade financeira e timing;
- autorização de mídia/visitas;
- administração desejada;
- regras de repasse e manutenção para locação.

Investidor:
- tese;
- capital;
- alavancagem;
- horizonte;
- renda x valorização;
- liquidez;
- regiões;
- risco e gestão desejada.

## 13. Agenda e visitas

- agenda do corretor e imóveis;
- disponibilidade do proprietário/ocupante;
- multi-imóvel por tour;
- confirmação e lembretes;
- reagendamento;
- QR/check-in;
- controle de chaves;
- instruções de acesso;
- no-show;
- feedback do interessado;
- feedback ao proprietário com proteção de dados;
- próxima ação automática;
- rota/logística quando integrada;
- visita remota quando disponível.

## 14. Propostas e negociação

- proposta versionada;
- contraproposta;
- validade;
- preço/condições;
- forma de pagamento;
- contingências;
- aprovação por múltiplos proprietários quando aplicável;
- trilha de negociação;
- anexos;
- assinatura por adapter;
- status e SLA;
- motivo de recusa;
- registro de comissão/split previsto.

## 15. Documentos e data room

Checklist depende da transação, papel e perfil.

Partes:
- comprador/co-comprador;
- vendedor/co-proprietário;
- locatário;
- garantidor;
- proprietário locador;
- PJ/sócios/representantes;
- procurador;
- imóvel;
- contrato/operação.

Recursos:
- upload seguro;
- versão;
- hash/integridade;
- classificação;
- validade/expiração;
- solicitado/recebido/em análise/aprovado/rejeitado/expirado;
- rejeição sempre com motivo e próximo passo;
- responsável;
- SLA;
- permissões granulares;
- URLs assinadas;
- auditoria de acesso;
- malware scan quando disponível;
- OCR apenas como auxílio, nunca verdade final sem política de validação;
- assinatura eletrônica via adapter;
- retenção e exclusão governadas.

Evento de upload/status dispara notificação apenas às partes autorizadas e responsáveis.

## 16. Venda ponta a ponta

Lead -> qualificação -> briefing -> matching -> corretor -> contato -> visita -> feedback -> proposta -> negociação -> documentação -> crédito/financiamento -> diligências -> ITBI quando aplicável -> escritura -> registro -> comissões -> chaves -> pós-venda -> indicação/reativação.

Cada macroetapa possui timeline, checklist, owner, SLA, bloqueios, documentos e evidências.

## 17. Locação e administração ponta a ponta

Proprietário -> onboarding -> imóvel -> preço -> mídia -> publicação -> lead -> visita -> proposta -> análise cadastral -> garantias -> documentação -> contrato -> assinatura -> vistoria -> chaves -> cobrança -> conciliação -> repasse -> manutenção -> inadimplência -> reajuste -> renovação -> saída -> vistoria final -> acerto/devoluções -> relacionamento.

Financeiro precisa suportar regras configuráveis por contrato:
- vencimento;
- taxa de administração;
- repasse;
- despesas;
- retenções;
- garantia/aluguel garantido quando contratado;
- multa/juros;
- reajuste;
- prestação de contas.

## 18. Vistorias e manutenção

- vistoria de entrada/saída/periódica;
- checklist e fotos datadas;
- aceite/contestação;
- ticket de manutenção;
- prioridade/SLA;
- orçamento de parceiros;
- aprovação do proprietário;
- execução;
- antes/depois;
- custo e responsabilidade;
- satisfação;
- histórico do imóvel.

## 19. Portais privados

### Proprietário
- imóveis;
- qualidade/status do anúncio;
- leads/visitas em visão apropriada;
- feedback;
- propostas;
- documentos;
- contratos;
- manutenção;
- cobranças/repasses;
- previsão e demonstrativo;
- extratos/documentos fiscais quando aplicável;
- recomendações de preço e performance com fonte de dados.

### Comprador/vendedor
- timeline da negociação;
- pendências;
- documentos;
- visitas;
- propostas;
- assinatura;
- financiamento/diligência quando integrado;
- contatos e próximo passo.

### Locatário
- contrato;
- cobranças;
- comprovantes;
- documentos;
- vistoria;
- chamados;
- reajuste/renovação;
- saída.

### Corretor
- leads;
- prioridades;
- carteira;
- busca/matching;
- tarefas;
- agenda;
- visitas;
- propostas;
- documentos;
- comissões;
- indicadores;
- treinamento/playbooks;
- copiloto Impulsionito.

### Gestor
- funis;
- canais;
- SLA;
- distribuição e justiça do roteamento;
- produtividade/carga;
- estoque e aging;
- qualidade de anúncios;
- visitas;
- propostas;
- fechamento;
- motivos de perda;
- forecast;
- receita;
- comissões;
- locação/repasses/inadimplência;
- documentos/SLA;
- NPS/CSAT;
- auditoria.

## 20. Construtoras, incorporadoras e lançamentos

- empreendimento/torre/bloco/unidade;
- tabela/versionamento;
- disponibilidade;
- materiais;
- campanhas;
- reservas;
- leads;
- canais/parceiros;
- proposta;
- venda;
- comissão;
- conciliação;
- atualização via adapter.

## 21. Marketing, Growth e relacionamento

Réguas separadas por intenção e estágio.

Captação de proprietário:
- avaliação;
- conteúdo de mercado;
- prova de capacidade operacional;
- follow-up;
- agendamento;
- proposta de intermediação/administração;
- recuperação de abandonos.

Comprador/locatário:
- novos matches;
- mudança de preço;
- novos imóveis;
- lembrete de visita;
- pós-visita;
- proposta pendente;
- documentos;
- reativação por mudança de estoque/contexto.

Pós-venda:
- satisfação;
- pendências;
- indicação;
- aniversário da transação;
- nova avaliação de patrimônio;
- investimento;
- recompra;
- conversão de comprador em proprietário/locador/investidor quando fizer sentido.

Gestão de frequência impede spam e respeita consentimentos/preferências.

## 22. Fidelização e Customer Success

Não encerrar relacionamento no contrato.

- NPS/CSAT por momentos da jornada;
- resolução de pendências;
- programa de indicação;
- carteira patrimonial;
- acompanhamento de imóveis administrados;
- alertas de mercado úteis;
- oportunidades de upgrade/downsize/investimento;
- reativação baseada em eventos e intenção;
- acompanhamento de proprietários sem atividade;
- recuperação de detratores com handoff humano.

## 23. Financeiro e comissões

- regra de comissão;
- split por captador/vendedor/equipe/parceiro;
- previsão;
- condição de aquisição do direito;
- aprovação;
- conciliação;
- pagamento;
- estorno/cancelamento;
- relatório individual/gestor;
- trilha de auditoria.

Locação:
- cobrança;
- baixa;
- conciliação;
- repasse;
- taxa de administração;
- despesas;
- manutenção;
- inadimplência;
- demonstrativos;
- exportação/integração contábil quando configurada.

## 24. Impulsionito e IA

A IA é tool-first e permission-aware.

Nunca inventar:
- disponibilidade;
- preço;
- proprietário;
- status de documento;
- condição contratual;
- aprovação de crédito;
- pagamento/repasse;
- informação jurídica.

Capacidades:
- classificar intenção;
- completar briefing;
- buscar/matchear imóveis reais;
- resumir histórico;
- sugerir próxima ação;
- redigir comunicação;
- detectar SLA vencendo;
- identificar lead parado;
- auxiliar corretor;
- cobrar pendências documentais de forma apropriada;
- explicar status com base no sistema;
- gerar alertas gerenciais;
- handoff humano.

## 25. Eventos canônicos

Exemplos:
- lead.created
- lead.qualified
- lead.assigned
- lead.assignment_expired
- briefing.completed
- property.created
- property.published
- property.price_changed
- search.saved
- favorite.added
- visit.requested
- visit.confirmed
- visit.completed
- proposal.created
- proposal.countered
- proposal.accepted
- document.requested
- document.uploaded
- document.approved
- document.rejected
- contract.signed
- rental.charge_created
- rental.payment_received
- owner.payout_scheduled
- owner.payout_completed
- maintenance.opened
- maintenance.closed
- deal.won
- deal.lost
- satisfaction.received
- referral.created
- subscription.past_due
- subscription.suspended
- subscription.reactivated

## 26. Dados, BI e inteligência gerencial

Métricas:
- CAC por origem;
- LTV;
- conversão por etapa;
- velocidade de funil;
- tempo de primeira resposta;
- SLA;
- taxa de contato;
- visita/agendamento/no-show;
- visita->proposta;
- proposta->fechamento;
- aging do estoque;
- preço e alterações;
- motivos de perda;
- distribuição por corretor;
- concentração/fairness;
- produtividade e carga;
- receita e forecast;
- comissão;
- ocupação e vacância;
- inadimplência;
- prazo e pontualidade de repasses;
- manutenção;
- NPS/CSAT;
- indicação/recompra;
- churn da imobiliária cliente do Core.

## 27. Integrações por adapters

Somente declarar funcional quando autenticada e testada.

Classes:
- portais/feeds imobiliários;
- WhatsApp;
- e-mail;
- Instagram/social;
- VoIP;
- mapas/geocoding;
- assinatura eletrônica;
- pagamentos;
- bancos/crédito/financiamento;
- garantia locatícia/seguros;
- cartório/diligência quando houver API/parceria;
- fiscal/contábil;
- armazenamento/documentos;
- n8n;
- analytics/ads.

## 28. White label e multi-imobiliária

Configuração por cliente:
- marca;
- domínio/subdomínio;
- tema/tokens;
- unidades/filiais;
- regiões;
- equipes;
- perfis/RBAC;
- agente especializado;
- módulos/features;
- planos/entitlements;
- integrações;
- canais;
- SLA;
- política de distribuição;
- templates;
- billing;
- retenção;
- analytics.

Nunca copiar código por cliente quando configuração resolve.

## 29. Segurança e LGPD

- isolamento por tenant/client_id;
- RLS;
- RBAC e menor privilégio;
- MFA para perfis internos sensíveis;
- service role apenas server-side;
- secrets fora do cliente;
- URLs assinadas para documentos;
- logs de acesso e alteração;
- consentimento/preferências;
- minimização de PII;
- retenção e descarte;
- backup/restore;
- rate limiting;
- idempotência de webhooks;
- proteção de upload;
- observabilidade;
- resposta a incidentes;
- revisão periódica de advisors.

## 30. Qualidade e go-live

Nenhuma imobiliária é considerada ativa por existir uma página.

Evidência mínima:
- hostname/rota real;
- dados reais;
- auth;
- RLS/RBAC;
- captação->CRM;
- distribuição de corretor;
- agenda/visita;
- proposta;
- documentos;
- locação quando contratada;
- financeiro quando contratado;
- agente tool-first;
- automações essenciais;
- billing/entitlements;
- suspensão/reativação;
- auditoria;
- smoke/E2E;
- acessibilidade;
- performance;
- monitoramento;
- rollback.

## 31. Regra de produto

A Lopes Enjoy é a primeira instância. O Core Imobiliário é o produto.

Toda melhoria aprovada que seja genérica deve nascer ou migrar para a camada compartilhada, com feature flag/configuração e rollout controlado, para que futuras imobiliárias recebam evolução sem fork, sem perda de isolamento e sem retrabalho.
