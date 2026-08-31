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

## Gatilhos de linguagem natural
As palavras **`intake`** e **`socializar`** passam a ser gatilhos oficiais para ativar este fluxo.

Quando o usuário disser algo como:

- "Intake: esse botão está errado."
- "Intake Ana Madú: quero mudar esse trecho."
- "Socializar: pensei numa melhoria para o ERP."
- "Socializa isso para a Diba."
- "Intake, vê esse erro aqui."
- "Socializar essa ideia pro futuro."

O agente deve entender automaticamente que precisa transformar a fala informal em um Product Intake estruturado.

Esses gatilhos **não exigem formato adicional**. A mensagem pode ser curta, incompleta, coloquial, conter erro de digitação, vir de áudio transcrito, imagem, print ou contexto anterior. O agente deve usar o contexto disponível e conduzir o restante.

`intake` e `socializar` são equivalentes como intenção de registrar, estruturar, contextualizar e preparar uma demanda para governança e execução. Quando a fala também contiver ordem clara de execução, o agente deve registrar o intake e seguir o fluxo de execução aplicável, sem obrigar o usuário a repetir o pedido.

## Papel do agente
Ao receber uma intenção de execução ou um dos gatilhos oficiais, o agente deve:

1. identificar automaticamente que se trata de Product Intake;
2. interpretar linguagem informal e normalizar a intenção sem exigir jargão técnico;
3. classificar o tipo de demanda;
4. identificar tenant/cliente, front, back, infraestrutura, integração ou Core afetado;
5. recuperar contexto existente, histórico, decisões anteriores e estado atual quando disponíveis;
6. fazer perguntas simples em português, uma por vez, somente quando houver informação realmente necessária que não possa ser inferida com segurança;
7. nunca perguntar novamente algo que já esteja claro no contexto ou possa ser verificado nas fontes conectadas;
8. inferir impacto técnico, impacto de negócio, dependências, riscos, segurança, LGPD e prioridade sugerida;
9. verificar duplicidade, conflito, regressão potencial, dependência e relação com demandas anteriores;
10. registrar o documento correspondente em `docs/product-intake/`;
11. produzir um bloco final `Resumo para o dono de produto`;
12. encaminhar para planejamento e execução quando houver ordem de execução, exceto incidente P0, cuja contenção pode ocorrer em paralelo ao intake;
13. após execução, atualizar o item com evidências, testes, validação, deploy e status final.

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

A melhor experiência possível é: **uma frase do usuário deve ser suficiente para iniciar o processo**. O ônus de estruturar, investigar, perguntar, documentar e preparar a execução pertence ao agente, não ao usuário.