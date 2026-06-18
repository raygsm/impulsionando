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

## Visual regression (E2E_VISUAL)

Os testes de snapshot do sub-nav da Minha área são pulados por padrão no CI para
não falhar em runs sem baseline. Para gerar os baselines iniciais (incluindo as
variações com `reducedMotion: reduce`):

```bash
# 1) Local: gerar/atualizar todos os PNGs de referência
export E2E_EMAIL=...
export E2E_PASSWORD=...
E2E_VISUAL=1 bunx playwright test tests/e2e/dashboards-consumidor-subnav.spec.ts \
  --update-snapshots

# 2) Commitar os arquivos sob tests/e2e/__snapshots__/ e
#    tests/e2e/dashboards-consumidor-subnav.spec.ts-snapshots/
git add tests/e2e/**/*.png
```

No CI, defina a variable `E2E_VISUAL=1` (Settings → Variables) para que os testes
visuais rodem contra os baselines commitados. O primeiro run deve passar logo
após o commit dos PNGs; mudanças intencionais de UI exigem `--update-snapshots`
local e novo commit. Sem `E2E_VISUAL=1` o CI continua pulando esses cenários.

