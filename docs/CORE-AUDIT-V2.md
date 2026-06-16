# CORE Audit V2 — Impulsionando Tecnologia

> Auditoria executada após a entrega do **Wizard "Criar Cliente em 1 Tela"** completo
> (Etapas 1‑4 + provisionamento de admin, contrato e 1ª fatura).
> Referência anterior: `docs/CORE-AUDIT.md` e `docs/AUDITORIA_FINAL.md`.

---

## 1. Resumo executivo

| Item | Status |
|---|---|
| Wizard de criação de cliente em 1 tela | ✅ Concluído (4 etapas) |
| Provisionamento técnico (empresa, módulos, schema) | ✅ Reaproveitado de `factory.functions.ts` |
| Criação automática do usuário admin (Gestor da Empresa) | ✅ Novo (`supabaseAdmin.auth.admin.createUser`) |
| Convite via magic link | ✅ Novo (gerado e retornado em `adminUserId` + `inviteLink`) |
| Contrato de cobrança (`billing_contracts`) | ✅ Novo (`contractId`) |
| 1ª fatura (`billing_invoices`, status `open`) | ✅ Novo (`firstInvoiceId`) |
| Email/WhatsApp/in-app `user_welcome` | ✅ Via `enqueue_message` |
| Dashboard CORE consolidado (4 KPIs faltantes) | ✅ Receita recebida, prevista, crescimento, conversão |
| Demos por nicho consolidados | ⏳ Pendente — ver §6 |
| Testes E2E do wizard | ⏳ Pendente — ver §7 |

---

## 2. O que já existia (reaproveitado)

| Recurso | Local |
|---|---|
| Tabelas `companies`, `company_modules`, `company_settings`, `user_profiles`, `profiles`, `permissions` | DB (já existiam) |
| `billing_contracts`, `billing_invoices`, `billing_plans`, `billing_dunning_policy` | DB (já existiam) |
| `message_outbox` + função `enqueue_message(...)` | DB (já existia) |
| Função `factory.createProject` (provisionamento de empresa + módulos) | `src/lib/factory.functions.ts` |
| Função `provisioningSnapshot` (KPIs CORE) | `src/lib/provisioning.functions.ts` |
| Página `Criar Projeto` (3 etapas anteriores) | `src/routes/_authenticated/core.criar-projeto.tsx` |
| Página `CORE Index` (dashboard) | `src/routes/_authenticated/core.index.tsx` |
| Trigger `tg_notify_welcome` (in-app + enqueue) | DB |
| Hooks `useQuery`, integração TanStack Query + Router | já configurados |
| Layout `_authenticated/` (RLS-aware) | já existia |

Nada foi recriado. O wizard estendeu o que já havia em vez de duplicar tabelas/rotas.

---

## 3. O que foi corrigido

| Correção | Detalhe |
|---|---|
| Dashboard CORE — KPIs ausentes | Adicionados em `provisioningSnapshot`: `receivedMonth`, `forecast30d`, `growthPct`, `conversionPct` |
| `core.index.tsx` | 4 novos cards (Receita recebida mês, Receita prevista 30d, Crescimento mensal, Conversão demo→pago) |
| Identidade visual | Tokens `--primary` (navy), `--primary-glow` (azul), `--accent` (laranja) em `src/styles.css` reaplicados em sidebar/gradientes/badges |
| Logotipo | `src/assets/logo-impulsionando.png.asset.json` atualizado para o novo logo único |

---

## 4. O que foi criado nesta rodada

### 4.1 Backend — `src/lib/factory.functions.ts`

Schema do `createProject` estendido com:

```ts
plan?: {
  planId: string;
  setupAmount?: number;
  recurringAmount?: number;
  dueDay?: number;            // 1..28
  setupPaid?: boolean;
  pixKey?: string;
  generateFirstInvoice?: boolean;
};
adminUser?: {
  email: string;
  name: string;
  phone?: string;
  sendWelcome?: boolean;
};
```

Fluxo (cada passo logado em `ai_project_generations.provisioning_steps`
e refletido em `audit_logs.factory.project.created`):

1. **Empresa** — `companies` (já existia, reaproveitado)
2. **Módulos** — `company_modules` ativados conforme nicho/plano
3. **Admin** — `supabaseAdmin.auth.admin.createUser` →
   `user_profiles` com perfil `gestor-empresa` →
   `generateLink({ type: 'magiclink' })` → `inviteLink`
4. **Contrato** — `billing_contracts` (PIX, dueDay, recurring/setup amounts)
5. **1ª fatura** — `billing_invoices` (`status='open'`, soma setup se `setupPaid=false`)
6. **Boas-vindas** — RPC `enqueue_message('user_welcome', ...)` em
   canais `['email','whatsapp','in_app']` com payload contendo
   `invite_link`, `company_name`, `plan_name`, `due_date`, `amount`
7. **Auditoria** — `audit_logs` registra agora:
   `{ companyId, contractId, firstInvoiceId, adminUserId, inviteLink }`

Nova função pública:

```ts
listBillingPlansForFactory() // server fn auth, retorna planos ativos
```

### 4.2 Frontend — `src/routes/_authenticated/core.criar-projeto.tsx`

Stepper de **4 etapas**:

| # | Nome | Conteúdo |
|---|---|---|
| 1 | Cliente & Nicho | Razão social, fantasia, doc, contato, nicho |
| 2 | Plano técnico & Módulos | Plano de infraestrutura + módulos selecionados |
| **3** | **Plano, Cobrança & Administrador** *(nova)* | Seleção do `billing_plan` (via `listBillingPlansForFactory`), override de `setupAmount`/`recurringAmount`/`dueDay`, `pixKey`, toggle `setupPaid`, toggle `generateFirstInvoice`, dados do admin (com fallback automático para os dados da Etapa 1), toggle `sendWelcome` |
| 4 | Resumo & Confirmação | Blocos "Cliente", "Plano técnico", **"Plano & Cobrança"**, **"Administrador"** + botão `Gerar ambiente` |

### 4.3 IDs retornados pelo wizard

A resposta de sucesso (`onSuccess`) traz:

```ts
{
  companyId: string;
  contractId: string | null;       // se plan foi definido
  firstInvoiceId: string | null;   // se generateFirstInvoice
  adminUserId: string | null;      // se adminUser foi definido
  inviteLink: string | null;       // magic link gerado
  provisioningSteps: string[];     // log estruturado
}
```

Estes IDs aparecem em **CORE → Eventos** e no toast final do wizard.

---

## 5. Gaps remanescentes

| Gap | Impacto | Prioridade |
|---|---|---|
| Demos por nicho consolidados (clínica, psicologia, bar, imobiliária, etc.) | Sem dataset pronto para demonstração comercial | Alta |
| Testes E2E do wizard (admin + magic link + 1ª fatura + enqueue) | Risco de regressão silenciosa | Alta |
| Reenvio manual do magic link a partir do CORE | Operação atual depende de SQL direto | Média |
| Conversão demo→pago automática ao receber `billing_mark_paid` do trial | Hoje é manual via `trial_convert` | Média |
| Dashboard "Eventos do wizard" com timeline visual | Hoje os `provisioning_steps` aparecem como JSON | Baixa |
| Webhook público para reconciliação de PIX externo | Plano atual é apenas chave PIX manual | Baixa |

---

## 6. Plano sugerido — Demos por nicho

> Não implementado nesta rodada. Plano consolidado abaixo.

1. **Seed migration** `core_demo_companies` criando 1 empresa demonstração por nicho
   ativo em `niches`, todas com `is_demo=true` em `companies`.
2. Para cada demo:
   - Plano padrão "Demo 30 dias" em `billing_plans` (`setup=0`, `recurring=0`).
   - Admin demo `demo+<niche>@impulsionando.com.br`.
   - Dataset mínimo por nicho (10 clientes, 5 agendamentos, 3 vendas, 2 leads).
3. CORE → `Demos` lista as empresas demo, permitindo "Entrar como" (impersonação
   server-side via `supabaseAdmin.auth.admin.generateLink`).
4. Botão **"Clonar demo → cliente real"** dispara o wizard pré-preenchido.

Estimativa: 1 migration + 1 server fn + 1 rota (`/core/demos`).

---

## 7. Plano sugerido — Testes E2E do wizard

> Não implementado nesta rodada. Plano consolidado abaixo.

Stack: **Vitest + @supabase/supabase-js (service role em ambiente de teste)**.

Localização: `src/lib/__tests__/factory.e2e.test.ts`.

Casos mínimos:

1. `createProject` com `plan` + `adminUser` retorna
   `{ companyId, contractId, firstInvoiceId, adminUserId, inviteLink }`
   todos não-nulos.
2. `billing_invoices` recém-criada tem `status='open'`,
   `amount = setup + recurring` quando `setupPaid=false`.
3. `user_profiles` do admin tem `profile.slug='gestor-empresa'`
   e `company_id` correto.
4. `message_outbox` contém uma linha `event='user_welcome'`
   com `payload->>'invite_link' IS NOT NULL` e
   canais `['email','whatsapp','in_app']`.
5. `audit_logs` mais recente para `entity='companies'` tem
   `after->>'contractId'`, `after->>'firstInvoiceId'`,
   `after->>'adminUserId'` populados.
6. Cleanup: deletar `companies.id` em cascata
   (`user_profiles`, `billing_contracts`, `billing_invoices`,
   `message_outbox` por `reference_id`, `auth.users` do admin).

Estes testes exigem `SUPABASE_SERVICE_ROLE_KEY` em `.env.test` e
**não rodam em CI público** — apenas localmente / pipeline privado.

---

## 8. Conclusão

O CORE agora cobre, num único fluxo, **provisionamento técnico + comercial + de
acesso + de cobrança + de comunicação**. Os IDs `contractId`, `firstInvoiceId` e
`adminUserId` tornam o wizard auditável ponta-a-ponta. Restam dois pilares
operacionais (demos por nicho e testes E2E) descritos nos §6 e §7 para a
próxima rodada.
