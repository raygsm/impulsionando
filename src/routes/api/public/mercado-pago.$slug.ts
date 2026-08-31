/**
 * Webhook Mercado Pago per-tenant.
 * Rota: /api/public/mercado-pago/:slug
 *
 * Resolve a empresa por `core_tenant_identity`, carrega exclusivamente as
 * credenciais da própria empresa e nunca usa fallback global.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const MP_API = "https://api.mercadopago.com";

const STATUS_MAP: Record<string, string> = {
  approved: "approved",
  pending: "pending",
  in_process: "pending",
  rejected: "rejected",
  cancelled: "canceled",
  refunded: "refunded",
  charged_back: "charged_back",
};

function verifyHmac(secret: string, request: Request, body: string): boolean {
  const sigHeader = request.headers.get("x-signature") ?? "";
  const reqId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ??
    (() => { try { return JSON.parse(body)?.data?.id ?? ""; } catch { return ""; } })();
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(v1)); }
  catch { return false; }
}

function verifyImpulsionandoTestHmac(secret: string, body: string, header: string | null): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const provided = header.slice("sha256=".length);
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(provided)); }
  catch { return false; }
}

export const Route = createFileRoute("/api/public/mercado-pago/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => Response.json({
        ok: true,
        tenant: params.slug,
        hint: "POST-only webhook. Configure esta URL no painel Mercado Pago do cliente.",
      }),
      POST: async ({ request, params }) => {
        const slug = params.slug.toLowerCase();
        const body = await request.text();
        let payload: any = {};
        try { payload = body ? JSON.parse(body) : {}; } catch { /* keep {} */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const logRuntime = async (
          level: "info" | "warn" | "error",
          message: string,
          context: Record<string, unknown>,
        ) => {
          try {
            await (supabaseAdmin as any).from("runtime_events").insert({
              level,
              scope: "mercadopago.webhook.tenant",
              message,
              context: { slug, ...context },
              route: `/api/public/mercado-pago/${slug}`,
            });
          } catch { /* logging cannot break webhook */ }
        };

        // 1. Resolve a identidade canônica do tenant.
        const { data: identity } = await (supabaseAdmin as any)
          .from("core_tenant_identity")
          .select("company_id,subdomain,dns_status,ssl_status")
          .eq("subdomain", slug)
          .maybeSingle();

        if (!identity?.company_id) {
          await logRuntime("error", "tenant não encontrado", {});
          return new Response("Tenant not found", { status: 404 });
        }

        const { data: company } = await (supabaseAdmin as any)
          .from("companies")
          .select("id,name,is_active,status")
          .eq("id", identity.company_id)
          .maybeSingle();

        if (!company || !company.is_active) {
          await logRuntime("error", "empresa ausente ou inativa", { company_id: identity.company_id });
          return new Response("Tenant inactive or not found", { status: 404 });
        }

        // 2. Credenciais desta empresa — nunca fallback global.
        const { data: creds } = await (supabaseAdmin as any)
          .from("mpago_credentials")
          .select("environment,active,access_token_secret_name,webhook_secret_name")
          .eq("company_id", company.id)
          .eq("active", true)
          .order("environment", { ascending: false });

        const cred = (creds ?? [])[0];
        if (!cred) {
          await logRuntime("error", "credencial MP não configurada para o tenant", { company_id: company.id });
          return new Response("Missing tenant Mercado Pago credentials", { status: 424 });
        }

        const [{ data: accessToken }, { data: webhookSecret }] = await Promise.all([
          (supabaseAdmin as any).rpc("reveal_secret_value", { p_name: cred.access_token_secret_name }),
          cred.webhook_secret_name
            ? (supabaseAdmin as any).rpc("reveal_secret_value", { p_name: cred.webhook_secret_name })
            : Promise.resolve({ data: null }),
        ]);

        if (!accessToken) {
          await logRuntime("error", "access_token vazio no cofre", { company_id: company.id });
          return new Response("Missing tenant access token", { status: 424 });
        }

        const isDiagnostic = request.headers.get("x-impulsionando-test") === "true";
        let signatureOk = false;
        if (webhookSecret) {
          signatureOk = verifyHmac(webhookSecret as string, request, body)
            || verifyImpulsionandoTestHmac(webhookSecret as string, body, request.headers.get("x-signature"));
        } else if (isDiagnostic) {
          signatureOk = true;
        } else {
          await logRuntime("warn", "webhook sem secret configurado", { company_id: company.id });
          return new Response("Webhook secret not configured", { status: 401 });
        }

        if (!signatureOk) {
          await logRuntime("warn", "assinatura HMAC inválida", {
            company_id: company.id,
            topic: payload?.type ?? payload?.topic ?? null,
          });
          return new Response("Invalid signature", { status: 401 });
        }

        const { data: logRow } = await (supabaseAdmin as any)
          .from("mp_webhook_log")
          .insert({
            topic: payload?.type ?? payload?.topic ?? null,
            resource_id: payload?.data?.id ? String(payload.data.id) : null,
            payload: { ...payload, __tenant_slug: slug, __company_id: company.id },
          })
          .select()
          .single();

        if (isDiagnostic || payload?.type === "test.ping") {
          await logRuntime("info", "diagnóstico recebido", { company_id: company.id });
          if (logRow) {
            await (supabaseAdmin as any).from("mp_webhook_log")
              .update({ processed: true }).eq("id", logRow.id);
          }
          return Response.json({ ok: true, diagnostic: true, tenant: slug });
        }

        try {
          const topic = payload?.type ?? payload?.topic;
          const resourceId = payload?.data?.id;
          if (topic === "payment" && resourceId) {
            const r = await fetch(`${MP_API}/v1/payments/${resourceId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!r.ok) throw new Error(`MP API ${r.status}`);
            const p: any = await r.json();
            const internal = STATUS_MAP[p.status] ?? p.status;
            const paidAt = p.status === "approved" ? new Date().toISOString() : null;

            await (supabaseAdmin as any).from("payments").update({
              status: internal,
              paid_at: paidAt,
              raw_response: p,
              webhook_received_at: new Date().toISOString(),
            }).eq("payment_id", String(resourceId));

            const meta = p?.metadata ?? {};
            const payerName = [p?.payer?.first_name, p?.payer?.last_name].filter(Boolean).join(" ") || null;
            await (supabaseAdmin as any).from("mpago_payments").upsert({
              mp_payment_id: String(resourceId),
              status: internal,
              amount_cents: Math.round(Number(p?.transaction_amount ?? 0) * 100),
              currency: p?.currency_id ?? "BRL",
              payment_method: p?.payment_method_id ?? null,
              payer_email: p?.payer?.email ?? null,
              payer_name: payerName,
              user_id: meta?.user_id ?? null,
              empresa_id: company.id,
              plano_id: meta?.plan_id ?? meta?.plano_id ?? null,
              customer_phone: p?.payer?.phone?.number ?? null,
              approved_at: paidAt,
              paid_at: paidAt,
              environment: cred.environment,
              metadata: { ...meta, __tenant_slug: slug },
            }, { onConflict: "mp_payment_id" });

            await logRuntime("info", "pagamento processado", {
              company_id: company.id,
              mp_payment_id: String(resourceId),
              status: internal,
            });
          }

          if (logRow) {
            await (supabaseAdmin as any).from("mp_webhook_log")
              .update({ processed: true }).eq("id", logRow.id);
          }
          return Response.json({ ok: true, tenant: slug });
        } catch (e: any) {
          if (logRow) {
            await (supabaseAdmin as any).from("mp_webhook_log")
              .update({ error: e?.message ?? String(e) }).eq("id", logRow.id);
          }
          await logRuntime("error", e?.message ?? "erro processando webhook", {
            company_id: company.id,
            stack: e?.stack?.slice(0, 2000) ?? null,
          });
          return Response.json({ ok: false, error: e?.message }, { status: 500 });
        }
      },
    },
  },
});
