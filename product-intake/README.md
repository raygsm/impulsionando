# PRODUCT INTAKE — REGRA DE GOVERNANÇA DE BRANCH

**Branch exclusiva e obrigatória:** `reengineering/program`

O diretório `product-intake/` e TODOS os seus arquivos `.md` existem exclusivamente na branch `reengineering/program`.

## Regras obrigatórias

- Nunca criar, atualizar, copiar, versionar ou manter `product-intake/` na branch `main`.
- Todo prompt, requisito, ajuste, ideia, demanda ou execução futura classificada como **Intake / Livro de Anotações** deve ser registrada somente em `reengineering/program`.
- `product-intake/` é documentação de produto para análise e implementação posterior pelo programador, especialmente Cauã.
- Conteúdo de Intake **não autoriza alteração de código, banco, infraestrutura, deploy ou produção** por si só.
- Quando um Intake for posteriormente implementado, o código correspondente seguirá o fluxo de engenharia definido para `reengineering/program`; somente depois dos gates técnicos aplicáveis poderá avançar para os fluxos de publicação estabelecidos.
- Se qualquer arquivo `product-intake/` aparecer na `main`, isso deve ser tratado como erro de governança e removido da `main`, preservando seu conteúdo em `reengineering/program`.

## Regra para agentes e automações

Antes de escrever em `product-intake/`, verificar a branch alvo. Se não for exatamente `reengineering/program`, interromper a escrita e corrigir o destino.

**Resumo:** `product-intake/*` = `reengineering/program` somente. Nunca `main`.
