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
          const sinceDay = since.slice(0, 10);
          const horizonEnd = new Date(Date.now() + 30 * 86400000).toISOString();
          const [statusRes, incRes, pmRes, mwRes, histRes, visRes] = await Promise.all([
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
            supabaseAdmin
              .from("v_core_uptime_daily" as any)
              .select("url,day,up_ratio,checks")
              .gte("day", sinceDay)
              .order("day", { ascending: true })
              .limit(20000),
            supabaseAdmin
              .from("uptime_state")
              .select("url,label,show_on_public,sort_order,paused,public_slug")
              .order("sort_order", { ascending: true }),
          ]);



          const status = (statusRes.data ?? []) as any[];
          const incidents = (incRes.data ?? []) as any[];
          const postmortems = (pmRes.data ?? []) as any[];
          const maintenance = (mwRes.data ?? []) as any[];
          const historyRows = (histRes.data ?? []) as any[];
          const visRows = (visRes.data ?? []) as any[];
          const visibility = new Map<string, { label: string | null; show: boolean; sort: number; paused: boolean; slug: string | null }>();
          for (const v of visRows) {
            visibility.set(v.url, {
              label: v.label ?? null,
              show: v.show_on_public !== false,
              sort: typeof v.sort_order === "number" ? v.sort_order : 100,
              paused: !!v.paused,
              slug: v.public_slug ?? null,
            });
          }


          // Build 90-day history per url, padding missing days with null
          const historyByUrl: Record<string, Map<string, number | null>> = {};
          for (const h of historyRows) {
            const url = h.url as string;
            const day = String(h.day).slice(0, 10);
            (historyByUrl[url] ||= new Map()).set(day, h.up_ratio == null ? null : Number(h.up_ratio));
          }

          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const days: string[] = [];
          for (let i = 89; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 86400000);
            days.push(d.toISOString().slice(0, 10));
          }
          const servicesWithHistory = status
            .filter((s) => {
              if (!s.url) return true;
              const v = visibility.get(s.url);
              if (!v) return true; // unknown URL: keep visible
              return v.show && !v.paused;
            })
            .map((s) => {
              const v = s.url ? visibility.get(s.url) : null;
              const map = (s.url && historyByUrl[s.url]) || null;
              const history = days.map((day) => ({
                day,
                up_ratio: map ? (map.has(day) ? map.get(day)! : null) : null,
              }));
              return {
                ...s,
                name: v?.label || s.name || s.url,
                slug: v?.slug ?? null,
                sort_order: v?.sort ?? 100,
                history,
              };
            })
            .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));



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
            services: servicesWithHistory,
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
