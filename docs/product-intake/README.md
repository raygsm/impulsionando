# Product Intake — padrão oficial de execução Impulsionando

Este diretório é a fonte oficial para registrar novos pedidos de produto e execução em todo o Ecossistema Impulsionando.

## Regra universal
A partir de agora, qualquer pedido novo relacionado à própria Impulsionando ou a qualquer tenant/cliente deve passar por Product Intake antes da execução, sem exigir que o usuário conheça um formato de mensagem.

O usuário pode simplesmente escrever, falar ou transcrever uma frase em linguagem natural, por exemplo:

- "Intake: tem um erro no botão da Ana Madú."
- "Intake: quero mudar a configuração desse tenant."
- "Intake: cria uma nova jornada para recuperação de clientes."
- "Intake: no futuro quero que o ERP faça X."
- "Intake: corrige esse problema no backend."

Não é necessário preencher formulário, usar sintaxe especial ou escrever prompt complexo.

## Gatilho oficial único
A palavra **`intake`** é o único gatilho oficial para ativar este fluxo.

Quando o usuário disser algo como:

- "Intake: esse botão está errado."
- "Intake Ana Madú: quero mudar esse trecho."
- "Intake, vê esse erro aqui."
- "Intake: pensei numa melhoria para o ERP."
- "Intake Diba: quero mudar a busca de produto."
- "Intake: olha esse print e ajusta isso."

O agente deve entender automaticamente que precisa transformar a fala informal em um Product Intake estruturado.

O gatilho **não exige formato adicional**. A mensagem pode ser curta, incompleta, coloquial, conter erro de digitação, vir de áudio transcrito, imagem, print ou contexto anterior. O agente deve usar o contexto disponível e conduzir o restante.

## Experiência obrigatória do usuário
O usuário fala de forma simples e natural. O agente assume o trabalho de:

1. entender a intenção real;
2. recuperar o contexto relevante;
3. organizar o pedido tecnicamente;
4. estruturar a demanda em ordem lógica e cronológica;
5. identificar impactos, dependências, riscos, regressões potenciais e critérios de aceite;
6. transformar a fala informal em uma especificação clara e executável;
7. apresentar ao usuário exatamente o que entendeu;
8. permitir que o usuário apenas incremente, ajuste ou confirme;
9. somente após confirmação explícita, iniciar a execução.

A interação ideal é:

`INTAKE EM LINGUAGEM NATURAL -> AGENTE INTERPRETA -> AGENTE ESTRUTURA -> AGENTE APRESENTA O QUE ENTENDEU -> USUÁRIO AJUSTA/INCREMENTA OU CONFIRMA -> EXECUÇÃO -> REVISÃO -> QA -> DEPLOY -> VERIFICAÇÃO -> FECHAMENTO`

## Regra de confirmação
Dizer `intake` **não autoriza automaticamente alterações em produção, código, banco, infraestrutura ou configuração**.

O agente deve primeiro consolidar a demanda e apresentar uma versão organizada ao usuário.

A execução começa quando o usuário confirmar de forma inequívoca, por exemplo:

- "É exatamente isso."
- "Confirmado."
- "Pode executar."
- "Siga."
- "Avance."
- "Perfeito, faça."

Se o usuário corrigir ou acrescentar algo, o agente atualiza o Intake e reapresenta a versão consolidada antes da execução, salvo quando a própria mensagem já contiver confirmação inequívoca da versão final.

Exceção: incidente P0 com risco imediato de indisponibilidade, segurança, perda ou corrupção de dados pode exigir contenção emergencial. Nesse caso, o agente registra o Intake em paralelo e limita a intervenção à contenção necessária, preservando evidências e rollback.

## Papel do agente
Ao receber `intake`, o agente deve:

1. identificar automaticamente o fluxo de Product Intake;
2. interpretar linguagem informal sem exigir jargão técnico;
3. identificar tenant/cliente, Core, front, back, infraestrutura, integração, automação ou módulo afetado;
4. recuperar contexto existente, decisões anteriores, código, configuração e estado real quando as fontes conectadas permitirem;
5. não perguntar novamente algo que já esteja claro no contexto ou possa ser verificado diretamente;
6. fazer perguntas simples em português, uma por vez, somente quando uma informação realmente necessária não puder ser inferida com segurança;
7. classificar a demanda: bug, melhoria, novo recurso, configuração, segurança, infraestrutura, conteúdo, UX/UI, integração, automação, compliance ou outro tipo pertinente;
8. analisar impacto técnico e de negócio;
9. mapear públicos e jornadas afetadas;
10. analisar frontend, backend, dados, APIs, N8N, agentes, MCPs/tools, billing, permissões, segurança e LGPD quando aplicável;
11. verificar duplicidade, conflito, dependência, complementaridade e regressão potencial em relação a demandas anteriores;
12. definir prioridade e risco sugeridos;
13. definir critérios objetivos de aceite e plano de validação;
14. organizar um plano técnico e cronológico de execução;
15. registrar ou atualizar o documento correspondente em `docs/product-intake/`;
16. gerar `Resumo para o dono de produto` em linguagem simples;
17. apresentar a especificação consolidada ao usuário para ajuste ou confirmação;
18. após confirmação, executar apenas o escopo aprovado;
19. realizar revisão, QA, deploy e verificação no ambiente correto;
20. atualizar o Intake com evidências e status final.

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
`DRAFT -> TRIAGE -> AWAITING_OWNER_CONFIRMATION -> APPROVED -> PLANNED -> IN_PROGRESS -> REVIEW -> QA -> READY_FOR_DEPLOY -> DEPLOYED -> VERIFIED -> CLOSED`

`DEPLOYED` nunca equivale automaticamente a `CLOSED`.

## Regra de continuidade
Um novo Intake não substitui automaticamente um pedido anterior. O agente deve verificar duplicidade, conflito, dependência, complemento e prioridade antes de alterar backlog ou execução existente.

## Regra de preservação
Toda execução deve partir do estado real atual, preservar o que estiver correto e alterar apenas o necessário. Não reiniciar, reescrever ou substituir componentes funcionais sem justificativa técnica.

## Regra de simplicidade
A interface do usuário com este processo deve permanecer deliberadamente simples.

**Uma frase iniciada por `intake` deve ser suficiente para começar.**

O trabalho de investigar, interpretar, estruturar, organizar, documentar, perguntar, planejar e preparar a execução pertence ao agente. Ao usuário cabe apenas complementar, corrigir ou confirmar o entendimento antes da execução.
## Commit e push automáticos (obrigatório)

Sempre que o agente **criar, atualizar, categorizar ou mover** qualquer arquivo sob `docs/product-intake/` — após terminar o bloco de escrita atual — **deve** fazer commit e push **sem perguntar** e **mesmo que o usuário não peça**.

### Escopo permitido

Inclua **apenas**:

- `docs/product-intake/**`
- `.cursor/rules/impulsionando-feature-intake.mdc` (se alterada na mesma sessão)

Não faça stage de `src/`, `package.json`, `.env*`, nem do restante do repo.

### Quando disparar

1. Depois de criar rascunho / Intake estruturado.
2. Depois de cada bloco relevante de informação gravado.
3. Depois de mover/categorizar o arquivo.
4. No fechamento da entrevista / confirmação do dono — sempre.

### Como executar

```bash
git add -- docs/product-intake/
# opcional:
# git add -- .cursor/rules/impulsionando-feature-intake.mdc
git commit -m "docs(product-intake): <tipo> <app> — <slug curto>"
git push
```

Detalhe operacional completo: `AGENTS.md` e `.cursor/rules/impulsionando-feature-intake.mdc`.
