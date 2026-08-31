# Product Intake — padrão oficial de execução Impulsionando

Este diretório é a fonte oficial para registrar novos pedidos de produto e execução em todo o Ecossistema Impulsionando.

## Regra universal
A partir de agora, qualquer pedido novo relacionado à própria Impulsionando ou a qualquer tenant/cliente deve passar por Product Intake antes da execução, sem exigir que o usuário conheça um formato de mensagem.

O usuário pode simplesmente escrever, falar ou transcrever uma frase em linguagem natural, por exemplo:

- "Tem um erro no botão da Ana Madú."
- "Quero mudar a configuração desse tenant."
- "Crie uma nova jornada para recuperação de clientes."
- "No futuro, quero que o ERP faça X."
- "Corrija esse problema no backend."

Não é necessário preencher formulário, usar sintaxe especial ou escrever prompt complexo.

## Papel do agente
Ao receber uma intenção de execução, o agente deve:

1. identificar automaticamente que se trata de Product Intake;
2. classificar o tipo de demanda;
3. identificar tenant/cliente, front, back, infraestrutura, integração ou Core afetado;
4. recuperar contexto existente quando disponível;
5. fazer perguntas simples em português, uma por vez, somente quando houver informação realmente necessária faltando;
6. inferir impacto técnico, impacto de negócio, dependências, riscos e prioridade sugerida;
7. registrar o documento correspondente em `docs/product-intake/`;
8. produzir um bloco final `Resumo para o dono de produto`;
9. somente então encaminhar para planejamento e execução, exceto incidente P0, cuja contenção pode ocorrer em paralelo ao intake;
10. após execução, atualizar o item com evidências, validação e status final.

## Escopo
Aplica-se a:

- Impulsionando Core;
- todos os tenants atuais e futuros;
- frontend;
- backend;
- Supabase;
- GitHub;
- infraestrutura;
- DNS/subdomínios;
- N8N;
- automações e jornadas;
- CRM;
- ERP;
- PDV;
- agenda;
- BI;
- agentes de IA;
- MCPs e tools;
- segurança;
- LGPD e compliance;
- comunicação;
- integrações;
- dashboards;
- billing;
- documentos, contratos e termos;
- ideias futuras e backlog.

## Estados
`DRAFT -> TRIAGE -> APPROVED -> PLANNED -> IN_PROGRESS -> REVIEW -> QA -> READY_FOR_DEPLOY -> DEPLOYED -> VERIFIED -> CLOSED`

`DEPLOYED` nunca equivale automaticamente a `CLOSED`.

## Regra de continuidade
Um novo pedido não substitui automaticamente um pedido anterior. O agente deve verificar duplicidade, conflito, dependência, complemento e prioridade antes de alterar o backlog ou a execução existente.

## Regra de simplicidade
A interface do usuário com este processo deve permanecer deliberadamente simples: o usuário fala normalmente; o agente transforma a intenção em documentação estruturada e governança de execução.