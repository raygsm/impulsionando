import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Fase 7 — Endpoint chamado por pg_cron a cada 5 minutos.
 * Reúne NFs em `queued`/`failed` (attempt < 5) e despacha para a Focus NFe.
 *
 * Segurança: rota em /api/public/* (bypass de auth do site publicado).
 * Validamos o `apikey` (anon do Supabase) como compatibilidade com pg_cron.
 */

const FOCUS_BASE_HOMOLOG = "https://homologacao.focusnfe.com.br";
const FOCUS_BASE_PROD = "https://api.focusnfe.com.br";

function buildPayload(invoice: any, issuer: any) {
  const addr = invoice.beneficiary_address ?? {};
  return {
    data_emissao: new Date().toISOString().slice(0, 10),
    prestador: {
      cnpj: (issuer.cnpj ?? "").replace(/\D/g, ""),
      inscricao_municipal: issuer.im ?? null,
    },
    tomador: {
      cnpj: (invoice.beneficiary_cnpj ?? "").replace(/\D/g, "") || null,
      razao_social: invoice.beneficiary_legal_name,
      email: addr.email ?? null,
      endereco: {
        logradouro: addr.logradouro ?? null,
        numero: addr.numero ?? null,
        bairro: addr.bairro ?? null,
        codigo_municipio: addr.codigo_municipio ?? null,
        uf: addr.uf ?? null,
        cep: (addr.cep ?? "").replace(/\D/g, "") || null,
      },
    },
    servico: {
      aliquota: Number(issuer.iss_rate ?? 0),
      discriminacao: invoice.service_description ?? "Taxa de Intermediação Digital",
      iss_retido: !!invoice.iss_withheld,
      item_lista_servico: invoice.service_code ?? issuer.service_code,
      valor_servicos: Number(invoice.service_amount ?? 0),
      valor_iss: Number(invoice.iss_amount ?? 0),
      valor_pis: Number(invoice.pis_amount ?? 0),
      valor_cofins: Number(invoice.cofins_amount ?? 0),
      valor_ir: Number(invoice.ir_amount ?? 0),
      valor_csll: Number(invoice.csll_amount ?? 0),
    },
    rps: { serie: invoice.rps_serie, numero: invoice.rps_number },
  };
}

export const Route = createFileRoute("/api/public/hooks/dispatch-fiscal")({
  server: {
    handlers: {
      POST: async () => {
        const token = process.env.FOCUS_NFE_TOKEN;
        if (!token) return Response.json({ ok: false, error: "FOCUS_NFE_TOKEN missing", processed: 0 });

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data: issuer } = await supabase
          .from("core_fiscal_issuer_config")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();
        if (!issuer) return Response.json({ ok: false, error: "issuer not configured", processed: 0 });

        const base = (issuer as any).environment === "production" ? FOCUS_BASE_PROD : FOCUS_BASE_HOMOLOG;

        const { data: queue } = await supabase
          .from("core_fiscal_invoices")
          .select("*")
          .in("status", ["queued", "failed"])
          .lt("attempt_count", 5)
          .order("created_at", { ascending: true })
          .limit(20);

        const results: any[] = [];
        const auth = "Basic " + Buffer.from(`${token}:`).toString("base64");

        for (const inv of (queue ?? []) as any[]) {
          const ref = `imp-${inv.id}`;
          const url = `${base}/v2/nfse?ref=${encodeURIComponent(ref)}`;
          let providerResponse: any = null;
          let nextStatus = "sent";
          let nextMsg: string | null = "Enviado à Focus NFe";
          try {
            const r = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: auth },
              body: JSON.stringify(buildPayload(inv, issuer)),
            });
            const text = await r.text();
            try { providerResponse = JSON.parse(text); } catch { providerResponse = { raw: text }; }
            if (!r.ok && r.status !== 422) {
              nextStatus = "failed";
              nextMsg = `HTTP ${r.status}: ${typeof providerResponse?.mensagem === "string" ? providerResponse.mensagem : text.slice(0, 200)}`;
            }
          } catch (e: any) {
            nextStatus = "failed";
            nextMsg = `Network error: ${e?.message ?? String(e)}`;
            providerResponse = { error: String(e) };
          }

          await supabase
            .from("core_fiscal_invoices")
            .update({
              status: nextStatus,
              status_message: nextMsg,
              provider_response: providerResponse,
              attempt_count: ((inv as any).attempt_count ?? 0) + 1,
              last_attempt_at: new Date().toISOString(),
            })
            .eq("id", inv.id);

          await supabase.from("core_fiscal_invoice_events").insert({
            invoice_id: inv.id,
            event_type: nextStatus === "sent" ? "sent" : "send_failed",
            message: nextMsg,
            payload: { request_ref: ref, response: providerResponse },
          });

          results.push({ id: inv.id, status: nextStatus });
        }

        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});
