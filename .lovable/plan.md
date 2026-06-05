
# Reorganização em 14 Módulos-Mãe — Impulsionando Tecnologia

## Princípio orientador

Criar **uma única fonte de verdade** para os 14 módulos-mãe e seus submódulos, e fazer todas as páginas comerciais consumirem dela. Não apagar rotas, não refazer banco, não duplicar componentes. Slugs antigos (`crm`, `agenda`, `financeiro`, `bi`) permanecem válidos — apenas ganham "irmãos" e passam a ser exibidos agrupados.

---

## 1. Nova fonte de verdade: `src/data/motherModules.ts`

Arquivo novo, com tipagem forte, contendo:

- 14 módulos-mãe (id, slug, nome, ícone, tagline, texto comercial)
- Lista de submódulos de cada um (conforme o briefing)
- `exampleNiches[]` por módulo-mãe
- `planTier`: indicação de em quais planos costuma entrar

Esse arquivo substitui a função de "catálogo" hoje espalhada por `modulos.tsx`, `moduleDetails.ts`, `trial.tsx` (RESOURCES) e `solucoes.tsx`.

## 2. Banco: seed dos 14 slugs em `public.modules`

Migration nova com **UPSERT idempotente** (não apaga nem renomeia os existentes):

```text
slugs: erp, crm, automacao, agenda, commerce, pdv,
       estoque, saude, eventos, delivery, bi,
       white_label, fidelizacao, area_cliente
```

- `crm`, `agenda`, `bi` já existem → apenas `UPDATE` de `name`/`description`/`sort_order`
- `financeiro` permanece (legado), passa a ser tratado como **alias de `erp`** em `useCompanyModules`
- Novos slugs entram com `is_active=true`, `is_core=false`

## 3. Webhook Paddle: atualizar `PLAN_MODULES`

`src/routes/api/public/payments/webhook.ts`:

```text
essencial_plan: ["crm"]                          (1 módulo-mãe)
integrado_plan: ["crm", "agenda"]                (2)
avancado_plan : ["crm", "agenda", "erp", "bi"]   (3 + BI)
```

Plano Sob Medida continua ativando manualmente.

## 4. Páginas comerciais — refatorar para consumir a nova fonte

| Página | Mudança |
|---|---|
| `/modulos` | Renderizar 14 cards (módulos-mãe), cada um com expand → lista de submódulos |
| `/modulos/$slug` | Mapear slugs novos; manter slugs antigos como redirect/alias |
| `/planos` | Atualizar `COMPARE[]` e descrição dos 4 planos refletindo "X módulo(s)-mãe ativo(s)" |
| `/solucoes` | Atualizar `SEGMENTS[].modules` para referenciar ids dos módulos-mãe |
| `/nichos` e `/nichos/$slug` | Atualizar `nichoDetails.ts` para usar ids novos |
| `/trial` (RESOURCES) | Substituir lista solta por agrupamento em módulos-mãe |
| `/orcamento` | Atualizar etiquetas dos checkboxes para módulos-mãe (mantém a coleta de `recommended_modules`) |
| `/trial/cadastro` | Sem mudança estrutural; apenas atualizar copy do select com "X módulo(s)-mãe" |

## 5. Hook `useCompanyModules`

`src/hooks/useCompanyModules.ts`: estender `MODULE_URL_PREFIXES` para mapear rotas existentes (`/sales`, `/inventory`, `/finance`) aos novos slugs-mãe (`commerce`, `estoque`, `erp`), mantendo retrocompatibilidade com `financeiro`.

## 6. Manter intacto

- Toda a lógica de auth, trial signup (RPC `trial_create`), Paddle catalog resolution, e-mails transacionais, formulário de leads (já corrigido).
- Nenhum arquivo Supabase auto-gerado é tocado.

---

## Detalhes técnicos

**Arquivos criados:**
- `src/data/motherModules.ts` — fonte única dos 14 módulos-mãe
- `supabase/migrations/<ts>_seed_mother_modules.sql` — UPSERT idempotente

**Arquivos editados (frontend apenas, sem mudança em business logic):**
- `src/routes/modulos.tsx`, `src/routes/modulos.$slug.tsx`
- `src/routes/planos.tsx` (textos do COMPARE e descrição dos cards)
- `src/routes/solucoes.tsx`
- `src/routes/nichos.index.tsx` (via `nichoDetails.ts`)
- `src/components/marketing/nichoDetails.ts`
- `src/components/marketing/moduleDetails.ts`
- `src/routes/trial.tsx` (RESOURCES → grupos)
- `src/routes/orcamento.tsx` (apenas labels)
- `src/routes/trial_.cadastro.tsx` (apenas copy do select)

**Arquivos editados (backend mínimo):**
- `src/routes/api/public/payments/webhook.ts` (PLAN_MODULES expandido)
- `src/hooks/useCompanyModules.ts` (MODULE_URL_PREFIXES expandido)

---

## Como você vai testar no preview

1. **`/modulos`** → 14 cards, cada um exibindo submódulos ao expandir.
2. **`/modulos/erp`**, **`/modulos/saude`**, **`/modulos/eventos`** → páginas detalhadas dos módulos novos.
3. **`/planos`** → cards mostrando "1 / 2 / 3+ módulos-mãe"; toggle anual aplica -17%.
4. **`/solucoes`** e **`/nichos/clinicas`** → recomendações de módulos exibem ids novos (ex.: "Saúde & Prontuário", "Agenda & Reservas").
5. **`/orcamento`** → checkboxes mostram os 14 módulos-mãe; submit salva e dispara e-mail para `sac@impulsionando.com.br`.
6. **`/trial/cadastro`** → cadastro continua funcionando; ao selecionar plano, copy mostra "X módulo(s)-mãe ativo(s)".
7. **Pós-pagamento Paddle (sandbox)** → após webhook, `company_modules` recebe os slugs do plano (`erp`, `crm` etc.) e a navegação interna libera as áreas correspondentes.

**Cartão de teste Paddle sandbox:** `4242 4242 4242 4242`, validade qualquer futura, CVV `100`.

---

## Fora de escopo desta rodada

- Criar as rotas internas para os módulos novos sem implementação ainda (ex.: `/eventos`, `/delivery`) — ficam apenas no catálogo comercial.
- Criar produtos Paddle adicionais para módulos-mãe vendidos avulsos — hoje vendemos por plano (Essencial/Integrado/Avançado/Sob Medida), não por módulo individual.

Confirma o plano para eu executar?
