// Provisionamento interno de clientes conectados ao Core Impulsionando.
// Regra: criação da empresa não ativa contrato nem acesso financeiro; o plano
// escolhido fica como preferência de onboarding até o fluxo canônico de cobrança.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertCoreAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' })
  if (error) throw new Error(error.message)
  if (!isAdmin) throw new Error('Forbidden: requer admin do core')
}

const SlugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/)

const ProvisionSchema = z.object({
  empresa: z.object({
    name: z.string().trim().min(2).max(120),
    legal_name: z.string().trim().max(160).optional(),
    document: z.string().trim().max(32).optional(),
    email: z.string().email().optional(),
    whatsapp: z.string().trim().max(32).optional(),
    subdomain: SlugSchema.optional(),
    niche_id: z.string().uuid().optional(),
    country_code: z.enum(['BR', 'BO']).optional(),
  }),
  plano: z.object({ plan_id: z.string().uuid().optional() }).optional(),
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
      context.supabase.from('billing_plans').select('id, code, name, recurring_amount, setup_fee, due_day, allow_direct_checkout').eq('is_active', true).order('sort_order', { ascending: true }),
    ])
    if (niches.error) throw new Error(niches.error.message)
    if (plans.error) throw new Error(plans.error.message)
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
        // 1. Cria a empresa sem gravar slug diretamente. O trigger universal faz
        // enrollment e o RPC canônico abaixo é a única fonte de verdade do slug.
        const { data: company, error: cErr } = await supabaseAdmin
          .from('companies')
          .insert({
            name: data.empresa.name,
            legal_name: data.empresa.legal_name ?? null,
            trade_name: data.empresa.name,
            document: data.empresa.document ?? null,
            email: data.empresa.email ?? data.admin.email,
            whatsapp: data.empresa.whatsapp ?? null,
            subdomain: null,
            niche_id: data.empresa.niche_id ?? null,
            primary_color: data.branding?.primary_color ?? null,
            secondary_color: data.branding?.secondary_color ?? null,
            logo_url: data.branding?.logo_url ?? null,
            country_code: data.empresa.country_code ?? 'BR',
            locale: data.empresa.country_code === 'BO' ? 'es-BO' : 'pt-BR',
            currency_code: data.empresa.country_code === 'BO' ? 'BOB' : 'BRL',
            phone_country_code: data.empresa.country_code === 'BO' ? '+591' : '+55',
            timezone: data.empresa.country_code === 'BO' ? 'America/La_Paz' : 'America/Sao_Paulo',
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

        // 2. Se o operador escolheu slug, substitui o slug derivado pelo RPC
        // canônico e reseta DNS/SSL para a reconciliação automática.
        let subdomain: string | null = null
        if (data.empresa.subdomain) {
          const { data: canonicalSlug, error: slugErr } = await supabaseAdmin.rpc('core_set_company_subdomain', {
            p_company_id: companyId,
            p_requested_slug: data.empresa.subdomain,
          })
          if (slugErr) throw new Error(`Falha ao reservar subdomínio: ${slugErr.message}`)
          subdomain = canonicalSlug as string
        } else {
          const { data: identity, error: identityErr } = await supabaseAdmin
            .from('core_tenant_identity')
            .select('subdomain')
            .eq('company_id', companyId)
            .maybeSingle()
          if (identityErr) throw new Error(identityErr.message)
          subdomain = (identity as any)?.subdomain ?? null
        }

        // 3. Registra somente a escolha do plano no onboarding. Contrato, cobrança,
        // liberação e recorrência continuam fail-closed no billing canônico.
        if (data.plano?.plan_id) {
          const { data: plan, error: planErr } = await supabaseAdmin
            .from('billing_plans')
            .select('id,is_active')
            .eq('id', data.plano.plan_id)
            .maybeSingle()
          if (planErr) throw new Error(planErr.message)
          if (!plan || !(plan as any).is_active) throw new Error('Plano informado não está ativo.')
          const { error: enrollmentErr } = await supabaseAdmin
            .from('core_client_enrollment')
            .update({ plan_id: data.plano.plan_id, lifecycle_status: 'plan_selected', updated_at: new Date().toISOString() } as never)
            .eq('company_id', companyId)
          if (enrollmentErr) throw new Error(enrollmentErr.message)
        }

        // 4. Resolve usuário administrador existente ou envia convite.
        let adminUserId: string | null = null
        let inviteSent = false
        try {
          const { data: existing, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
          if (usersErr) throw usersErr
          const found = existing?.users?.find((u: any) => (u.email ?? '').toLowerCase() === data.admin.email.toLowerCase())
          if (found) {
            adminUserId = found.id
          } else {
            const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.admin.email, {
              data: { display_name: data.admin.display_name, tenant_company_id: companyId },
            })
            if (inviteErr) throw inviteErr
            adminUserId = invited?.user?.id ?? null
            inviteSent = !!adminUserId
          }
        } catch (e) {
          await supabaseAdmin.from('audit_logs').insert({
            company_id: companyId,
            user_id: context.userId,
            action: 'core.client_admin.invite_failed',
            entity: 'companies',
            entity_id: companyId,
            metadata: { email: data.admin.email, error: e instanceof Error ? e.message : 'unknown' },
          } as never)
        }

        // 5. Vínculo canônico de acesso. user_profiles é mantido apenas como
        // compatibilidade de UI enquanto o painel legado ainda o consome.
        if (adminUserId) {
          const { error: roleErr } = await supabaseAdmin.from('user_roles').upsert({
            user_id: adminUserId,
            role: 'admin',
            company_id: companyId,
          } as never, { onConflict: 'user_id,role,company_id' })
          if (roleErr) throw new Error(`Falha ao vincular administrador: ${roleErr.message}`)

          await supabaseAdmin.from('user_profiles').upsert({
            user_id: adminUserId,
            company_id: companyId,
            display_name: data.admin.display_name,
            email: data.admin.email,
            is_active: true,
          } as never, { onConflict: 'user_id,company_id' })
        }

        // 6. Registro de jornada do domínio; a publicação real é comprovada pelo
        // reconciliador DNS/HTTPS, nunca por simples criação deste registro.
        if (subdomain) {
          await supabaseAdmin.from('onboarding_domain_requests').insert({
            company_id: companyId,
            mode: 'subdomain',
            requested_value: subdomain,
            contact_name: data.admin.display_name,
            contact_email: data.admin.email,
            status: 'reserved',
          } as never)
        }

        const { data: identity } = await supabaseAdmin
          .from('core_tenant_identity')
          .select('subdomain,root_domain,dns_status,ssl_status,provisioned_at')
          .eq('company_id', companyId)
          .maybeSingle()

        return {
          companyId,
          companyName: (company as any).name as string,
          adminUserId,
          inviteSent,
          subdomain: (identity as any)?.subdomain ?? subdomain,
          fullDomain: (identity as any)?.subdomain ? `${(identity as any).subdomain}.${(identity as any).root_domain ?? 'impulsionando.com.br'}` : null,
          dnsStatus: (identity as any)?.dns_status ?? 'pending',
          sslStatus: (identity as any)?.ssl_status ?? 'pending',
          accessMode: 'financial_onboarding_only',
        }
      },
    )
  })

export const listTenantOnboarding = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: tenants, error: tenantErr } = await supabaseAdmin
      .from('companies')
      .select('id, name, subdomain, email, status, is_active, created_at, company_kind')
      .eq('company_kind', 'tenant')
      .eq('is_demo', false)
      .order('created_at', { ascending: false })
      .limit(200)
    if (tenantErr) throw new Error(tenantErr.message)

    const ids = (tenants ?? []).map((t: any) => t.id)
    const safeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']
    const [{ data: domains }, { data: profiles }, { data: identities }, { data: enrollments }] = await Promise.all([
      supabaseAdmin.from('onboarding_domain_requests').select('company_id, mode, requested_value, status, updated_at').in('company_id', safeIds),
      supabaseAdmin.from('user_profiles').select('company_id, user_id, email, display_name, is_active').in('company_id', safeIds),
      supabaseAdmin.from('core_tenant_identity').select('company_id,subdomain,root_domain,dns_status,dns_error,dns_last_checked_at,ssl_status,ssl_issued_at,provisioned_at').in('company_id', safeIds),
      supabaseAdmin.from('core_client_enrollment').select('company_id,lifecycle_status,plan_id,contract_id,billing_required').in('company_id', safeIds),
    ])

    return {
      tenants: (tenants ?? []).map((t: any) => ({
        ...t,
        domain: (domains ?? []).find((d: any) => d.company_id === t.id) ?? null,
        identity: (identities ?? []).find((i: any) => i.company_id === t.id) ?? null,
        enrollment: (enrollments ?? []).find((e: any) => e.company_id === t.id) ?? null,
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
    const { captureServerError } = await import('@/lib/runtime-observability.functions')
    return captureServerError(
      { scope: 'tenant-provisioning.resendTenantAdminInvite', userId: context.userId, supabaseAdmin, companyId: data.companyId, context: { email: data.email } },
      async () => {
        const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
          data: { tenant_company_id: data.companyId, resend: true },
        })
        if (error) throw new Error(`Falha ao reenviar convite: ${error.message}`)
        return { ok: true, userId: invited?.user?.id ?? null }
      },
    )
  })

export const updateTenantSubdomain = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid(), subdomain: SlugSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCoreAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { captureServerError } = await import('@/lib/runtime-observability.functions')
    return captureServerError(
      { scope: 'tenant-provisioning.updateTenantSubdomain', userId: context.userId, supabaseAdmin, companyId: data.companyId, context: { subdomain: data.subdomain } },
      async () => {
        const { data: canonicalSlug, error } = await supabaseAdmin.rpc('core_set_company_subdomain', {
          p_company_id: data.companyId,
          p_requested_slug: data.subdomain,
        })
        if (error) throw new Error(error.message)

        await supabaseAdmin.from('onboarding_domain_requests').insert({
          company_id: data.companyId,
          mode: 'subdomain',
          requested_value: canonicalSlug,
          status: 'reserved',
        } as never)

        return { ok: true, subdomain: canonicalSlug, dnsStatus: 'pending', sslStatus: 'pending' }
      },
    )
  })
