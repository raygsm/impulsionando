import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve slug ativo no servidor (admin client — só lê id+destino, nunca expõe métricas)
        const { data: row } = await supabaseAdmin
          .from("aff_links")
          .select("id, destination_url")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (!row) {
          return new Response("Link not found", { status: 404 });
        }

        // Incrementa cliques (best-effort)
        try {
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
