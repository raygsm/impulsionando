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
não falhar em runs sem baseline. Habilite-os com `E2E_VISUAL=1`.

### Gerar/atualizar todos os baselines (inclui reducedMotion + RTL)

```bash
export E2E_EMAIL=...
export E2E_PASSWORD=...
bun run test:e2e:visual:update
```

### Regenerar somente os baselines RTL + reducedMotion (portrait e landscape)

Os PNGs ficam em `tests/e2e/dashboards-consumidor-subnav.spec.ts-snapshots/`
com prefixo `rm-rtl-mobile-`. Para regerá-los isoladamente:

```bash
# Portrait (390x844) + landscape (844x390) — o teste alterna os dois viewports
E2E_VISUAL=1 bunx playwright test \
  tests/e2e/dashboards-consumidor-subnav.spec.ts \
  -g "visual regression \(RTL \+ reduced motion\)" \
  --update-snapshots

# Commitar os novos PNGs
git add tests/e2e/dashboards-consumidor-subnav.spec.ts-snapshots/rm-rtl-mobile-*.png
```

Os arquivos esperados após a regeneração:

- `rm-rtl-mobile-portrait-subnav-default.png`
- `rm-rtl-mobile-portrait-subnav-focus-cupons.png`
- `rm-rtl-mobile-portrait-tabpanel-cupons.png`
- `rm-rtl-mobile-landscape-subnav-focus-cupons.png`
- `rm-rtl-mobile-landscape-tabpanel-cupons.png`
- `rm-rtl-mobile-light-subnav-focus-cupons.png` / `rm-rtl-mobile-light-tabpanel-cupons.png`
- `rm-rtl-mobile-dark-subnav-focus-cupons.png` / `rm-rtl-mobile-dark-tabpanel-cupons.png`

Para regerar apenas o cenário dark/light:

```bash
E2E_VISUAL=1 bunx playwright test \
  tests/e2e/dashboards-consumidor-subnav.spec.ts \
  -g "dark/light toggle \(RTL \+ reduced motion\)" \
  --update-snapshots
```

No CI, defina a variable `E2E_VISUAL=1` (Settings → Variables) para rodar os
visuais contra os baselines commitados. Sem ela o CI continua pulando esses
cenários.

### Interpretando os artifacts do CI quando falha

Quando um teste visual falha, o workflow `.github/workflows/e2e.yml` faz upload
de dois artifacts (e posta um comentário no PR com links diretos):

| Artifact | Contém | Como abrir |
| --- | --- | --- |
| `playwright-visual-diffs` | `*-expected.png`, `*-actual.png`, `*-diff.png` por teste | Baixe e compare visualmente |
| `playwright-traces` | `trace.zip`, `video.webm` | `bunx playwright show-trace trace.zip` |

Como ler os PNGs:

- **`*-expected.png`** — baseline atualmente commitado no repo. É o que o teste esperava ver.
- **`*-actual.png`** — captura real desta run. É o que o teste viu.
- **`*-diff.png`** — destaque dos pixels divergentes (vermelho/transparente).
  Pequenos diffs em anti-aliasing são tolerados via `maxDiffPixelRatio: 0.02`.
  Se a mudança for **intencional** (ex.: ajuste de cor/spacing), rode
  `bun run test:e2e:visual:update` localmente e commite os novos baselines.
  Se for **regressão**, corrija o componente e refaça o run.

#### Mapa: qual PNG cobre qual asserção

Cada teste produz um conjunto de PNGs com nomes determinísticos. Use a tabela
abaixo para identificar rapidamente qual asserção quebrou olhando o nome do
arquivo no artifact `playwright-visual-diffs`:

| Sufixo do arquivo | Asserção coberta | O que olhar no diff |
| --- | --- | --- |
| `*-subnav-default.png` | Estado inicial do tablist (chip ativo padrão) | Posição/estilo do chip `favoritos`, ordem RTL |
| `*-subnav-focus-cupons.png` | Focus ring no chip ativo (`cupons`) após teclado | Anel de foco (`ring-2 ring-ring ring-offset-2`) e cor do chip selecionado |
| `*-tabpanel-cupons.png` | Conteúdo do tabpanel ativo | Layout, tipografia e cores do painel `Meus cupons` |
| `rm-rtl-mobile-light-*` | Variante tema claro | Tokens semânticos no modo light |
| `rm-rtl-mobile-dark-*` | Variante tema escuro | Tokens semânticos no modo dark |
| `rm-rtl-mobile-landscape-*` | Após `orientationchange` para landscape | `--sec-offset` recomputado, chip ainda visível |

Exemplo prático: se apenas `rm-rtl-mobile-dark-subnav-focus-cupons.png` falhar
mas `*-light-*` passar, o problema está na cor/contraste do focus ring no tema
escuro — não no layout do tablist em si.

### Navigation timing (RTL + reduced motion)

O teste `RTL + reduced motion: navigation timing` mede quanto tempo cada
ativação de chip leva para "assentar" (hash + `aria-selected` + `--sec-offset` +
foco no tabpanel). Falha se exceder o threshold padrão de **1500ms**.

- Ajuste local com `E2E_SETTLE_THRESHOLD_MS=2000 bun run test:e2e`.
- Em cada run, um artifact JSON (`rtl-reducedmotion-settle-timings.json`) é
  anexado ao Playwright report com os tempos medidos por seção.





