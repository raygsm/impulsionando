# Required Status Checks — `main`

The `security-rls` workflow (`.github/workflows/security-rls.yml`,
job **`Security scan + RLS regression`**) MUST be a required status check
before any PR can merge into `main`.

## Why
It runs:
1. `supabase db lint --level error` (security warnings → fail)
2. The full RLS regression suite, including `audit-denied-exports.test.ts`
   which verifies every denied export/download path writes to `audit_logs`.

Artifacts uploaded on every run (downloadable from the PR checks tab):
- `security-scan-report` — db linter output + recent `audit_logs` denials
- `rls-test-report` — JUnit XML + verbose vitest log
- `security-rls-results` — combined `test-results/` directory

## How to enforce (one-time GitHub setting)

GitHub branch protection is configured in the repository UI, not in code.
Apply this once on the repository:

1. Open **Settings → Branches → Branch protection rules → Add rule**.
2. Branch name pattern: `main`.
3. Enable **Require status checks to pass before merging**.
4. Under **Status checks that are required**, search for and add:
   - `Security scan + RLS regression`
5. Enable **Require branches to be up to date before merging**.
6. Save.

> Tip: if you use a ruleset instead of classic protection, add the same
> check name under **Rules → Require status checks to pass**.

After this is enabled, any PR whose `security-rls` job fails (or never
runs) will be blocked from merging — including PRs that touch RLS
policies, export endpoints, or the cron tick.

## Local reproduction
```bash
bunx vitest run \
  tests/rls-permission-hardening.test.ts \
  tests/rls-contab-rules-isolation.test.ts \
  tests/rls-contracts-isolation.test.ts \
  tests/rls-permissions.test.ts \
  tests/rls-exports-isolation.test.ts \
  tests/audit-denied-exports.test.ts
```

---

## Required check adicional: `Tests Gate`

O workflow `.github/workflows/tests-gate.yml` (job **`Vitest full suite (456/456 must pass)`**)
deve ser marcado como required status check em **Settings → Branches → main**:

1. Settings → Branches → Branch protection rules → editar regra de `main`
2. Em **Status checks that are required**, adicionar:
   - `Vitest full suite (456/456 must pass)`
3. Manter **Require branches to be up to date before merging** ativo
4. Salvar

Resultado: qualquer PR cujo `bunx vitest run` falhe (qualquer dos 456 testes)
fica automaticamente bloqueado para merge. O job ainda publica o artefato
`vitest-results` (JSON + JUnit + log) e atualiza `public/qa-history.json`
alimentando o dashboard em `/admin/qualidade`.

### Reprodução local

```bash
bunx vitest run
```

Para regenerar o histórico/PDF manualmente:

```bash
bunx vitest run --reporter=json --outputFile=/tmp/vitest.json
node scripts/append-quality-history.mjs /tmp/vitest.json > public/qa-history.json
```
