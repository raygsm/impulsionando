# Biblioteca Compartilhada — Ecossistema Impulsionando

**Rodada de Consolidação — homologada em 08/07/2026**

Este documento é a fonte oficial da biblioteca visual compartilhada
do Ecossistema Impulsionando. Todo tenant novo criado pelo Core
(CHRISMED, RIOMED, Colors, Garrido, Marocas, Food Service, WMP e
futuros) **deve** consumir estes primitivos antes de reimplementar.

## 1. Onde vive

| Camada | Path |
|--------|------|
| Primitivos visuais | `src/components/impulsionando/` |
| Tokens por tenant | `src/styles/tokens-tenants.css` |
| Registro oficial de tenants | `src/data/tenant-registry.ts` |
| Contexto do Impulsionito | `src/data/impulsionito-context.ts` |
| Datasets semânticos | `src/data/<tenant>-*.ts` |

## 2. Primitivos disponíveis

Importe pela raiz: `import { TenantHero, StatGrid, ... } from "@/components/impulsionando"`.

| Componente | Substitui | Uso |
|------------|-----------|-----|
| `TenantHero` | Hero inline em WMP, Garrido, FoodService, Colors, Marocas | Landing e sub-páginas hero |
| `StatGrid` / `Stat` | `function Stat()` local em WMP, mini-stats do Garrido | KPIs públicos, prova de escala |
| `TestimonialGrid` / `TestimonialCard` | `Depoimentos()` do Garrido, `TestimonialsSection` do Colors | Prova social |
| `FaqAccordion` + `buildFaqJsonLd` | 5 implementações de `<details>` distintas | FAQ com schema.org automático |
| `TrustBadges` | Trust strips em FoodService, Chrismed, checkout | Garantias, certificações, LGPD |
| `CtaBlock` | 9 blocos "Pronto para..." espalhados | Fechamento de landing |
| `SectionHeader` | Cabeçalho de seção repetido em toda rota | Chip + h2 + descrição |
| `FeatureGrid` | Grids `{icon,title,desc}` de WMP, Garrido, Marocas | Serviços/features |
| `StepList` | "Como funciona" 1/2/3/4 do WMP, Sobre | Fluxos numerados |

## 3. Regra de cor

**Nenhum componente da biblioteca hardcoda cor.** Todos herdam
`--primary` do escopo `[data-tenant="<slug>"]`.

Wrapper padrão de rota de tenant:

```tsx
export function TenantLayout() {
  return (
    <div data-tenant="garrido" className="min-h-dvh bg-background text-foreground">
      <Outlet />
    </div>
  );
}
```

O `tokens-tenants.css` mapeia `[data-tenant="garrido"]` →
`--primary: var(--garrido-primary)`. Qualquer `text-primary`,
`bg-primary`, `border-primary` dentro do escopo pega a cor correta.

## 4. Tokens por tenant

Todos declarados em `src/styles/tokens-tenants.css`. Padrão triádico
mínimo por tenant: `--<slug>-primary`, `--<slug>-accent`, `--<slug>-surface`.
Tokens extras legados (`--garrido-gold`, `--fs-amber`, etc.) permanecem
como aliases estáveis — não removê-los sem plano de migração das rotas
que já os referenciam.

## 5. Preparação Impulsionito

`src/data/tenant-registry.ts` é o mapa que o Impulsionito lê para
saber:
- quais dimensões cada tenant recomenda (`produtos`, `servicos`,
  `imoveis`, `consultas`, `eventos`, `delivery`, `reservas`,
  `locacoes`);
- objetivos, público, ocasião, faixa de preço, região e tags
  semânticas de cada tenant.

Datasets ricos (Garrido, FoodService, Colors) já expõem `perfilImpulsionito`
ou campos equivalentes por item. Datasets pobres (WMP, Marocas planos)
devem ser gradualmente enriquecidos — a estrutura do registry já
sinaliza o mínimo esperado.

## 6. Vitrine

- `/vitrine` — dinâmica, alimentada por `getPublicVitrine` (Supabase).
- `/ecossistema` — editorial, mostra pilares.
- Novo em breve: adicionar aba/seção "Modelos oficiais por segmento"
  usando `TENANT_MODELS` de `tenant-registry.ts` como cards estáticos.

## 7. O que NÃO refatoramos nesta rodada

Preservamos os tenants homologados como estão (WMP, Garrido, FoodService,
Marocas, Chrismed, Riomed, Colors) — a biblioteca é o padrão a partir
daqui. Refatorar retroativamente exigiria testes visuais massivos e
sai do escopo "consolidar sem quebrar produção".

Recomendação: nas próximas alterações de cada tenant, substituir
oportunisticamente `<details>` por `<FaqAccordion>`, `function Stat`
inline por `<StatGrid>`, etc.

## 8. Cores hardcoded conhecidas (pendências)

Documentadas para tratamento futuro (não bloqueantes):

- `src/components/chrismed/ChrismedShell.tsx` — 4 ocorrências `bg-[#f7f4ed]`
  (deveria ser `bg-[color:var(--chrismed-surface)]`).
- `src/components/app/SidebarNav.tsx` e `AuditStatusPill.tsx` —
  variantes de status com `bg-emerald-600 text-white` etc. Aceitável
  para semântica de status universal; opcional migrar para tokens
  `--success`, `--warning`, `--destructive`.
- `src/components/core/BrandingPreviewTab.tsx` — fallbacks `#1e40af`
  intencionais (mostra "cor padrão" quando o tenant ainda não escolheu).

## 9. Próximos blocos

Com a Rodada de Consolidação encerrada, o ecossistema está pronto
para os dois últimos tenants:

1. **White Label** — arquitetura de multi-tenant com marca configurável
   por cliente (deve consumir 100% da biblioteca `impulsionando/`).
2. **Clube Impulsionando** — consumidor final, cross-tenant.

E, por fim, a homologação das áreas de demonstração.
