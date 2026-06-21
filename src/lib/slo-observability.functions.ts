// Fase 9 — Observabilidade & SLO do core Impulsionando.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchSloDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async ({ context }) => {
    const supa = context.supabase as any;
    const [status, incidents, targets] = await Promise.all([
      supa.from("v_core_slo_status").select("*").order("currently_up", { ascending: true }),
      supa.from("core_incidents").select("id, scope, url, severity, status, title, detected_at, resolved_at, event_count, source").order("detected_at", { ascending: false }).limit(50),
      supa.from("core_slo_targets").select("id, scope, url, name, availability_target_bps, latency_p95_target_ms, window_days, active").eq("active", true),
    ]);
    const rows = (status.data ?? []) as any[];
    const inc = (incidents.data ?? []) as any[];
    return {
      summary: {
        monitored: rows.length,
        down: rows.filter((r) => r.currently_up === false).length,
        openIncidents: inc.filter((i) => i.status !== "resolved").length,
        sev1Open: inc.filter((i) => i.status !== "resolved" && i.severity === "sev1").length,
      },
      status: rows,
      incidents: inc,
      targets: (targets.data ?? []) as any[],
    };
  });

export const resolveIncidentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { error } = await supa.from("core_incidents").update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      postmortem: data.note ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
