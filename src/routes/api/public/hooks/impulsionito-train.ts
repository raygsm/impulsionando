/**
 * /api/public/hooks/impulsionito-train (W18)
 *
 * Cron diário que captura uma foto (snapshot) de cada empresa ativa do core
 * Impulsionando e grava em `impulsionito_training_snapshots` para alimentar
 * o treinamento contínuo do agente Impulsionito.
 *
 * Autenticação: anon key (apikey header). Bypass do /api/public/* +
 * service-role para inserir snapshots ignorando RLS.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/impulsionito-train")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
        const apikey = request.headers.get("apikey") ?? "";
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

        // Empresas ativas (não-master) — alvo do treinamento por tenant.
        const { data: companies, error: cErr } = await supabaseAdmin
          .from("companies")
          .select("id, name, niche_code")
          .eq("is_active", true)
          .eq("is_master", false)
          .limit(500);

        if (cErr) {
          return new Response(JSON.stringify({ error: cErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        let processed = 0;
        const errors: Array<{ companyId: string; error: string }> = [];

        for (const co of companies ?? []) {
          try {
            const [custCount, prodCount, apptCount, openTickCount, evtCount] = await Promise.all([
              supabaseAdmin.from("customers").select("id", { count: "exact", head: true }).eq("company_id", co.id),
              supabaseAdmin.from("inv_products").select("id", { count: "exact", head: true }).eq("company_id", co.id),
              supabaseAdmin.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", co.id).gte("starts_at", since30),
              supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("company_id", co.id).in("status", ["new", "received", "waiting_customer", "waiting_core", "in_review", "in_development", "reopened"]),
              supabaseAdmin.from("evt_tickets").select("id", { count: "exact", head: true }).eq("company_id", co.id).in("status", ["sold", "paid", "checked_in"]),
            ]);

            const { error: insErr } = await supabaseAdmin.from("impulsionito_training_snapshots").insert({
              company_id: co.id,
              niche: (co as { niche_code?: string }).niche_code ?? null,
              metrics: {
                customers: custCount.count ?? 0,
                products: prodCount.count ?? 0,
                appointmentsLast30d: apptCount.count ?? 0,
                openTickets: openTickCount.count ?? 0,
                eventTicketsSold: evtCount.count ?? 0,
              },
              sample: {},
              source: "cron",
            });

            if (insErr) errors.push({ companyId: co.id, error: insErr.message });
            else processed++;
          } catch (e) {
            errors.push({ companyId: co.id, error: e instanceof Error ? e.message : String(e) });
          }
        }

        return new Response(
          JSON.stringify({ ok: true, processed, total: companies?.length ?? 0, errors: errors.slice(0, 10) }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
