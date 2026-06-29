import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public Status endpoint — agrega uptime/SLO + postmortems publicados.
 *
 * Não retorna PII. Consome:
 *  - v_core_slo_status  (uptime/p95 por scope/url)
 *  - core_incidents     (incidentes 90d; postmortems publicados)
 *
 * Cache 60s no edge para suportar tráfego público.
 */
export const Route = createFileRoute("/api/public/status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const since = new Date(Date.now() - 90 * 86400000).toISOString();
          const horizonEnd = new Date(Date.now() + 30 * 86400000).toISOString();
          const [statusRes, incRes, pmRes, mwRes] = await Promise.all([
            supabaseAdmin
              .from("v_core_slo_status" as any)
              .select(
                "scope,url,name,currently_up,availability_bps_30d,latency_p95_ms_30d,last_check_at",
              )
              .order("currently_up", { ascending: true })
              .limit(100),
            supabaseAdmin
              .from("core_incidents")
              .select("id,scope,url,severity,status,title,detected_at,resolved_at")
              .gte("detected_at", since)
              .order("detected_at", { ascending: false })
              .limit(50),
            supabaseAdmin
              .from("core_incidents")
              .select(
                "id,scope,url,severity,title,detected_at,resolved_at,postmortem_summary,postmortem_lessons,postmortem_published_at",
              )
              .eq("status", "resolved")
              .not("postmortem_published_at", "is", null)
              .gte("postmortem_published_at", since)
              .order("postmortem_published_at", { ascending: false })
              .limit(20),
            supabaseAdmin
              .from("core_maintenance_windows")
              .select("id,title,description,scope,url,severity,starts_at,ends_at,status")
              .eq("published", true)
              .in("status", ["scheduled", "in_progress"])
              .lte("starts_at", horizonEnd)
              .gte("ends_at", new Date().toISOString())
              .order("starts_at", { ascending: true })
              .limit(20),
          ]);

          const status = (statusRes.data ?? []) as any[];
          const incidents = (incRes.data ?? []) as any[];
          const postmortems = (pmRes.data ?? []) as any[];
          const maintenance = (mwRes.data ?? []) as any[];

          // Fetch updates for open incidents (last 90d)
          const openIds = incidents.filter((i) => i.status !== "resolved").map((i) => i.id);
          let updatesByIncident: Record<string, any[]> = {};
          if (openIds.length > 0) {
            const upRes = await supabaseAdmin
              .from("core_incident_updates" as any)
              .select("id,incident_id,status,body,created_at")
              .in("incident_id", openIds)
              .order("created_at", { ascending: false })
              .limit(200);
            for (const u of (upRes.data ?? []) as any[]) {
              (updatesByIncident[u.incident_id] ||= []).push(u);
            }
          }
          const incidentsWithUpdates = incidents.map((i) => ({
            ...i,
            updates: updatesByIncident[i.id] ?? [],
          }));

          const monitored = status.length;
          const up = status.filter((r) => r.currently_up !== false).length;
          const down = status.filter((r) => r.currently_up === false).length;
          const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
          const sev1Open = incidents.filter(
            (i) => i.status !== "resolved" && i.severity === "sev1",
          ).length;
          const inMaintenance = maintenance.filter((m) => m.status === "in_progress").length;

          let overall: "operational" | "degraded" | "outage" | "maintenance" = "operational";
          if (sev1Open > 0 || down >= Math.max(2, Math.ceil(monitored * 0.2))) overall = "outage";
          else if (openIncidents > 0 || down > 0) overall = "degraded";
          else if (inMaintenance > 0) overall = "maintenance";

          const body = {
            overall,
            updated_at: new Date().toISOString(),
            summary: { monitored, up, down, openIncidents, sev1Open, maintenance: inMaintenance },
            services: status,
            incidents: incidentsWithUpdates,
            postmortems,
            maintenance,
          };


          return new Response(JSON.stringify(body), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
            },
          });
        } catch (err: any) {
          return new Response(
            JSON.stringify({ overall: "unknown", error: err?.message ?? "status_unavailable" }),
            {
              status: 200,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            },
          );
        }
      },
    },
  },
});
