# Universal Intake Governance

## Regra absoluta

A partir de 2026-08-31, **todo prompt, comando, demanda, correção, ajuste, decisão, auditoria, descoberta, execução, melhoria ou requisito do Ecossistema Impulsionando é um Intake**.

Não existe execução válida fora de Intake.

## Retroatividade

Itens anteriores que tenham sido criados, executados ou documentados sem classificação formal de Intake devem ser **reenquadrados retroativamente como Intake**, sem perda de:

- conteúdo original;
- contexto e origem;
- prioridade;
- dependências;
- tenant/produto afetado;
- evidências;
- histórico de decisões;
- vínculo com commits, PRs, workflows, migrations, deploys e incidentes;
- estado real da execução.

A retroclassificação não autoriza reimplementar, duplicar ou reexecutar trabalho já comprovadamente concluído.

## Lifecycle obrigatório

Todo Intake deve ser rastreável pelo menos pelos estados abaixo:

1. `INTAKE` — recebido e registrado;
2. `IMPLEMENTED` — alteração existente em código/configuração/documentação aplicável;
3. `TESTED` — evidência de teste correspondente ao escopo;
4. `DEPLOYED` — versão correspondente publicada no ambiente declarado;
5. `VERIFIED` — comportamento confirmado no ambiente-alvo com evidência suficiente.

Estados não podem ser inferidos. Cada transição exige evidência.

`IMPLEMENTED` não significa `TESTED`.
`TESTED` não significa `DEPLOYED`.
`DEPLOYED` não significa `VERIFIED`.

## Fonte de verdade

Para a reengenharia, a fonte arquitetural prioritária permanece `docs/reengineering`, em especial decisões aceitas, arquitetura-alvo, `STATUS.md`, gates de migração e evidências de teste/runtime.

O Intake organiza entrada e rastreabilidade; ele não substitui ADRs quando uma decisão arquitetural relevante exigir ADR.

## Base legada

A base legada entra em política de correção seletiva. Correções profundas que serão naturalmente eliminadas pela nova arquitetura não devem consumir esforço sem justificativa.

Trabalho no legado é prioritário somente quando necessário para:

- segurança;
- integridade de dados;
- indisponibilidade real;
- pagamentos/cobrança;
- continuidade operacional crítica;
- desbloqueio do pipeline/gate da reengenharia.

Demais necessidades devem ser incorporadas ao Intake e implementadas preferencialmente na nova base canônica.

## Progresso

Percentual de progresso do Superprompt Master deve refletir entregáveis efetivamente comprovados na nova arquitetura e demais escopos ainda válidos, evitando creditar remendos temporários do legado como avanço estrutural.

## Regra operacional

Nenhum prompt novo substitui silenciosamente um Intake anterior do mesmo projeto. Novos comandos complementam, refinam, priorizam, suspendem explicitamente ou encerram Intakes existentes, mantendo histórico e rastreabilidade.
