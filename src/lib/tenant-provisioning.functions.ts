// Onboarding self-service de novos tenants do core Impulsionando.
// Gate: somente admin do core.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertCoreAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' })
  if (!isAdmin) throw new Error('Forbidden: requer admin do core')
}

const ProvisionSchema = z.object({
  empresa: z.object({
    name: z.string().trim().min(2).max(120),
    legal_name: z.string().trim().max(160).optional(),
    document: z.string().trim().max(32).optional(),
    email: z.string().email().optional(),
    whatsapp: z.string().trim().max(32).optional(),
    subdomain: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/).optional(),
    niche_id: z.string().uuid().optional(),
  }),
  plano: z.object({
    plan_id: z.string().uuid().optional(),
  }).optional(),
  branding: z.object({
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    logo_url: z.string().url().optional(),
  }).optional(),
  admin: z.object({
    email: z.string().email(),
    display_name: z.string().trim().min(2).max(120),
  }),
})

export const listProvisionOptions = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCoreAdmin(context)
    const [niches, plans] = await Promise.all([
      context.supabase.from('niches').select('id, name, slug').eq('is_active', true).order('name'),
      context.supabase.from('billing_plans').select('id, code, name, recurring_amount, cycle').eq('is_active', true).order('sort_order', { ascending: true }),
    ])
    return { niches: niches.data ?? [], plans: plans.data ?? [] }
  })

export const provisionTenant = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProvisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { captureServerError } = await import('@/lib/runtime-observability.functions')
    return captureServerError(
      { scope: 'tenant-provisioning.provisionTenant', userId: context.userId, supabaseAdmin, context: { adminEmail: data.admin.email } },
      async () => {



    // 1. Cria empresa tenant
    const { data: company, error: cErr } = await supabaseAdmin
      .from('companies')
      .insert({
        name: data.empresa.name,
        legal_name: data.empresa.legal_name ?? null,
        trade_name: data.empresa.name,
        document: data.empresa.document ?? null,
        email: data.empresa.email ?? data.admin.email,
        whatsapp: data.empresa.whatsapp ?? null,
        subdomain: data.empresa.subdomain ?? null,
        niche_id: data.empresa.niche_id ?? null,
        primary_color: data.branding?.primary_color ?? null,
        secondary_color: data.branding?.secondary_color ?? null,
        logo_url: data.branding?.logo_url ?? null,
        is_master: false,
        is_active: true,
        is_demo: false,
        status: 'active',
        company_kind: 'tenant',
      } as never)
      .select('id, name')
      .single()
    if (cErr || !company) throw new Error(`Falha ao criar empresa: ${cErr?.message ?? 'desconhecido'}`)
    const companyId = (company as any).id as string

    // 2. Vincula plano (se informado)
    if (data.plano?.plan_id) {
      await supabaseAdmin.from('core_company_plans').insert({
        company_id: companyId,
        plan_id: data.plano.plan_id,
        status: 'active',
        started_at: new Date().toISOString(),
      } as never)
    }

    // 3. Resolve usuário admin: existente ou convite
    let adminUserId: string | null = null
    let inviteSent = false
    try {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })
      const found = existing?.users?.find((u: any) => (u.email ?? '').toLowerCase() === data.admin.email.toLowerCase())
      if (found) {
        adminUserId = found.id
      } else {
        const { data: invited } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.admin.email, {
          data: { display_name: data.admin.display_name, tenant_company_id: companyId },
        })
        adminUserId = invited?.user?.id ?? null
        inviteSent = !!adminUserId
      }
    } catch (e) {
      // mantém companyId criado; admin pode ser vinculado depois
    }

    // 4. Vincula admin à empresa
    if (adminUserId) {
      await supabaseAdmin.from('user_profiles').insert({
        user_id: adminUserId,
        company_id: companyId,
        display_name: data.admin.display_name,
        email: data.admin.email,
        is_active: true,
      } as never)
      await supabaseAdmin.from('user_roles').insert({
        user_id: adminUserId,
        role: 'admin',
        company_id: companyId,
      } as never)
    }

    // 5. Registra solicitação de domínio (subdomínio whitelabel)
    if (data.empresa.subdomain) {
      await supabaseAdmin.from('onboarding_domain_requests').insert({
        company_id: companyId,
        mode: 'subdomain',
        requested_value: data.empresa.subdomain,
        contact_name: data.admin.display_name,
        contact_email: data.admin.email,
        status: 'reserved',
      } as never)
    }

    return {
      companyId,
      companyName: (company as any).name as string,
      adminUserId,
      inviteSent,
    }
  })

// ============= Gestão pós-provisionamento =============

export const listTenantOnboarding = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: tenants } = await supabaseAdmin
      .from('companies')
      .select('id, name, subdomain, email, status, is_active, created_at, company_kind')
      .eq('company_kind', 'tenant')
      .order('created_at', { ascending: false })
      .limit(200)
    const ids = (tenants ?? []).map((t: any) => t.id)
    const safeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']
    const [{ data: domains }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from('onboarding_domain_requests').select('company_id, mode, requested_value, status, updated_at').in('company_id', safeIds),
      supabaseAdmin.from('user_profiles').select('company_id, user_id, email, display_name, is_active').in('company_id', safeIds),
    ])
    return {
      tenants: (tenants ?? []).map((t: any) => ({
        ...t,
        domain: (domains ?? []).find((d: any) => d.company_id === t.id) ?? null,
        admins: (profiles ?? []).filter((p: any) => p.company_id === t.id),
      })),
    }
  })

export const resendTenantAdminInvite = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email(), companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { tenant_company_id: data.companyId, resend: true },
    })
    if (error) throw new Error(`Falha ao reenviar convite: ${error.message}`)
    return { ok: true, userId: invited?.user?.id ?? null }
  })

export const updateTenantSubdomain = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    companyId: z.string().uuid(),
    subdomain: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: clash } = await supabaseAdmin
      .from('companies').select('id').eq('subdomain', data.subdomain).neq('id', data.companyId).maybeSingle()
    if (clash) throw new Error(`Subdomínio "${data.subdomain}" já está em uso.`)
    const { error: upErr } = await supabaseAdmin
      .from('companies').update({ subdomain: data.subdomain } as never).eq('id', data.companyId)
    if (upErr) throw new Error(upErr.message)
    await supabaseAdmin.from('onboarding_domain_requests').insert({
      company_id: data.companyId,
      mode: 'subdomain',
      requested_value: data.subdomain,
      status: 'reserved',
    } as never)
    return { ok: true, subdomain: data.subdomain }
  })
