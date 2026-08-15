import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PUBLIC_SETS = new Set([
  "br_states",
  "person_document_types",
  "company_document_types",
  "business_segments",
  "lead_sources",
  "communication_channels",
  "health_modalities",
  "chrismed_event_types",
  "wmp_event_types",
  "wmp_partner_categories",
  "wmp_equipment_categories",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

export const Route = createFileRoute("/api/public/referencias/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = String(params.key ?? "").trim();
        if (!PUBLIC_SETS.has(key)) return json({ ok: false, error: "reference_set_not_public" }, 404);

        const { data: set, error: setError } = await supabaseAdmin
          .from("reference_option_sets")
          .select("id,key,name,description")
          .eq("key", key)
          .eq("active", true)
          .maybeSingle();
        if (setError || !set) return json({ ok: false, error: "reference_set_not_found" }, 404);

        const { data: options, error } = await supabaseAdmin
          .from("reference_options")
          .select("code,label,description,sort_order,metadata")
          .eq("set_id", set.id)
          .eq("active", true)
          .order("sort_order")
          .order("label");
        if (error) return json({ ok: false, error: "reference_set_unavailable" }, 500);

        return json({ ok: true, set: { key: set.key, name: set.name, description: set.description }, options: options ?? [] });
      },
    },
  },
});
