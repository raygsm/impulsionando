# Metodologia de contraste WCAG

Este documento descreve como calculamos o contraste de texto no
Impulsionando e por que o algoritmo trata gradientes, opacidade e
overlays de forma diferente do axe-core clássico.

## Referências

- WCAG 2.1 SC 1.4.3 (nível AA) — texto normal ≥ 4.5:1, texto grande ≥ 3:1
- "Texto grande" = ≥ 24px, **ou** ≥ 18.66px com `font-weight ≥ 700`
- Fórmula de luminância relativa: <https://www.w3.org/TR/WCAG21/#dfn-relative-luminance>

## Thresholds configuráveis (`contrast.config.json`)

Cada rota define `normal`, `large` e `strict`. Rotas `strict: true`
fazem o CI falhar em qualquer violação; rotas não-strict entram como
warning no relatório JSON/PDF. Isso reduz falso-positivo em telas do
app (que já operam sob supervisão) sem perder rigor nas páginas
marketing (visitadas por leads antes do onboarding).

`ignoreSelectors` permite pular padrões (ex: `.sr-only`, ícones SVG,
elementos `aria-hidden`).

## Cor efetiva de foreground

`fg_eff = fg.a < 1 ? blend(fg, bg_at_point) : fg`

`blend(fg, bg) = fg * fg.a + bg * (1 - fg.a)` (por canal, sRGB
gamma-encoded, arredondado para inteiro). É a mesma composição alpha
que o browser aplica ao pintar.

## Cor efetiva de background

O algoritmo sobe a árvore DOM a partir do elemento de texto e coleta
até **40 camadas** de fundo, guardando para cada uma:

- cor sólida (`background-color`)
- gradiente linear (`background-image: linear-gradient(...)`) com
  suas paradas parseadas
- imagem raster (`background-image: url(...)`) — marcada como
  "amostragem indisponível"

Para o gradiente, extraímos ângulo (`deg`, `to top/right/left/bottom`,
default 180°) e uma lista ordenada de `{color, position 0..1}`. A cor
no ponto `(x,y)` é interpolada linearmente entre a parada anterior e a
próxima ao longo do eixo do gradiente projetado na bounding box.

## Sampling multi-ponto

Para cada nó de texto, amostramos **N pontos** (default 5: centro + 4
quadrantes internos) sobre a bounding box. Em cada ponto:

1. Percorremos as camadas de fundo de baixo para cima aplicando
   `blend()` sucessivamente.
2. Calculamos o contraste `(fg_eff, bg_efetivo)` naquele ponto.

O **pior contraste** entre os N pontos é o valor reportado. Isso
capta o caso clássico de "hero com gradiente escuro→claro em que o
texto branco fica ilegível no fim do gradiente".

## Warnings vs. violações

- **Violation**: contraste < mínimo em um ponto onde conseguimos
  calcular determinísticamente a cor de fundo. Reprova o CI (em
  rotas strict).
- **Warning**: elemento com `background-image: url(...)` no caminho.
  Não conseguimos amostrar o pixel raster sem rasterizar a página,
  então reportamos como aviso para revisão humana.

Tolerância global: `±0.05` (evita ruído de arredondamento em cores
com componente 254/255).

## Como rodar

```bash
bun run contrast:scan            # gera JSON
bun run contrast:scan -- --pdf   # JSON + PDF
bun run contrast:scan -- --fail  # exit 1 se rota strict violar
bunx playwright test e2e/contrast-a11y.spec.ts
```

O PDF (`playwright-report/contrast-report.pdf`) é o artefato para
revisão de legibilidade — sumário por rota + detalhamento com
swatches lado-a-lado (fg vs bg efetivo).

## Como suprimir um falso-positivo

1. Adicione `data-contrast-ignore` no elemento (respeitado pelo
   scan) — use com moderação e comente o motivo no código.
2. Ajuste `ignoreSelectors` em `contrast.config.json` se for um
   padrão global (ex: badges decorativos).
3. Reduza o `strict` da rota se ela ainda estiver em iteração de
   design (não deixe rotas marketing em não-strict).
