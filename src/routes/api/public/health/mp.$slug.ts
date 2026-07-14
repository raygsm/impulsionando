/**
 * Health check per-tenant do Mercado Pago.
 * Rota: /api/public/health/mp/:slug
 *
 * Retorna, sem expor segredos:
 *   - environment / active
 *   - public_key configurada
 *   - access_token válido (chamada real a /v1/payment_methods)
 *   - webhook_secret configurado
 *
 * Nunca lê MERCADOPAGO_ACCESS_TOKEN global — puramente per-tenant.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health/mp/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const t0 = Date.now();
        const slug = params.slug;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: company } = await (supabaseAdmin as any)
          .from("companies")
          .select("id,name")
          .or(`subdomain.eq.${slug},public_slug.eq.${slug}`)
          .maybeSingle();

        if (!company) {
          return new Response(JSON.stringify({ status: "not_found", tenant: slug }), {
            status: 404, headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }

        const { data: creds } = await (supabaseAdmin as any)
          .from("mpago_credentials")
          .select("environment,active,public_key,access_token_secret_name,webhook_secret_name,updated_at")
          .eq("company_id", company.id)
          .order("environment", { ascending: false });

        const rows = (creds ?? []) as any[];
        const prod = rows.find((r) => r.environment === "production") ?? null;

        let apiOk: boolean | null = null;
        let apiStatus: number | null = null;
        let methodsCount: number | null = null;
        let apiError: string | null = null;

        if (prod?.access_token_secret_name) {
          const { data: token } = await (supabaseAdmin as any)
            .rpc("reveal_secret_value", { p_name: prod.access_token_secret_name });
          if (token) {
            try {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 6000);
              const r = await fetch("https://api.mercadopago.com/v1/payment_methods", {
                headers: { Authorization: `Bearer ${token}` },
                signal: ctrl.signal,
              });
              clearTimeout(timer);
              apiStatus = r.status;
              apiOk = r.ok;
              if (r.ok) {
                const j = (await r.json()) as unknown;
                methodsCount = Array.isArray(j) ? j.length : 0;
              } else {
                apiError = (await r.text()).slice(0, 200);
              }
            } catch (e) {
              apiError = e instanceof Error ? e.message.slice(0, 200) : "fetch_failed";
              apiOk = false;
            }
          } else {
            apiOk = false;
            apiError = "access_token vazio no cofre";
          }
        }

        const ok = !!prod && !!prod.active && apiOk === true && !!prod.public_key;
        return new Response(JSON.stringify({
          status: ok ? "ok" : "degraded",
          service: "mercadopago-tenant",
          tenant: { slug, name: company.name, id: company.id },
          elapsed_ms: Date.now() - t0,
          ts: new Date().toISOString(),
          environments: rows.map((r) => ({
            environment: r.environment,
            active: r.active,
            public_key_configured: !!r.public_key,
            public_key_preview: r.public_key ? `${String(r.public_key).slice(0, 12)}…` : null,
            access_token_configured: !!r.access_token_secret_name,
            webhook_secret_configured: !!r.webhook_secret_name,
            updated_at: r.updated_at,
          })),
          production: prod ? {
            active: !!prod.active,
            api: { ok: apiOk, http_status: apiStatus, payment_methods_count: methodsCount, error: apiError },
          } : null,
          webhook_url: `https://impulsionando.com.br/api/public/mercado-pago/${slug}`,
        }), {
          status: ok ? 200 : 503,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});
