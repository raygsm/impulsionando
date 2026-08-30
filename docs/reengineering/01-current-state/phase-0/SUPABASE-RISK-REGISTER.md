# Registro de riscos do Supabase

## P0 — bloqueiam mudanças estruturais

| Risco                                                  | Evidência                                   | Ação segura na Fase 0                          |
| ------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------- |
| migrations locais e live possuem histórias divergentes | 484 versões apenas locais e 467 apenas live | proibir push/reset; capturar baseline live     |
| tipos TypeScript não representam o banco live          | interseção de apenas 142 tabelas            | regenerar somente após definir source of truth |
| backup restaurável não comprovado                      | workflow falhou antes do dump               | testar restore isolado                         |
| dados reais em projeto único sem staging confirmado    | informação de owners                        | criar estratégia de staging na Fase 1          |

## P1 — auditar antes do lançamento de fluxos

| Risco                             | Evidência                                             | Próxima validação                                 |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| functions privilegiadas anônimas  | 47 `SECURITY DEFINER` executáveis por `anon`          | revisar corpos, tokens, rate limit e idempotência |
| tabelas EVR sem RLS               | 21 tabelas, atualmente vazias e sem DML para clientes | impedir uso real até definir RLS                  |
| tenant acoplado à policy          | nove policies com UUID hardcoded                      | definir modelo de tenant antes de escalar         |
| escrita anônima em demos/eventos  | policies `true`                                       | confirmar isolamento e proteção contra abuso      |
| lógica implícita no banco         | 178 triggers públicos                                 | mapear side effects por jornada                   |
| possível crescimento sem retenção | ~2,4 milhões de checks estimados                      | medir tamanho, índices e política de retenção     |

## Controles positivos observados

- 556 de 577 tabelas públicas possuem RLS habilitado.
- As 21 sem RLS não concedem DML normal a `anon/authenticated` na coleta.
- Todas as functions `SECURITY DEFINER` inventariadas configuram `search_path`.
- Apenas um bucket é público e ele está limitado a formatos de imagem.

Esses controles reduzem risco, mas não substituem testes de autorização com usuários de tenants diferentes.
