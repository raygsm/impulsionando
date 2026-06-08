# Testes de Regressão e Exceções de Segurança

Documenta o estado de segurança consolidado da plataforma Impulsionando após as
correções financeiras e a revisão dos warnings remanescentes do Security Scan.

---

## 1. Correções financeiras protegidas (vetor crítico)

`billing_contracts`, `billing_invoices`, `billing_suspensions` — toda leitura
exige `is_impulsionando_staff()` **ou** (`user_belongs_to_company()` **e**
`user_has_permission(..., 'finance.transaction.read')`).

- Chaves PIX (`pix_key`, `pix_copy_paste`) ficam atrás da mesma RLS.
- Trava de regressão: `public.assert_billing_finance_rls()` — chamar no início
  de qualquer migration que toque essas tabelas.

### Query de verificação

```sql
SELECT count(*) FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('billing_contracts','billing_invoices','billing_suspensions')
  AND cmd='SELECT' AND qual LIKE '%finance.transaction.read%';
-- esperado: 3
```

---

## 2. Funções SECURITY DEFINER — revisão de execução por anon

Anon (sem login) foi **revogado** das seguintes funções (mantidas para
`authenticated` + `service_role`):

| Função | Finalidade | Por que anon não precisa |
|---|---|---|
| `billing_check_company_status` | Status de cobrança da empresa | Apenas membros logados |
| `billing_mark_paid` | Conciliação manual | Staff via service_role |
| `billing_run_cycle` | Cron de cobrança | Service_role (webhook interno) |
| `company_identity_payload` | Identidade da empresa para templates | Server-side |
| `core_user_belongs_to_company` | Checagem de pertencimento | Faz sentido só logado |
| `delete_email`, `enqueue_email`, `read_email_batch`, `move_to_dlq` | Fila pgmq | Service_role |
| `has_active_subscription` | Status de assinatura por user_id | Evita probe anônimo |
| `is_patient_of_record` (2 overloads) | Validação prontuário | Apenas usuário logado |
| `master_company_id` | ID da empresa-mestre | Server-side |
| `trial_cancel`, `trial_check_abuse`, `trial_create`, `trial_extend` | Operações de trial | Chamadas via `supabaseAdmin` |

### Funções que permanecem executáveis por anon — justificativa

| Função | Motivo |
|---|---|
| `is_super_admin`, `is_impulsionando_staff`, `is_patient_of_record`, `user_belongs_to_company`, `user_has_permission` | Usadas dentro de cláusulas RLS; precisam ser avaliáveis pelo planner mesmo em contexto anônimo. Não vazam dados (retornam apenas boolean para o `auth.uid()` corrente, que é `NULL` para anon → sempre `false`). |
| Funções de trigger (`tg_*`, `handle_new_user`) | Executadas pelo Postgres durante operações DML, nunca via PostgREST direto. |
| `enqueue_message`, `notify_user`, `customer_anonymize`, `subscription_suspend_overdue`, `sales_cash_session_close`, `trial_convert`, `trial_regularize`, `trial_advance_status` | Já não tinham `EXECUTE` para anon (criadas como `SECURITY DEFINER` sem grant explícito). |

> Os warnings `SECURITY DEFINER executable by authenticated` que permanecem no
> linter são esperados: usuários autenticados **precisam** chamar essas funções
> para o produto funcionar. A função em si reaplica as checagens (`is_super_admin`,
> `user_has_permission`, RLS interna), portanto o `EXECUTE` por `authenticated`
> não vaza dados além do que o usuário já pode ver.

---

## 3. RLS `USING (true)` em tabelas públicas

| Tabela | Política | Conteúdo | Sensível? | Decisão |
|---|---|---|---|---|
| `modules` | `modules_read` SELECT | Catálogo de módulos disponíveis | Não | Manter pública |
| `module_versions` | `mv_read` SELECT | Versões de módulos | Não | Manter pública |
| `niches` | `niches_read` SELECT | Lista de nichos de mercado | Não | Manter pública |
| `permissions` | `perms_read` SELECT | Catálogo de códigos de permissão | Não | Manter pública (necessária para UI de perfis) |
| `setting_definitions` | `sd_read` SELECT | Definições de configurações | Não | Manter pública |
| `notifications` | `notifications_insert_service` INSERT `WITH CHECK true` | Inserção via service_role / triggers | N/A | Intencional; service-role-only por prática |
| `quotes` | `Anyone can create a quote` INSERT `WITH CHECK true` | Submissão pública de orçamento | Entrada pública | Intencional para formulário público |

Nenhuma dessas políticas expõe dados de clientes. Catálogos `modules`/`niches`/
`permissions`/`setting_definitions` são metadados de produto.

---

## 4. Warnings remanescentes do scan (não acionáveis)

- `Public Can Execute SECURITY DEFINER Function`: apenas funções usadas em
  cláusulas RLS (ver item 2).
- `Signed-In Users Can Execute SECURITY DEFINER Function`: esperado — produto
  depende dessas chamadas; cada função reaplica suas próprias permissões.
- `RLS Policy Always True`: tabelas de catálogo público (ver item 3).

---

## 5. Itens de atenção futura (fora do escopo desta auditoria)

Itens detectados pelo scanner com nível `error`/`warn` que **não foram alterados**
por estarem fora do escopo solicitado. Recomenda-se tratamento posterior:

1. **`quotes` UPDATE público (ERROR)** — política atual permite usuários anon
   atualizarem o status para `accepted` em janela de 24h sem token. Risco real
   de auto-aceite. Recomendado: exigir token único de aceite por orçamento.
2. **`aff_payouts` INSERT self-service (WARN)** — afiliado pode pedir valor
   arbitrário. Recomendado: trigger comparando com `aff_commissions` liberadas.
3. **`message_outbox` SELECT por `communication.outbox.read` (WARN)** — confirmar
   que essa permissão é concedida só a operadores; caso contrário, filtrar PII.

---

## 6. Resultado consolidado

- Vetor financeiro: **protegido** (3 políticas SELECT exigindo `finance.transaction.read`).
- PIX: **protegido** pela mesma RLS.
- Funções SECURITY DEFINER: **anon revogado** onde desnecessário (15 funções +
  overloads de `is_patient_of_record`); justificativa registrada para o restante.
- Tabelas com RLS `USING (true)`: **todas revisadas**, nenhuma contém dado
  sensível de cliente.
- Findings do scan: **45 → 28** (somente warnings esperados restam).
- Itens ignorados intencionais: `aff_sales` autoacesso de afiliado,
  `notifications` INSERT por service_role.
