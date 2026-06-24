# Supabase pooler para GitHub Actions

GitHub Actions nao deve usar o host direto do banco Supabase (`db.<project>.supabase.co`) para `supabase db push`, `psql` ou scanners que abrem conexao Postgres direta.

O endpoint direto pode resolver para IPv6. Quando o runner nao tem IPv6, a falha aparece assim:

```text
Your network does not support IPv6, which is required for direct connections to the database.
Retry with your project's IPv4 transaction pooler connection string via --db-url.
```

## Secrets corretos

Use a connection string de **Connect > Transaction pooler** no dashboard Supabase e configure:

```text
PGHOST=<host>.pooler.supabase.com
PGPORT=6543
PGUSER=postgres.<project-ref>
PGPASSWORD=<database-password>
PGDATABASE=postgres
```

Para o Core Impulsionando, o `<project-ref>` esperado pelo repositorio e:

```text
arygtqrdpcdkwnuwsgmm
```

Nao use:

```text
PGHOST=db.<project-ref>.supabase.co
PGPORT=5432
PGUSER=postgres
```

## Comando de apply

O comando de migration deve montar a URL com os secrets do pooler:

```bash
supabase db push --include-all --db-url "postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
```

Antes do apply, rode:

```bash
node scripts/verify-supabase-target.mjs
node scripts/verify-supabase-pooler.mjs
```

Assim o CI falha cedo se estiver apontando para o projeto errado ou para o endpoint IPv6 direto.
