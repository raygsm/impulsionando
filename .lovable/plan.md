
## Observação importante antes de começar

Você respondeu que **`trial_create` já cria o auth user e envia magic link**. Auditei o RPC no banco e ele **não faz isso** — apenas insere uma linha em `trial_subscriptions` e enfileira uma mensagem com o link `https://impulsionando.com.br/auth`. O usuário recebe um e-mail mandando "entrar", mas não tem conta nem senha.

Como você marcou **"P0: Trial signup + criação de usuário"** no escopo, vou tratar isso como o item correto a corrigir.

Itens **não marcados** (ficam para depois, mas registrados):
- Anonymous checkout sem `userId` (webhook não habilita módulos)
- Banner test-mode no AppShell + polling em `/checkout/success`
- Centralizar PRICE_IDS em arquivo único
- Corrigir "Impulsionando Sistemas" nos títulos de reset-password

---

## Escopo desta rodada

### Bloco 1 — Trial → login funcional (P0)

**Problema:** `/trial/cadastro` chama `requestTrial` → `trial_create` RPC. RPC só insere `trial_subscriptions`. Não cria `auth.users`. Usuário recebe e-mail e cai em `/auth` sem conta.

**Solução:** novo server function `requestTrialAndProvisionUser` que:
1. Chama `trial_create` (mantém validações anti-abuso existentes).
2. Verifica se já existe usuário em `auth.users` com aquele e-mail via `supabaseAdmin.auth.admin.listUsers`. Se existir, reusa.
3. Se não existir, cria via `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { display_name, phone, trial_id } })`.
4. Atualiza `trial_subscriptions.user_id` com o id do usuário criado.
5. Dispara magic link via `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${origin}/dashboard` } })` e retorna o link.
6. Enfileira mensagem `trial_started_v2` (novo template) com `{{link_acesso_magico}}` apontando para o magic link em vez do `/auth` genérico. Fallback: se `enqueue_message` não tiver o template novo, mantém o existente e o link genérico (não bloqueia).

**Arquivos:**
- `src/lib/trial.functions.ts` — novo `requestTrialAndProvisionUser`; manter `requestTrial` antigo por compat até remoção.
- `src/routes/trial_.cadastro.tsx` — trocar `requestTrial` por `requestTrialAndProvisionUser`. Tela de sucesso mostra "Enviamos um link de acesso para `{email}`. Clique no link para entrar — sem senha." em vez de redirecionar para `/auth`.
- Migration: novo template `trial_started_v2` na tabela `message_templates` (e-mail + whatsapp) com `{{link_acesso_magico}}`.

**RLS / segurança:** server-only via `supabaseAdmin`. Sem mudança em policies.

---

### Bloco 2 — Entitlement server-side em todas server fns de negócio (P1, você marcou "bloqueio total")

**Problema:** server fns leem/escrevem dados de CRM, financeiro, agenda, vendas etc. sem checar se a empresa tem o módulo ativo nem se a assinatura está em dia. Qualquer usuário autenticado pode invocar qualquer fn diretamente.

**Solução:** três middlewares compostáveis encadeados após `requireSupabaseAuth`.

1. **`requireActiveSubscription`** — busca a assinatura corrente (filtro por `environment` derivado do header `x-paddle-env` enviado pelo client, fallback live) e bloqueia se status não estiver em `active|trialing|past_due` (com grace `past_due_since < 3 dias`) ou `canceled` com `current_period_end > now()`. Considera também `trial_subscriptions` ativo para o user. Lança 402 (`Payment Required`).
2. **`requireCompanyAccess`** — input contém `companyId`; verifica `user_belongs_to_company(uid, companyId)` (RPC existente). Lança 403.
3. **`requireModule('crm'|'finance'|'agenda'|'sales'|'inventory'|'ehr'|'marketing')`** — verifica `company_modules.is_enabled = true` para a empresa. Lança 403.

**Padrão:**
```ts
export const listCrmLeads = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth, requireActiveSubscription, requireCompanyAccess, requireModule('crm')])
  .inputValidator(z.object({ companyId: z.string().uuid() }).parse)
  .handler(...)
```

**Arquivos:**
- `src/lib/middleware/billing.middleware.ts` (novo) — os 3 middlewares.
- Aplicar nas server fns existentes (varredura por `createServerFn` em `src/lib/**`). Estimativa: ~15-25 funções em finance, CRM, agenda, sales, inventory, EHR, marketing.
- **NÃO aplicar** em: trial.functions, billing-self.functions, billing-admin.functions, uptime.functions, ehr-patient (já é paciente, não usuário operador), example.functions.
- Frontend: adicionar header `x-paddle-env` em `attachSupabaseAuth` (ou middleware separado) lendo `getPaddleEnvironment()`, para que o servidor saiba qual ambiente filtrar.

**Tratamento de erro no cliente:** `useSubscription` já expõe `isSuspended`. Adicionar interceptor no React Query que, ao receber 402, dispara toast "Assinatura inativa — regularize em /minha-assinatura" e roteia para lá.

**Risco e mitigação:** se um cliente ativo cair em `past_due` na hora de uma operação crítica, a regra "grace 3 dias" + UI de banner evita corte abrupto. Super admin (`is_super_admin`) bypassa todos os middlewares — adicionar essa exceção dentro de `requireActiveSubscription` e `requireModule`.

---

## Como testar no preview

Após implementação, no preview (modo test):

### Teste 1 — Trial signup
1. Abra `/trial/cadastro` em janela anônima.
2. Preencha o formulário com e-mail real (que você consegue acessar).
3. Veja tela de sucesso: "Enviamos um link de acesso para {email}".
4. Em Cloud → Emails (ou na caixa de entrada), abra o link mágico → deve cair direto em `/dashboard` autenticado.
5. Em Cloud → Database → `trial_subscriptions` confirme que `user_id` está preenchido.

### Teste 2 — Entitlement server-side
1. Em `/auth` crie uma conta nova (ou use uma sem trial nem assinatura).
2. Vá para `/_authenticated/crm/leads` — UI mostra dados vazios; abra DevTools → Network e confirme que a serverFn `listCrmLeads` retornou **402**.
3. Faça checkout no `/planos` com cartão de teste **`4242 4242 4242 4242`**, CVC `123`, qualquer data futura, qualquer nome.
4. Após webhook processar (5-10s), recarregue `/crm/leads` — deve carregar normalmente.
5. Em Cloud → Database → `subscriptions` confirme nova linha com `status=active`, `environment=sandbox`.

### Teste 3 — Past due / dunning
1. Repita checkout com cartão **`4000 0027 6000 3184`** (sucede inicialmente, falha na renovação).
2. Para forçar renovação rápida, no painel Paddle (sandbox) avance `next_billed_at` 31min adiante.
3. Aguarde renovação falhar → `subscriptions.status` vira `past_due`, `past_due_since` populado.
4. Por 3 dias, app continua funcionando (banner amarelo no AppShell). Após 3 dias, cron `subscription_suspend_overdue` desativa módulos → server fns retornam 402.

### Cartões de teste
- `4242 4242 4242 4242` → sucesso
- `4000 0000 0000 0002` → recusado
- `4000 0000 0000 3220` → exige 3D Secure
- `4000 0027 6000 3184` → falha em renovação (dunning)
- CVC `123`, qualquer data futura, qualquer nome

---

## Detalhes técnicos

**Migration nova (1 só):**
- Insert do template `trial_started_v2` em `message_templates` (e-mail + whatsapp + in_app).

**Sem mudança em:** schema de `subscriptions`, RLS de tabelas existentes, integração Paddle/webhook, fluxo de checkout, customer portal.

**Bypass para staff:** `requireActiveSubscription` e `requireModule` checam `is_impulsionando_staff(uid)` primeiro e liberam.

**Header `x-paddle-env`:** anexado em `attachSupabaseAuth` (mesmo middleware do bearer) lendo `localStorage` do token Paddle. Servidor faz `getRequestHeader('x-paddle-env') === 'sandbox' ? 'sandbox' : 'live'`.

---

## Fora do escopo (registrado para próxima rodada)
- Webhook criar `companies` + `user_profiles` quando checkout vem sem `userId`
- Banner test-mode dentro de `AppShell`
- Polling de subscription em `/checkout/success`
- Centralização de PRICE_IDS em arquivo único
- Brand fix `Impulsionando Sistemas` → `Impulsionando Tecnologia` em reset-password
- Sync programático de preços entre frontend e Paddle

Aprova para implementar?
