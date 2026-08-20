import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const Input = z.object({
  name: z.string().trim().min(2).max(160),
  legalName: z.string().trim().max(200).optional(),
  document: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  requestedSlug: z.string().trim().max(63).regex(/^[a-z0-9-]*$/).optional(),
})

export const createMyCompany = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc('core_self_service_create_company', {
      p_name: data.name,
      p_legal_name: data.legalName || null,
      p_document: data.document || null,
      p_phone: data.phone || null,
      p_requested_slug: data.requestedSlug || null,
    } as never)
    if (error) throw new Error(error.message)
    return result as {
      created: boolean
      company_id: string
      company_name: string
      tenant_id?: string | null
      subdomain?: string | null
      lifecycle_status?: string | null
      access_mode?: string | null
      due_day?: number
      reason?: string
    }
  })

export const getMyCompanyOnboardingState = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: companyId, error } = await context.supabase.rpc('current_user_company_id')
    if (error) throw new Error(error.message)
    if (!companyId) return { hasCompany: false as const }

    const { data: policy } = await context.supabase
      .from('core_company_access_policy')
      .select('company_id,company_name,lifecycle_status,service_state,access_mode,subdomain,root_domain')
      .eq('company_id', companyId)
      .maybeSingle()

    return { hasCompany: true as const, companyId: String(companyId), policy }
  })
