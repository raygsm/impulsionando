# End-to-end tests (Playwright)

Audita o painel admin verificando que o logo correto aparece em todas as rotas principais.

## Rodando localmente

O Playwright sobe automaticamente um `vite preview` em `http://127.0.0.1:4173`. Basta exportar as credenciais de teste:

```bash
export E2E_EMAIL=...        # usuário com acesso ao painel
export E2E_PASSWORD=...
bun run test:e2e
```

Se preferir apontar para outro alvo (preview deploy, staging), defina:

```bash
export E2E_BASE_URL=https://meu-preview.lovable.app
bun run test:e2e
```

Quando `E2E_BASE_URL` está definido, o Playwright não inicia servidor próprio.

## CI (GitHub Actions)

Workflow: `.github/workflows/e2e.yml`. Roda em `push` na `main`, em PRs e via `workflow_dispatch`.

Secrets obrigatórios no repositório (Settings → Secrets and variables → Actions):

| Nome | Origem | Para que serve |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Lovable Cloud → Backend | Build do cliente |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud → Backend | Build do cliente |
| `VITE_SUPABASE_PROJECT_ID` | Lovable Cloud → Backend | Build do cliente |
| `SUPABASE_URL` | Lovable Cloud → Backend | Server functions em runtime |
| `SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud → Backend | Server functions em runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Backend | Operações admin server-side |
| `E2E_EMAIL` | Conta de teste dedicada | Login no Playwright |
| `E2E_PASSWORD` | Conta de teste dedicada | Login no Playwright |

Variável opcional (Settings → Variables): `E2E_BASE_URL` para apontar o CI a um preview hospedado em vez de fazer build local.

**Recomendado**: use um projeto Supabase de _staging_ (não produção) com um usuário de teste dedicado. As credenciais nunca são gravadas no repo — vêm exclusivamente dos secrets do GitHub.

## Relatório

Em CI, falhas geram o `playwright-report/` que é anexado como artifact por 14 dias. Localmente, abra com:

```bash
bunx playwright show-report
```
