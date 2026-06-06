import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        const url = new URL(process.env.SUPABASE_URL!);
        const apikey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

        // Busca slug ativo
        const lookup = await fetch(`${url.origin}/rest/v1/aff_links?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=id,destination_url`, {
          headers: { apikey, Authorization: `Bearer ${apikey}` },
        });
        const rows = lookup.ok ? (await lookup.json()) as { id: string; destination_url: string | null }[] : [];
        const row = rows[0];

        if (!row) {
          return new Response("Link not found", { status: 404 });
        }

        // Incrementa cliques (best-effort, via service role só se necessário; aqui usamos rpc-like update)
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const current = await supabaseAdmin.from("aff_links").select("clicks").eq("id", row.id).single();
          await supabaseAdmin.from("aff_links").update({ clicks: (current.data?.clicks ?? 0) + 1 } as never).eq("id", row.id);
        } catch {
          // silencioso — redireciona mesmo assim
        }

        const dest = row.destination_url || "/";
        return new Response(null, { status: 302, headers: { Location: dest, "Set-Cookie": `aff_ref=${row.id}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax` } });
      },
    },
  },
});
