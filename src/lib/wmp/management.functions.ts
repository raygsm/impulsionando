import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { dispatchN8nByEvent } from '@/lib/n8n-dispatch-by-event.server'

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
    const categorySet = await context.supabase
      .from('reference_option_sets')
      .select('id')
      .eq('key', 'wmp_equipment_categories')
      .eq('active', true)
      .maybeSingle()
    if (categorySet.error) throw categorySet.error

    const [briefings, partners, bookings, availability, equipment, rentals, payouts, tickets, manufacturers, models, referenceRequests, categories] = await Promise.all([
      context.supabase.from('wmp_briefings').select('id,status,contratante_nome,contratante_empresa,contratante_email,contratante_telefone,evento_tipo,evento_data,evento_cidade,evento_estado,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(100),
      context.supabase.from('wmp_parceiros').select('id,status,nome,nome_artistico,email,telefone,categoria,cidade,estado,experiencia_anos,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200),
      context.supabase.from('wmp_dj_bookings').select('id,parceiro_id,proposal_id,event_name,event_date,venue_name,city,state,status,fee_cents,response_deadline,accepted_at,declined_at,meal_allowance_cents,parking_allowance_cents,meal_provided_by_contractor,parking_provided_by_contractor,logistics,created_at').eq('tenant_id', id).order('event_date', { ascending: true }).limit(200),
      context.supabase.from('wmp_dj_availability').select('id,parceiro_id,date,start_time,end_time,status,city,state,notes').eq('tenant_id', id).gte('date', new Date().toISOString().slice(0, 10)).order('date', { ascending: true }).limit(300),
      context.supabase.from('wmp_equipment_catalog').select('id,code,category,name,manufacturer,manufacturer_id,model,model_id,quantity_available,internal_cost_cents,commercial_value_cents,status,owner_type,owner_ref_id,owner_name,beneficiary_kind').eq('tenant_id', id).order('name').limit(500),
      context.supabase.from('wmp_equipment_rentals').select('id,equipment_id,proposal_id,dj_booking_id,quantity,unit_rental_cents,status,owner_type,owner_name,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(300),
      context.supabase.from('wmp_equipment_rental_payouts').select('id,rental_id,beneficiary_type,beneficiary_name,amount_cents,status,paid_at,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(300),
      context.supabase.from('communication_conversation_tickets').select('id,protocol,conversation_id,contact_id,closed_at,export_status,export_requested_at,export_sent_at,created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200),
      context.supabase.from('wmp_equipment_manufacturers').select('id,name,website,active').eq('tenant_id', id).eq('active', true).order('name').limit(500),
      context.supabase.from('wmp_equipment_models').select('id,manufacturer_id,category,product_line,model,submodel,active').eq('tenant_id', id).eq('active', true).order('model').limit(2000),
      context.supabase.from('wmp_equipment_reference_requests').select('id,request_type,requested_name,manufacturer_id,category,reference_url,status,resulting_manufacturer_id,resulting_model_id,created_at,reviewed_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(200),
      categorySet.data?.id
        ? context.supabase.from('reference_options').select('id,code,label,description,sort_order').eq('set_id', categorySet.data.id).eq('active', true).order('sort_order').limit(500)
        : Promise.resolve({ data: [], error: null }),
    ])
    const all = { briefings, partners, bookings, availability, equipment, rentals, payouts, tickets, manufacturers, models, referenceRequests, categories }
    for (const [key, result] of Object.entries(all)) {
      if ((result as any).error) throw new Error(`${key}: ${(result as any).error.message}`)
    }
    return Object.fromEntries(Object.entries(all).map(([key, result]) => [key, (result as any).data ?? []]))
  })

const tableSchema = z.enum(['wmp_briefings', 'wmp_parceiros', 'wmp_dj_bookings', 'wmp_dj_availability', 'wmp_equipment_rentals', 'wmp_equipment_rental_payouts'])

const djLifecycleEvents: Record<string, string> = {
  OFFERED: 'wmp.dj.offered',
  ACCEPTED: 'wmp.dj.accepted',
  CONFIRMED: 'wmp.dj.confirmed',
  COMPLETED: 'wmp.dj.completed',
}

export const updateWmpOperationalStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string; status: string }) => z.object({
    table: tableSchema,
    id: z.string().uuid(),
    status: z.string().trim().min(1).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const id = await tenantId(context)
    const normalizedStatus = data.status.toUpperCase()
    const now = new Date().toISOString()

    if (data.table === 'wmp_dj_bookings') {
      const { data: current, error: readError } = await context.supabase
        .from('wmp_dj_bookings')
        .select('id,proposal_id,parceiro_id,event_name,event_date,status')
        .eq('tenant_id', id)
        .eq('id', data.id)
        .single()
      if (readError) throw readError

      const patch: Record<string, unknown> = { status: normalizedStatus, updated_at: now }
      if (normalizedStatus === 'ACCEPTED') patch.accepted_at = now
      if (normalizedStatus === 'DECLINED') patch.declined_at = now

      const { error } = await context.supabase
        .from('wmp_dj_bookings')
        .update(patch)
        .eq('tenant_id', id)
        .eq('id', data.id)
      if (error) throw error

      const eventName = djLifecycleEvents[normalizedStatus]
      const automation = eventName
        ? await dispatchN8nByEvent(eventName, {
            booking_id: current.id,
            proposal_id: current.proposal_id,
            partner_id: current.parceiro_id,
            event_name: current.event_name,
            event_date: current.event_date,
            previous_status: current.status,
            status: normalizedStatus,
            transitioned_at: now,
          }, null, 'wmp')
        : null
      return { ok: true, automation }
    }

    const { error } = await context.supabase
      .from(data.table)
      .update({ status: data.status, updated_at: now })
      .eq('tenant_id', id)
      .eq('id', data.id)
    if (error) throw error
    return { ok: true }
  })

const equipmentUpdateSchema = z.object({
  id: z.string().uuid(),
  category: z.string().trim().min(1).max(80).optional(),
  manufacturer_id: z.string().uuid().nullable().optional(),
  model_id: z.string().uuid().nullable().optional(),
  commercial_value_cents: z.number().int().min(0).optional(),
  internal_cost_cents: z.number().int().min(0).optional(),
  quantity_available: z.number().int().min(0).optional(),
  owner_type: z.string().trim().min(1).max(40).optional(),
  owner_name: z.string().trim().max(160).nullable().optional(),
  beneficiary_kind: z.string().trim().max(60).nullable().optional(),
  status: z.string().trim().min(1).max(40).optional(),
})

export const updateWmpEquipment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof equipmentUpdateSchema>) => equipmentUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const id = await tenantId(context)
    const { data: current, error: currentError } = await context.supabase
      .from('wmp_equipment_catalog')
      .select('id,category,manufacturer_id,model_id')
      .eq('tenant_id', id)
      .eq('id', data.id)
      .single()
    if (currentError) throw currentError

    const category = data.category ?? current.category
    if (data.category !== undefined) {
      const { data: set, error: setError } = await context.supabase.from('reference_option_sets').select('id').eq('key', 'wmp_equipment_categories').eq('active', true).single()
      if (setError) throw setError
      const { data: option, error: optionError } = await context.supabase.from('reference_options').select('id').eq('set_id', set.id).eq('code', data.category).eq('active', true).maybeSingle()
      if (optionError) throw optionError
      if (!option) throw new Error('Categoria de equipamento não pertence ao catálogo canônico WMP.')
    }

    let manufacturer: { id: string; name: string } | null = null
    const manufacturerId = data.manufacturer_id === undefined ? current.manufacturer_id : data.manufacturer_id
    if (manufacturerId) {
      const { data: row, error } = await context.supabase.from('wmp_equipment_manufacturers').select('id,name').eq('tenant_id', id).eq('id', manufacturerId).eq('active', true).maybeSingle()
      if (error) throw error
      if (!row) throw new Error('Fabricante inválido ou inativo para a WMP.')
      manufacturer = row
    }

    let model: { id: string; model: string; manufacturer_id: string | null; category: string } | null = null
    const modelId = data.model_id === undefined ? current.model_id : data.model_id
    if (modelId) {
      const { data: row, error } = await context.supabase.from('wmp_equipment_models').select('id,model,manufacturer_id,category').eq('tenant_id', id).eq('id', modelId).eq('active', true).maybeSingle()
      if (error) throw error
      if (!row) throw new Error('Modelo inválido ou inativo para a WMP.')
      if (manufacturerId && row.manufacturer_id && row.manufacturer_id !== manufacturerId) throw new Error('O modelo selecionado não pertence ao fabricante escolhido.')
      if (row.category !== category) throw new Error('O modelo selecionado não pertence à categoria escolhida.')
      model = row
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.category !== undefined) patch.category = data.category
    if (data.manufacturer_id !== undefined) {
      patch.manufacturer_id = data.manufacturer_id
      patch.manufacturer = manufacturer?.name ?? null
      if (!data.manufacturer_id) {
        patch.model_id = null
        patch.model = null
      }
    }
    if (data.model_id !== undefined) {
      patch.model_id = data.model_id
      patch.model = model?.model ?? null
    }
    if (data.commercial_value_cents !== undefined) patch.commercial_value_cents = data.commercial_value_cents
    if (data.internal_cost_cents !== undefined) patch.internal_cost_cents = data.internal_cost_cents
    if (data.quantity_available !== undefined) patch.quantity_available = data.quantity_available
    if (data.owner_type !== undefined) patch.owner_type = data.owner_type
    if (data.owner_name !== undefined) patch.owner_name = data.owner_name
    if (data.beneficiary_kind !== undefined) patch.beneficiary_kind = data.beneficiary_kind
    if (data.status !== undefined) patch.status = data.status

    const { error } = await context.supabase
      .from('wmp_equipment_catalog')
      .update(patch)
      .eq('tenant_id', id)
      .eq('id', data.id)
    if (error) throw error
    return { ok: true }
  })