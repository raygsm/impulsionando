# PRODUCT INTAKE — ENJOY IMÓVEIS — OPERAÇÃO AUTÔNOMA LOPITO + N8N

**MODO:** PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**VÍNCULO:** complemento obrigatório do `2026-09-02_enjoy_imoveis_master_intake_v2_consolidado.md`  
**TENANT:** Enjoy Imóveis  
**AGENTE:** Lopito  
**NÃO EXECUTAR AGORA.**

## 1. PRINCÍPIO DE AUTONOMIA

A Enjoy deve operar com o mínimo possível de intervenção humana administrativa. A proposta do ecossistema é eliminar tarefas repetitivas de secretaria, recepção, cobrança de follow-up, triagem de lead, lembrança de visitas, aviso de pendências e acompanhamento manual de jornadas.

O papel humano deve se concentrar no que realmente exige decisão, relacionamento, negociação, visita, parecer profissional, aprovação sensível ou exceção.

A arquitetura-alvo é:

**PORTAL → LOPITO → CRM → N8N → CORRETOR/GESTÃO → EVENTO → PRÓXIMA AÇÃO AUTOMÁTICA.**

## 2. CONFIGURAR UMA VEZ, OPERAR SEMPRE

A gestão deve possuir uma área de configuração única, clara e guiada para definir regras operacionais uma vez. Depois disso, N8N e Lopito executam automaticamente.

Parâmetros mínimos:

- prazo máximo para primeiro contato com lead;
- intervalo de follow-up quando lead não evolui;
- quantidade máxima de tentativas;
- prazo para lembrar visita;
- lembrete no dia da visita;
- prazo de follow-up pós-visita;
- prazo de proposta sem resposta;
- prazo de documento pendente;
- prazo de proprietário sem atualização;
- tempo de inatividade do lead;
- prazo para pesquisa/NPS;
- horários permitidos de comunicação;
- canais por tipo de evento;
- regras de opt-out;
- escalonamento para gestor;
- SLA por prioridade;
- regras por unidade/corretor/operação.

## 3. ONBOARDING GUIADO PELO LOPITO

No primeiro acesso da gestão, Lopito deve conduzir um checklist de ativação simples, progressivo e contextual.

Nunca despejar dezenas de configurações de uma vez.

Exemplo:

`Para ativar o acompanhamento automático dos leads, preciso saber: em quantas horas um corretor deve fazer o primeiro contato?`

Depois:

`Perfeito. E se esse lead não avançar, em quantos dias devo lembrar novamente o corretor?`

Cada resposta salva a regra correspondente.

## 4. CHECKLIST DE ATIVAÇÃO

Lopito deve manter estado por recurso:

- configurado;
- pendente;
- opcional;
- bloqueado por dependência;
- ativo;
- com erro.

Exemplos de dependências:

- WhatsApp não conectado;
- e-mail remetente não validado;
- template sem aprovação;
- certificado digital ausente;
- provider fiscal não configurado;
- regra de SLA ausente;
- calendário de corretores não conectado;
- source of truth imobiliária não sincronizada.

## 5. ALERTA PROATIVO DE CONFIGURAÇÃO AUSENTE

Lopito deve detectar recursos incompletos e avisar a gestão por dashboard e, quando configurado, por e-mail.

Exemplos de comunicação:

`Falta definir o prazo de primeiro contato para ativar a jornada automática de novos leads.`

`Falta conectar o WhatsApp oficial para eu ativar os lembretes de visita.`

`Falta configurar o certificado digital/provider fiscal para automatizar a emissão fiscal das comissões recebidas.`

`Falta definir após quantos dias do fechamento o comprador deve receber a pesquisa de experiência.`

Sempre incluir CTA direto para a tela correta.

## 6. ZERO DEPENDÊNCIA DE SECRETARIA/RECEPÇÃO PARA ROTINA

Fluxos rotineiros devem ser automatizados:

- recepção de lead;
- qualificação inicial;
- briefing;
- roteamento;
- lembrete ao corretor;
- follow-up;
- confirmação de visita;
- lembrete de visita;
- pesquisa pós-visita;
- cobrança de atualização do CRM;
- aviso de proposta vencendo;
- aviso de documento pendente;
- comunicação com proprietário;
- pesquisas de satisfação;
- campanhas comportamentais;
- alertas de imóveis compatíveis;
- redução de preço;
- reativação de leads.

## 7. NOVO LEAD — JORNADA AUTOMÁTICA

Fluxo:

**lead entra → dedupe → origem/UTM → Lopito qualifica → briefing → score → roteamento → corretor recebe resumo → SLA inicia → lembretes automáticos → escalonamento se necessário.**

A gestão não precisa distribuir manualmente cada lead.

## 8. PRIMEIRO CONTATO DO CORRETOR

Regra parametrizável.

Exemplo:

- lead entrou 10h;
- SLA configurado = 2h;
- às 11h30, lembrete preventivo;
- às 12h, SLA vencido;
- N8N notifica corretor;
- após tolerância configurada, escala para gerente;
- se houver redistribuição automática habilitada, move para outro corretor segundo regra.

## 9. LEAD SEM EVOLUÇÃO

Definir estados e tempos.

Exemplo:

`SEM RESPOSTA D+1 → lembrete`

`SEM RESPOSTA D+3 → nova tentativa contextual`

`SEM RESPOSTA D+7 → reativação`

`SEM RESPOSTA D+X → inativo/nurturing`

Datas são parametrizáveis; não hard-code universal.

## 10. LEMBRETES AO CORRETOR

O sistema deve lembrar o corretor automaticamente sobre:

- lead novo;
- follow-up vencido;
- visita hoje;
- visita em X horas;
- visita sem confirmação;
- visita realizada sem feedback;
- proposta sem retorno;
- documento pendente;
- cliente inativo;
- tarefa vencida.

## 11. VISITA — AUTOMAÇÃO COMPLETA

**agendamento → confirmação cliente → confirmação corretor → lembrete anterior → lembrete no dia → check-in → conclusão → pesquisa/feedback → atualização do briefing → próxima ação.**

A gestão só entra se houver exceção.

## 12. PÓS-VISITA

Se corretor não registrar resultado dentro do prazo configurado, N8N lembra automaticamente.

Se persistir, escala.

Lopito pode sugerir resumo e próxima ação com base no feedback.

## 13. PROPOSTAS

Monitorar automaticamente:

- criada;
- enviada;
- visualizada quando provider permitir;
- sem resposta;
- contraproposta;
- validade próxima;
- expirada.

Gerar lembretes e tarefas sem intervenção administrativa.

## 14. PROPRIETÁRIOS

Definir frequência de atualização ao proprietário.

N8N pode consolidar:

- visualizações;
- leads;
- visitas;
- feedbacks;
- propostas;
- alterações de preço;
- recomendação de ação.

Enviar automaticamente dentro das regras aprovadas.

## 15. TEMPLATES CANÔNICOS

Cada jornada deve possuir templates pré-definidos e versionados.

Categorias:

- novo lead;
- lead qualificado;
- lead sem resposta;
- imóveis recomendados;
- visita confirmada;
- lembrete de visita;
- pós-visita;
- proposta;
- documento;
- proprietário;
- redução de preço;
- novo imóvel compatível;
- reativação;
- NPS;
- fechamento;
- pós-venda.

## 16. IDENTIDADE VISUAL DOS TEMPLATES

Templates de e-mail devem carregar automaticamente a identidade Enjoy:

- logo;
- cores;
- tipografia segura;
- assinatura;
- CTA;
- unidade/corretor;
- Lopito quando aplicável;
- footer legal;
- preferências/opt-out.

Gestão não deve redesenhar cada campanha.

## 17. WHATSAPP

Templates de WhatsApp devem ser curtos, objetivos, naturais e compatíveis com regras do provedor.

Lopito deve preencher contexto automaticamente sem inventar dados.

## 18. CONFIGURAÇÃO DE TOM DE VOZ

Uma única configuração de brand voice deve alimentar e-mail, WhatsApp, chat e campanhas.

Permitir ajustes por segmento:

- Luxury;
- venda residencial;
- locação;
- proprietário;
- corretor;
- pós-venda.

## 19. GESTÃO POR EXCEÇÃO

A gestão deve receber painel de exceções, não uma lista infinita de tarefas rotineiras.

Exceções típicas:

- integração caiu;
- lead sem atendimento após escalonamento;
- corretor indisponível;
- proposta crítica;
- divergência de inventário;
- documento inválido;
- certificado vencido;
- erro fiscal;
- N8N falhou;
- WhatsApp bloqueou template;
- OpenAI indisponível.

## 20. PAINEL “O QUE FALTA PARA FICAR 100% AUTOMÁTICO?”

Criar visão com:

`Recurso | Status | Dependência | Impacto | Ação | Responsável`.

Exemplo:

`Emissão fiscal | Pendente | Certificado/provider | Alto | Configurar agora | Gestão`.

## 21. HEALTH SCORE DA AUTOMAÇÃO

Indicador consolidado de autonomia operacional.

Exemplo:

- CRM: 100%;
- WhatsApp: 100%;
- e-mail: 100%;
- fiscal: 70%;
- visitas: 100%;
- propostas: 90%;
- proprietário: 100%.

Não usar percentual fictício: calcular com checklist real.

## 22. LOPITO COMO ADMINISTRADOR DIGITAL

Lopito deve conseguir responder:

- “O que ainda falta configurar?”;
- “Qual automação está desligada?”;
- “Quais corretores estão com follow-up vencido?”;
- “Tem visita sem confirmação?”;
- “Qual integração falhou?”;
- “Quais leads estão parados?”;
- “O que precisa da minha aprovação hoje?”

## 23. LOPITO NÃO DEVE DEPENDER DE PROMPT HUMANO

Além de responder perguntas, deve detectar proativamente:

- configuração faltante;
- processo travado;
- SLA vencido;
- erro de integração;
- oportunidade de automação;
- jornada sem template;
- público sem regra;
- recurso contratado ainda inativo.

## 24. NOTIFICAÇÕES PARA GESTÃO

Canais configuráveis:

- dashboard;
- e-mail;
- WhatsApp interno quando autorizado.

Usar severidade:

- informativo;
- atenção;
- urgente;
- crítico.

## 25. NÃO GERAR RUÍDO

Agrupar notificações quando possível.

Exemplo preferível:

`Hoje há 8 leads com follow-up vencido em 3 equipes.`

em vez de 8 e-mails separados, salvo se a regra exigir individualização.

## 26. N8N — STATE-AWARE

Nenhum workflow deve agir apenas por timer sem consultar o estado real.

Antes de disparar:

- lead já avançou?;
- visita já ocorreu?;
- proposta já respondeu?;
- corretor já atualizou?;
- usuário optou out?;
- canal está permitido?;
- horário é válido?;

## 27. IDEMPOTÊNCIA

Eventos repetidos não podem duplicar mensagens, tarefas, propostas ou tickets.

## 28. REPROCESSAMENTO

Falha temporária deve permitir retry controlado.

Não gerar loop infinito.

## 29. AUDITORIA

Registrar:

- regra aplicada;
- evento;
- workflow;
- mensagem;
- destinatário;
- resultado;
- timestamp;
- próxima ação;
- override humano quando houver.

## 30. CONFIGURAÇÃO DE REGRAS

Interface deve ser amigável, sem exigir conhecimento de N8N.

Exemplo:

`Se um lead ficar sem evolução por [3] dias → lembrar [corretor] por [WhatsApp + dashboard]. Se não atualizar em [1] dia → avisar [gerente].`

O sistema traduz isso para automação.

## 31. PRESETS

Oferecer presets recomendados para ativação rápida, todos editáveis.

Exemplo:

- atendimento agressivo;
- atendimento padrão;
- Luxury;
- locação;
- proprietário.

Não impor preset como regra universal.

## 32. FISCAL / COMISSÕES

Para emissão fiscal automatizada de comissão/receita da imobiliária, Lopito deve verificar dependências:

- dados fiscais;
- regime/provider;
- certificado quando exigido;
- série/configuração;
- serviço/código;
- município;
- integração ativa.

Se faltar algo, avisar gestão exatamente o que falta.

## 33. DOCUMENTOS E CERTIFICADOS

Monitorar vencimentos e integridade de configurações críticas.

Avisar antecipadamente sobre certificado próximo do vencimento.

## 34. CONFIGURAÇÃO DE PESQUISAS

Definir uma vez:

- quando enviar;
- qual público;
- canal;
- template;
- anonimato ou identificação;
- gatilho de detrator;
- ação posterior.

## 35. PESQUISA PÓS-VISITA

Automática após visita concluída dentro do delay configurado.

## 36. PESQUISA PÓS-FECHAMENTO

Automática conforme configuração.

## 37. DETRATORES

NPS/CSAT abaixo do limite → ticket/alerta automático → gestão/corretor responsável.

## 38. COMUNICAÇÃO COM CORRETOR

Corretor deve receber somente alertas acionáveis.

Cada mensagem inclui:

- o que aconteceu;
- quem é o lead;
- por que precisa agir;
- prazo;
- botão direto para ação.

## 39. MOBILE-FIRST DO CORRETOR

Lembrete deve abrir diretamente o lead/visita/proposta no app/PWA, não uma home genérica.

## 40. RESUMO DIÁRIO DO CORRETOR

Opcional/configurável:

- leads novos;
- follow-ups;
- visitas;
- propostas;
- tarefas críticas.

## 41. RESUMO DA GESTÃO

Opcional/configurável:

- SLAs vencidos;
- conversões;
- visitas;
- propostas;
- exceções;
- integrações;
- pendências de configuração;
- saúde da automação.

## 42. AUTOMAÇÃO NÃO SIGNIFICA AUSÊNCIA DE CONTROLE

Toda regra deve ser:

- visível;
- editável;
- versionada;
- auditável;
- ativável/desativável;
- testável.

## 43. HUMAN-IN-THE-LOOP APENAS ONDE NECESSÁRIO

Manter aprovação humana para:

- decisões jurídicas;
- negociações relevantes;
- documentos/assinaturas que exijam pessoa;
- alterações financeiras sensíveis;
- ações de alto impacto;
- exceções.

O objetivo é eliminar trabalho administrativo repetitivo, não retirar controles legais/profissionais obrigatórios.

## 44. SLA DE AUTOMAÇÃO

O próprio sistema deve monitorar se workflows críticos estão rodando.

Se N8N falhar, avisar gestão/tecnologia.

## 45. TESTE E2E — CONFIGURAÇÃO INICIAL

**primeiro login gestão → Lopito abre → checklist → pergunta regras mínimas → salvar → validar dependências → ativar jornadas → mostrar status.**

## 46. TESTE E2E — LEAD SEM EVOLUÇÃO

**lead entra → corretor recebe → prazo vence → lembrete → sem atualização → escalonamento → CRM/auditoria.**

## 47. TESTE E2E — VISITA

**visita agendada → confirmação → lembrete → check-in → corretor não registra feedback → lembrete → feedback → pesquisa cliente.**

## 48. TESTE E2E — CONFIGURAÇÃO AUSENTE

**fiscal incompleto → Lopito detecta → avisa gestão → CTA configuração → dependência resolvida → recurso muda para ativo.**

## 49. TESTE E2E — TEMPLATE

**evento → template correto → identidade Enjoy → variáveis preenchidas → canal → envio → tracking → CRM.**

## 50. TESTE E2E — ESTADO REAL

Lead avançou antes do timer → workflow antigo deve cancelar/saltar a mensagem incompatível.

## 51. CRITÉRIO DE ACEITE DE AUTONOMIA

PASS somente quando:

- regras configuráveis pela gestão;
- Lopito guia setup;
- dependências detectadas;
- templates prontos;
- N8N state-aware;
- corretor recebe lembretes;
- visitas automatizadas;
- follow-ups automatizados;
- propostas monitoradas;
- proprietário atualizado;
- pesquisas automatizadas;
- exceções escaladas;
- auditoria completa;
- nenhuma rotina crítica depende de recepcionista/secretária para funcionar.

## 52. REGRA FINAL AO CAUÃ

A proposta da Enjoy dentro do Impulsionando é **operação autônoma por padrão e gestão por exceção**.

A gestão configura poucas regras essenciais uma única vez. Depois disso:

**LOPITO ENTENDE → CRM REGISTRA → N8N EXECUTA → CORRETOR AGE → SISTEMA COBRA → LOPITO MONITORA → GESTÃO SÓ RECEBE O QUE REALMENTE EXIGE ATENÇÃO.**

Não construir uma plataforma que digitaliza tarefas de secretaria e depois exige alguém clicando nelas manualmente.

Construir uma plataforma que **remove a necessidade dessas tarefas manuais** por meio de contexto, regras, automação, agentes e auditoria.

O humano permanece onde gera valor: relacionamento, visita, negociação, decisão e responsabilidade profissional.

**STATUS: PRODUCT INTAKE SALVO COMO ADDENDUM OBRIGATÓRIO DO SUPERPROMPT MESTRE ENJOY.**