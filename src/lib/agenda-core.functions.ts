/**
 * Módulo CORE — Agenda Inteligente / Plantões / Pega-Horário
 *
 * Server functions universais, isoladas por empresa (RLS).
 * Toda regra vem de `agenda_rules` / `agenda_settings` — zero hardcode por nicho.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ----------- Helpers de payload -----------
const uuid = z.string().uuid();

// ===================== LOCAIS / SALAS / TURNOS =====================

export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: uuid }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("agenda_locations")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw error;
    return rows ?? [];
  });

export const upsertLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: uuid.optional(),
        companyId: uuid,
        name: z.string().min(1).max(120),
        address: z.string().max(300).optional().nullable(),
        city: z.string().max(120).optional().nullable(),
        state: z.string().max(60).optional().nullable(),
        zip: z.string().max(20).optional().nullable(),
        timezone: z.string().max(60).default("America/Sao_Paulo"),
        isActive: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      id: data.id,
      company_id: data.companyId,
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zip: data.zip ?? null,
      timezone: data.timezone,
      is_active: data.isActive,
    };
    const { data: row, error } = await context.supabase
      .from("agenda_locations")
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const upsertRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: uuid.optional(),
        companyId: uuid,
        locationId: uuid.nullable().optional(),
        name: z.string().min(1).max(120),
        kind: z.string().max(40).default("room"),
        capacity: z.number().int().min(1).max(500).default(1),
        isActive: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("agenda_rooms")
      .upsert({
        id: data.id,
        company_id: data.companyId,
        location_id: data.locationId ?? null,
        name: data.name,
        kind: data.kind,
        capacity: data.capacity,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ===================== PLANTÕES =====================

export const createOncallShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        companyId: uuid,
        locationId: uuid.nullable().optional(),
        roomId: uuid.nullable().optional(),
        serviceId: uuid.nullable().optional(),
        specialty: z.string().max(80).nullable().optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        flatRate: z.number().nullable().optional(),
        hourlyRate: z.number().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("agenda_oncall_shifts")
      .insert({
        company_id: data.companyId,
        location_id: data.locationId ?? null,
        room_id: data.roomId ?? null,
        service_id: data.serviceId ?? null,
        specialty: data.specialty ?? null,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        flat_rate: data.flatRate ?? null,
        hourly_rate: data.hourlyRate ?? null,
        status: "open",
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ===================== REGRAS & SETTINGS =====================

export const getRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; kind?: string }) =>
    z
      .object({ companyId: uuid, kind: z.string().optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("agenda_rules")
      .select("*")
      .eq("company_id", data.companyId)
      .eq("is_active", true);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const upsertRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: uuid.optional(),
        companyId: uuid,
        kind: z.enum([
          "no_show_customer",
          "no_show_professional",
          "cancellation",
          "rescheduling",
          "substitution",
          "distribution",
          "reminder",
          "payment",
        ]),
        rule: z.record(z.string(), z.unknown()),
        scopeServiceId: uuid.nullable().optional(),
        scopeSpecialty: z.string().nullable().optional(),
        scopePlan: z.string().nullable().optional(),
        isActive: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("agenda_rules")
      .upsert({
        id: data.id,
        company_id: data.companyId,
        kind: data.kind,
        rule: data.rule as never,
        scope_service_id: data.scopeServiceId ?? null,
        scope_specialty: data.scopeSpecialty ?? null,
        scope_plan: data.scopePlan ?? null,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: uuid }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("agenda_settings")
      .select("*")
      .eq("company_id", data.companyId);
    if (error) throw error;
    return rows ?? [];
  });

export const setSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        companyId: uuid,
        key: z.string().min(1).max(80),
        value: z.unknown(),
        description: z.string().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("agenda_settings")
      .upsert(
        {
          company_id: data.companyId,
          key: data.key,
          value: data.value as never,
          description: data.description ?? null,
        },
        { onConflict: "company_id,key" },
      )
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ===================== PEGA HORÁRIO =====================

/**
 * Abre uma vaga e dispara ofertas para profissionais elegíveis (primeira onda).
 * A elegibilidade é calculada por (especialidade, serviço, location) + disponibilidade.
 * Não envia notificação aqui — apenas insere oferta; o canal notifica via realtime + outbox.
 */
export const openSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        companyId: uuid,
        origin: z.enum([
          "cancellation",
          "no_show",
          "oncall",
          "walkin",
          "manual",
          "substitution",
          "emergency",
        ]),
        appointmentId: uuid.nullable().optional(),
        oncallShiftId: uuid.nullable().optional(),
        serviceId: uuid.nullable().optional(),
        specialty: z.string().nullable().optional(),
        locationId: uuid.nullable().optional(),
        roomId: uuid.nullable().optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        payoutAmount: z.number().nullable().optional(),
        expiresInSeconds: z.number().int().min(60).max(86400).default(900),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Cria a vaga
    const { data: slot, error: slotErr } = await supabase
      .from("agenda_open_slots")
      .insert({
        company_id: data.companyId,
        origin: data.origin,
        appointment_id: data.appointmentId ?? null,
        oncall_shift_id: data.oncallShiftId ?? null,
        service_id: data.serviceId ?? null,
        specialty: data.specialty ?? null,
        location_id: data.locationId ?? null,
        room_id: data.roomId ?? null,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        payout_amount: data.payoutAmount ?? null,
        status: "open",
        current_wave: 1,
        expires_at: new Date(Date.now() + data.expiresInSeconds * 1000).toISOString(),
        created_by: userId,
      })
      .select()
      .single();
    if (slotErr) throw slotErr;

    // 2. Busca profissionais elegíveis (ordenados por prioridade)
    let q = supabase
      .from("agenda_professional_eligibility")
      .select("professional_id, priority")
      .eq("company_id", data.companyId)
      .eq("is_active", true);
    if (data.serviceId) q = q.or(`service_id.eq.${data.serviceId},service_id.is.null`);
    if (data.specialty) q = q.or(`specialty.eq.${data.specialty},specialty.is.null`);
    if (data.locationId) q = q.or(`location_id.eq.${data.locationId},location_id.is.null`);

    const { data: eligibles, error: elErr } = await q.order("priority");
    if (elErr) throw elErr;

    const profIds = Array.from(new Set((eligibles ?? []).map((e) => e.professional_id)));

    // 3. Dispara ofertas (onda 1)
    if (profIds.length > 0) {
      const offers = profIds.map((pid) => ({
        company_id: data.companyId,
        open_slot_id: slot.id,
        professional_id: pid,
        wave: 1,
        status: "sent" as const,
        expires_at: new Date(Date.now() + data.expiresInSeconds * 1000).toISOString(),
      }));
      const { error: offerErr } = await supabase
        .from("agenda_slot_offers")
        .insert(offers);
      if (offerErr) throw offerErr;
    }

    return { slot, offeredTo: profIds.length };
  });

/**
 * Aceite atômico do horário pelo profissional. Só 1 pode ganhar.
 */
export const claimSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slotId: uuid,
        professionalId: uuid,
        ip: z.string().nullable().optional(),
        userAgent: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc("agenda_claim_open_slot", {
      _slot_id: data.slotId,
      _professional_id: data.professionalId,
      _ip: data.ip ?? undefined,
      _user_agent: data.userAgent ?? undefined,
    });
    if (error) throw error;
    return row;
  });

/**
 * Profissional declina a oferta.
 */
export const declineSlotOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        offerId: uuid,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agenda_slot_offers")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", data.offerId);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Lista as ofertas ativas para o usuário atual (profissional).
 */
export const listMyOpenOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agenda_slot_offers")
      .select(`
        id, status, wave, sent_at, expires_at,
        slot:agenda_open_slots(
          id, company_id, origin, starts_at, ends_at, specialty, service_id, location_id, payout_amount, status
        ),
        professional:agenda_professionals!inner(id, name, user_id)
      `)
      .eq("status", "sent")
      .eq("professional.user_id", context.userId)
      .order("sent_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ===================== AGENDAMENTOS / NO-SHOW =====================

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        appointmentId: uuid,
        reason: z.string().max(500).optional(),
        reopenSlot: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: appt, error: aErr } = await context.supabase
      .from("agenda_appointments")
      .select("*")
      .eq("id", data.appointmentId)
      .single();
    if (aErr) throw aErr;

    const { error: uErr } = await context.supabase
      .from("agenda_appointments")
      .update({
        status: "cancelled",
        cancel_reason: data.reason ?? null,
        cancelled_at: new Date().toISOString(),
        cancelled_by: context.userId,
      })
      .eq("id", data.appointmentId);
    if (uErr) throw uErr;

    let openedSlotId: string | null = null;
    if (data.reopenSlot && appt) {
      const { data: slot } = await context.supabase
        .from("agenda_open_slots")
        .insert({
          company_id: appt.company_id,
          origin: "cancellation",
          appointment_id: appt.id,
          service_id: appt.service_id,
          starts_at: appt.starts_at,
          ends_at: appt.ends_at,
          status: "open",
          current_wave: 1,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          created_by: context.userId,
        })
        .select("id")
        .single();
      openedSlotId = slot?.id ?? null;
    }

    return { ok: true, openedSlotId };
  });

export const registerNoShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        appointmentId: uuid,
        kind: z.enum(["customer", "professional"]),
        reason: z.string().max(500).optional(),
        chargedAmount: z.number().min(0).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: appt, error: aErr } = await context.supabase
      .from("agenda_appointments")
      .select("*")
      .eq("id", data.appointmentId)
      .single();
    if (aErr) throw aErr;

    await context.supabase
      .from("agenda_appointments")
      .update({ status: "no_show" })
      .eq("id", data.appointmentId);

    const { data: ev, error: eErr } = await context.supabase
      .from("agenda_no_show_events")
      .insert({
        company_id: appt.company_id,
        kind: data.kind,
        appointment_id: appt.id,
        customer_id: appt.customer_id,
        professional_id: appt.professional_id,
        reason: data.reason ?? null,
        charged_amount: data.chargedAmount,
        created_by: context.userId,
      })
      .select()
      .single();
    if (eErr) throw eErr;

    // No-show do profissional: abre vaga emergencial para substituição
    if (data.kind === "professional") {
      await context.supabase.from("agenda_open_slots").insert({
        company_id: appt.company_id,
        origin: "no_show",
        appointment_id: appt.id,
        service_id: appt.service_id,
        starts_at: appt.starts_at,
        ends_at: appt.ends_at,
        status: "open",
        current_wave: 1,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_by: context.userId,
      });
    }

    return ev;
  });

export const confirmAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ appointmentId: uuid }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agenda_appointments")
      .update({ status: "confirmed" })
      .eq("id", data.appointmentId);
    if (error) throw error;
    return { ok: true };
  });

// ===================== CLIENTE (autoatendimento) =====================

export const listMyAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: customers } = await sb
      .from("customers")
      .select("id, company_id")
      .eq("patient_user_id", context.userId);
    const ids = (customers ?? []).map((c) => c.id);
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from("agenda_appointments")
      .select("id, company_id, starts_at, ends_at, status, service_id, professional_id, location_id, customer_id, notes")
      .in("customer_id", ids)
      .gte("starts_at", new Date(Date.now() - 7 * 86400_000).toISOString())
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });



export const startService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ appointmentId: uuid }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agenda_appointments")
      .update({ status: "in_progress" })
      .eq("id", data.appointmentId);
    if (error) throw error;
    return { ok: true };
  });

export const finishService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        appointmentId: uuid,
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agenda_appointments")
      .update({
        status: "completed",
        notes: data.notes ?? null,
      })
      .eq("id", data.appointmentId);
    if (error) throw error;
    return { ok: true };
  });

// ===================== DASHBOARD =====================

export const dashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; days?: number }) =>
    z
      .object({ companyId: uuid, days: z.number().int().min(1).max(365).default(30) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const sb = context.supabase;

    const [{ count: scheduled }, { count: noShows }, { count: cancelled }, { count: completed }, { count: openSlots }] =
      await Promise.all([
        sb.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).gte("starts_at", since).in("status", ["scheduled", "confirmed", "checked_in", "in_progress"]),
        sb.from("agenda_no_show_events").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).gte("created_at", since),
        sb.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).gte("starts_at", since).eq("status", "cancelled"),
        sb.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).gte("starts_at", since).eq("status", "completed"),
        sb.from("agenda_open_slots").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).eq("status", "open"),
      ]);

    return {
      scheduled: scheduled ?? 0,
      noShows: noShows ?? 0,
      cancelled: cancelled ?? 0,
      completed: completed ?? 0,
      openSlots: openSlots ?? 0,
    };
  });

// ===================== INSTALAÇÃO POR EMPRESA =====================

/**
 * Instala o módulo Agenda Inteligente em uma empresa — semeia regras default e settings.
 * Idempotente: pode rodar várias vezes sem duplicar.
 */
export const installAgendaModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ companyId: uuid }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    // Default rules (idempotente via on key+kind)
    const defaults = [
      {
        kind: "no_show_customer" as const,
        rule: {
          tolerance_minutes: 15,
          confirmation_required: true,
          reminder_offsets_minutes: [1440, 120],
          policy: "charge_partial",
          partial_pct: 50,
          block_after_strikes: 3,
        },
      },
      {
        kind: "no_show_professional" as const,
        rule: {
          max_late_minutes: 10,
          auto_replace: true,
          replacement_window_minutes: 15,
          priority_loss_days: 7,
        },
      },
      {
        kind: "cancellation" as const,
        rule: {
          min_hours_no_cost: 24,
          partial_refund_pct: 50,
          max_reschedules: 3,
        },
      },
      {
        kind: "distribution" as const,
        rule: {
          waves: [
            { filter: "preferred", wait_seconds: 120 },
            { filter: "same_specialty_same_location", wait_seconds: 180 },
            { filter: "same_specialty", wait_seconds: 300 },
            { filter: "all_active", wait_seconds: 600 },
          ],
        },
      },
      {
        kind: "reminder" as const,
        rule: {
          channels: ["whatsapp", "email", "push"],
          offsets_minutes: [1440, 120],
        },
      },
      {
        kind: "payment" as const,
        rule: {
          provider: "mercado_pago",
          require_prepayment_for: [],
          accept_pix: true,
          accept_card: true,
          accept_on_site: true,
        },
      },
    ];

    for (const d of defaults) {
      const { data: existing } = await sb
        .from("agenda_rules")
        .select("id")
        .eq("company_id", data.companyId)
        .eq("kind", d.kind)
        .eq("version", 1)
        .maybeSingle();
      if (!existing) {
        await sb.from("agenda_rules").insert({
          company_id: data.companyId,
          kind: d.kind,
          version: 1,
          rule: d.rule,
          is_active: true,
        });
      }
    }

    // Defaults de settings
    const settings = [
      { key: "module.enabled", value: true },
      {
        key: "agenda.types_enabled",
        value: [
          "individual",
          "shared",
          "by_professional",
          "by_room",
          "by_unit",
          "by_specialty",
          "by_service",
          "by_team",
          "oncall",
          "shift",
          "schedule",
          "telehealth",
          "in_person",
          "home",
          "hybrid",
        ],
      },
      { key: "agenda.brand_name", value: "Agenda Inteligente" },
      { key: "agenda.dashboards_active", value: ["occupancy", "no_show", "open_slots", "revenue"] },
    ];
    for (const s of settings) {
      await sb
        .from("agenda_settings")
        .upsert(
          { company_id: data.companyId, key: s.key, value: s.value as never },
          { onConflict: "company_id,key" },
        );
    }

    return { ok: true, installedAt: new Date().toISOString() };
  });
