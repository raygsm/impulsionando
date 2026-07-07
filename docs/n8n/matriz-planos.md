# Matriz de Workflows por Plano

Planos vigentes do Core Impulsionando (ordem crescente de capacidade):

`Free` → `Essencial` → `Pro` → `Premium` → `WL (White Label)`

Regra: workflow disponível a partir do plano indicado. Plano superior
herda tudo do inferior. Consumidor Final / Clube PF é ortogonal (grátis).

## Regra por régua

| Régua           | Free                | Essencial              | Pro                    | Premium / WL           |
| --------------- | ------------------- | ---------------------- | ---------------------- | ---------------------- |
| Captação        | 1, 5, 7             | +2, 3, 6               | +4, 8                  | tudo                   |
| Conversão       | 9, 11, 19           | +10, 12–18             | tudo                   | tudo                   |
| Relacionamento  | 20–24, 29           | +25, 26                | +27, 28, 30            | tudo                   |
| Retenção        | 31–34               | +35, 36, 37, 38        | +39, 40                | tudo                   |
| Financeiro      | —                   | 41–45                  | +48, 49, 50            | +46, 47 (WL)           |
| Suporte         | 51, 54, 56          | +52, 53, 55            | tudo                   | tudo                   |
| Vitrine & Clube | 59, 60, 62, 63      | +57, 58, 61            | tudo                   | tudo                   |

## Notas

- Workflows financeiros de repasse (`46`, `47`) são exclusivos White Label.
- `Trial Premium 30 dias` habilita temporariamente a régua Pro completa.
- Nichos específicos (ver `matriz-nichos.md`) exigem plano ≥ Essencial,
  exceto Bar/Restaurante `bar-pedido-recebido` que roda em Free.

## Bloqueio automático

Antes de disparar em produção, o node `Plano Gate` (sub-workflow
`_shared/plano-gate.json`) valida:

1. `tenant.plan` presente.
2. Workflow permitido pela matriz acima.
3. Trial ativo pode elevar temporariamente.
4. Se bloqueado → log `status: suppressed`, `channel: internal`,
   sem disparo.
