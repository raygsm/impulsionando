import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const PLAN_STATUS_COMERCIAL_VALUES = [
  "disponivel_contratacao",
  "sob_consulta",
  "em_breve",
  "oculto",
  "exclusivo_interno",
  "exclusivo_white_label",
] as const;

export const PLAN_STATUS_COMERCIAL_LABELS: Record<string, string> = {
  disponivel_contratacao: "Disponível para contratação",
  sob_consulta: "Sob consulta",
  em_breve: "Em breve",
  oculto: "Oculto",
  exclusivo_interno: "Exclusivo interno",
  exclusivo_white_label: "Exclusivo White Label",
};

/** Lista todos os contratos recorrentes (somente staff). */
export const listBillingContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data, error } = await supabaseAdmin
      .from("billing_contracts")
      .select(`
        id, company_id, plan_id, status, start_date, due_day, next_due_date,
        recurring_amount, setup_amount, setup_paid_at, nfe_issued_at, last_paid_at,
        pix_key, pix_copy_paste,
        companies:company_id ( name, is_active ),
        billing_plans:plan_id ( name, code, cycle ),
        billing_invoices ( id, due_date, amount, status, paid_at )
      `)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { contracts: data ?? [] };
  });

/** Status do contrato da empresa do usuário (usado para gating). */
export const getMyBillingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("billing_contracts")
      .select("id, status, next_due_date, recurring_amount, pix_key, pix_copy_paste")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rows) return { hasContract: false as const };

    let openInvoice = null as null | {
      id: string;
      due_date: string;
      amount: number;
      status: string;
      pix_key: string | null;
      pix_copy_paste: string | null;
    };
    if (rows.status === "suspended") {
      const { data: inv } = await supabase
        .from("billing_invoices")
        .select("id, due_date, amount, status, pix_key, pix_copy_paste")
        .eq("contract_id", rows.id)
        .in("status", ["open", "overdue"])
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      openInvoice = inv ?? null;
    }
    return { hasContract: true as const, contract: rows, openInvoice };
  });

/** Marca fatura como paga (gera receita realizada, reativa contrato). */
export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { error } = await supabaseAdmin.rpc("billing_mark_paid", { _invoice_id: data.invoiceId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Roda o ciclo de cobrança manualmente (staff). */
export const runBillingCycleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data, error } = await supabaseAdmin.rpc("billing_run_cycle");
    if (error) throw new Error(error.message);
    return { result: data };
  });

/** Lê / atualiza a política padrão. */
export const getDefaultDunningPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("billing_dunning_policy")
      .select("*")
      .eq("is_default", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { policy: data };
  });

export const updateDunningPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    name: string;
    steps: Array<{ code: string; offset_days: number; channels: string[]; template_code: string }>;
    suspend_offset_days: number;
  }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { error } = await supabaseAdmin
      .from("billing_dunning_policy")
      .update({
        name: data.name,
        steps: data.steps,
        suspend_offset_days: data.suspend_offset_days,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista planos disponíveis. */
export const listBillingPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("is_active", true)
      .order("recurring_amount");
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });

/* ============================================================
 * GESTÃO MASTER DE PLANOS — Comercial
 * ============================================================ */

const PlanCommercialSchema = z.object({
  id: z.string().uuid(),
  status_comercial: z.enum(PLAN_STATUS_COMERCIAL_VALUES).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  recurring_amount: z.number().min(0).max(10_000_000).optional(),
  setup_fee: z.number().min(0).max(10_000_000).optional(),
  min_contract_days: z.number().int().min(0).max(3650).optional(),
  min_installments: z.number().int().min(0).max(120).optional(),
  included_module_count: z.number().int().min(0).max(100).optional(),
  extra_module_price: z.number().min(0).max(1_000_000).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  show_on_site: z.boolean().optional(),
  show_in_checkout: z.boolean().optional(),
  allow_direct_checkout: z.boolean().optional(),
  route_to_quote: z.boolean().optional(),
  route_to_whatsapp: z.boolean().optional(),
  cta: z.string().max(120).nullable().optional(),
  legal_text: z.string().max(2000).nullable().optional(),
  internal_notes: z.string().max(4000).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
});

export const listMasterPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data, error } = await supabaseAdmin
      .from("billing_plans")
      .select("*")
      .order("sort_order")
      .order("recurring_amount");
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });

export const updateMasterPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanCommercialSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: before } = await supabaseAdmin
      .from("billing_plans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("Plano não encontrado");

    const patch: Record<string, unknown> = {};
    const beforeLog: Record<string, unknown> = {};
    const afterLog: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "id" || v === undefined) continue;
      patch[k] = v;
      beforeLog[k] = (before as never as Record<string, unknown>)[k] ?? null;
      afterLog[k] = v;
    }
    if (Object.keys(patch).length === 0) return { ok: true, changed: 0 };

    const { error } = await supabaseAdmin.from("billing_plans").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      action: "plan.commercial.updated",
      entity: "billing_plans",
      entity_id: data.id,
      before: beforeLog,
      after: afterLog,
    } as never);

    return { ok: true, changed: Object.keys(patch).length };
  });

/* ============================================================
 * MÓDULOS PARA FINALIZAÇÃO COMERCIAL — Lista priorizada
 * ============================================================ */

export const listModulesPendingCommercialization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: modules, error } = await supabaseAdmin
      .from("modules")
      .select("id, slug, name, description, status_tecnico, status_comercial, monthly_price, setup_fee, min_contract_days, min_installments, show_on_site, show_in_checkout, show_in_plans, show_price, allow_standalone, cta_primary, commercial_url, readiness_status, readiness_checklist, demo_url, docs_url")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);

    const rows = (modules ?? []).map((m: any) => {
      const checks = [
        { key: "status_tecnico_ok", label: "Status técnico definido", ok: !!m.status_tecnico && m.status_tecnico !== "rascunho" },
        { key: "status_comercial_ok", label: "Status comercial definido", ok: !!m.status_comercial && m.status_comercial !== "oculto" },
        { key: "monthly_price", label: "Mensalidade definida", ok: Number(m.monthly_price ?? 0) > 0 },
        { key: "setup_fee", label: "Setup definido", ok: Number(m.setup_fee ?? 0) >= 0 && m.setup_fee !== null },
        { key: "min_contract", label: "Contrato mínimo definido", ok: Number(m.min_contract_days ?? 0) > 0 },
        { key: "min_installments", label: "Mensalidades obrigatórias", ok: Number(m.min_installments ?? 0) > 0 },
        { key: "description", label: "Descrição comercial", ok: !!m.description && m.description.length > 20 },
        { key: "cta_primary", label: "CTA principal", ok: !!m.cta_primary },
        { key: "commercial_url", label: "URL comercial", ok: !!m.commercial_url },
        { key: "show_on_site", label: "Visível no site", ok: !!m.show_on_site },
        { key: "demo_url", label: "Demonstração configurada", ok: !!m.demo_url },
        { key: "docs_url", label: "Documentação configurada", ok: !!m.docs_url },
      ];
      const done = checks.filter((c) => c.ok).length;
      const ready = done === checks.length;
      return { ...m, checks, done, total: checks.length, ready };
    });

    const pending = rows.filter((r) => !r.ready).sort((a, b) => b.done - a.done);
    const ready = rows.filter((r) => r.ready);
    return { pending, ready, total: rows.length };
  });

/**
 * Dispara um lembrete IMEDIATO de cobrança (whatsapp + email) para uma fatura.
 * Usado pelos botões "Lembrar agora" nos painéis de cobrança/inadimplência.
 * Enfileira no message_outbox; o worker `process-message-outbox` despacha em < 1 min.
 */
export const sendInvoiceReminderNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) =>
    z.object({ invoiceId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: inv, error } = await supabaseAdmin
      .from("billing_invoices")
      .select(
        "id, company_id, amount, status, due_date, pix_copy_paste, pix_key, contract_id, " +
          "companies:company_id(name, email, phone)",
      )
      .eq("id", data.invoiceId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv) throw new Error("Fatura não encontrada");
    if (inv.status === "paid") throw new Error("Fatura já está paga.");

    const company = (inv as any).companies ?? {};
    const recipientEmail: string | null = company.email ?? null;
    const recipientPhone: string | null = company.phone ?? null;
    if (!recipientEmail && !recipientPhone) {
      throw new Error("Sem e-mail/WhatsApp cadastrado para esta empresa.");
    }

    const amountStr = Number(inv.amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString("pt-BR") : "—";
    const subject = `Lembrete de cobrança — ${amountStr} · vence ${due}`;
    const lines = [
      `Olá ${company.name ?? "cliente"},`,
      ``,
      `Identificamos que a fatura ${amountStr} com vencimento em ${due} ainda está em aberto.`,
      inv.pix_copy_paste
        ? `Pague rapidamente via PIX copia-e-cola:\n${inv.pix_copy_paste}`
        : `Acesse o painel para gerar o PIX e quitar agora.`,
      ``,
      `Após o pagamento, o acesso é reativado automaticamente.`,
      ``,
      `— Impulsionando`,
    ];
    const body = lines.join("\n");
    const payload = {
      invoice_id: inv.id,
      amount: inv.amount,
      due_date: inv.due_date,
      pix_copy_paste: inv.pix_copy_paste ?? null,
      pix_key: inv.pix_key ?? null,
      contract_id: inv.contract_id,
      triggered_by: userId,
      trigger: "manual_reminder",
    };

    const rows: any[] = [];
    if (recipientEmail) {
      rows.push({
        company_id: inv.company_id,
        event_code: "billing.invoice.reminder.manual",
        channel: "email",
        recipient_email: recipientEmail,
        recipient_name: company.name ?? null,
        subject,
        body,
        payload,
        status: "queued",
        reference_type: "billing_invoices",
        reference_id: inv.id,
      });
    }
    if (recipientPhone) {
      rows.push({
        company_id: inv.company_id,
        event_code: "billing.invoice.reminder.manual",
        channel: "whatsapp",
        recipient_phone: recipientPhone,
        recipient_name: company.name ?? null,
        subject: null,
        body,
        payload,
        status: "queued",
        reference_type: "billing_invoices",
        reference_id: inv.id,
      });
    }

    const { error: insErr } = await supabaseAdmin.from("message_outbox").insert(rows);
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin.from("audit_logs").insert({
      company_id: inv.company_id,
      user_id: userId,
      action: "billing.invoice.manual_reminder",
      entity: "billing_invoices",
      entity_id: inv.id,
      after: { channels: rows.map((r) => r.channel) },
    });

    return { ok: true, channels: rows.map((r) => r.channel) };
  });
