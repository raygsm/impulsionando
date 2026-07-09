# Onda 2.9 — Consolidação do Ecossistema Impulsionando

> Rodada de padronização executada após a Onda 2.6. Objetivo: transformar
> o que foi construído em Colors, Chrismed, Riomed, WMP, Marocas e Garrido
> em **primitivos reutilizáveis** para qualquer novo cliente conectado
> ao Core Impulsionando.

## Regra de ouro

Todo componente novo do ecossistema:

1. **Nunca** hardcoda cor Tailwind (`bg-black`, `text-white`, `#hex`).
   Usa tokens semânticos (`bg-primary`, `text-foreground`) ou variáveis
   do tenant (`var(--garrido-ink)`, `var(--wmp-gold)`).
2. **Nunca** duplica um primitivo já existente em
   `src/components/impulsionando/`. Se o novo caso não couber, estende
   ou promove — não cópia.
3. **Nunca** usa WhatsApp como CTA principal quando o tenant tem
   jornada interna (busca, orçamento, cardápio, checkout, agendamento).
   WhatsApp entra sempre como **suporte / SAC / pós-venda** via
   `SupportFab` ou link no rodapé.
4. **Sempre** monta `head()` completo por rota shareable: `title`,
   `description`, `og:title`, `og:description`. `og:image` só nas
   folhas — nunca no `__root.tsx` ou layouts.
5. **Sempre** define barra de rolagem em cor de forte contraste com o
   fundo (utility global `scroll-contrast`) e monta `MoreContentFab`
   dentro do shell do tenant.

## Biblioteca compartilhada — `src/components/impulsionando/`

Registry oficial (exportado pelo `index.ts`):

| Primitivo             | Responsabilidade                                             | Origem            |
| --------------------- | ------------------------------------------------------------ | ----------------- |
| `TenantHero`          | Hero padronizado com eyebrow / título / subtítulo / CTAs     | Extraído Colors   |
| `SectionHeader`       | Cabeçalho consistente de seção                               | Extraído Colors   |
| `FeatureGrid`         | Grid de features com ícone + copy                            | Extraído Chrismed |
| `StepList`            | Passos numerados 1..n                                        | Extraído Chrismed |
| `StatGrid` / `Stat`   | KPIs — números institucionais                                | Extraído Colors   |
| `TrustBadges`         | Selos de confiança                                           | Extraído Colors   |
| `TestimonialGrid`     | Cards de depoimento                                          | Extraído Chrismed |
| `FaqAccordion`        | FAQ + `buildFaqJsonLd` para SEO                              | Extraído Chrismed |
| `CtaBlock`            | Bloco de CTA final                                           | Extraído Chrismed |
| `MoreContentFab`      | FAB "role para ver mais" (padrão global Onda 2.6)            | Novo Onda 2.6     |
| `Breadcrumbs`         | Trilha + `buildBreadcrumbJsonLd` (**Onda 2.9 — promovido**)  | Promovido Garrido |
| `SupportFab`          | FAB de suporte com opções internas + WhatsApp (**Onda 2.9**) | Novo Onda 2.9     |

## Bibliotecas por nicho (roadmap)

À medida que padrões se solidificam por vertical, movemos para bibliotecas
por nicho — mantendo os primitivos genéricos em `impulsionando/`:

```text
src/components/
  impulsionando/       ← primitivos genéricos (todos os tenants)
  health/              ← Chrismed, Riomed, Colors  (candidato Onda 3.1)
  foodservice/         ← Marocas + novos bares/restaurantes (Onda 3.2)
  realestate/          ← Garrido + futuras imobiliárias (Onda 3.3)
  events/              ← WMP + futuras produtoras (Onda 3.4)
  b2b/                 ← Riomed + novos distribuidores (Onda 3.5)
```

Estes namespaces ainda não existem em Onda 2.9 (foco foi consolidar
primitivos genéricos primeiro). Serão criados na Onda 3 conforme cada
vertical ganhar seu 2º/3º tenant e o padrão vira previsível.

## Padrões UX consolidados

### Shell padrão de tenant

Todo shell (`GarridoShell`, `WmpShell`, `MarocasShell`, `ChrismedShell`)
segue a mesma estrutura:

```text
<Shell>
  <SkipLink />              ← acessibilidade
  <Topbar?>                 ← institucional (telefone, área do cliente)
  <Header>                  ← sticky, backdrop-blur, logo + nav + CTAs
    <Nav />
    <MobileMenu />          ← min-h-11/min-w-11 nos toques
  </Header>
  <Breadcrumbs? />          ← quando há trilha
  <main id="…-main">
    <Outlet /> ou {children}
  </main>
  <Footer />                ← 3-4 colunas + copyright + link Core
  <MoreContentFab />        ← padrão global
  <SupportFab? /> ou <HelpFab? />
</Shell>
```

### Contraste de scrollbar

Utility global (`src/styles.css`, Onda 2.6):

```css
@utility scroll-contrast { /* barra sempre em cor oposta ao fundo */ }
```

### Botões / toque mobile

- Default `size="default"` do shadcn Button (44×44 mínimo).
- `size="icon"` recebe `min-h-11 min-w-11` em CTAs primários.
- Menus mobile: cada link com `min-h-11`.

### Breadcrumbs

- Componente único: `Breadcrumbs` compartilhado.
- JSON-LD montado no `head()` da rota via `buildBreadcrumbJsonLd`.
- Último item **sem** `to` (marca `aria-current="page"`).

### WhatsApp

Auditoria realizada nos 6 tenants:

| Tenant   | WhatsApp CTA principal? | Papel atual                                     |
| -------- | ----------------------- | ----------------------------------------------- |
| Colors   | Não                     | Rodapé/suporte pós-venda                        |
| Chrismed | Não                     | `OliverFab` (concierge virtual, não WhatsApp direto — link p/ IA) |
| Riomed   | Não                     | `FloatingWhatsApp` = SAC; jornada = cotização interna |
| WMP      | Não                     | Rodapé "suporte pós-venda"; jornada = orçamento em 60s |
| Marocas  | Não                     | `MarocasHelpFab` (SAC dentro do menu de ajuda)  |
| Garrido  | Não                     | Rodapé/contato; jornada = "Agendar visita" / "Solicitar proposta" |

Todos os tenants estão em conformidade com a regra do ecossistema.
O padrão canônico agora é `SupportFab` (compartilhado) para futuros
tenants — Marocas continuará com `MarocasHelpFab` por já implementar
integração com carrinho ativo; WMP e Chrismed podem migrar em manutenção
futura.

## SEO padronizado

Checklist obrigatório por rota shareable:

- [ ] `head()` com `title`, `description`, `og:title`, `og:description`
- [ ] `og:url` autorreferente (nunca aponta p/ home)
- [ ] `canonical` só em folhas (nunca em layout/`__root`)
- [ ] `og:image` só em folhas com imagem meaningful
- [ ] JSON-LD por tipo:
  - `Organization` / `WebSite` no `__root`
  - `BreadcrumbList` em rotas de profundidade ≥ 2
  - `Article` em posts
  - `Product` / `RealEstateListing` em PDPs
  - `FAQPage` em FAQ
  - `LocalBusiness` variantes por tenant (`RealEstateAgent`, `Restaurant`,
    `MedicalBusiness`)

`robots.txt` e `sitemap.xml` são geridos em `public/robots.txt` e
`src/routes/sitemap[.]xml.tsx` — atualizar quando surgir rota shareable
nova em qualquer tenant.

## Arquivos alterados nesta onda

- **Criados**
  - `src/components/impulsionando/Breadcrumbs.tsx` — primitivo promovido
  - `src/components/impulsionando/SupportFab.tsx` — novo padrão de FAB de suporte
  - `docs/ONDA_2_9_CONSOLIDACAO.md` — este documento
- **Editados**
  - `src/components/impulsionando/index.ts` — exporta `Breadcrumbs`, `SupportFab`
  - `src/components/garrido/Breadcrumbs.tsx` — reexporta shared (retrocompat)
  - `src/components/chrismed/ChrismedShell.tsx` — adiciona `MoreContentFab`
  - `src/components/marocas/MarocasShell.tsx` — adiciona `MoreContentFab`
  - `src/components/wmp/WmpShell.tsx` — adiciona `MoreContentFab`

## Duplicações eliminadas

1. **Breadcrumbs** — Garrido reexporta o shared; WMP e Marocas
   continuam com implementação inline (removível em manutenção futura
   trocando por `<Breadcrumbs items={…} className="mx-auto max-w-7xl px-6 pt-4" />`).
2. **FAB de suporte** — Padrão codificado em `SupportFab`. Marocas
   já segue o mesmo layout (menu de opções + WhatsApp como um item);
   futuros tenants começam direto do shared.
3. **`MoreContentFab`** — Agora presente nos 5 shells (Chrismed, Riomed
   via shell público, WMP, Marocas, Garrido). Colors usa layout single-page
   com FAB próprio (`ComprarOriginalFab`) e não requer.

## Ganhos esperados

- **Manutenção**: bug em breadcrumb agora é 1 arquivo, não 3+.
- **Velocidade de novos tenants**: shell mínimo cai de ~180 linhas
  para <80 quando composto por primitivos.
- **Consistência UX**: FAB de "role para ver mais" e barra de rolagem
  contrastada garantem que a experiência escala igual entre tenants.
- **SEO**: JSON-LD de breadcrumb padronizado por builder único.

## Impacto em desenvolvimento

Novo tenant (ex.: nova clínica, nova imobiliária) agora consome:

```tsx
import {
  TenantHero, SectionHeader, FeatureGrid, StepList,
  TestimonialGrid, StatGrid, TrustBadges, CtaBlock,
  FaqAccordion, buildFaqJsonLd,
  Breadcrumbs, buildBreadcrumbJsonLd,
  MoreContentFab, SupportFab,
} from "@/components/impulsionando";
```

Não precisa reimplementar nenhum destes. Shell fica só com header/footer
específicos do tenant.

## Pendências para o Codex (Onda 2.9.1 opcional)

1. Migrar breadcrumbs inline de `WmpShell` e `MarocasShell` para
   `<Breadcrumbs />` compartilhado (economia ~30 LOC cada).
2. Migrar `MarocasHelpFab` para consumir `<SupportFab>` (já é o mesmo
   layout — só reduzir para invocação do primitivo).
3. Extrair Header/Footer para primitivos configuráveis (`TenantHeader`
   e `TenantFooter`) — requer definição de contrato flexível o suficiente
   para acomodar topbar do Garrido, LangSwitcher do Chrismed, carrinho do
   Marocas e CTA em destaque do WMP.
4. Criar `src/components/impulsionando/EmptyState`, `SuccessState`,
   `ErrorState`, `LoadingState` — hoje cada tenant desenha o seu.
5. Auditar `head()` de cada rota folha dos 6 tenants — completar OG e
   canonical onde faltar.

## Oportunidades futuras (não bloqueiam Onda 3)

- **Storybook do ecossistema** com todos primitivos em `impulsionando/`.
- **Design tokens exportáveis** para Figma via Style Dictionary.
- **Contract tests visuais** (Playwright screenshots) por primitivo.
- **CLI `impulsionando new-tenant <nicho> <slug>`** gerando shell +
  rotas base a partir dos primitivos.

## Matriz de maturidade dos 6 tenants (após Onda 2.9)

| Tenant   | Nicho          | Rotas | MoreContentFab | Breadcrumbs shared | SupportFab | Maturidade    |
| -------- | -------------- | ----- | -------------- | ------------------ | ---------- | ------------- |
| Colors   | Saúde D2C      | 12+   | opcional (SPA) | não aplicável      | próprio    | **Avançada**  |
| Chrismed | Saúde privada  | 8+    | ✅              | pendente           | OliverFab  | **Avançada**  |
| Riomed   | B2B saúde      | 9+    | ✅              | pendente           | próprio    | **Avançada**  |
| WMP      | Eventos        | 9     | ✅              | pendente migração  | rodapé     | **Avançada**  |
| Marocas  | Food service   | 12+   | ✅              | pendente migração  | HelpFab    | **Avançada**  |
| Garrido  | Imobiliário    | 18+   | ✅              | ✅ (fonte)          | rodapé     | **Avançada+** |

Ecossistema pronto para **Onda 3 — Core Impulsionando** (CRM, ERP,
Financeiro, Marketplace, White Label, Agente Virtual, Analytics,
Automações, Dashboards, Integrações).
