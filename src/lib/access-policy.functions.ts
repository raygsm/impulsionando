import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

/**
 * Fonte server-authoritative para o gate de acesso do cliente.
 * A empresa nunca é aceita do navegador: é resolvida pela identidade autenticada.
 */
export const getMyCoreAccessPolicy = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context
    const { data: companyId, error: companyError } = await supabase.rpc('current_user_company_id')
    if (companyError) throw new Error(companyError.message)
    if (!companyId) return { hasCompany: false as const }

    const { data: policy, error: policyError } = await supabase
      .from('core_company_access_policy')
      .select('company_id,company_name,lifecycle_status,service_state,access_mode,subdomain,root_domain,watermark_required,finance_only')
      .eq('company_id', companyId)
      .maybeSingle()
    if (policyError) throw new Error(policyError.message)

    const { data: contract, error: contractError } = await supabase
      .from('billing_contracts')
      .select('id,status,next_due_date,recurring_amount,created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (contractError) throw new Error(contractError.message)

    return {
      hasCompany: true as const,
      companyId: String(companyId),
      policy: policy ?? null,
      hasContract: !!contract,
      contract: contract ?? null,
    }
  })
