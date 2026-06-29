import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public per-service Status detail: 90d history, incidents and maintenance for one URL.
 */
export const Route = createFileRoute("/api/public/status/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const slug = String(params.slug ?? "").toLowerCase();
          if (!slug) return new Response("not found", { status: 404 });

          const stRes = await supabaseAdmin
            .from("uptime_state")
            .select("url,label,public_slug,show_on_public,paused")
            .eq("public_slug", slug)
            .maybeSingle();

          const target = stRes.data as any;
          if (!target || target.show_on_public === false) {
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "content-type": "application/json" },
            });
          }

          const url = target.url as string;
          const since = new Date(Date.now() - 90 * 86400000).toISOString();
          const sinceDay = since.slice(0, 10);
          const horizonEnd = new Date(Date.now() + 30 * 86400000).toISOString();

          const [sloRes, histRes, incRes, mwRes] = await Promise.all([
            supabaseAdmin
              .from("v_core_slo_status" as any)
              .select("currently_up,availability_bps_30d,latency_p95_ms_30d,last_check_at")
              .eq("url", url)
              .maybeSingle(),
            supabaseAdmin
              .from("v_core_uptime_daily" as any)
              .select("day,up_ratio,checks")
              .eq("url", url)
              .gte("day", sinceDay)
              .order("day", { ascending: true }),
            supabaseAdmin
              .from("core_incidents")
              .select("id,severity,status,title,detected_at,resolved_at,postmortem_summary,postmortem_published_at")
              .eq("url", url)
              .gte("detected_at", since)
              .order("detected_at", { ascending: false })
              .limit(50),
            supabaseAdmin
              .from("core_maintenance_windows")
              .select("id,title,description,severity,starts_at,ends_at,status")
              .eq("published", true)
              .eq("url", url)
              .in("status", ["scheduled", "in_progress"])
              .lte("starts_at", horizonEnd)
              .gte("ends_at", new Date().toISOString())
              .order("starts_at", { ascending: true }),
          ]);

          const histMap = new Map<string, number | null>();
          for (const h of (histRes.data ?? []) as any[]) {
            histMap.set(String(h.day).slice(0, 10), h.up_ratio == null ? null : Number(h.up_ratio));
          }
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const days: Array<{ day: string; up_ratio: number | null }> = [];
          for (let i = 89; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
            days.push({ day: d, up_ratio: histMap.has(d) ? histMap.get(d)! : null });
          }

          const incidents = (incRes.data ?? []) as any[];
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

          const body = {
            service: {
              name: target.label || url,
              url,
              slug,
              currently_up: (sloRes.data as any)?.currently_up ?? null,
              availability_bps_30d: (sloRes.data as any)?.availability_bps_30d ?? null,
              latency_p95_ms_30d: (sloRes.data as any)?.latency_p95_ms_30d ?? null,
              last_check_at: (sloRes.data as any)?.last_check_at ?? null,
            },
            history: days,
            incidents: incidents.map((i) => ({ ...i, updates: updatesByIncident[i.id] ?? [] })),
            maintenance: mwRes.data ?? [],
            updated_at: new Date().toISOString(),
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
            JSON.stringify({ error: err?.message ?? "status_unavailable" }),
            { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } },
          );
        }
      },
    },
  },
});
