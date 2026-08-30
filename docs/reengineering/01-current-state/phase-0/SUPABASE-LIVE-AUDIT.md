# Auditoria estrutural do Supabase live

Data da coleta completa: 2026-08-28

Projeto informado: único projeto Supabase, plano Pro, contendo cadastros de pessoas reais.

Os CSVs completos permanecem em `.local/phase0-evidence/`, ignorados pelo Git. Nenhum registro de aplicação ou secret foi exportado.

## Dimensão live

| Superfície                                       | Quantidade |
| ------------------------------------------------ | ---------: |
| tabelas em todos os schemas                      |        624 |
| tabelas em `public`                              |        577 |
| tabelas públicas com RLS                         |        556 |
| tabelas públicas sem RLS                         |         21 |
| policies públicas                                |        680 |
| functions públicas                               |        603 |
| functions `SECURITY DEFINER` em `public/private` |        363 |
| triggers públicos                                |        178 |
| linhas no histórico de migrations                |        559 |
| buckets                                          |         12 |

O catálogo de colunas contém 8.262 linhas. Existem 267 tabelas públicas com `company_id`, 131 com `tenant_id`, 56 com `user_id` e 196 sem `company_id` nem `tenant_id`.

## RLS e grants

- 680 policies cobrem 455 tabelas públicas.
- 619 policies são para `authenticated`; 34 para `anon,authenticated`; 26 para `public`; uma para `anon`.
- 15 policies têm expressão `USING true`; duas têm `WITH CHECK true`.
- Nove policies contêm UUID de tenant hardcoded, principalmente Chrismed.
- 101 tabelas têm RLS ligado e nenhuma policy explícita. Isso normalmente resulta em default-deny para clientes, não exposição.
- As 21 tabelas sem RLS pertencem ao módulo EVR, estavam vazias segundo a estimativa do catálogo e não concedem SELECT/INSERT/UPDATE/DELETE a `anon/authenticated`.
- Essas 21 tabelas ainda possuem grants técnicos como REFERENCES/TRIGGER/TRUNCATE; devem receber RLS e grants mínimos antes de armazenar dados reais.

Grants amplos em tabelas protegidas por RLS são comuns no modelo Supabase e não significam, sozinhos, vazamento. O risco aparece quando a tabela está exposta e RLS está ausente ou incorreto.

## Functions privilegiadas

Todas as 363 functions `SECURITY DEFINER` possuem uma configuração de `search_path`, o que é um controle positivo.

Entretanto:

- 47 podem ser executadas por `anon`;
- 200 podem ser executadas por `authenticated`;
- 232 podem ser executadas por `service_role`.

As functions anônimas incluem fluxos intencionalmente públicos por token, como agendamento Chrismed, eventos, contratos WMP, convites e demos EVR. Também incluem operações que escrevem dados, calculam cobrança ou retornam configuração.

Permissão de execução não prova vulnerabilidade. O corpo de cada uma das 47 functions precisa ser revisado para confirmar validação do token, rate limit, idempotência, escopo de tenant e ausência de enumeração.

## Policies que exigem revisão

- Duas tabelas de configuração de billing permitem SELECT autenticado com `true`.
- Catálogos e definições de módulos também possuem leitura autenticada irrestrita; isso pode ser intencional.
- Tabelas demo EVR possuem leitura/escrita anônima irrestrita por design aparente.
- Uma policy de registro em evento permite INSERT anônimo com `WITH CHECK true`.
- Nove policies Chrismed acoplam regras a um UUID fixo de empresa.

Nenhuma dessas regras deve ser alterada antes de revisar o consumidor. O acoplamento por UUID, porém, não é compatível com uma plataforma que pretende adicionar tenants sem trabalho manual.

## Storage

Existem 12 buckets, 11 privados e um público. O bucket público é `anamadu-products`, limitado a imagens JPEG/PNG/WebP e 10 MiB.

Os nomes live divergem parcialmente dos buckets encontrados nas migrations locais, indicando renome, evolução ou drift.

## Drift confirmado

### Tipos TypeScript versus live

- live: 577 tabelas públicas;
- snapshot TypeScript: 465;
- presentes apenas no live: 435;
- presentes apenas no snapshot TypeScript: 323;
- interseção: apenas 142 tabelas.

Isso não é um pequeno atraso de geração. O arquivo de tipos aparenta representar outro momento ou outra estrutura do banco e não pode ser tratado como contrato confiável.

### Migrations do repositório versus histórico live

- live: 559 versões aplicadas;
- repositório: 579 arquivos e 576 versões únicas;
- versões apenas no repositório: 484;
- versões apenas no live: 467;
- três timestamps duplicados no repositório.

A diferença não equivale a “20 migrations pendentes”. As duas histórias possuem apenas uma pequena interseção e provavelmente foram produzidas por mecanismos diferentes. Executar `db push`, `db reset --linked` ou migrations em lote agora seria extremamente perigoso.

## Outras observações

- 178 triggers públicos afetam 126 tabelas, indicando bastante lógica implícita no banco.
- A tabela `imp_monitoring_checks` possui estimativa de aproximadamente 2,4 milhões de registros e deve ser avaliada quanto a retenção/particionamento/custo.
- Nenhuma tabela pública usa `FORCE ROW LEVEL SECURITY`; owners e service roles continuam capazes de bypass, comportamento esperado que exige controle de credenciais.

## Avaliação

O banco é objetivamente complexo e possui drift grave. Ainda não é correto concluir que suas 577 tabelas devam ser consolidadas: vários bounded contexts legítimos estão presentes.

Os problemas estruturais prioritários são:

1. ausência de uma source of truth reproduzível para schema/migrations;
2. tipos TypeScript materialmente divergentes do live;
3. identidade multi-tenant inconsistente entre `company_id`, `tenant_id` e regras específicas;
4. alto volume de lógica privilegiada em functions e triggers;
5. funções públicas por token que precisam de auditoria de abuso;
6. tabelas novas sem RLS preparadas para futuros dados EVR;
7. produção real sem ambiente de staging confirmado.

Nenhuma migration corretiva deve ser aplicada durante a Fase 0. Primeiro precisamos capturar a estrutura live como baseline, provar backup/restore e definir a estratégia de reconciliação.
