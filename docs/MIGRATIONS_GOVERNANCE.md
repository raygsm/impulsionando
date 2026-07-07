# Governança de Migrations — Core Impulsionando

## Regra de Ouro

**Toda alteração de schema passa por migration versionada.** Nunca rode `CREATE TABLE`, `ALTER TABLE`, `CREATE POLICY` ou qualquer DDL direto no banco de produção fora do fluxo de migrations.

## Localização

Todas as migrations vivem em `supabase/migrations/` no repositório, com naming `YYYYMMDDHHMMSS_description.sql`. O sync bidirecional Lovable ↔ GitHub garante que cada migration aplicada via Lovable também apareça no repo automaticamente.

## Como Criar Migration

### Via Lovable (recomendado)
Peça a alteração no chat. A IA usa a `supabase--migration` que:
1. Escreve o arquivo em `supabase/migrations/`
2. Solicita sua aprovação
3. Aplica ao banco após aprovação
4. Regenera `src/integrations/supabase/types.ts`

### Localmente (avançado)
```bash
# 1. Criar arquivo com timestamp
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_nome_descritivo.sql

# 2. Escrever SQL (SEMPRE incluir: CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY)

# 3. Aplicar via Supabase CLI (fora do Lovable) ou colar via ferramenta migration da IA
```

## Regras Obrigatórias em Toda Migration

Ordem estrita para novas tabelas em `public`:

```sql
-- 1. CREATE TABLE
CREATE TABLE public.minha_tabela ( ... );

-- 2. GRANT (Data API não concede automaticamente)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.minha_tabela TO authenticated;
GRANT ALL ON public.minha_tabela TO service_role;
-- GRANT SELECT ON public.minha_tabela TO anon;  -- apenas se houver política pública

-- 3. ENABLE RLS
ALTER TABLE public.minha_tabela ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICY
CREATE POLICY "..." ON public.minha_tabela FOR SELECT TO authenticated USING (...);
```

Migration que cria tabela sem `GRANT` é **incorreta** e falha em runtime com "permission denied".

## Reversão

**Nunca edite uma migration já aplicada.** Para reverter:
1. Crie uma nova migration com o SQL inverso (`DROP TABLE`, `ALTER TABLE ... DROP COLUMN`, etc.)
2. Documente no comentário do arquivo o motivo da reversão e a migration original
3. Aplique via fluxo normal

## Auditoria de Consistência

Script `scripts/audit-schema.ts` compara:
- Tabelas em `information_schema` (banco vivo)
- vs. Tabelas declaradas em `supabase/migrations/*.sql`

Roda automaticamente em cada PR via GitHub Action `.github/workflows/schema-check.yml`.

```bash
bun scripts/audit-schema.ts
```

Saída aponta drift:
- ⚠️  Tabela no banco sem migration correspondente (schema modificado fora do fluxo)
- ⚠️  Migration declara tabela que não existe no banco (falha de aplicação)

## Boas Práticas

- **1 migration = 1 mudança lógica coesa** (uma feature, um refactor). Não misture 5 alterações não relacionadas.
- **Sempre teste em preview antes**. A IA aplica no banco dev do Lovable, mas você pode replicar em Postgres local.
- **Nunca use `DROP TABLE ... CASCADE` sem revisar** dependências (FKs, views, funções).
- **Migrations são imutáveis**. Se aplicada uma vez, congelou.
- **CHECK constraints não podem referenciar `now()`** ou dados variáveis — use trigger de validação.
- **Não faça `ALTER DATABASE postgres ...`** — é rejeitado.

## Fluxo em CI/CD (Self-Hosting Futuro)

Se/quando sair do Lovable Cloud, o fluxo passa a ser:
1. PR abre → GitHub Action valida naming + sintaxe SQL
2. Merge → deploy automático aplica migrations pendentes via `supabase db push`
3. Falha → rollback automático (nova migration inversa)
