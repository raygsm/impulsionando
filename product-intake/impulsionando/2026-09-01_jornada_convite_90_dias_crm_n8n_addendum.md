# ADDENDUM PRODUCT INTAKE — JORNADA 90 DIAS / CRM + N8N + IMPULSIONITO

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**

## 1. Princípio
A campanha dos 90 dias não é um disparo isolado. É uma jornada transacional/comercial completa: seleção do cliente no CRM → personalização automática → envio por e-mail e WhatsApp → clique único rastreável → percepção de conversão → boas-vindas → primeiro acesso → adoção → suporte → retenção → conversão.

## 2. Origem e canais
A ação deve nascer no módulo CRM/Comunicações da própria Impulsionando. E-mail remetente: `sac@impulsionando.com.br`. WhatsApp oficial: `(21) 99307-5000`. O operador seleciona um tenant/cliente existente e o CRM preenche automaticamente responsável, empresa, e-mail, celular/WhatsApp, subdomínio, link de gestão, agente e demais dados canônicos. Nunca redigitar dados que já existam na base.

## 3. Link único nos dois canais
O convite enviado por e-mail e WhatsApp deve apontar para o MESMO destino lógico do cliente e para a mesma campanha/jornada. O link deve conter identificação segura e rastreável, sem expor IDs internos previsíveis nem segredos. O sistema deve preservar canal de origem separadamente para atribuição, mesmo quando o destino é o mesmo.

## 4. CLIQUE É EVENTO DE CONVERSÃO
O clique no link é um gatilho de relacionamento, não apenas analytics. Ao primeiro clique válido, registrar imediatamente `INVITE_LINK_CLICKED` com tenant, contato, campanha, timestamp, canal/origem, UTM e journey_instance. Esse evento deve mover o contato de CONVITE_ENVIADO para INTERESSE/ENGAJAMENTO e acionar a próxima etapa da jornada.

O clique NÃO significa contratação, aceite jurídico nem primeiro login. São eventos diferentes e devem permanecer separados no funil.

## 5. Reação imediata ao clique
Depois de `INVITE_LINK_CLICKED`, o N8N deve consultar o estado atual. Se ainda não houve ativação/login, pode disparar uma comunicação de acolhimento/continuidade, respeitando cooldown e regras do canal, na linha: `Que legal que você veio conhecer. Seu ambiente da {{empresa}} está preparado. Entre, explore e chame o {{agente}}. Pergunte: por onde eu começo?`

Nunca enviar essa mensagem se o usuário já avançou para primeiro login antes de o workflow processar o evento.

## 6. Landing/entrada contextual
Ao clicar, o usuário deve cair diretamente no ambiente correto ou em uma entrada segura de ativação, já contextualizada para `{{empresa}}`, sem fazê-lo procurar seu tenant. Exibir claramente que a empresa foi selecionada para 90 dias sem mensalidade e sem setup, sem alegar contratação prévia.

## 7. Primeiro acesso
`FIRST_LOGIN` é um novo marco de conversão. Deve cancelar automaticamente lembretes de não acesso e disparar a jornada de boas-vindas pós-login por e-mail e WhatsApp, com mensagem personalizada: `Pô, que legal, {{primeiro_nome}}! A gente viu que você acessou o Impulsionando pela primeira vez. Muito bom ter a {{empresa}} por aqui. O {{agente}} está dentro da sua gestão para te ajudar.`

## 8. Impulsionito no dashboard
No primeiro acesso à gestão, o Impulsionito/agente contextual deve abrir automaticamente, cumprimentar e se oferecer para orientar. Exemplo: `Olá, {{primeiro_nome}}! Estou por aqui. Se precisar de mim, é só chamar. Posso te ajudar a conhecer e usar o Impulsionando.` Depois deve minimizar automaticamente, permanecer acessível e não repetir a abertura invasiva em todos os logins. Registrar `AGENT_WELCOME_SHOWN`.

## 9. Primeira interação e primeira ação útil
Registrar separadamente `FIRST_AGENT_INTERACTION` e `FIRST_MEANINGFUL_ACTION`. A ação significativa depende da vertical: primeiro lead, cliente, venda, item de estoque, campanha, reserva, consulta, evento etc. Esses eventos alimentam adoção e Customer Success.

## 10. Funil canônico
`INVITE_CREATED → INVITE_SENT → DELIVERED → OPENED (sinal auxiliar) → INVITE_LINK_CLICKED → ACCOUNT_ACTIVATED → FIRST_LOGIN → AGENT_WELCOME_SHOWN → FIRST_AGENT_INTERACTION → FIRST_MEANINGFUL_ACTION → ENGAGED → TRIAL_MILESTONE → PLAN_CONVERTED`.

Também suportar `BOUNCE`, `DELIVERY_FAILED`, `OPT_OUT`, `INACTIVE`, `TICKET_OPENED`, `TICKET_RESOLVED`, `TRIAL_EXPIRING`.

## 11. Orquestração N8N
Arquitetura preferida: EVENTO → webhook/event bus → N8N → resolver tenant/contato → consultar estado da jornada → verificar consentimento/política/canal → escolher template versionado → personalizar → enviar → registrar resultado → atualizar CRM → programar próxima ação.

Todos os handlers devem ser idempotentes. O mesmo evento recebido duas vezes não pode gerar duas mensagens.

## 12. Estado antes de mensagem
Toda automação deve consultar o estado real antes de enviar. Exemplos: quem já fez login não recebe `você ainda não entrou`; quem converteu não recebe régua de conversão; quem optou por sair não recebe campanha; quem está ativo não recebe reativação equivocada.

## 13. Régua de relacionamento
Criar jornadas comportamentais para: clicou/não entrou; primeiro login; entrou/não usou; primeira interação com agente; primeira ação útil; inatividade D+3/D+7/D+15/D+30 parametrizável; marcos D1/D7/D15/D30/D45/D60/D75/D83/D87/D89/D90; proximidade do fim; conversão para plano. Não disparar todos os marcos cegamente: comportamento decide a mensagem.

## 14. Percepção de conversão no CRM
O clique deve ser visível imediatamente no CRM como sinal de interesse. O card do cliente deve mostrar: convite enviado, entregue, aberto quando disponível, clicado, primeiro acesso, última atividade, agente utilizado, ações significativas, tickets, dias restantes, etapa da jornada, último contato e próxima ação.

## 15. Customer Success Intelligence
Impulsionito deve funcionar como organismo vivo: entender onde o cliente está na adoção, quais módulos usa, quais não usa, dúvidas recorrentes e dificuldades, para orientar proativamente sem inventar dados. O objetivo é reduzir suporte manual e aumentar ativação real.

## 16. Suporte integrado
Se o agente não resolver uma dúvida com segurança, oferecer abertura de chamado. Com autorização, transportar contexto para ticket, gerar número, prioridade, SLA, histórico e acompanhamento sem exigir que o cliente explique tudo novamente.

## 17. Segurança e privacidade
RLS/RBAC e isolamento tenant são obrigatórios. Tokens de convite devem ser seguros, expiráveis/revogáveis quando aplicável e não carregar segredos. Nunca expor API keys. Respeitar LGPD, opt-out e regras do provedor de WhatsApp/e-mail. Open-rate é sinal auxiliar; clique/login/ação são sinais de maior confiança.

## 18. Critério E2E obrigatório
Antes de liberar campanha real, executar: selecionar cliente no CRM → dados preenchidos automaticamente → preview → envio e-mail + WhatsApp → mesmo destino lógico → entrega registrada → clique → `INVITE_LINK_CLICKED` → CRM muda estágio → gatilho de relacionamento → ativação → primeiro login → cancelar lembretes incompatíveis → Impulsionito abre/minimiza → boas-vindas pós-login → primeira interação → primeira ação significativa → CRM/N8N atualizados.

Só marcar PASS com evidência.

## 19. Regra final
O sistema deve perceber que o cliente avançou antes que uma pessoa da Impulsionando precise perceber. Cada ação relevante do usuário deve atualizar contexto e decidir a próxima melhor ação. Essa é a materialização do conceito Impulsionito como cérebro vivo do ecossistema.

**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**