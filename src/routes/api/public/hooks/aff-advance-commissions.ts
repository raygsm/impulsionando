import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cron-friendly endpoint: promotes aff_sales/aff_commissions statuses by date.
// Auth via Supabase anon key in `apikey` header (matches pg_cron pattern).
async function run(): Promise<{ promoted_to_internal: number; promoted_to_available: number }> {
  const now = new Date().toISOString();
  let movedGw = 0, movedInt = 0;

  const { data: salesGw } = await supabaseAdmin
    .from("aff_sales").select("id")
    .eq("status", "aguardando_gateway").lte("gateway_release_at", now);
  for (const s of salesGw ?? []) {
    await supabaseAdmin.from("aff_sales").update({ status: "aguardando_prazo_interno" } as never).eq("id", s.id);
    await supabaseAdmin.from("aff_commissions").update({ status: "aguardando_prazo_interno" } as never)
      .eq("sale_id", s.id).eq("status", "aguardando_gateway");
    movedGw++;
  }

  const { data: salesInt } = await supabaseAdmin
    .from("aff_sales").select("id, internal_release_at")
    .eq("status", "aguardando_prazo_interno").lte("internal_release_at", now);
  for (const s of salesInt ?? []) {
    await supabaseAdmin.from("aff_sales").update({ status: "disponivel", available_at: s.internal_release_at } as never).eq("id", s.id);
    await supabaseAdmin.from("aff_commissions").update({ status: "disponivel", released_at: s.internal_release_at } as never)
      .eq("sale_id", s.id).eq("status", "aguardando_prazo_interno");
    movedInt++;
  }

  return { promoted_to_internal: movedGw, promoted_to_available: movedInt };
}

function authorized(request: Request): boolean {
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (!anon) return false;
  const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
  const auth = request.headers.get("authorization");
  if (apikey === anon) return true;
  if (auth && auth.toLowerCase() === `bearer ${anon.toLowerCase()}`) return true;
  return false;
}

export const Route = createFileRoute("/api/public/hooks/aff-advance-commissions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
        try {
          const result = await run();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
      GET: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
        try {
          const result = await run();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
