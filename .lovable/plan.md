## Objetivo

Evoluir o fluxo já existente em `/orcamento` (atualmente um briefing de ~1.044 linhas) para a jornada completa **"Monte seu Orçamento"** em 12 etapas, com seleção de módulos, cálculo em tempo real, descontos progressivos, combinações recomendadas, revisão, contrato objetivo, aceite e pagamento — sem refazer páginas existentes e sem duplicar componentes.

## Antes de implementar — 3 decisões que preciso confirmar

Existem **conflitos importantes** entre o que você pediu e o que já está em produção. Preciso da sua confirmação antes de codar, senão vamos quebrar coisa que já funciona.

### 1. Preço dos módulos (CONFLITO REAL)

- **Hoje no sistema:** 14 "módulos principais" (ERP, CRM, WhatsApp, Agenda, Checkout, Produtos, Estoque, PDV, Delivery, Prontuário, Área do Paciente, Eventos, Afiliados, BI, etc.) organizados em planos `Essencial`, `Integrado`, `Avançado`, `Sob Medida` (arquivo `src/data/motherModules.ts` + página `/planos` + webhook de pagamento que mapeia `PLAN_MODULES`).
- **Pedido novo:** cada módulo custa **R$ 497/mês fixo** com desconto progressivo (1=0%, 2=5%, 3=10%, 4+=15%).

Esses dois modelos **não convivem**: ou o lead compra por plano (Essencial/Integrado/Avançado) ou compra módulo a módulo a R$497. Qual mantemos?

- **Opção A — Substituir:** /orcamento passa a vender módulo a R$497 com desconto progressivo. /planos continua existindo só como vitrine. Webhook de pagamento precisa de novo mapeamento "módulos selecionados → entitlements".
- **Opção B — Coexistir:** /orcamento oferece **as duas portas** — "Quero um plano fechado" (vai pra /planos atual) ou "Quero montar módulo a módulo" (novo fluxo R$497).
- **Opção C — Só evoluir o que existe:** manter pricing por plano e só adicionar as etapas que faltam (contrato objetivo, revisão final, aceite, integração de pagamento mais clara).

### 2. Setup, trial e gateway

- Você cita "setup, se houver" — **existe setup?** Se sim, qual valor / em que casos?
- Já existe `/trial` com fluxo de 7 dias. O novo wizard deve **embutir** o trial como opção de pagamento, ou trial e contratação direta são fluxos separados?
- O gateway está integrado via Paddle (webhook em `src/routes/api/public/payments/webhook.ts`). Posso assumir Paddle Checkout? Ou queremos preparar Pix/Boleto também (que exige outro PSP)?

### 3. Onde mora o wizard

`/orcamento` hoje já é um briefing de 1.044 linhas com captura de lead, categoria, segmento, dores e sugestão de plano. Duas formas de "não refazer":

- **Opção A — Substituir o conteúdo de /orcamento** pelo novo wizard de 12 etapas (mantendo a rota, SEO e links existentes). O conteúdo atual vira parte das etapas 1–3.
- **Opção B — Manter /orcamento como está** e criar uma nova rota `/montar` ou `/contratar` para o wizard completo. Risco: o usuário disse explicitamente "não duplicar" e "evoluir o que já existe".

Recomendo **A**.

---

## Plano de implementação (assumindo respostas: 1-A, 2-Paddle sem setup, trial separado, 3-A)

### Etapa 0 — Fundação de dados

Criar `src/data/moduleCatalog.ts` (novo, não conflita com `motherModules.ts`):
- Lista de **17 módulos comerciais** exatamente como você descreveu (CRM, WhatsApp, Follow-ups, Agenda, Reservas, Eventos, Checkout, Produtos, Afiliados, Estoque, PDV, Delivery, Prontuário, Área do Paciente, BI, Permissões, White Label).
- Cada item: `slug`, `name`, `category` (Atendimento/Agenda/Vendas/Operação/Saúde/Gestão), `description`, `priceMonthly: 497`, `combinesWith: string[]`, `recommendedFor: string[]`, `requiresExternalCredentials?: boolean`.
- Mapeamento `slug → motherModuleSlug` para o webhook reaproveitar `PLAN_MODULES` existente.

Criar `src/lib/pricing.ts`:
- `computeQuote(selectedSlugs): { subtotal, discountPct, discountAmount, total, lineItems }`
- Regras: 1=0%, 2=5%, 3=10%, 4+=15%. Pure function, testável.

Criar `src/data/recommendedBundles.ts`:
- 6 bundles (Clínica, Restaurante, Delivery, Eventos, Afiliados, White Label) com array de slugs.

### Etapa 1 — Reescrever `/orcamento` como wizard

Refatorar `src/routes/orcamento.tsx` para um wizard com componente `QuoteWizard` e 12 sub-componentes de etapa em `src/components/orcamento/steps/` (cada um <150 linhas):

1. `StepLead` — nome, WhatsApp, email, empresa, cargo, cidade, UF + captura UTM via `validateSearch` (já existe parcialmente).
2. `StepCategoria` — 9 categorias (incluindo Eventos, Afiliados, White Label que faltam hoje).
3. `StepSegmento` — segmentos por categoria, com sugestão automática de bundle.
4. `StepModulos` — grid de cards de módulo com toggle, tooltip, "combina com", chip de bundle recomendado. **Resumo lateral fixo** com valores em tempo real.
5. `StepResumoModulos` — recap dos módulos escolhidos com possibilidade de remover.
6. `StepValores` — quebra detalhada de subtotal/desconto/total/setup.
7. `StepPrazos` — prazos de implantação e dependências externas.
8. `StepEmpresa` — CNPJ, razão social, endereço fiscal (campos novos).
9. `StepRevisao` — recap completo.
10. `StepContrato` — contrato objetivo renderizado a partir dos dados.
11. `StepAceite` — 5 checkboxes obrigatórios.
12. `StepPagamento` — integração com Paddle (já existe).

Barra de progresso `<Progress value={(step/12)*100} />` + label "Etapa X de 12".

Estado mantido em `useReducer` + persistido em `sessionStorage` (chave `orcamento_wizard_v1`) para sobreviver a refresh sem banco.

### Etapa 2 — Componentes reusáveis

- `src/components/orcamento/ModuleCard.tsx` — card de módulo com toggle.
- `src/components/orcamento/QuoteSidebar.tsx` — resumo fixo desktop / drawer mobile.
- `src/components/orcamento/ContractView.tsx` — render do contrato objetivo (HTML imprimível, sem PDF nesta entrega).
- `src/components/orcamento/BundleChip.tsx` — botão de bundle recomendado.

### Etapa 3 — Backend mínimo

Criar `src/lib/quote.functions.ts` com `createServerFn`:
- `saveQuote` (público, usa `supabaseAdmin` via `await import`): grava lead + módulos selecionados na tabela `quotes` (nova) para o time comercial recuperar.
- Migração nova: `public.quotes` (id, lead_data jsonb, modules text[], subtotal_cents, discount_pct, total_cents, status, created_at) com RLS aberto só pro service_role + GRANTs corretos.

### Etapa 4 — Integração de pagamento

Reutilizar Paddle existente. Estender `PLAN_MODULES` no webhook para também aceitar o caminho "monte seu plano" — `passthrough` com array de slugs vira entitlements. Se você ainda não criou um Paddle Price para "módulo avulso R$497", uso `payments--create_product`.

### Etapa 5 — SEO + segurança

- `head()` específico do wizard.
- Validação Zod em todos os passos (não só etapa 1).
- Limites de tamanho em todos os campos texto.
- Sem `dangerouslySetInnerHTML`.

### Fora de escopo desta entrega

- Geração de PDF do contrato (só HTML imprimível via `window.print()`).
- Assinatura digital com certificado (apenas aceite eletrônico com timestamp + IP).
- Pix/Boleto (depende de PSP brasileiro não conectado).

---

## Tamanho realista

~15 arquivos novos, 1 arquivo grande refatorado, 1 migração, ~1.500–2.000 linhas no total. É uma entrega substancial mas viável em uma rodada se as decisões acima estiverem fechadas.

**Posso seguir com Opção A (substituir pricing), Paddle, trial separado, /orcamento como rota do wizard? Ou prefere ajustar alguma dessas escolhas?**