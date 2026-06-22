import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Agenda Resources & Configuration Cockpit — Fase 95.
 * Infraestrutura/configuração da Agenda: locais, salas, jornadas, turnos,
 * regras, plantões, bloqueios, disponibilidade/elegibilidade de profissionais,
 * settings e auditoria.
 */
export const getAgendaResourcesHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();
    const nowIso = new Date().toISOString();

    const [locRes, romRes, schRes, shfRes, ocRes, blkRes, rulRes, setRes, paRes, peRes, psRes, ptRes, alRes] = await Promise.all([
      supabaseAdmin.from("agenda_locations").select("id, company_id, city, state, timezone, is_active, created_at").limit(20000),
      supabaseAdmin.from("agenda_rooms").select("id, company_id, location_id, kind, capacity, is_active, created_at").limit(20000),
      supabaseAdmin.from("agenda_schedules").select("id, company_id, professional_id, weekday, is_active, created_at").limit(100000),
      supabaseAdmin.from("agenda_shifts").select("id, company_id, weekdays, is_active, created_at").limit(20000),
      supabaseAdmin.from("agenda_oncall_shifts").select("id, company_id, location_id, specialty, status, hourly_rate, flat_rate, assigned_professional_id, starts_at, ends_at, created_at").limit(50000),
      supabaseAdmin.from("agenda_blocks").select("id, company_id, professional_id, starts_at, ends_at, reason, created_at").limit(50000),
      supabaseAdmin.from("agenda_rules").select("id, company_id, kind, version, is_active, created_at").limit(10000),
      supabaseAdmin.from("agenda_settings").select("id, company_id, key, created_at, updated_at").limit(10000),
      supabaseAdmin.from("agenda_professional_availability").select("id, company_id, professional_id, accepts_walkin, accepts_oncall, accepts_emergency, accepts_substitution, accepts_in_person, accepts_telehealth, accepts_home, travel_radius_km").limit(50000),
      supabaseAdmin.from("agenda_professional_eligibility").select("id, company_id, professional_id, service_id, priority, performance_score, no_show_rate, is_active").limit(100000),
      supabaseAdmin.from("agenda_professional_services").select("id, company_id, professional_id, service_id, created_at").limit(100000),
      supabaseAdmin.from("agenda_professional_terms").select("id, company_id, professional_id, terms_version, accepted_at, created_at").limit(50000),
      supabaseAdmin.from("agenda_audit_log").select("id, company_id, actor_id, action, entity, created_at").gte("created_at", sinceIso).limit(100000),
    ]);

    const err = locRes.error || romRes.error || schRes.error || shfRes.error || ocRes.error || blkRes.error || rulRes.error || setRes.error || paRes.error || peRes.error || psRes.error || ptRes.error || alRes.error;
    if (err) throw new Error(err.message);

    const loc = locRes.data ?? [];
    const rom = romRes.data ?? [];
    const sch = schRes.data ?? [];
    const shf = shfRes.data ?? [];
    const oc = ocRes.data ?? [];
    const blk = blkRes.data ?? [];
    const rul = rulRes.data ?? [];
    const set = setRes.data ?? [];
    const pa = paRes.data ?? [];
    const pe = peRes.data ?? [];
    const ps = psRes.data ?? [];
    const pt = ptRes.data ?? [];
    const al = alRes.data ?? [];

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m = new Map<string, number>();
      for (const r of rows) { const k = (key(r) ?? "—") as string; m.set(k, (m.get(k) ?? 0) + 1); }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };

    // Locations
    const locActive = loc.filter((r: any) => r.is_active).length;
    const locByState = countBy(loc, (r: any) => r.state).slice(0, 10);
    const locByCity = countBy(loc, (r: any) => r.city).slice(0, 10);
    const locByTz = countBy(loc, (r: any) => r.timezone);

    // Rooms
    const romActive = rom.filter((r: any) => r.is_active).length;
    const romByKind = countBy(rom, (r: any) => r.kind);
    const romCap = rom.reduce((s: number, r: any) => s + (Number(r.capacity) || 0), 0);

    // Schedules
    const schActive = sch.filter((r: any) => r.is_active).length;
    const profsComJornada = new Set(sch.map((r: any) => r.professional_id).filter(Boolean)).size;
    const schByWeekday = countBy(sch, (r: any) => String(r.weekday ?? ""));

    // Shifts
    const shfActive = shf.filter((r: any) => r.is_active).length;

    // On-call
    const ocByStatus = countBy(oc, (r: any) => r.status);
    const ocBySpec = countBy(oc, (r: any) => r.specialty).slice(0, 10);
    const ocUpcoming = oc.filter((r: any) => r.starts_at && r.starts_at >= nowIso).length;
    const ocOpenAssign = oc.filter((r: any) => !r.assigned_professional_id).length;
    const ocHourlyAvg = (() => {
      const v = oc.map((r: any) => Number(r.hourly_rate) || 0).filter((n: number) => n > 0);
      return v.length > 0 ? v.reduce((s: number, n: number) => s + n, 0) / v.length : 0;
    })();
    const ocFlatTotal = oc.reduce((s: number, r: any) => s + (Number(r.flat_rate) || 0), 0);

    // Blocks
    const blkPeriodo = blk.filter((r: any) => r.created_at >= sinceIso).length;
    const blkAtivos = blk.filter((r: any) => r.ends_at && r.ends_at >= nowIso).length;
    const blkByReason = countBy(blk, (r: any) => r.reason).slice(0, 10);

    // Rules
    const rulActive = rul.filter((r: any) => r.is_active).length;
    const rulByKind = countBy(rul, (r: any) => r.kind);

    // Settings
    const setByKey = countBy(set, (r: any) => r.key).slice(0, 10);

    // Professional availability
    const paWalkin = pa.filter((r: any) => r.accepts_walkin).length;
    const paOncall = pa.filter((r: any) => r.accepts_oncall).length;
    const paEmergency = pa.filter((r: any) => r.accepts_emergency).length;
    const paSub = pa.filter((r: any) => r.accepts_substitution).length;
    const paPerson = pa.filter((r: any) => r.accepts_in_person).length;
    const paTele = pa.filter((r: any) => r.accepts_telehealth).length;
    const paHome = pa.filter((r: any) => r.accepts_home).length;
    const paRadius = (() => {
      const v = pa.map((r: any) => Number(r.travel_radius_km) || 0).filter((n: number) => n > 0);
      return v.length > 0 ? v.reduce((s: number, n: number) => s + n, 0) / v.length : 0;
    })();

    // Eligibility
    const peActive = pe.filter((r: any) => r.is_active).length;
    const peAvgPerf = (() => {
      const v = pe.map((r: any) => Number(r.performance_score) || 0).filter((n: number) => n > 0);
      return v.length > 0 ? v.reduce((s: number, n: number) => s + n, 0) / v.length : 0;
    })();
    const peAvgNoShow = (() => {
      const v = pe.map((r: any) => Number(r.no_show_rate) || 0).filter((n: number) => n >= 0);
      return v.length > 0 ? v.reduce((s: number, n: number) => s + n, 0) / v.length : 0;
    })();

    // Services per professional
    const psPerProf = (() => {
      const m = new Map<string, number>();
      for (const r of ps) { const k = String((r as any).professional_id ?? ""); if (!k) continue; m.set(k, (m.get(k) ?? 0) + 1); }
      const arr = Array.from(m.values());
      return arr.length > 0 ? arr.reduce((s: number, n: number) => s + n, 0) / arr.length : 0;
    })();

    // Terms
    const ptAccepted = pt.filter((r: any) => r.accepted_at).length;
    const ptByVersion = countBy(pt, (r: any) => r.terms_version);

    // Audit
    const alByAction = countBy(al, (r: any) => r.action).slice(0, 10);
    const alByEntity = countBy(al, (r: any) => r.entity).slice(0, 10);
    const alAtores = new Set(al.map((r: any) => r.actor_id).filter(Boolean)).size;

    return {
      days: data.days,
      locations: { total: loc.length, active: locActive, byState: locByState, byCity: locByCity, byTz: locByTz },
      rooms: { total: rom.length, active: romActive, totalCapacity: romCap, byKind: romByKind },
      schedules: { total: sch.length, active: schActive, profsWithSchedule: profsComJornada, byWeekday: schByWeekday },
      shifts: { total: shf.length, active: shfActive },
      oncall: { total: oc.length, upcoming: ocUpcoming, openAssignment: ocOpenAssign, hourlyAvg: ocHourlyAvg, flatTotal: ocFlatTotal, byStatus: ocByStatus, bySpecialty: ocBySpec },
      blocks: { total: blk.length, novoNoPeriodo: blkPeriodo, ativos: blkAtivos, byReason: blkByReason },
      rules: { total: rul.length, active: rulActive, byKind: rulByKind },
      settings: { total: set.length, byKey: setByKey },
      availability: {
        total: pa.length, walkin: paWalkin, oncall: paOncall, emergency: paEmergency, substitution: paSub,
        inPerson: paPerson, telehealth: paTele, home: paHome, avgRadiusKm: paRadius,
      },
      eligibility: { total: pe.length, active: peActive, avgPerformance: peAvgPerf, avgNoShowRate: peAvgNoShow },
      services: { total: ps.length, avgServicesPerProfessional: psPerProf },
      terms: { total: pt.length, accepted: ptAccepted, byVersion: ptByVersion },
      audit: { total: al.length, atores: alAtores, byAction: alByAction, byEntity: alByEntity },
    };
  });
