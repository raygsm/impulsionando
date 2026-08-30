# CI/CD e releases

## Fluxo-alvo

```text
PR
 -> lint, types, unit, integration, RLS, contracts, build
 -> preview opcional

merge em main
 -> build único
 -> imagem GHCR:<full-sha>
 -> deploy em staging
 -> smoke + E2E

promoção aprovada
 -> mesma imagem em produção
 -> readiness gate
 -> smoke externo
 -> registrar release
```

## Regras de banco

- Migration aplicada por job controlado, não pelo startup de todas as réplicas.
- Alterações seguem expand/contract.
- Código novo convive temporariamente com schema anterior.
- Destruição de coluna/tabela ocorre em release posterior.
- Rollback de aplicação não pode depender de reverter migration destrutiva.

## Identidade do release

Todo serviço publica:

- commit SHA;
- data do build;
- versão do schema/contrato quando aplicável;
- ambiente;
- health e readiness.

## Gates de produção

- CI completa verde;
- staging saudável;
- migrations revisadas;
- backup/restauração compatíveis;
- plano de rollback;
- smoke tests por domínio crítico;
- aprovação humana enquanto o programa estiver em migração.

## Proibições

- tag `latest` como fonte de verdade;
- build dentro da VPS de produção;
- deploy por SSH que reescreve diretórios ativos;
- múltiplos workflows promovendo o mesmo serviço;
- fallback silencioso para release antigo não identificado.

