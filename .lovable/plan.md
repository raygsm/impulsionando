# Plano: Pagamentos, Entitlement e Portal do Usuário

## Objetivos
Corrigir os 3 bugs críticos, fechar os gaps de arquitetura (gating, downgrade, past_due, portal do usuário, anuais) e deixar o fluxo testável de ponta a ponta no preview.

---

## Parte 1 — Bugs críticos do webhook (`webhook.ts`)

1. **Status enum**: trocar `status: "converted"` → `"convertido"` no `UPDATE trial_subscriptions`. Mesma correção em qualquer outro lugar que escreva enum em inglês.
2. **Checkout anônimo (sem userId)**: se `customData.userId` ausente, usar `customer.email` do payload + `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, password: random })` e disparar `resetPasswordForEmail` para o cliente definir senha. Linkar o novo `user.id` ao `subscriptions.user_id`. Enfileirar template `welcome_post_checkout` com link de definir senha.
3. **Race em `handleSubscriptionCanceled`**: ler a row ANTES de fazer o update; usar dados lidos para resolver `company_id` e disparar gating/notificações.
4. **Downgrade**: ao processar `subscription.updated` com troca de `productId`, calcular `modulesToDisable = (modulosDoProdutoAntigo) - (modulosDoNovoProduto)` e fazer upsert de `is_enabled=false` para esses.
5. **past_due**: novo handler que (a) marca `subscriptions.status='past_due'`, (b) grava `past_due_since=now()` (coluna nova), (c) NÃO desativa módulos imediatamente, (d) enfileira `payment_failed_dunning`. Cron diário verifica `past_due_since < now()-3 days` e desativa módulos + enfileira `subscription_suspended`.

## Parte 2 — Catálogo Paddle (anuais separados)

6. Expandir `PLAN_MODULES` com chaves `essencial_plan_annual`, `integrado_plan_annual`, `avancado_plan_annual` (mesmos módulos do mensal correspondente).
7. Criar via tools `payments--batch_create_product` os 3 produtos anuais novos com seus respectivos prices (`essencial_annual`, `integrado_annual`, `avancado_annual`). Verificar com `payments--api_read` se já existem para evitar duplicar; reuso por `external_id`.
8. Atualizar `planos.tsx` com price IDs já validados.

## Parte 3 — Templates de mensagem faltantes

9. Migração que insere em `message_templates` os event_codes: `trial_payment_approved`, `payment_failed_dunning`, `subscription_suspended`, `welcome_post_checkout` (email + whatsapp + in_app onde aplicável). Conteúdo PT-BR com variáveis `{{nome_cliente}}`, `{{nome_plano}}`, `{{link_acesso}}`, `{{link_definir_senha}}`.

## Parte 4 — Hook & gating de módulos

10. Novo `src/hooks/useSubscription.ts`: query do `subscriptions` filtrando por `environment` (via `getPaddleEnvironment()`), retorna `{ subscription, status, isActive, isPastDue, daysUntilSuspension, plan }`.
11. Novo `src/hooks/useCompanyModules.ts`: retorna `Set<moduleSlug>` de módulos ativos da company atual.
12. Novo `<RequireModule slug="agenda">` (ou layout route `_authenticated/_module.$slug/route.tsx`): se módulo não ativo → `redirect({ to: '/planos', search: { reason: 'module_locked', module: slug } })`. Envolver rotas existentes de crm/agenda/financeiro/bi.
13. Em `AppShell`, banner amarelo se `isPastDue` com contador de dias restantes até suspensão.

## Parte 5 — Portal "Minha Assinatura"

14. Nova rota `src/routes/_authenticated/minha-assinatura.tsx` com:
   - Card: plano atual, status (badge), próxima cobrança, valor, ciclo (mensal/anual).
   - Botão **Trocar de plano** → abre Dialog com cards dos 3 planos; ao confirmar chama server fn `changePlan` (Paddle SDK `subscriptions.update` com `prorationBillingMode: 'prorated_immediately'` para upgrade, `'prorated_next_billing_period'` para downgrade — webhook depois reflete módulos).
   - Botão **Cancelar assinatura** → confirma e chama `cancelOwnSubscription` (Paddle SDK com `effectiveFrom: 'next_billing_period'`).
   - Botão **Portal Paddle** (atualizar cartão, faturas) → server fn `openMyPortal` retorna URL e abre em nova aba.
15. Novas server fns em `src/lib/billing-self.functions.ts` com `requireSupabaseAuth` middleware, validando que `subscription.user_id === context.userId`.
16. Link no menu do usuário (avatar dropdown) → "Minha Assinatura".

## Parte 6 — Higiene

17. `planos.tsx`: adicionar `ssr: false` para evitar render server-side sem sessão.
18. Garantir `attachSupabaseAuth` em `src/start.ts` (verificar — pode já estar).
19. Migração para coluna `subscriptions.past_due_since timestamptz` + índice.

---

## Detalhes técnicos

### Estrutura de arquivos novos/alterados
```
src/
├── routes/
│   ├── planos.tsx                                    (edit: ssr:false, anuais)
│   ├── _authenticated/
│   │   ├── minha-assinatura.tsx                      (new)
│   │   └── _module.$slug/route.tsx                   (new — gate)
│   └── api/public/payments/webhook.ts                (edit: bugs + past_due + downgrade)
├── hooks/
│   ├── useSubscription.ts                            (new)
│   └── useCompanyModules.ts                          (new)
├── lib/
│   └── billing-self.functions.ts                     (new)
└── components/
    └── PastDueBanner.tsx                             (new)
supabase/migrations/
└── <ts>_billing_v2.sql                               (templates + past_due_since)
```

### Pseudocódigo do gate de módulo
```ts
// _authenticated/_module.$slug/route.tsx
beforeLoad: async ({ params }) => {
  const modules = await getActiveModules();        // server fn
  if (!modules.has(params.slug)) {
    throw redirect({ to: '/planos', search: { locked: params.slug }});
  }
}
```

### Pseudocódigo `changePlan`
```ts
export const changePlan = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { newPriceId: string; isUpgrade: boolean }) => d)
  .handler(async ({ data, context }) => {
    const sub = await loadMySub(context.userId);
    const paddle = getPaddleClient(sub.environment);
    const newPaddleId = await resolveExternal(data.newPriceId, sub.environment);
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: newPaddleId, quantity: 1 }],
      prorationBillingMode: data.isUpgrade
        ? 'prorated_immediately'
        : 'prorated_next_billing_period',
    });
    return { ok: true };
  });
```

---

## Como testar no preview (modo TEST)

1. **Catálogo**: abra `?view=payments`, confirme que aparecem 6 prices (3 mensais + 3 anuais) e 6 produtos com `external_id` correto.
2. **Checkout logado**: faça login em `/auth`, vá em `/planos`, escolha **Essencial mensal**, abra checkout, use cartão `4242 4242 4242 4242` CVC `123`, validade futura. Após pagar deve redirecionar para `/checkout/success`. Em `/minha-assinatura` deve ver "Essencial — ativo". Em `/admin/billing` (super-admin) também.
3. **Checkout anônimo** (gap #4): faça logout, volte em `/planos`, assine **Integrado**. Use email novo no checkout do Paddle. Após pagar, conta nova deve ser criada e email de "definir senha" enviado (verifique `message_outbox` no DB).
4. **Upgrade**: como usuário Essencial, em `/minha-assinatura` clique "Trocar plano" → Avançado. Cobrança prorata imediata. Webhook deve liberar `agenda`, `financeiro`, `bi`.
5. **Downgrade**: troque de Avançado para Essencial → mudança só no próximo ciclo. Para acelerar, no `/admin/billing` use a função de fast-forward (ou via Paddle Simulator) e veja módulos extras serem desativados.
6. **Cancelamento**: em `/minha-assinatura` clique "Cancelar" → status muda para `canceled` mas acesso permanece até `current_period_end`.
7. **Past_due** (dunning): assine com cartão `4000 0027 6000 3184` (sucesso inicial, falha no recurring). Use fast-forward no admin para forçar renovação → status vai para `past_due`, banner aparece com "3 dias para suspensão". Após 3 dias simulados (ou rodar manualmente o cron `subscription_dunning_check`), módulos são desativados.
8. **Gating**: como usuário com plano Essencial, tente acessar `/agenda` direto pela URL → deve redirecionar para `/planos?locked=agenda`.
9. **Portal Paddle**: em `/minha-assinatura`, clique "Gerenciar pagamento" → abre nova aba com portal Paddle (atualizar cartão / ver faturas).

### Cartões de teste
- `4242 4242 4242 4242` — sucesso sempre
- `4000 0000 0000 0002` — recusa sempre
- `4000 0027 6000 3184` — sucesso inicial, recusa na renovação (testar dunning)
- `4000 0000 0000 3220` — força fluxo 3DS

Validade: qualquer data futura. CVC: `123`. Nome: qualquer.

---

## Ordem de execução
1. Migração (templates + `past_due_since`)
2. Catálogo Paddle (anuais)
3. Webhook (bugs + downgrade + past_due + anônimo)
4. Hooks + gate de módulo
5. Página `/minha-assinatura` + server fns
6. Banner past_due + ajustes finais

Estimativa: ~10 arquivos novos, ~5 editados, 1 migração.
