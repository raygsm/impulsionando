# SUPERPROMPT MESTRE — PRODUCT INTAKE CSI INVESTIMENTOS

## INVESTITO + IMPULSIONITO — Wealth Management, CRM, carteira consolidada, Open Finance, B3, suitability, compliance, BI, jornadas, UX/UI e Core Impulsionando Full

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**AGENTE CENTRAL DO ECOSSISTEMA:** Impulsionito  
**AGENTE ESPECIALIZADO DA CSI:** INVESTITO  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, INFRAESTRUTURA, N8N, FRONTEND, BACKEND OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento existe exclusivamente como Livro de Anotações / Product Intake para implementação posterior pelo programador.

---

# 1. REGRA ABSOLUTA DE CONTINUIDADE

Este documento não substitui requisitos anteriores corretos. Na execução futura, partir do estado real da CSI e do Core Impulsionando.

Fluxo obrigatório:

**AUDITAR → PRESERVAR → CORRIGIR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Regras:

- correto → preservar;
- incompleto → completar;
- errado → corrigir;
- duplicado → consolidar;
- mock → substituir por fonte real;
- inseguro → blindar;
- integração apenas desenhada → não considerar pronta.

Código versionado não significa funcionalidade pronta. **Pronto = funcionando, integrado, testado e publicado no ambiente real correto.**

---

# 2. OBJETIVO CENTRAL

Transformar a CSI Investimentos em uma plataforma premium de relacionamento, consolidação patrimonial e inteligência de wealth management, integrada ao **plano Full do Impulsionando**.

A experiência deve unir:

**captação → CRM → cadastro → KYC → suitability → consentimentos → consolidação patrimonial → objetivos → carteira → acompanhamento → atendimento → relatórios → relacionamento → retenção → indicação → BI → compliance.**

A CSI não deve ser apresentada como corretora, consultora, gestora ou transmissora de ordens se não possuir o enquadramento regulatório necessário.

---

# 3. BENCHMARK COMPETITIVO

Usar como referência funcional, sem copiar identidade ou propriedade intelectual:

- **Kinvo:** consolidação multibanco/corretora, visão global, rentabilidade, distribuição, proventos, risco e comparação;
- **Warren:** objetivos financeiros, visão patrimonial e relacionamento consultivo;
- **BTG Pactual:** experiência digital premium + atendimento/assessoria;
- **B3 Área do Investidor:** consolidação de posições/movimentações registradas na infraestrutura B3;
- **Open Finance Brasil:** consentimento e compartilhamento padronizado de dados financeiros.

A CSI deve superar essas referências em:

- simplicidade;
- transparência;
- organização patrimonial;
- leitura de risco/liquidez;
- relacionamento humano + INVESTITO;
- governança;
- jornadas proativas;
- experiência premium.

---

# 4. REGULATORY MODE

Criar conceito/configuração de `regulatory_mode` para definir quais recursos podem ser ativados conforme o enquadramento real da CSI.

Possíveis papéis a validar juridicamente:

- assessoria de investimentos;
- consultoria de valores mobiliários;
- planejamento financeiro / wealth advisory;
- escritório vinculado a instituição intermediária;
- gestão de carteira, somente se houver autorização específica;
- consolidador/tecnologia sem recomendação regulada.

O sistema deve bloquear automaticamente recursos incompatíveis com o modo regulatório ativo.

---

# 5. COMPLIANCE BY DESIGN

Incorporar desde a arquitetura:

- KYC;
- suitability;
- PLD/FTP quando aplicável;
- PEP;
- listas de risco/sanções quando houver fonte contratada;
- transparência de remuneração;
- conflitos de interesse;
- termos de ciência;
- trilha de auditoria;
- versionamento documental;
- LGPD;
- retenção de registros;
- segregação de acesso.

Compliance não pode ser somente uma página de termos.

---

# 6. PÚBLICOS E PERFIS

Criar experiências e permissões específicas para:

1. visitante;
2. lead;
3. investidor PF;
4. investidor PJ;
5. família/household;
6. cliente private/high net worth;
7. assessor/consultor autorizado conforme regulatory_mode;
8. relationship manager;
9. analista/especialista;
10. atendimento;
11. compliance;
12. administrativo;
13. financeiro;
14. gestor CSI;
15. Master CSI;
16. Master Impulsionando.

---

# 7. MATRIZ DE PERMISSÕES

Implementar RBAC + RLS reais.

Cliente: somente seus dados e household consentido.  
Assessor: somente clientes atribuídos.  
Analista: visões necessárias, sem acesso irrestrito a PII.  
Compliance: KYC, suitability, documentos, conflitos e auditoria.  
Financeiro: faturamento/receitas, sem acesso irrestrito a recomendações.  
Master CSI: tenant completo.  
Master Impulsionando: administração técnica transversal, auditada.

Toda tentativa de acesso indevido deve retornar **NEGADO** e gerar log quando necessário.

---

# 8. CADASTRO ÚNICO

Cadastro central, deduplicado e estruturado.

Campos possíveis:

- nome/razão social;
- CPF/CNPJ;
- nascimento/constituição;
- e-mail;
- celular;
- endereço;
- profissão/atividade;
- renda/faixa;
- patrimônio/faixa;
- origem de recursos;
- residência fiscal;
- nacionalidade;
- PEP;
- objetivos;
- horizonte;
- necessidade de liquidez;
- experiência;
- tolerância a risco;
- instituições conectadas;
- responsável CSI;
- household;
- documentos;
- consentimentos;
- histórico de relacionamento.

Evitar texto livre quando houver possibilidade de lista, enum ou multiseleção.

---

# 9. KYC

Fluxo:

**lead → identidade → documentos → validação → análise de risco → compliance quando necessário → aprovado → cliente ativo.**

Status:

- iniciado;
- incompleto;
- aguardando documento;
- em análise;
- pendência;
- aprovado;
- rejeitado;
- atualização necessária.

Nunca apagar histórico.

---

# 10. SUITABILITY

Questionário versionado e parametrizável.

Dimensões:

- objetivos;
- horizonte;
- liquidez;
- capacidade financeira;
- tolerância a perdas;
- conhecimento;
- experiência;
- concentração patrimonial;
- complexidade dos produtos.

Guardar respostas, score, versão, data, validade, responsável e evidência de aceite.

Alertar suitability vencido ou potencialmente desatualizado.

---

# 11. PERFIL DE RISCO

Labels configuráveis, como:

- conservador;
- moderado;
- arrojado/agressivo.

Nunca transformar label em recomendação automática de ativo.

---

# 12. OBJETIVOS FINANCEIROS

Permitir objetivos:

- reserva de emergência;
- imóvel;
- aposentadoria;
- educação;
- viagem;
- geração de renda;
- preservação patrimonial;
- sucessão;
- crescimento de longo prazo;
- personalizado.

Cada objetivo:

- valor alvo;
- prazo;
- valor atual;
- aporte planejado;
- progresso;
- prioridade;
- carteira associada quando permitido.

---

# 13. CARTEIRA GLOBAL

Consolidar patrimônio por:

- classe;
- estratégia;
- instituição;
- emissor;
- moeda;
- país;
- risco;
- liquidez;
- objetivo;
- titular;
- carteira/subcarteira.

---

# 14. CLASSES DE ATIVOS

Preparar estrutura para:

- caixa;
- Tesouro;
- CDB/RDB;
- LCI/LCA;
- debêntures;
- CRI/CRA;
- fundos;
- previdência;
- ações;
- ETFs;
- BDRs;
- FIIs;
- stocks;
- REITs;
- bonds;
- moedas;
- criptoativos quando permitido;
- alternativos;
- ativos manuais.

---

# 15. INTEGRAÇÕES DE POSIÇÃO

Priorizar fontes oficiais/licenciadas:

- Open Finance;
- B3 e APIs autorizadas;
- corretoras/custodiantes/parceiros;
- providers de consolidação;
- arquivos estruturados;
- importação manual como contingência.

Nunca usar scraping frágil como fonte primária.

---

# 16. OPEN FINANCE

Jornada:

**Conectar instituição → explicar finalidade → consentir → autenticar → retornar → sincronizar → acompanhar validade.**

Mostrar:

- instituição;
- escopo;
- consentimento;
- validade;
- última sincronização;
- status;
- erro;
- revogação.

---

# 17. B3 / CUSTÓDIA / APIs

Mapear possibilidades reais de integração com B3, instituições financeiras e providers.

Não assumir API disponível sem contrato ou autorização.

Cada integração deve possuir:

- owner;
- autenticação;
- escopo;
- SLA;
- sincronização;
- reconciliação;
- rate limit;
- tratamento de falha;
- auditoria.

---

# 18. RECONCILIAÇÃO

Detectar:

- posição divergente;
- ativo desconhecido;
- transação duplicada;
- saldo ausente;
- cotação ausente;
- integração atrasada;
- consentimento expirado.

Criar fila **PRECISA DE ATENÇÃO**.

---

# 19. REGRA DE VERDADE SOBRE “TEMPO REAL”

Só usar expressão “tempo real” se o provider efetivamente entregar tempo real.

Diferenciar:

- tempo real;
- delayed;
- D-1;
- última sincronização;
- estimado.

Sempre mostrar timestamp/origem.

---

# 20. MARKET DATA

Camada preparada para provider licenciado de:

- preços;
- índices;
- curvas;
- moedas;
- taxas;
- benchmarks.

Nunca redistribuir market data protegido sem licença.

---

# 21. DASHBOARD DO INVESTIDOR

Primeira dobra deve mostrar:

- patrimônio consolidado;
- variação do dia quando válida;
- rentabilidade do mês;
- rentabilidade no ano;
- rentabilidade desde início;
- aportes líquidos;
- distribuição por classe;
- liquidez;
- risco;
- principal objetivo;
- próximos eventos;
- mensagens da equipe;
- pendências.

---

# 22. RENTABILIDADE

Metodologia documentada e testada.

Exibir:

- acumulada;
- mensal;
- anual;
- desde início;
- ativo;
- classe;
- estratégia;
- instituição;
- carteira.

Separar performance de aportes/retiradas.

Avaliar TWR e MWR/XIRR conforme finalidade.

---

# 23. BENCHMARKS

Comparações configuráveis com fontes válidas:

- CDI;
- IPCA;
- Ibovespa;
- IFIX;
- IMA-B;
- poupança;
- S&P 500;
- dólar;
- outros.

Evitar comparação enganosa entre riscos ou horizontes incompatíveis.

---

# 24. RENTABILIDADE REAL

Quando tecnicamente adequado:

- retorno nominal;
- inflação;
- retorno real.

---

# 25. EVOLUÇÃO PATRIMONIAL

Separar visualmente:

- patrimônio;
- aportes;
- retiradas;
- ganhos/perdas;
- evolução temporal.

---

# 26. DISTRIBUIÇÃO E CONCENTRAÇÃO

Gráficos por classe, estratégia, instituição, emissor, moeda, país, objetivo e titular.

Indicadores:

- top 5 ativos;
- top emissores;
- concentração por instituição;
- cambial;
- geográfica;
- classe.

Alertas de concentração são informativos; recomendação individual depende do regulatory_mode.

---

# 27. RISCO

Quando dados permitirem:

- volatilidade;
- drawdown;
- risco x retorno;
- concentração;
- liquidez;
- exposição cambial;
- crédito/emissor;
- duration;
- sensibilidade.

---

# 28. LIQUIDEZ

Classificar:

- D+0/D+1;
- curto prazo;
- médio;
- longo;
- carência;
- sem liquidez imediata.

Responder claramente: **“quanto do patrimônio está disponível em X dias?”**

---

# 29. FGC

Quando aplicável, mostrar exposição por emissor/instituição e cobertura estimada segundo regras atualizáveis.

Nunca hard-code permanentemente limites regulatórios.

---

# 30. PROVENTOS E VENCIMENTOS

Calendário de:

- dividendos;
- JCP;
- cupons;
- amortizações;
- vencimentos;
- resgates;
- aportes programados.

Gatilhos de relacionamento antes de vencimentos importantes.

---

# 31. PROJEÇÕES E OBJETIVOS

Relacionar objetivos à carteira.

Mostrar:

- progresso;
- prazo;
- valor atual;
- lacuna estimada;
- projeções.

Toda projeção deve ser identificada como simulação, com premissas visíveis e sem garantia.

---

# 32. CRM CSI

Pipeline comercial:

**novo lead → contato → reunião → qualificado → KYC/suitability → proposta de relacionamento → onboarding → ativo.**

Status complementares:

- documento pendente;
- conexão patrimonial pendente;
- acompanhamento;
- risco de churn;
- inativo;
- indicação.

---

# 33. VISÃO 360 DO CLIENTE

Uma tela:

- cadastro;
- patrimônio;
- carteira;
- objetivos;
- risco;
- suitability;
- documentos;
- reuniões;
- mensagens;
- tickets;
- consentimentos;
- relatórios;
- histórico.

---

# 34. LEAD SCORING

Pode considerar:

- origem;
- patrimônio estimado;
- interesse;
- urgência;
- engajamento;
- reunião;
- perfil de relacionamento.

Nunca utilizar atributo sensível para discriminação inadequada.

---

# 35. AGENDA

Agenda integrada para:

- primeira conversa;
- suitability;
- revisão patrimonial;
- planejamento;
- reunião periódica;
- vencimento;
- revisão cadastral;
- evento CSI.

---

# 36. JORNADA DO LEAD

**conteúdo/indicação → landing page → diagnóstico inicial → CRM → qualificação → agenda → reunião → onboarding.**

CTA sem promessa de rentabilidade.

---

# 37. JORNADA DO CLIENTE NOVO

**boas-vindas → documentos → KYC → suitability → consentimentos → instituições → carteira consolidada → objetivos → primeira reunião.**

---

# 38. JORNADA DO CLIENTE ATIVO

**monitoramento → relatórios → contatos periódicos → vencimentos → revisão de objetivos → revisão de suitability → retenção.**

---

# 39. JORNADA DE CHURN

Gatilhos:

- queda de engajamento;
- consentimento expirado;
- ausência em reuniões;
- reclamação;
- NPS baixo;
- pedido de saída;
- grandes saídas patrimoniais quando fonte permitir.

Priorizar tarefa humana, não automação agressiva.

---

# 40. HOUSEHOLD / FAMÍLIA

Agrupamento familiar com consentimento e permissão.

Visões:

- individual;
- casal;
- família;
- PJ/família quando adequado.

---

# 41. PLANEJAMENTO PATRIMONIAL AMPLIADO

Inventário opcional de:

- investimentos;
- imóveis;
- participações societárias;
- previdência;
- seguros;
- dívidas;
- outros ativos/passivos.

Separar claramente dado conectado de dado declarado manualmente.

---

# 42. INVESTITO — AGENTE OFICIAL CSI

**INVESTITO** é a instância especializada do Impulsionito para a CSI.

Deve atuar como:

- concierge patrimonial;
- intérprete de indicadores;
- assistente de relacionamento;
- organizador de pendências;
- facilitador de reuniões;
- explicador de conceitos;
- navegador de documentos e carteira.

Pode:

- informar patrimônio consolidado;
- explicar rentabilidade e benchmarks;
- informar liquidez;
- localizar vencimentos;
- resumir carteira;
- indicar última sincronização;
- mostrar documentos;
- orientar atualização cadastral;
- agendar reunião;
- abrir ticket;
- lembrar consentimentos e suitability.

Não pode:

- garantir retorno;
- inventar cotação;
- inventar posição;
- emitir recomendação regulada fora do regulatory_mode;
- executar ordem autonomamente;
- ocultar conflito ou risco.

---

# 43. INVESTITO — REGRA DE FONTE

Toda resposta patrimonial deve partir de dado real.

Se posição estiver defasada:

**informar última sincronização.**

Se dado não existir:

**não inventar.**

---

# 44. INVESTITO — EXEMPLOS

Cliente: “Quanto tenho investido?” → consultar carteira real.  
Cliente: “Quanto está líquido em D+1?” → consultar liquidez real.  
Cliente: “Quando vence meu CDB?” → consultar agenda de vencimentos.  
Cliente: “Minha carteira está atualizada?” → informar timestamp/fontes.  
Cliente: “Qual ação devo comprar hoje?” → respeitar regulatory_mode; não improvisar recomendação.

---

# 45. RELATIONSHIP MANAGER

Dashboard:

- clientes;
- AUM acompanhado;
- reuniões;
- pendências;
- suitability vencendo;
- consentimentos;
- vencimentos;
- sem contato recente;
- risco de churn;
- tarefas.

---

# 46. RELATÓRIOS DO CLIENTE

Exportáveis:

- posição consolidada;
- performance;
- alocação;
- risco;
- liquidez;
- proventos;
- evolução patrimonial;
- objetivos;
- movimentações.

Sempre com data/hora e origem.

---

# 47. RELATÓRIO EXECUTIVO

Formato simples:

**onde estou → como evoluiu → como está distribuído → riscos → liquidez → próximos eventos → pendências.**

---

# 48. BI EXECUTIVO CSI

Indicadores:

- clientes ativos;
- leads;
- conversão;
- AUM acompanhado/consolidado;
- entradas/saídas identificadas;
- patrimônio por assessor;
- patrimônio por instituição;
- receita CSI quando integrada;
- churn;
- NPS;
- CAC;
- LTV;
- reuniões;
- KYC pendente;
- suitability vencido;
- consentimentos expirando;
- tickets;
- SLA.

---

# 49. BI COMERCIAL

Funil:

**visitas → leads → reuniões → qualificados → onboarding → clientes ativos.**

Por origem, campanha e responsável.

---

# 50. BI DE CARTEIRAS

Visões agregadas, respeitando sigilo e necessidade:

- classe;
- liquidez;
- concentração;
- perfil;
- moeda;
- instituição;
- vencimentos.

---

# 51. METAS

Parametrizáveis:

- novos clientes;
- AUM novo;
- reuniões;
- conversão;
- retenção;
- suitability atualizado;
- NPS.

Não criar incentivo para giro indevido de carteira.

---

# 52. REMUNERAÇÃO E CONFLITOS

Quando aplicável, registrar/exibir:

- fee;
- comissão;
- rebate;
- origem da remuneração;
- conflito potencial;
- produto/instituição relacionada.

---

# 53. RECOMENDAÇÕES

Somente habilitar quando juridicamente permitido.

Cada recomendação:

- responsável habilitado;
- cliente;
- suitability vigente;
- objetivo;
- racional;
- riscos;
- custos;
- conflitos;
- data;
- ciência/aceite;
- status.

INVESTITO não substitui controle humano regulatório.

---

# 54. ORDENS

Se houver escopo autorizado e integração com intermediário, desenhar recepção/transmissão conforme regras aplicáveis.

Nunca criar botão de “ordem real” sem integração, autorização e controles.

---

# 55. CENTRAL DE DOCUMENTOS

Organizar:

- contratos;
- KYC;
- suitability;
- termos;
- relatórios;
- consentimentos;
- comunicações relevantes;
- atas/reuniões;
- autorizações.

Versionamento obrigatório.

---

# 56. CONTRATOS E ACEITES

Contrato deve refletir:

- papel regulatório;
- escopo;
- remuneração;
- conflitos;
- responsabilidades;
- proteção de dados;
- encerramento.

Aceite eletrônico deve guardar versão, data/hora, usuário e evidência.

Revisão jurídica obrigatória antes de go-live.

---

# 57. SUPORTE E OUVIDORIA

Tickets:

- acesso;
- carteira;
- integração;
- cadastro;
- documento;
- relatório;
- divergência;
- atendimento;
- reclamação;
- compliance.

Ouvidoria/reclamação com protocolo, prazo, responsável e resolução quando aplicável.

---

# 58. COMUNICAÇÃO

Canais:

- e-mail;
- WhatsApp oficial quando integrado;
- notificação interna;
- SMS quando necessário.

Comunicação premium, clara e sóbria.

---

# 59. TEMPLATES DE E-MAIL

Criar padrão CSI premium, responsivo, com logo e identidade visual.

Templates:

- boas-vindas;
- cadastro incompleto;
- documentos;
- KYC;
- suitability;
- consentimento;
- carteira sincronizada;
- relatório;
- reunião;
- vencimento;
- pendência;
- suporte;
- segurança;
- atualização cadastral.

---

# 60. AUTOMAÇÕES N8N

Fluxos:

- novo lead;
- agenda;
- KYC;
- suitability;
- consentimento;
- sincronização;
- relatório;
- vencimento;
- relacionamento;
- NPS;
- churn;
- ticket;
- compliance.

Cada workflow com idempotência, logs, retry, tratamento de erro e alerta.

---

# 61. WEBHOOKS

Todo webhook:

- autenticar origem;
- validar payload;
- ser idempotente;
- registrar evento;
- tratar duplicidade;
- retry;
- fila de erro/dead-letter;
- auditoria.

---

# 62. API GATEWAY

Centralizar integrações sensíveis atrás de camada segura.

Nunca expor credenciais no frontend.

---

# 63. SEGURANÇA

Aplicar:

- MFA para perfis sensíveis;
- RLS;
- RBAC;
- tenant isolation;
- criptografia;
- secrets manager;
- rate limiting;
- logs;
- backups;
- monitoramento;
- princípio do menor privilégio.

---

# 64. LGPD

Implementar:

- finalidade;
- consentimento/base legal;
- minimização;
- acesso;
- correção;
- revogação;
- retenção;
- exclusão quando aplicável;
- registro de consentimentos.

---

# 65. AUDITORIA

Registrar:

- login;
- alteração cadastral;
- suitability;
- recomendação;
- documento;
- consentimento;
- exportação;
- permissionamento;
- integração;
- erro;
- acesso sensível quando necessário.

---

# 66. OBSERVABILIDADE

Monitorar:

- Open Finance;
- B3/provider;
- market data;
- banco;
- N8N;
- e-mail;
- WhatsApp;
- APIs;
- login;
- relatórios.

Criar painel de saúde das integrações.

---

# 67. UX/UI

Padrão:

- premium;
- sóbrio;
- moderno;
- confiável;
- minimalista;
- alto contraste;
- números legíveis;
- pouca poluição;
- hierarquia forte.

Aplicar UX, UI, design instrucional, copywriting e design system.

Não usar gráficos apenas para “parecer financeiro”.

---

# 68. FRONT PÚBLICO

Menu sugerido:

- A CSI;
- Como trabalhamos;
- Para você;
- Para famílias;
- Soluções;
- Conteúdos;
- Fale com um especialista;
- Área do cliente.

CTA principal:

**“Organize seu patrimônio e tome decisões com mais clareza.”**

Sem promessa de rentabilidade.

---

# 69. ONBOARDING UX

Etapas:

**identidade → objetivos → perfil → documentos → consentimentos → instituições → carteira → primeira reunião.**

Mostrar progresso e salvar estado.

---

# 70. EXPLICAÇÃO DE INDICADORES

Todo KPI importante deve possuir tooltip em linguagem humana.

Rentabilidade, risco, drawdown, liquidez e benchmark nunca devem aparecer sem contexto mínimo.

---

# 71. MOBILE FIRST

Cliente deve conseguir pelo celular:

- ver patrimônio;
- carteira;
- objetivos;
- relatórios;
- mensagens;
- documentos;
- agenda;
- consentimento;
- atualização cadastral.

---

# 72. ACESSIBILIDADE

WCAG AA, foco, teclado, labels, contraste, gráficos legíveis e formatos numéricos acessíveis.

---

# 73. IMPORTAÇÃO MANUAL

Contingência CSV/XLSX:

- mapeamento;
- preview;
- validação;
- deduplicação;
- relatório de erros;
- auditoria.

---

# 74. DADOS CONECTADOS X MANUAIS

Marcar claramente:

- sincronizado;
- importado;
- declarado manualmente;
- estimado.

Nunca misturar sem transparência.

---

# 75. MULTIMOEDA

Guardar:

- valor original;
- moeda;
- câmbio de referência;
- valor convertido;
- data do câmbio.

---

# 76. TRIBUTAÇÃO

Não criar cálculo fiscal definitivo sem metodologia validada.

Pode haver módulo informativo/estimativo com revisão especializada e disclaimer.

---

# 77. EDUCAÇÃO FINANCEIRA

Conteúdos contextuais:

- risco;
- liquidez;
- diversificação;
- inflação;
- benchmarks;
- classes;
- volatilidade.

INVESTITO pode explicar conceitos, sem ultrapassar regulatory_mode.

---

# 78. NPS E SATISFAÇÃO

Medir:

- onboarding;
- reuniões;
- atendimento;
- relatórios;
- experiência geral.

Detrator gera tarefa humana.

---

# 79. INDICAÇÃO

Jornada rastreável de indicação, respeitando compliance/publicidade aplicável.

---

# 80. EVENTOS E CONTEÚDO

Registrar no CRM:

- inscrição;
- presença;
- engajamento;
- conteúdo acessado.

Usar para relacionamento, não para recomendação automatizada imprópria.

---

# 81. SEGMENTAÇÃO

Segmentos:

- lead;
- prospect;
- cliente novo;
- ativo;
- private/HNW;
- família;
- PJ;
- consentimento pendente;
- suitability vencendo;
- sem contato;
- churn risk.

---

# 82. PLANOS / NÍVEIS DE SERVIÇO

Se a CSI comercializar níveis de relacionamento, modelar como configuração.

Possíveis conceitos:

- digital;
- acompanhamento dedicado;
- wealth/private;
- família/empresarial.

Não copiar nomes de concorrentes.

Explicar escopo, preço/fee, SLA, frequência de reunião e canais.

---

# 83. CANCELAMENTO / SAÍDA

Fluxo:

**solicitação → motivo → contato humano → documentos → status → encerramento → retenção obrigatória de registros.**

Sem dark patterns.

---

# 84. ALERTAS AO CLIENTE

- consentimento expirando;
- suitability vencendo;
- vencimento de ativo;
- documento pendente;
- relatório disponível;
- reunião;
- sincronização com problema.

---

# 85. ALERTAS INTERNOS

- KYC pendente;
- cliente sem contato;
- suitability vencido;
- concentração relevante;
- consentimento expirado;
- reconciliação falhou;
- integração fora;
- pedido de saída;
- ticket crítico.

---

# 86. CENTRAL DE PENDÊNCIAS

Fila **PRECISA DE ATENÇÃO** com dono, prioridade, SLA, cliente, categoria, prazo e histórico.

---

# 87. TESTE — LEAD

**origem → landing → cadastro → CRM → agenda → reunião → qualificação.**

---

# 88. TESTE — ONBOARDING

**cliente → KYC → suitability → consentimento → conexão → carteira → objetivos → reunião.**

---

# 89. TESTE — CARTEIRA MULTI-INSTITUIÇÃO

Conectar duas instituições/fixtures oficiais e validar:

- ativos;
- saldo;
- classe;
- moeda;
- duplicidade;
- atualização;
- origem.

---

# 90. TESTE — RENTABILIDADE

Fixtures controladas:

- aporte;
- retirada;
- valorização;
- rendimento;
- benchmark.

Comparar com resultados matematicamente conhecidos.

---

# 91. TESTE — SUITABILITY

Testar:

- válido;
- vencido;
- incompleto;
- alterado.

Bloquear ações incompatíveis quando aplicável.

---

# 92. TESTE — CONSENTIMENTO

- ativo;
- expirando;
- expirado;
- revogado;
- erro de sincronização.

---

# 93. TESTE — INVESTITO

Perguntas:

“Quanto tenho investido?”  
“Qual minha rentabilidade no ano?”  
“Quanto está líquido?”  
“Quando vence meu CDB?”  
“Minha carteira está atualizada?”  
“Quero marcar uma reunião.”

Todas devem consultar fonte real.

Pergunta regulatória:

“Qual ação devo comprar hoje?”

INVESTITO deve respeitar regulatory_mode e nunca improvisar.

---

# 94. TESTE — PERMISSÕES

Cliente A → Cliente B = NEGADO.  
Assessor A → cliente não atribuído = NEGADO.  
Financeiro → suitability sem necessidade = NEGADO.  
Compliance → alteração de performance = NEGADO.  
Master → acesso conforme política = PERMITIDO/AUDITADO.

---

# 95. TESTE — EXCEÇÕES

Simular:

- Open Finance fora;
- provider B3 atrasado;
- webhook duplicado;
- ativo desconhecido;
- preço ausente;
- câmbio ausente;
- consentimento revogado;
- suitability vencido;
- cadastro duplicado;
- relatório inconsistente.

---

# 96. ZERO MOCK

Produção não pode mostrar patrimônio, rentabilidade, AUM, cotação, cliente ou benchmark fictícios.

Demo somente em ambiente explicitamente marcado como demonstração.

---

# 97. PROIBIÇÕES

Não considerar pronto:

- carteira estática;
- gráfico inventado;
- cotação sem fonte;
- INVESTITO respondendo por imaginação;
- recomendação não autorizada;
- integração apenas desenhada;
- compliance sem backend;
- botão sem ação;
- relatório sem metodologia;
- “tempo real” sem feed real.

---

# 98. PUBLICAÇÃO FUTURA

Após implementação pelo Cauã:

**commit → `reengineering/program` → testes/gates → fluxo de engenharia aprovado → deploy → domínio/subdomínio real → prova de funcionamento.**

O diretório `product-intake/*` permanece exclusivamente em `reengineering/program`.

---

# 99. CRITÉRIO DE GO-LIVE

Somente liberar quando:

- regulatory_mode validado;
- KYC PASS;
- suitability PASS;
- RBAC/RLS PASS;
- integrações PASS;
- reconciliação PASS;
- carteira PASS;
- cálculos PASS;
- CRM PASS;
- jornadas PASS;
- INVESTITO PASS;
- segurança PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 100. ACEITE FINAL POR PERSONA

**Investidor:** consigo enxergar e compreender meu patrimônio?  
**Assessor/consultor:** consigo saber quem precisa de mim e por quê?  
**Compliance:** consigo provar o que foi feito, por quem, com qual perfil e consentimento?  
**Gestor CSI:** consigo visualizar crescimento, AUM, conversão, risco operacional e qualidade do atendimento?  
**Master Impulsionando:** consigo administrar o tenant sem romper segurança, isolamento ou Core?  
**INVESTITO:** consigo responder somente com dados reais e dentro do escopo regulatório?

Se alguma resposta for “não”, o módulo continua aberto.

---

# 101. RESULTADO FINAL ESPERADO

A arquitetura ideal:

**CAPTAÇÃO → CRM → KYC → SUITABILITY → CONSENTIMENTOS → OPEN FINANCE/B3/APIs → CARTEIRA GLOBAL → OBJETIVOS → INVESTITO + EQUIPE CSI → RELATÓRIOS → RELACIONAMENTO → RETENÇÃO → BI + COMPLIANCE.**

O cliente deve sentir:

**“Eu consigo enxergar meu patrimônio, entender o que está acontecendo e tenho acompanhamento confiável.”**

A CSI deve operar com visão 360º, sem planilhas paralelas como fonte principal, sem dados fictícios e sem prometer capacidades regulatórias que não possua.

---

**STATUS:** PRODUCT INTAKE RECOMPILADO E SALVO.  
**BRANCH:** `reengineering/program`  
**AGENTE OFICIAL:** INVESTITO  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**
