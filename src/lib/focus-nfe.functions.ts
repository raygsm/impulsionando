import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fase 7 — Emissão real de NFS-e via Focus NFe.
 *
 * - dispatchPendingFiscalInvoices: pega NFs em status `queued`, monta o payload
 *   da Focus NFe, envia ao endpoint correto (homologação ou produção), e
 *   marca a NF como `sent` (registra `provider_response`, `attempt_count`,
 *   `last_attempt_at`). Mantém-se idempotente — só processa `queued` ou
 *   `failed` (com retry < 5).
 * - retryFiscalInvoice: força reenvio de uma NF específica (`failed` → `queued`).
 * - registerFiscalInvoiceEvent: helper interno para gravar eventos.
 *
 * O webhook do Focus NFe (que atualiza status `issued`/`rejected`/`cancelled`
 * com o número da NF e URLs) vive em
 * `src/routes/api/public/hooks/focus-nfe.ts`.
 */

const FOCUS_BASE_HOMOLOG = "https://homologacao.focusnfe.com.br";
const FOCUS_BASE_PROD = "https://api.focusnfe.com.br";

function focusBase(env: string | null | undefined) {
  return env === "production" ? FOCUS_BASE_PROD : FOCUS_BASE_HOMOLOG;
}

async function authorizeAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

function buildFocusPayload(invoice: any, issuer: any) {
  const addr = invoice.beneficiary_address ?? {};
  const ref = `imp-${invoice.id}`;
  return {
    referencia: ref,
    data_emissao: new Date().toISOString().slice(0, 10),
    prestador: {
      cnpj: (issuer.cnpj ?? "").replace(/\D/g, ""),
      inscricao_municipal: issuer.im ?? null,
      codigo_municipio: issuer.address?.codigo_municipio ?? issuer.metadata?.codigo_municipio ?? null,
    },
    tomador: {
      cnpj: (invoice.beneficiary_cnpj ?? "").replace(/\D/g, "") || null,
      razao_social: invoice.beneficiary_legal_name,
      email: addr.email ?? null,
      endereco: {
        logradouro: addr.logradouro ?? null,
        numero: addr.numero ?? null,
        complemento: addr.complemento ?? null,
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
      codigo_tributario_municipio: issuer.metadata?.codigo_tributario_municipio ?? null,
      valor_servicos: Number(invoice.service_amount ?? 0),
      valor_iss: Number(invoice.iss_amount ?? 0),
      valor_pis: Number(invoice.pis_amount ?? 0),
      valor_cofins: Number(invoice.cofins_amount ?? 0),
      valor_ir: Number(invoice.ir_amount ?? 0),
      valor_csll: Number(invoice.csll_amount ?? 0),
    },
    rps: {
      serie: invoice.rps_serie,
      numero: invoice.rps_number,
    },
  };
}

const Dispatch = z.object({ limit: z.number().int().min(1).max(50).default(10) });

export const dispatchPendingFiscalInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Dispatch.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await authorizeAdmin(supabase, userId);
    const supa = supabase as any;

    const token = process.env.FOCUS_NFE_TOKEN;
    if (!token) return { ok: false, error: "FOCUS_NFE_TOKEN ausente", processed: 0 };

    const { data: issuer } = await supa
      .from("core_fiscal_issuer_config")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    if (!issuer) return { ok: false, error: "Emissor não configurado", processed: 0 };

    const base = focusBase(issuer.environment);

    const { data: queue } = await supa
      .from("core_fiscal_invoices")
      .select("*")
      .in("status", ["queued", "failed"])
      .lt("attempt_count", 5)
      .order("created_at", { ascending: true })
      .limit(data.limit);

    const results: any[] = [];
    for (const inv of queue ?? []) {
      const payload = buildFocusPayload(inv, issuer);
      const ref = `imp-${inv.id}`;
      const url = `${base}/v2/nfse?ref=${encodeURIComponent(ref)}`;
      let providerResponse: any = null;
      let nextStatus = "sent";
      let nextMsg: string | null = null;
      try {
        const auth = "Basic " + Buffer.from(`${token}:`).toString("base64");
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: auth },
          body: JSON.stringify(payload),
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

      await supa
        .from("core_fiscal_invoices")
        .update({
          status: nextStatus,
          status_message: nextMsg,
          provider_response: providerResponse,
          attempt_count: (inv.attempt_count ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", inv.id);

      await supa.from("core_fiscal_invoice_events").insert({
        invoice_id: inv.id,
        event_type: nextStatus === "sent" ? "sent" : "send_failed",
        message: nextMsg,
        payload: { request_ref: ref, response: providerResponse },
      });

      results.push({ id: inv.id, status: nextStatus, message: nextMsg });
    }

    return { ok: true, processed: results.length, results };
  });

const Retry = z.object({ invoiceId: z.string().uuid() });

export const retryFiscalInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Retry.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await authorizeAdmin(supabase, userId);
    const supa = supabase as any;
    const { error } = await supa
      .from("core_fiscal_invoices")
      .update({ status: "queued", status_message: "Reenfileirado manualmente", attempt_count: 0 })
      .eq("id", data.invoiceId)
      .in("status", ["failed", "rejected"]);
    if (error) throw new Error(error.message);
    await supa.from("core_fiscal_invoice_events").insert({
      invoice_id: data.invoiceId,
      event_type: "requeued",
      message: "Reenfileirado manualmente",
    });
    return { ok: true };
  });
