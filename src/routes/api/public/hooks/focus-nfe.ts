import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Fase 7 — Webhook do Focus NFe.
 *
 * Focus NFe envia POST com `ref` (nossa referência `imp-<invoice_id>`) e
 * o estado atual da NFS-e: `processando_autorizacao`, `autorizado`,
 * `cancelado`, `erro_autorizacao`. O webhook atualiza
 * `core_fiscal_invoices` e grava em `core_fiscal_invoice_events`.
 *
 * Segurança:
 *  - opcional: HMAC SHA-256 do body com FOCUS_NFE_WEBHOOK_SECRET no header
 *    `x-focus-signature` (configurável no painel Focus NFe).
 *  - rota em `/api/public/*` (bypass de auth do site publicado).
 */

const REF_RE = /^imp-([0-9a-f-]{36})$/i;

function mapStatus(focusStatus: string): { status: string | null; message: string } {
  switch (focusStatus) {
    case "autorizado":
      return { status: "issued", message: "NFS-e autorizada" };
    case "cancelado":
      return { status: "cancelled", message: "NFS-e cancelada" };
    case "erro_autorizacao":
      return { status: "rejected", message: "NFS-e rejeitada" };
    case "processando_autorizacao":
      return { status: "sent", message: "Processando autorização" };
    default:
      return { status: null, message: `Status ${focusStatus}` };
  }
}

export const Route = createFileRoute("/api/public/hooks/focus-nfe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env.FOCUS_NFE_WEBHOOK_SECRET;

        if (secret) {
          const sig = request.headers.get("x-focus-signature") ?? request.headers.get("x-signature") ?? "";
          const expected = createHmac("sha256", secret).update(raw).digest("hex");
          const a = Buffer.from(sig);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let body: any;
        try { body = JSON.parse(raw); } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const ref: string = body?.ref ?? body?.referencia ?? "";
        const m = REF_RE.exec(ref);
        if (!m) return new Response("Unknown ref", { status: 202 });
        const invoiceId = m[1];

        const focusStatus: string = body?.status ?? body?.situacao ?? "";
        const mapped = mapStatus(focusStatus);

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const update: Record<string, any> = {
          status_message: mapped.message,
          provider_response: body,
          last_attempt_at: new Date().toISOString(),
        };
        if (mapped.status) update.status = mapped.status;
        if (focusStatus === "autorizado") {
          update.nf_number = body?.numero ?? body?.nfse?.numero ?? null;
          update.nf_verification_code = body?.codigo_verificacao ?? body?.nfse?.codigo_verificacao ?? null;
          update.nf_url = body?.url ?? body?.caminho_xml_nota_fiscal ?? null;
          update.nf_xml_url = body?.caminho_xml_nota_fiscal ?? body?.url_xml ?? null;
          update.issued_at = new Date().toISOString();
        }
        if (focusStatus === "cancelado") update.cancelled_at = new Date().toISOString();

        const { error } = await supabase
          .from("core_fiscal_invoices")
          .update(update)
          .eq("id", invoiceId);
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        await supabase.from("core_fiscal_invoice_events").insert({
          invoice_id: invoiceId,
          event_type: "webhook_received",
          message: `${focusStatus} → ${mapped.status ?? "no-op"}`,
          payload: body,
        });

        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
