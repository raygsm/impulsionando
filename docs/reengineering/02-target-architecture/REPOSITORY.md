# Estrutura-alvo do repositório

```text
apps/
  platform-web/
  tenant-web/
  app-web/
  api/
  worker/

packages/
  contracts/
  domain/
  auth/
  database/
  integrations/
  observability/
  config/
  ui/
  testing/

supabase/
  migrations/
  functions/
  tests/
  seed/

infra/
  dokploy/
  compose/
  runbooks/
```

## Dependências permitidas

```text
apps/* -> packages/*
packages/integrations -> packages/domain contracts
packages/database -> packages/domain contracts
packages/domain -> contracts ou nenhuma dependência externa de infraestrutura
packages/contracts -> schemas e tipos somente
```

Frontends não importam implementações internas do API. API e worker podem compartilhar domínio e adapters, mas não código de bootstrap.

## Estratégia de transição

Não mover 1.083 rotas mecanicamente. Criar o workspace e migrar um fluxo vertical por vez. Código legado permanece no local até haver substituto testado e tráfego migrado.

## Convenções mínimas

- `pnpm` como único gerenciador de pacote.
- TypeScript strict.
- validação de ambiente no startup;
- contratos Zod/OpenAPI versionados;
- imports controlados por lint;
- testes próximos ao módulo e testes de contrato separados;
- nenhum package genérico chamado `utils` como destino de regras sem dono.

