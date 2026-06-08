# Testes de Regressão de Segurança — Billing

Objetivo: impedir que políticas de RLS críticas das tabelas financeiras sejam
removidas ou enfraquecidas em migrations futuras.

## Estado esperado (baseline)

As três tabelas `billing_contracts`, `billing_invoices` e `billing_suspensions`
devem ter, para SELECT, uma cláusula que exija:

- `is_impulsionando_staff(auth.uid())` (bypass para staff Impulsionando), **OU**
- `user_belongs_to_company(auth.uid(), company_id)` **E**
  `user_has_permission(auth.uid(), company_id, 'finance.transaction.read')`.

## Query de verificação (rodar manualmente ou no CI)

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('billing_contracts','billing_invoices','billing_suspensions')
  AND cmd = 'SELECT';
```

Esperado: 3 linhas, todas com `finance.transaction.read` na expressão `qual`.

## Teste automático (assertion SQL)

```sql
DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE tablename IN ('billing_contracts','billing_invoices','billing_suspensions')
    AND cmd = 'SELECT'
    AND qual LIKE '%finance.transaction.read%';
  IF n < 3 THEN
    RAISE EXCEPTION 'REGRESSÃO DE SEGURANÇA: políticas SELECT em billing_* perderam exigência de finance.transaction.read (encontradas: %)', n;
  END IF;
END $$;
```

Este bloco DO falha (e aborta a migration) se qualquer política for removida
ou se a exigência `finance.transaction.read` for retirada. Recomenda-se incluí-lo
no início de toda nova migration que toque essas tabelas.

## Perfis e comportamento esperado

| Perfil | SELECT em billing_* | Justificativa |
|---|---|---|
| Staff Impulsionando (`is_impulsionando_staff`) | ✅ permitido | Operação interna |
| Membro de empresa com `finance.transaction.read` | ✅ permitido | Acesso financeiro autorizado |
| Membro de empresa sem permissão financeira | ❌ negado | Não vê chaves PIX, faturas, suspensões |
| Usuário de outra empresa | ❌ negado | Isolamento por `company_id` |
| `anon` / não autenticado | ❌ negado | RLS bloqueia sem sessão |
| Cliente/lead/demo | ❌ negado | Não possui `user_profiles` ativo em empresa |

## Itens conscientemente mantidos como ignorados

- `aff_sales` autoacesso do afiliado — escopo limitado a `aff_affiliates.user_id = auth.uid()`.
- `notifications` INSERT — scanner marcou como non-actionable.

## Último scan validado

- 3 issues críticos do scan anterior: **corrigidos**.
- Findings remanescentes são `warn` (funções `SECURITY DEFINER` executáveis pelo
  papel anon, padrão Supabase) — não impactam o vetor financeiro.
