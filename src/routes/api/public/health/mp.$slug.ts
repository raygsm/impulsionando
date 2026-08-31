/**
 * Health check per-tenant do Mercado Pago.
 * Rota: /api/public/health/mp/:slug
 *
 * Resolve o tenant pela fonte canônica `core_tenant_identity` e nunca por
 * colunas legadas/inexistentes em `companies`.
 * Nunca lê MERCADOPAGO_ACCESS_TOKEN global — puramente per-tenant.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health/mp/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const t0 = Date.now();
        const slug = params.slug.toLowerCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: identity } = await (supabaseAdmin as any)
          .from("core_tenant_identity")
          .select("company_id,subdomain,root_domain,custom_domain,dns_status,ssl_status")
          .eq("subdomain", slug)
          .maybeSingle();

        if (!identity?.company_id) {
          return new Response(JSON.stringify({ status: "not_found", tenant: slug }), {
            status: 404,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }

        const { data: company } = await (supabaseAdmin as any)
          .from("companies")
          .select("id,name,is_active,status")
          .eq("id", identity.company_id)
          .maybeSingle();

        if (!company) {
          return new Response(JSON.stringify({ status: "not_found", tenant: slug }), {
            status: 404,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
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

        const ok = !!company.is_active && !!prod && !!prod.active && apiOk === true && !!prod.public_key;
        return new Response(JSON.stringify({
          status: ok ? "ok" : "degraded",
          service: "mercadopago-tenant",
          tenant: {
            slug,
            name: company.name,
            id: company.id,
            active: !!company.is_active,
            lifecycle_status: company.status,
            dns_status: identity.dns_status,
            ssl_status: identity.ssl_status,
          },
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
