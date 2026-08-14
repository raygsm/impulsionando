import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const WMP_COMPANY_ID = 'ff2a9570-1168-4f9c-a852-1e042d9f32ed'

async function requireWmpManager(context: any) {
  const appMetadata = (context.claims?.app_metadata ?? {}) as Record<string, unknown>
  const isSuperAdmin = appMetadata.is_super_admin === true || appMetadata.platform_role === 'super_admin'
  const isImpulsionandoStaff = isSuperAdmin || appMetadata.is_impulsionando_staff === true
  if (isImpulsionandoStaff) return

  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.userId)
    .eq('company_id', WMP_COMPANY_ID)
    .in('role', ['admin', 'gestor'])
    .limit(1)
  if (error) throw error
  if (!data?.length) throw new Error('Forbidden: WMP management access required')
}

async function tenantId(context: any) {
  await requireWmpManager(context)
  const { data, error } = await context.supabase
    .from('communication_tenants')
    .select('id')
    .eq('slug', 'wmp')
    .eq('active', true)
    .single()
  if (error) throw error
  return data.id as string
}

export const getWmpOperations = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const id = await tenantId(context)
    const [briefings, partners, bookings, availability, equipment, rentals, payouts, tickets] = await Promise.all([
      context.supabase.from('wmp_briefings').select('id,status,contratante_nome,contratante_empresa,contratante_email,contratante_telefone,evento_tipo,evento_data,evento_cidade,evento_estado,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(100),
      context.supabase.from('wmp_parceiros').select('id,status,nome,nome_artistico,email,telefone,categoria,cidade,estado,experiencia_anos,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200),
      context.supabase.from('wmp_dj_bookings').select('id,parceiro_id,proposal_id,event_name,event_date,venue_name,city,state,status,fee_cents,response_deadline,accepted_at,declined_at,logistics,created_at').eq('tenant_id', id).order('event_date', { ascending: true }).limit(200),
      context.supabase.from('wmp_dj_availability').select('id,parceiro_id,date,start_time,end_time,status,city,state,notes').eq('tenant_id', id).gte('date', new Date().toISOString().slice(0, 10)).order('date', { ascending: true }).limit(300),
      context.supabase.from('wmp_equipment_catalog').select('id,code,category,name,manufacturer,model,quantity_available,commercial_value_cents,status,owner_type,owner_name,beneficiary_kind').eq('tenant_id', id).order('name').limit(500),
      context.supabase.from('wmp_equipment_rentals').select('id,equipment_id,proposal_id,dj_booking_id,quantity,unit_rental_cents,status,owner_type,owner_name,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(300),
      context.supabase.from('wmp_equipment_rental_payouts').select('id,rental_id,beneficiary_type,beneficiary_name,amount_cents,status,paid_at,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(300),
      context.supabase.from('wmp_conversation_tickets').select('id,protocol,conversation_id,contact_id,closed_at,export_status,export_email,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200),
    ])
    const all = { briefings, partners, bookings, availability, equipment, rentals, payouts, tickets }
    for (const [key, result] of Object.entries(all)) {
      if ((result as any).error) throw new Error(`${key}: ${(result as any).error.message}`)
    }
    return Object.fromEntries(Object.entries(all).map(([key, result]) => [key, (result as any).data ?? []]))
  })

const tableSchema = z.enum(['wmp_briefings', 'wmp_parceiros', 'wmp_dj_bookings', 'wmp_dj_availability', 'wmp_equipment_rentals', 'wmp_equipment_rental_payouts'])

export const updateWmpOperationalStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string; status: string }) => z.object({
    table: tableSchema,
    id: z.string().uuid(),
    status: z.string().trim().min(1).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const id = await tenantId(context)
    const { error } = await context.supabase
      .from(data.table)
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq('tenant_id', id)
      .eq('id', data.id)
    if (error) throw error
    return { ok: true }
  })

export const updateWmpEquipment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; commercial_value_cents?: number; quantity_available?: number; status?: string }) => z.object({
    id: z.string().uuid(),
    commercial_value_cents: z.number().int().min(0).optional(),
    quantity_available: z.number().int().min(0).optional(),
    status: z.string().trim().min(1).max(40).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const id = await tenantId(context)
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.commercial_value_cents !== undefined) patch.commercial_value_cents = data.commercial_value_cents
    if (data.quantity_available !== undefined) patch.quantity_available = data.quantity_available
    if (data.status !== undefined) patch.status = data.status
    const { error } = await context.supabase
      .from('wmp_equipment_catalog')
      .update(patch)
      .eq('tenant_id', id)
      .eq('id', data.id)
    if (error) throw error
    return { ok: true }
  })
