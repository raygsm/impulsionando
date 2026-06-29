import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(d: string | Date): string {
  return new Date(d).toUTCString();
}

/**
 * Per-service RSS feed: incidents, timeline updates, postmortems and maintenance
 * windows for a single uptime target identified by public_slug.
 */
export const Route = createFileRoute("/api/public/status/$slug/rss")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const slug = String(params.slug ?? "").toLowerCase();
        if (!slug) return new Response("not found", { status: 404 });

        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;

        const stRes = await supabaseAdmin
          .from("uptime_state")
          .select("url,label,public_slug,show_on_public")
          .eq("public_slug", slug)
          .maybeSingle();

        const target = stRes.data as any;
        if (!target || target.show_on_public === false) {
          return new Response("not found", { status: 404 });
        }

        const serviceUrl = target.url as string;
        const serviceName = (target.label as string) || serviceUrl;
        const since = new Date(Date.now() - 90 * 86400000).toISOString();
        const horizonEnd = new Date(Date.now() + 30 * 86400000).toISOString();

        const [incRes, mwRes] = await Promise.all([
          supabaseAdmin
            .from("core_incidents")
            .select("id,title,severity,status,detected_at,resolved_at,postmortem_summary,postmortem_published_at")
            .eq("url", serviceUrl)
            .gte("detected_at", since)
            .order("detected_at", { ascending: false })
            .limit(50),
          supabaseAdmin
            .from("core_maintenance_windows")
            .select("id,title,description,severity,starts_at,ends_at,status,published")
            .eq("published", true)
            .eq("url", serviceUrl)
            .lte("starts_at", horizonEnd)
            .order("starts_at", { ascending: false })
            .limit(50),
        ]);

        const incidents = (incRes.data ?? []) as any[];
        const incidentIds = incidents.map((i) => i.id);
        let updatesByIncident: Record<string, any[]> = {};
        if (incidentIds.length > 0) {
          const upRes = await supabaseAdmin
            .from("core_incident_updates" as any)
            .select("id,incident_id,status,body,created_at")
            .in("incident_id", incidentIds)
            .order("created_at", { ascending: false })
            .limit(500);
          for (const u of (upRes.data ?? []) as any[]) {
            (updatesByIncident[u.incident_id] ||= []).push(u);
          }
        }

        type Item = {
          guid: string;
          title: string;
          link: string;
          pubDate: string;
          description: string;
          category: string;
        };
        const items: Item[] = [];
        const serviceLink = `${origin}/status/${slug}`;

        for (const i of incidents) {
          const statusLabel = i.resolved_at ? "Resolvido" : (i.status ?? "Em andamento");
          items.push({
            guid: `incident:${i.id}:${i.resolved_at ?? i.detected_at}`,
            title: `[${String(i.severity ?? "sev?").toUpperCase()}] ${i.title} — ${statusLabel}`,
            link: `${serviceLink}#incident-${i.id}`,
            pubDate: rfc822(i.resolved_at ?? i.detected_at),
            description: `Serviço: ${serviceName}`,
            category: "incident",
          });
          for (const u of updatesByIncident[i.id] ?? []) {
            items.push({
              guid: `update:${u.id}`,
              title: `Atualização [${String(u.status ?? "info").toUpperCase()}] — ${i.title}`,
              link: `${serviceLink}#incident-${i.id}`,
              pubDate: rfc822(u.created_at),
              description: String(u.body ?? ""),
              category: "incident-update",
            });
          }
          if (i.postmortem_published_at) {
            items.push({
              guid: `postmortem:${i.id}:${i.postmortem_published_at}`,
              title: `Postmortem: ${i.title}`,
              link: `${serviceLink}#incident-${i.id}`,
              pubDate: rfc822(i.postmortem_published_at),
              description: String(i.postmortem_summary ?? ""),
              category: "postmortem",
            });
          }
        }

        for (const m of (mwRes.data ?? []) as any[]) {
          items.push({
            guid: `maintenance:${m.id}:${m.status}`,
            title: `Manutenção [${String(m.severity ?? "info").toUpperCase()}] ${m.title} — ${m.status}`,
            link: `${serviceLink}#maintenance-${m.id}`,
            pubDate: rfc822(m.starts_at),
            description: [
              `Janela: ${m.starts_at} → ${m.ends_at}`,
              m.description ?? "",
            ]
              .filter(Boolean)
              .join("\n\n"),
            category: "maintenance",
          });
        }

        items.sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate));
        const lastBuild = rfc822(items[0]?.pubDate ?? new Date());

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(`Impulsionando — Status: ${serviceName}`)}</title>
<link>${serviceLink}</link>
<atom:link href="${origin}/api/public/status/${slug}/rss" rel="self" type="application/rss+xml" />
<description>${escapeXml(`Incidentes, atualizações e manutenções de ${serviceName}.`)}</description>
<language>pt-BR</language>
<lastBuildDate>${lastBuild}</lastBuildDate>
${items
  .map(
    (it) => `<item>
<title>${escapeXml(it.title)}</title>
<link>${escapeXml(it.link)}</link>
<guid isPermaLink="false">${escapeXml(it.guid)}</guid>
<pubDate>${it.pubDate}</pubDate>
<category>${it.category}</category>
<description>${escapeXml(it.description)}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=60, s-maxage=60",
          },
        });
      },
    },
  },
});
