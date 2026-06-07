import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CHECKLIST_ITEMS = [
  "payment_approved",
  "onboarding_done",
  "subdomain_reserved",
  "domain_requested",
  "domain_migration_requested",
  "emails_requested",
  "modules_activated",
  "client_released",
] as const;

export const initChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const rows = CHECKLIST_ITEMS.map((k) => ({ company_id: data.companyId, item_key: k }));
    await supabase.from("onboarding_checklist").upsert(rows, { onConflict: "company_id,item_key", ignoreDuplicates: true });
    const { data: list } = await supabase
      .from("onboarding_checklist")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at");
    return { items: list ?? [] };
  });

export const completeChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; itemKey: string; status?: "done" | "skipped" | "pending" }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const status = data.status ?? "done";
    await supabase
      .from("onboarding_checklist")
      .upsert(
        { company_id: data.companyId, item_key: data.itemKey, status, completed_at: status === "done" ? new Date().toISOString() : null },
        { onConflict: "company_id,item_key" },
      );
    return { ok: true };
  });

const DomainSchema = z.object({
  companyId: z.string().uuid(),
  mode: z.enum(["subdomain", "own", "register"]),
  requestedValue: z.string().min(1).max(255).optional(),
  alternatives: z.string().max(500).optional(),
  contactName: z.string().max(255).optional(),
  contactEmail: z.string().email().max(255).optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
});

export const saveDomainRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DomainSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const status = data.mode === "subdomain" ? "reserved" : "pending";
    const { data: row, error } = await supabase
      .from("onboarding_domain_requests")
      .insert({
        company_id: data.companyId,
        mode: data.mode,
        requested_value: data.requestedValue ?? null,
        alternatives: data.alternatives ?? null,
        contact_name: data.contactName ?? null,
        contact_email: data.contactEmail || null,
        contact_phone: data.contactPhone ?? null,
        status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Marca item correspondente no checklist
    const key = data.mode === "subdomain" ? "subdomain_reserved" : data.mode === "own" ? "domain_migration_requested" : "domain_requested";
    await supabase
      .from("onboarding_checklist")
      .upsert(
        { company_id: data.companyId, item_key: key, status: "done", completed_at: new Date().toISOString() },
        { onConflict: "company_id,item_key" },
      );

    // Registra na timeline do CRM (best-effort)
    await supabase.from("crm_activities").insert({
      company_id: data.companyId,
      activity_type: "note",
      title: "Solicitação de domínio registrada",
      description: `Modo: ${data.mode}. Valor: ${data.requestedValue ?? "-"}`,
    } as never);

    return { request: row };
  });

const EmailSchema = z.object({
  companyId: z.string().uuid(),
  prefixes: z.array(z.string().min(1).max(50).regex(/^[a-zA-Z0-9._-]+$/)).min(1).max(20),
  domain: z.string().min(1).max(255).optional(),
});

export const saveEmailRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const rows = data.prefixes.map((p) => ({
      company_id: data.companyId,
      address_prefix: p,
      full_address: data.domain ? `${p}@${data.domain}` : null,
    }));
    const { error } = await supabase.from("onboarding_email_requests").insert(rows);
    if (error) throw new Error(error.message);

    await supabase
      .from("onboarding_checklist")
      .upsert(
        { company_id: data.companyId, item_key: "emails_requested", status: "done", completed_at: new Date().toISOString() },
        { onConflict: "company_id,item_key" },
      );

    await supabase.from("crm_activities").insert({
      company_id: data.companyId,
      activity_type: "note",
      title: "Solicitação de e-mails corporativos",
      description: `Prefixos: ${data.prefixes.join(", ")}`,
    } as never);

    return { ok: true, count: rows.length };
  });

export const getClient360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [company, contracts, modules, domain, emails, checklist, activities] = await Promise.all([
      supabase.from("companies").select("*").eq("id", data.companyId).maybeSingle(),
      supabase.from("billing_contracts").select("*").eq("company_id", data.companyId).order("created_at", { ascending: false }),
      supabase.from("company_modules").select("is_enabled, modules!inner(slug, name)").eq("company_id", data.companyId),
      supabase.from("onboarding_domain_requests").select("*").eq("company_id", data.companyId).order("created_at", { ascending: false }),
      supabase.from("onboarding_email_requests").select("*").eq("company_id", data.companyId).order("created_at", { ascending: false }),
      supabase.from("onboarding_checklist").select("*").eq("company_id", data.companyId).order("created_at"),
      supabase.from("crm_activities").select("*").eq("company_id", data.companyId).order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      company: company.data,
      contracts: contracts.data ?? [],
      modules: modules.data ?? [],
      domain: domain.data ?? [],
      emails: emails.data ?? [],
      checklist: checklist.data ?? [],
      activities: activities.data ?? [],
    };
  });

export const listClientsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, slug, is_active, is_master, created_at")
      .eq("is_master", false)
      .order("created_at", { ascending: false });
    return { companies: companies ?? [] };
  });
