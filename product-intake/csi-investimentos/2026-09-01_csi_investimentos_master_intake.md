# SUPERPROMPT MESTRE — PRODUCT INTAKE CSI INVESTIMENTOS

## Wealth Management, CRM, carteira consolidada, Open Finance, B3, suitability, compliance, BI, jornadas e Core Impulsionando Full

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, INFRA, N8N OU PRODUÇÃO A PARTIR DESTE REGISTRO.**

---

# 1. OBJETIVO CENTRAL

Transformar a CSI Investimentos em uma plataforma de relacionamento, acompanhamento patrimonial e gestão comercial de wealth/investimentos integrada ao **Core Impulsionando Full**, com experiência premium para investidores, assessores/consultores, gestão, compliance e operação.

A plataforma deve unir em uma única experiência:

**captação → cadastro → KYC → suitability → consolidação patrimonial → objetivos → carteira → acompanhamento → atendimento → recomendações/ações permitidas pelo enquadramento regulatório → documentação → relacionamento → retenção → indicação → BI → compliance.**

Não criar uma “corretora fictícia” nem assumir capacidades regulatórias não confirmadas.

Antes de ativar qualquer função de recomendação, aconselhamento, recepção/transmissão de ordens ou gestão discricionária, o programador deverá mapear o enquadramento jurídico/regulatório real da CSI e habilitar somente o que estiver permitido.

---

# 2. BENCHMARK DE MERCADO

Usar como referências funcionais, sem copiar identidade ou propriedade intelectual:

- Kinvo: consolidação de múltiplas instituições, carteira global, distribuição por classe/estratégia/instituição, rentabilidade histórica, benchmarks, proventos, risco/retorno, sensibilidade e FGC.
- Warren: objetivos financeiros, visão patrimonial, carteiras, acompanhamento consultivo e gestão orientada a objetivos.
- BTG Pactual: plataforma digital combinada com diferentes níveis de assessoria e atendimento.
- B3 Área do Investidor: consolidação de investimentos e movimentações registradas na infraestrutura B3.
- Open Finance Brasil: consentimento e compartilhamento padronizado de dados financeiros quando aplicável.

A CSI deve buscar experiência superior em **simplicidade, transparência, relacionamento humano + IA, organização patrimonial, leitura de risco, governança e visão consolidada**.

---

# 3. PRIMEIRA REGRA REGULATÓRIA

Criar um `regulatory_mode` configurável para a operação real da CSI.

Possíveis papéis, a confirmar juridicamente:

- assessoria de investimentos;
- consultoria de valores mobiliários;
- planejamento financeiro/wealth advisory;
- escritório vinculado a instituição intermediária;
- gestão de carteira, somente se houver autorização específica;
- consolidador/tecnologia sem recomendação regulada.

Cada modo deve habilitar ou bloquear capacidades.

Exemplo: se a CSI não estiver autorizada como consultora, o sistema não poderá produzir recomendação individualizada como se fosse consultoria regulada.

---

# 4. COMPLIANCE BY DESIGN

Arquitetura deve contemplar:

- suitability;
- KYC;
- PLD/FTP quando aplicável ao enquadramento;
- PEP;
- sanções/listas de risco quando contratadas fontes válidas;
- transparência de remuneração;
- conflitos de interesse;
- termos de ciência;
- trilha de auditoria;
- versionamento de documentos;
- consentimento LGPD;
- retenção documental;
- segregação de acesso.

Nunca tratar compliance como página estática.

---

# 5. PÚBLICOS DO SISTEMA

Criar jornadas e permissões distintas para:

1. visitante/lead;
2. investidor pessoa física;
3. investidor pessoa jurídica;
4. família/grupo familiar;
5. cliente private/high net worth;
6. assessor/consultor autorizado conforme enquadramento;
7. relationship manager;
8. analista/investment specialist;
9. atendimento/suporte;
10. compliance;
11. administrativo;
12. financeiro;
13. gestor CSI;
14. Master CSI;
15. Master Impulsionando.

---

# 6. CADASTRO ÚNICO

Cadastro do investidor deve ser central e deduplicado.

Dados estruturados:

- nome/razão social;
- CPF/CNPJ;
- data de nascimento/constituição;
- e-mail;
- celular;
- endereço;
- profissão/atividade;
- renda/faixa de renda;
- patrimônio/faixa patrimonial;
- origem de recursos;
- residência fiscal;
- nacionalidade;
- PEP quando aplicável;
- objetivos;
- horizonte;
- necessidades de liquidez;
- experiência com investimentos;
- tolerância a risco;
- instituições conectadas;
- assessor responsável;
- grupo familiar;
- consentimentos;
- documentos;
- histórico de relacionamento.

Evitar texto livre sempre que possível. Usar listas, enums e multiseleção.

---

# 7. KYC

Fluxo:

**lead → identidade → documentos → validação → risco cadastral → compliance quando necessário → aprovado → cliente ativo.**

Status:

- iniciado;
- incompleto;
- aguardando documento;
- em análise;
- pendência;
- aprovado;
- rejeitado;
- atualização necessária.

Nunca apagar evidência histórica.

---

# 8. SUITABILITY

Criar questionário versionado e parametrizável.

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

Resultado não deve ser apenas “conservador/moderado/arrojado”.

Guardar:

- respostas;
- score;
- versão;
- data;
- validade;
- responsável;
- evidência de aceite.

Alertar para suitability vencido ou potencialmente desatualizado.

---

# 9. PERFIS DE RISCO

Labels configuráveis, por exemplo:

- conservador;
- moderado;
- arrojado/agressivo.

Nunca hard-code recomendação de ativo apenas pelo label.

---

# 10. OBJETIVOS FINANCEIROS

Permitir objetivos como:

- reserva de emergência;
- compra de imóvel;
- aposentadoria;
- educação;
- viagem;
- geração de renda;
- preservação de patrimônio;
- sucessão;
- crescimento de longo prazo;
- objetivo personalizado.

Cada objetivo deve possuir:

- valor alvo;
- prazo;
- valor atual;
- aporte planejado;
- progresso;
- prioridade;
- carteira associada quando permitido.

---

# 11. CARTEIRA GLOBAL

Criar visão consolidada de patrimônio.

Agrupamentos:

- classe;
- estratégia;
- instituição;
- moeda;
- país;
- risco;
- liquidez;
- objetivo;
- titular;
- carteira/subcarteira.

---

# 12. CLASSES DE ATIVOS

Estrutura preparada para:

- caixa;
- conta remunerada;
- Tesouro Direto;
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
- fundos internacionais;
- stocks;
- REITs;
- bonds;
- moedas;
- criptoativos, se houver fonte/uso autorizado;
- ativos alternativos;
- ativos manuais/personalizados.

---

# 13. INTEGRAÇÕES DE POSIÇÃO

Prioridade para fontes oficiais/licenciadas:

- Open Finance, quando consentido e tecnicamente disponível;
- B3/API/integrações autorizadas;
- APIs de instituições parceiras;
- custodiante/corretora;
- arquivos padronizados;
- importação manual estruturada como contingência.

Nunca usar scraping frágil como fonte principal de patrimônio.

---

# 14. CONSENTIMENTO OPEN FINANCE

Criar jornada:

**conectar instituição → explicar finalidade → consentir → autenticar na instituição → retornar → sincronizar → monitorar expiração.**

Mostrar claramente:

- instituição;
- escopo;
- data de consentimento;
- validade;
- última sincronização;
- erro;
- revogação.

---

# 15. RECONCILIAÇÃO

Toda integração precisa de rotina de reconciliação.

Detectar:

- posição divergente;
- ativo sem identificação;
- transação duplicada;
- saldo ausente;
- instituição atrasada;
- conexão expirada.

Criar fila “PRECISA DE ATENÇÃO”.

---

# 16. TEMPO REAL — REGRA DE VERDADE

“Tempo real” só deve ser prometido quando a fonte contratada realmente entregar dados em tempo real.

Diferenciar no frontend:

- cotação em tempo real;
- cotação com atraso;
- posição D-1;
- posição da última sincronização;
- valor estimado.

Mostrar timestamp da fonte.

---

# 17. MARKET DATA

Arquitetura preparada para provider licenciado de:

- preços;
- índices;
- curvas;
- moedas;
- taxas;
- benchmarks.

Não distribuir cotações protegidas sem contrato/licença.

---

# 18. HOME DO INVESTIDOR

Primeira dobra deve responder em segundos:

- patrimônio consolidado;
- variação do dia, quando fonte permitir;
- rentabilidade do mês;
- rentabilidade no ano;
- rentabilidade desde início;
- aportes líquidos;
- distribuição por classe;
- liquidez;
- risco;
- objetivo principal;
- próximos eventos;
- mensagens do assessor;
- pendências importantes.

---

# 19. RENTABILIDADE

Implementar metodologia tecnicamente correta e documentada.

Suportar:

- rentabilidade acumulada;
- mensal;
- anual;
- desde início;
- por ativo;
- classe;
- estratégia;
- instituição;
- carteira global.

Separar retorno de aportes/retiradas.

Avaliar TWR e MWR/XIRR conforme finalidade.

---

# 20. BENCHMARKS

Permitir comparação configurável com:

- CDI;
- IPCA;
- Ibovespa;
- IFIX;
- IMA-B;
- poupança;
- S&P 500;
- dólar;
- outros índices licenciados/disponíveis.

Nunca comparar carteiras de natureza incompatível sem contexto.

---

# 21. RENTABILIDADE REAL

Exibir retorno nominal e retorno real descontado da inflação, quando metodologia/fonte permitirem.

---

# 22. EVOLUÇÃO PATRIMONIAL

Gráfico de:

- patrimônio;
- aportes;
- retiradas;
- ganhos/perdas;
- evolução por período.

Permitir separar crescimento por fluxo financeiro e performance.

---

# 23. DISTRIBUIÇÃO

Gráficos por:

- classe;
- instituição;
- emissor;
- estratégia;
- moeda;
- país;
- objetivo;
- titular.

---

# 24. CONCENTRAÇÃO

Indicadores:

- top 5 ativos;
- top emissores;
- top instituições;
- concentração por classe;
- concentração geográfica;
- concentração cambial.

Alertas são informativos e de risco; não devem virar recomendação automática sem enquadramento regulatório.

---

# 25. RISCO

Preparar indicadores, conforme dados disponíveis:

- volatilidade;
- drawdown;
- risco x retorno;
- concentração;
- liquidez;
- sensibilidade;
- exposição cambial;
- crédito/emissor;
- duration quando aplicável.

---

# 26. LIQUIDEZ

Classificar patrimônio por faixa de liquidez:

- D+0/D+1;
- curto prazo;
- médio;
- longo;
- carência;
- sem liquidez imediata.

Dashboard deve mostrar “quanto do patrimônio está disponível em X dias”.

---

# 27. FGC

Quando aplicável, criar visão de exposição por emissor/instituição e cobertura estimada.

Regras devem ser parametrizadas e atualizáveis, nunca hard-coded permanentemente.

---

# 28. PROVENTOS E FLUXOS

Calendário de:

- dividendos;
- JCP;
- cupons;
- amortizações;
- vencimentos;
- resgates;
- aportes programados.

---

# 29. VENCIMENTOS DE RENDA FIXA

Criar agenda de vencimentos e concentração temporal.

Gatilho antes do vencimento para relacionamento e planejamento, respeitando permissões regulatórias.

---

# 30. OBJETIVOS X CARTEIRA

Relacionar patrimônio a objetivos.

Mostrar:

- progresso;
- projeção;
- prazo;
- lacuna estimada;
- necessidade de revisão.

Não prometer retorno futuro garantido.

---

# 31. PROJEÇÕES

Toda projeção deve ser explicitamente identificada como simulação.

Permitir cenários:

- conservador;
- base;
- otimista;

com premissas visíveis.

---

# 32. CRM CSI

Pipeline comercial:

**novo lead → contato → reunião → qualificado → KYC/suitability → proposta de relacionamento → onboarding → cliente ativo.**

Outros estágios:

- aguardando documento;
- aguardando transferência/consolidação;
- acompanhamento;
- risco de churn;
- inativo;
- indicação.

---

# 33. LEAD SCORING

Considerar:

- origem;
- patrimônio estimado;
- interesse;
- urgência;
- engajamento;
- reunião marcada;
- perfil de relacionamento.

Nunca usar atributos sensíveis de forma discriminatória.

---

# 34. AGENDA

Agenda integrada para:

- primeira conversa;
- revisão patrimonial;
- suitability;
- planejamento;
- reunião periódica;
- revisão de carteira;
- vencimentos importantes;
- eventos CSI.

---

# 35. CADÊNCIA DE RELACIONAMENTO

Parametrizar por segmento.

Exemplo:

- onboarding;
- 7 dias;
- 30 dias;
- revisão trimestral;
- revisão semestral/anual;
- contato por evento de carteira;
- aniversário;
- vencimento;
- grande movimentação;
- consentimento expirando.

---

# 36. JORNADA DO LEAD

**conteúdo/indicação → landing page → diagnóstico inicial → qualificação → agenda → reunião → KYC/suitability → onboarding.**

CTA premium, sem promessa de rentabilidade.

---

# 37. JORNADA DO CLIENTE NOVO

**boas-vindas → documentação → consentimentos → perfil → conexão de instituições → carteira consolidada → objetivos → reunião inicial → plano de acompanhamento.**

---

# 38. JORNADA DO CLIENTE ATIVO

**monitoramento → insights permitidos → contato periódico → revisão de objetivos → revisão de suitability → relatórios → retenção.**

---

# 39. JORNADA DE RISCO DE CHURN

Gatilhos possíveis:

- queda de engajamento;
- conexões expiradas;
- ausência em reuniões;
- pedido de portabilidade/saída;
- reclamação;
- NPS baixo.

Criar tarefa humana antes de automação comercial agressiva.

---

# 40. RELATIONSHIP MANAGER

Dashboard individual com:

- clientes;
- AUM acompanhado;
- reuniões;
- pendências;
- suitability vencendo;
- consentimentos;
- vencimentos;
- clientes sem contato;
- risco de churn;
- oportunidades de relacionamento permitidas.

---

# 41. VISÃO 360 DO CLIENTE

Uma única tela deve reunir:

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

# 42. FAMÍLIA / HOUSEHOLD

Permitir agrupamento familiar com consentimento e permissões.

Visões:

- individual;
- casal;
- família;
- empresa/família quando juridicamente adequado.

---

# 43. PLANEJAMENTO PATRIMONIAL

Criar módulo de inventário patrimonial ampliado:

- investimentos;
- imóveis;
- participações societárias;
- previdência;
- seguros;
- dívidas;
- outros ativos/passivos.

Dados não financeiros podem ser manuais/documentais.

---

# 44. PATRIMÔNIO LÍQUIDO

Exibir ativos menos passivos, quando cliente fornecer dados suficientes.

Separar patrimônio financeiro custodiado/conectado de patrimônio declarado manualmente.

---

# 45. RELATÓRIOS DO CLIENTE

Exportáveis:

- posição consolidada;
- performance;
- alocação;
- risco;
- liquidez;
- proventos;
- evolução patrimonial;
- objetivos;
- histórico de movimentações.

Sempre com data/hora e origem dos dados.

---

# 46. RELATÓRIO EXECUTIVO

Versão simples para leitura rápida:

**onde estou → como evoluiu → como está distribuído → riscos principais → próximos eventos → pendências.**

---

# 47. BI DA GESTÃO CSI

Indicadores:

- clientes ativos;
- leads;
- conversão;
- AUM acompanhado/consolidado;
- entradas/saídas patrimoniais identificadas;
- patrimônio por assessor;
- patrimônio por instituição;
- receita da CSI, quando integrada;
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

# 48. BI COMERCIAL

Funil:

**visitas → leads → reuniões → qualificados → onboarding → clientes ativos.**

Por origem/campanha/assessor.

---

# 49. BI DE CARTEIRAS

Visões agregadas e anonimizadas/permitidas:

- distribuição por classe;
- liquidez;
- concentração;
- perfil;
- moeda;
- instituição;
- vencimentos.

Respeitar necessidade de acesso e sigilo.

---

# 50. METAS COMERCIAIS

Parametrizar:

- novos clientes;
- AUM novo;
- reuniões;
- conversão;
- retenção;
- atualização de suitability;
- NPS.

Não incentivar práticas inadequadas de giro de carteira ou venda por comissão.

---

# 51. TRANSPARÊNCIA DE REMUNERAÇÃO

Quando aplicável ao modelo:

- taxa;
- fee;
- comissão;
- rebate;
- origem da remuneração;
- conflito potencial.

Disponibilizar ao investidor conforme exigências e política da CSI.

---

# 52. CONFLITOS DE INTERESSE

Registrar e exibir quando necessário:

- produto ligado a instituição parceira;
- remuneração diferenciada;
- relacionamento econômico;
- potencial conflito.

---

# 53. RECOMENDAÇÕES / PLANO DE AÇÃO

Somente habilitar se o enquadramento jurídico permitir.

Cada recomendação deve ter:

- responsável habilitado;
- cliente;
- contexto;
- suitability vigente;
- objetivo;
- racional;
- riscos;
- custos;
- conflitos;
- data;
- aceite/ciência;
- status.

Nunca permitir IA autônoma emitir recomendação regulada sem controle humano e jurídico apropriado.

---

# 54. ORDENS

Se a CSI atuar como assessor e houver integração autorizada com intermediário, desenhar fluxo de recepção/transmissão de ordens dentro do escopo permitido.

Nunca executar ordem diretamente sem integração, autorização e controles formais.

---

# 55. AGENTE VIRTUAL ESPECIALIZADO

Criar agente especializado CSI, como instância do Impulsionito, com nome a definir oficialmente.

Ele deve funcionar como concierge de relacionamento e leitura de dados, não como “guru de investimentos”.

Pode:

- explicar carteira;
- localizar documentos;
- informar posição e sincronização;
- explicar conceitos;
- agendar reunião;
- mostrar vencimentos;
- orientar atualização cadastral;
- resumir relatórios;
- abrir ticket.

Não pode:

- garantir retorno;
- inventar cotação;
- recomendar produto fora do modo regulatório permitido;
- executar ordem sozinho.

---

# 56. RESPOSTAS BASEADAS EM FONTE

Toda resposta sobre patrimônio deve indicar implicitamente a fonte correta e respeitar a última sincronização.

Se dado estiver defasado, avisar.

---

# 57. ALERTAS AO CLIENTE

Possíveis alertas:

- consentimento expirando;
- suitability vencendo;
- vencimento de ativo;
- documento pendente;
- grande movimentação importada;
- reunião próxima;
- relatório disponível.

Alertas de mercado devem ser parametrizados e não alarmistas.

---

# 58. ALERTAS INTERNOS

- KYC pendente;
- cliente sem contato;
- suitability vencido;
- concentração relevante;
- consentimento expirado;
- reconciliação falhou;
- integração fora do ar;
- cliente pediu saída;
- ticket crítico.

---

# 59. CENTRAL DE DOCUMENTOS

Organizar:

- contratos;
- termos;
- suitability;
- KYC;
- relatórios;
- documentos fiscais quando aplicáveis;
- atas de reunião;
- comunicações relevantes;
- autorizações.

Versionamento obrigatório.

---

# 60. ASSINATURA ELETRÔNICA

Fluxos de aceite devem registrar:

- versão;
- data/hora;
- usuário;
- evidência;
- IP quando adequado;
- provedor de assinatura quando houver.

---

# 61. CRM DE TAREFAS

Toda pendência deve possuir:

- dono;
- SLA;
- prioridade;
- cliente;
- categoria;
- prazo;
- status;
- histórico.

---

# 62. SUPORTE

Tickets por categoria:

- acesso;
- carteira;
- integração;
- cadastro;
- documento;
- relatório;
- movimentação divergente;
- atendimento;
- reclamação;
- compliance.

---

# 63. OUVIDORIA / RECLAMAÇÃO

Fluxo separado quando exigido/adequado.

Registrar protocolo, classificação, prazo, responsável, evidências e resolução.

---

# 64. COMUNICAÇÃO

Canais:

- e-mail;
- WhatsApp oficial quando integrado;
- notificações internas;
- SMS somente se necessário.

Foco em comunicação transacional e relacionamento de alta confiança.

---

# 65. TEMPLATES DE E-MAIL

Criar identidade CSI premium e responsiva.

Templates:

- boas-vindas;
- cadastro incompleto;
- documentos;
- KYC;
- suitability;
- consentimento;
- carteira sincronizada;
- relatório disponível;
- reunião;
- vencimento;
- pendência;
- suporte;
- segurança;
- atualização cadastral.

---

# 66. N8N / AUTOMAÇÃO

Orquestrar:

- novo lead;
- reunião;
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

Cada fluxo com logs, retry, idempotência e tratamento de erro.

---

# 67. WEBHOOKS

Todo webhook deve:

- autenticar origem;
- ser idempotente;
- registrar evento;
- tratar duplicidade;
- ter retry;
- dead-letter/fila de erro;
- auditoria.

---

# 68. API GATEWAY

Centralizar integrações financeiras atrás de camada de integração segura.

Não deixar credenciais em frontend.

---

# 69. SEGURANÇA

Aplicar:

- RLS;
- RBAC;
- tenant isolation;
- MFA para perfis sensíveis;
- sessão segura;
- criptografia;
- secrets manager;
- logs imutáveis quando necessário;
- rate limiting;
- monitoramento;
- backups;
- princípio do menor privilégio.

---

# 70. PERMISSÕES

Exemplos:

Cliente: somente seus dados/household consentido.  
Assessor: somente carteira de clientes atribuídos.  
Compliance: KYC/suitability/documentos e trilha, sem necessidade de alterar carteira.  
Financeiro: faturamento/receita, sem acesso irrestrito a recomendações.  
Master CSI: tenant completo.  
Master Impulsionando: acesso técnico transversal auditado.

---

# 71. AUDITORIA

Registrar:

- login;
- leitura de dados sensíveis quando necessário;
- alteração cadastral;
- suitability;
- recomendação;
- documento;
- consentimento;
- exportação;
- permissionamento;
- integração;
- erro.

---

# 72. LGPD

Implementar:

- finalidade;
- base legal/consentimento conforme caso;
- minimização;
- acesso;
- correção;
- revogação;
- retenção;
- exclusão quando legalmente aplicável;
- registro de consentimentos.

---

# 73. OBSERVABILIDADE

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
- geração de relatórios.

---

# 74. UX/UI

Padrão premium, sóbrio, moderno e confiável.

Prioridades:

- leitura rápida;
- pouca poluição;
- hierarquia forte;
- números legíveis;
- comparação clara;
- explicação contextual;
- mobile-first;
- acessibilidade.

Não usar excesso de gráficos só porque o tema é financeiro.

---

# 75. FRONT PÚBLICO

Menu sugerido:

- A CSI;
- Como trabalhamos;
- Para você;
- Para famílias;
- Soluções;
- Conteúdos;
- Fale com um especialista;
- Área do cliente.

CTA principal sem promessa de retorno:

**“Organize seu patrimônio e tome decisões com mais clareza.”**

---

# 76. ONBOARDING UX

Etapas curtas:

**identidade → objetivos → perfil → documentos → consentimentos → instituições → carteira → primeira reunião.**

Mostrar progresso e salvar estado.

---

# 77. EXPLICAÇÃO DE MÉTRICAS

Cada KPI deve ter tooltip simples.

Exemplo:

“Rentabilidade” não deve aparecer sem explicar período/metodologia.

---

# 78. ACESSIBILIDADE

WCAG AA, contraste, foco, teclado, labels, formatos numéricos e gráficos legíveis.

---

# 79. MOBILE

Cliente deve conseguir pelo celular:

- consultar patrimônio;
- ver carteira;
- objetivo;
- relatório;
- falar com equipe;
- atualizar dados;
- renovar consentimento;
- agendar reunião.

---

# 80. IMPORTAÇÃO MANUAL

Permitir CSV/XLSX para contingência, com:

- mapeamento;
- preview;
- validação;
- deduplicação;
- relatório de erros;
- auditoria.

---

# 81. DADOS MANUAIS X CONECTADOS

Marcar visualmente:

- sincronizado;
- importado;
- declarado manualmente;
- estimado.

Nunca misturar sem transparência.

---

# 82. HISTÓRICO

Preservar snapshots para análises históricas quando permitido pela fonte e arquitetura.

Open Finance pode ter limitações de histórico conforme consentimento; UI deve comunicar isso.

---

# 83. DATAS E HORÁRIOS

Todos os dados financeiros precisam de `as_of_date` / timestamp de referência.

---

# 84. MOEDAS

Suportar patrimônio multimoeda.

Separar:

- valor original;
- moeda;
- câmbio de referência;
- valor convertido;
- data do câmbio.

---

# 85. TRIBUTAÇÃO

Não criar cálculo fiscal definitivo sem metodologia validada.

Pode existir módulo informativo/estimativo com disclaimers e revisão especializada.

---

# 86. SUCESSÃO E PLANEJAMENTO

Permitir registrar objetivos e documentos de planejamento patrimonial sem prestar aconselhamento jurídico automático.

Encaminhar para especialista quando necessário.

---

# 87. EDUCAÇÃO FINANCEIRA

Conteúdo contextual:

- risco;
- liquidez;
- diversificação;
- inflação;
- benchmarks;
- classes;
- volatilidade.

Agente pode explicar conceitos, sem recomendação personalizada fora do escopo legal.

---

# 88. NPS E SATISFAÇÃO

Medir:

- onboarding;
- atendimento;
- clareza dos relatórios;
- reuniões;
- experiência geral.

Detrator gera tarefa humana.

---

# 89. INDICAÇÃO

Criar jornada de indicação rastreável, respeitando compliance e publicidade aplicável.

---

# 90. EVENTOS E CONTEÚDOS

CRM deve registrar inscrições e participação em:

- webinars;
- reuniões;
- eventos;
- conteúdos premium.

Usar engajamento para relacionamento, não para recomendação automática imprópria.

---

# 91. SEGMENTAÇÃO

Segmentos operacionais possíveis:

- lead;
- prospect qualificado;
- cliente novo;
- cliente ativo;
- high net worth;
- família;
- PJ;
- consentimento pendente;
- suitability vencendo;
- sem contato recente;
- risco de churn.

---

# 92. PLANOS / NÍVEIS DE SERVIÇO CSI

Se a CSI comercializar planos de relacionamento, modelar de forma parametrizável.

Possíveis diferenciações, somente após definição comercial/regulatória:

- digital;
- acompanhamento dedicado;
- wealth/private;
- family/empresarial.

Não copiar nomenclatura de concorrentes.

Exibir claramente o que cada nível inclui, preço/fee quando houver, SLA, frequência de reunião e canais.

---

# 93. CONTRATOS

Contrato deve refletir exatamente o papel regulatório, escopo, remuneração, conflitos, responsabilidades, tratamento de dados e encerramento.

Revisão jurídica obrigatória antes do go-live.

---

# 94. PORTABILIDADE / SAÍDA

Criar processo de saída respeitoso:

- solicitação;
- motivo;
- contato humano;
- documentos;
- status;
- encerramento;
- retenção de registros obrigatórios.

Nunca usar dark pattern.

---

# 95. TESTE — LEAD

Simular:

**origem → landing → cadastro → CRM → agenda → reunião → qualificação.**

---

# 96. TESTE — ONBOARDING

**cliente → KYC → suitability → consentimento → conexão → carteira global → objetivos → primeira reunião.**

---

# 97. TESTE — CARTEIRA

Conectar duas instituições e validar:

- ativos;
- saldos;
- classes;
- moedas;
- distribuição;
- duplicidade;
- atualização.

---

# 98. TESTE — RENTABILIDADE

Validar com fixtures controladas:

- aporte;
- retirada;
- valorização;
- rendimento;
- benchmark.

Comparar cálculo com valores conhecidos.

---

# 99. TESTE — SUITABILITY

Perfil válido, vencido, incompleto e alterado.

Bloquear ações incompatíveis conforme modo regulatório.

---

# 100. TESTE — CONSENTIMENTO

Ativo, expirando, expirado, revogado e falha de sincronização.

---

# 101. TESTE — PERMISSÕES

Cliente A tenta Cliente B → NEGADO.  
Assessor A tenta cliente não atribuído → NEGADO.  
Financeiro tenta documento de suitability sem necessidade → NEGADO.  
Compliance tenta alterar performance → NEGADO.  
Master audita conforme regra → PERMITIDO/AUDITADO.

---

# 102. TESTE — IA

Perguntas:

- “Quanto tenho investido?”
- “Qual foi minha rentabilidade no ano?”
- “Quanto está líquido?”
- “Quando vence meu CDB?”
- “Minha carteira está atualizada?”
- “Quero agendar uma reunião.”

Responder somente com fonte real e timestamp.

Pergunta:

- “Qual ação devo comprar hoje?”

Comportamento deve respeitar regulatory_mode e nunca improvisar recomendação.

---

# 103. TESTES DE EXCEÇÃO

Simular:

- Open Finance fora do ar;
- B3/provider atrasado;
- webhook duplicado;
- ativo desconhecido;
- preço ausente;
- câmbio ausente;
- consentimento revogado;
- suitability vencido;
- cadastro duplicado;
- relatório inconsistente.

---

# 104. ZERO MOCK

Produção não pode mostrar patrimônio, rentabilidade, AUM ou cotação fictícios.

Demo apenas em ambiente explicitamente marcado.

---

# 105. PROIBIÇÕES

Não considerar pronto:

- carteira estática;
- gráfico com número inventado;
- cotação sem fonte;
- recomendação por IA não autorizada;
- integração apenas desenhada;
- compliance sem backend;
- botão sem ação;
- relatório sem metodologia;
- “tempo real” sem feed real.

---

# 106. PUBLICAÇÃO

Após execução futura:

**commit → `reengineering/program` → testes/gates → fluxo de engenharia aprovado → deploy → domínio real → prova de funcionamento.**

`product-intake/*` permanece exclusivamente em `reengineering/program`.

---

# 107. CRITÉRIO DE GO-LIVE

Somente liberar com:

- regulatory_mode validado;
- KYC = PASS;
- suitability = PASS;
- RBAC/RLS = PASS;
- integrações = PASS;
- reconciliação = PASS;
- carteira = PASS;
- cálculos = PASS;
- CRM = PASS;
- jornadas = PASS;
- agente = PASS;
- segurança = PASS;
- publicação = PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 108. ACEITE POR PERSONA

Investidor: “Consigo entender meu patrimônio e meus próximos passos sem ficar perdido?”

Assessor/consultor: “Consigo saber quem precisa de mim hoje e por quê?”

Compliance: “Consigo provar quem fez o quê, com qual perfil, documento e consentimento?”

Gestor CSI: “Consigo ver crescimento, AUM, conversão, risco operacional e qualidade da carteira de clientes?”

Master Impulsionando: “Consigo operar o tenant sem quebrar isolamento, segurança ou Core?”

Se qualquer resposta for NÃO, o módulo permanece aberto.

---

# 109. RESULTADO FINAL ESPERADO

A experiência ideal deve funcionar assim:

**CAPTAÇÃO → CRM → KYC → SUITABILITY → CONSENTIMENTOS → OPEN FINANCE/B3/APIs → CARTEIRA GLOBAL → OBJETIVOS → RELACIONAMENTO HUMANO + AGENTE CSI/IMPULSIONITO → RELATÓRIOS → RETENÇÃO → BI + COMPLIANCE.**

O investidor deve sentir:

**“Eu consigo enxergar meu patrimônio, entender o que está acontecendo e tenho acompanhamento confiável.”**

A CSI deve operar com visão 360º, sem planilhas paralelas como fonte principal e sem prometer capacidades regulatórias que não possua.

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR.  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**
