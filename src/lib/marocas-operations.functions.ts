import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const listMarocasReservations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('marocas_reservations')
      .select('*, marocas_apartments(id,code,title)')
      .order('check_in_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return data ?? []
  })

export const listMarocasTurnovers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('marocas_turnovers')
      .select('*, marocas_apartments(id,code,title), marocas_services(id,status,service_type,scheduled_for,scheduled_end_at,professional_id,marocas_professionals(full_name,role))')
      .order('checkout_at', { ascending: true })
      .limit(300)
    if (error) throw error
    return data ?? []
  })

const ReservationInput = z.object({
  apartmentId: z.string().uuid(),
  sourcePlatform: z.enum(['manual','airbnb','booking','channel_manager','corporativo','direto','outro']).default('manual'),
  externalReference: z.string().max(180).optional(),
  guestName: z.string().max(180).optional(),
  guestCount: z.number().int().positive().max(100).optional(),
  checkInAt: z.string().datetime(),
  checkOutAt: z.string().datetime(),
  cleaningRequired: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
})

async function createTurnover(
  supabase: any,
  input: {
    apartmentId: string
    previousReservationId: string
    nextReservationId: string
    checkoutAt: string
    nextCheckinAt: string
  },
) {
  const gapMinutes = Math.floor((new Date(input.nextCheckinAt).getTime() - new Date(input.checkoutAt).getTime()) / 60000)
  const priority = gapMinutes < 180 ? 'urgente' : gapMinutes < 300 ? 'alta' : 'normal'

  const { data: template, error: templateError } = await supabase
    .from('marocas_checklist_templates')
    .select('id,items')
    .eq('apartment_id', input.apartmentId)
    .eq('service_type', 'limpeza')
    .eq('active', true)
    .maybeSingle()
  if (templateError) throw templateError

  const { data: existingTurnover, error: existingError } = await supabase
    .from('marocas_turnovers')
    .select('id,service_id')
    .eq('apartment_id', input.apartmentId)
    .eq('previous_reservation_id', input.previousReservationId)
    .eq('next_reservation_id', input.nextReservationId)
    .maybeSingle()
  if (existingError) throw existingError

  let turnover = existingTurnover
  if (!turnover) {
    const { data: insertedTurnover, error: insertError } = await supabase
      .from('marocas_turnovers')
      .insert({
        apartment_id: input.apartmentId,
        previous_reservation_id: input.previousReservationId,
        next_reservation_id: input.nextReservationId,
        checkout_at: input.checkoutAt,
        next_checkin_at: input.nextCheckinAt,
        priority,
      })
      .select('id,service_id')
      .single()

    if (insertError) {
      // Uma requisição concorrente pode ter criado o mesmo giro entre o SELECT e o INSERT.
      // Nesse caso, recupera a linha protegida pelo índice único parcial sem criar duplicidade.
      if (insertError.code !== '23505') throw insertError
      const { data: racedTurnover, error: racedError } = await supabase
        .from('marocas_turnovers')
        .select('id,service_id')
        .eq('apartment_id', input.apartmentId)
        .eq('previous_reservation_id', input.previousReservationId)
        .eq('next_reservation_id', input.nextReservationId)
        .single()
      if (racedError) throw racedError
      turnover = racedTurnover
    } else {
      turnover = insertedTurnover
    }
  }

  if (!turnover.service_id) {
    const { data: existingService, error: existingServiceError } = await supabase
      .from('marocas_services')
      .select('id')
      .eq('turnover_id', turnover.id)
      .maybeSingle()
    if (existingServiceError) throw existingServiceError

    let service = existingService
    if (!service) {
      const { data: insertedService, error: serviceError } = await supabase
        .from('marocas_services')
        .insert({
          apartment_id: input.apartmentId,
          reservation_id: input.previousReservationId,
          turnover_id: turnover.id,
          checklist_template_id: template?.id ?? null,
          service_type: 'limpeza',
          status: 'agendado',
          priority: priority === 'urgente' ? 'urgente' : priority === 'alta' ? 'alta' : 'media',
          scheduled_for: input.checkoutAt,
          scheduled_end_at: input.nextCheckinAt,
          checklist: Array.isArray(template?.items) ? template.items : [],
          notes: 'Serviço gerado automaticamente a partir de giro entre reservas.',
        })
        .select('id')
        .single()
      if (serviceError) throw serviceError
      service = insertedService
    }

    const { error: linkError } = await supabase
      .from('marocas_turnovers')
      .update({ service_id: service.id })
      .eq('id', turnover.id)
      .is('service_id', null)
    if (linkError) throw linkError
  }
}

export const createMarocasReservation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: z.input<typeof ReservationInput>) => ReservationInput.parse(value))
  .handler(async ({ context, data }) => {
    if (new Date(data.checkOutAt) <= new Date(data.checkInAt)) throw new Error('Check-out deve ser posterior ao check-in.')

    const { data: apartment, error: apartmentError } = await context.supabase
      .from('marocas_apartments')
      .select('id')
      .eq('id', data.apartmentId)
      .single()
    if (apartmentError || !apartment) throw apartmentError ?? new Error('Imóvel não encontrado.')

    const { data: overlaps, error: overlapError } = await context.supabase
      .from('marocas_reservations')
      .select('id')
      .eq('apartment_id', data.apartmentId)
      .neq('status', 'cancelada')
      .lt('check_in_at', data.checkOutAt)
      .gt('check_out_at', data.checkInAt)
      .limit(1)
    if (overlapError) throw overlapError
    if ((overlaps ?? []).length > 0) throw new Error('Existe uma reserva conflitante para este imóvel nesse período.')

    const { data: reservation, error } = await context.supabase
      .from('marocas_reservations')
      .insert({
        apartment_id: data.apartmentId,
        source_platform: data.sourcePlatform,
        external_reference: data.externalReference ?? null,
        guest_name: data.guestName ?? null,
        guest_count: data.guestCount ?? null,
        check_in_at: data.checkInAt,
        check_out_at: data.checkOutAt,
        cleaning_required: data.cleaningRequired,
        notes: data.notes ?? null,
      })
      .select('*')
      .single()
    if (error) throw error

    const [{ data: previous }, { data: next }] = await Promise.all([
      context.supabase
        .from('marocas_reservations')
        .select('id,check_out_at,cleaning_required')
        .eq('apartment_id', data.apartmentId)
        .neq('id', reservation.id)
        .neq('status', 'cancelada')
        .lte('check_out_at', data.checkInAt)
        .order('check_out_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from('marocas_reservations')
        .select('id,check_in_at')
        .eq('apartment_id', data.apartmentId)
        .neq('id', reservation.id)
        .neq('status', 'cancelada')
        .gte('check_in_at', data.checkOutAt)
        .order('check_in_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    if (previous?.id && previous.cleaning_required !== false) {
      await createTurnover(context.supabase, {
        apartmentId: data.apartmentId,
        previousReservationId: previous.id,
        nextReservationId: reservation.id,
        checkoutAt: previous.check_out_at,
        nextCheckinAt: reservation.check_in_at,
      })
    }

    if (next?.id && reservation.cleaning_required) {
      await createTurnover(context.supabase, {
        apartmentId: data.apartmentId,
        previousReservationId: reservation.id,
        nextReservationId: next.id,
        checkoutAt: reservation.check_out_at,
        nextCheckinAt: next.check_in_at,
      })
    }

    return { ok: true, reservationId: reservation.id }
  })
