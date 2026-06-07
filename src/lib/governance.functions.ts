import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Governance — Core Master.
 * Apenas super-admin. Aplicações em massa de parâmetros, versões e clonagens.
 * Tudo é auditado em `governance_applications` + `audit_logs`.
 */

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user: userId });
  if (!data) throw new Error("Apenas Super Admin pode executar esta operação.");
}

async function logAudit(
  supabase: any,
  userId: string,
  email: string | null,
  kind: string,
  scope: string,
  targetId: string | null,
  payload: any,
  affectedCount: number,
) {
  await supabase.from("governance_applications").insert({
    kind,
    scope,
    target_id: targetId,
    payload,
    affected_count: affectedCount,
    applied_by: userId,
    applied_by_email: email,
  });
  await supabase.from("audit_logs").insert({
    user_id: userId,
    user_email: email,
    action: `governance.${kind}.applied`,
    entity: "governance",
    entity_id: targetId,
    after: { scope, payload, affected_count: affectedCount },
  });
}

/* ============================================================
   1) APLICAR PARÂMETRO GLOBAL
   ============================================================ */
const applySettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.any(),
  value_type: z.enum(["text", "number", "boolean", "json"]).default("text"),
  category: z.string().min(1).max(60).default("geral"),
  scope: z.enum(["all", "white_label", "company"]),
  target_id: z.string().uuid().optional().nullable(),
  segment_filter: z.string().optional().nullable(),
});

export const applyGlobalSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applySettingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertSuperAdmin(supabase, userId);

    let query = supabase.from("companies").select("id").eq("is_master", false).eq("is_active", true);
    if (data.scope === "company" && data.target_id) {
      query = query.eq("id", data.target_id);
    } else if (data.scope === "white_label" && data.segment_filter) {
      query = query.eq("segment", data.segment_filter);
    }
    const { data: companies, error } = await query;
    if (error) throw error;
    const ids = (companies ?? []).map((c: any) => c.id);
    if (!ids.length) return { affected: 0 };

    const rows = ids.map((company_id: string) => ({
      company_id,
      key: data.key,
      value: data.value,
      value_type: data.value_type,
      category: data.category,
    }));
    const { error: upErr } = await supabase
      .from("company_settings")
      .upsert(rows, { onConflict: "company_id,key" });
    if (upErr) throw upErr;

    await logAudit(
      supabase,
      userId,
      (claims as any)?.email ?? null,
      "setting",
      data.scope,
      data.target_id ?? null,
      { key: data.key, value: data.value, category: data.category, segment_filter: data.segment_filter },
      ids.length,
    );
    return { affected: ids.length };
  });

/* ============================================================
   2) APLICAR VERSÃO DE MÓDULO EM MASSA
   ============================================================ */
const applyVersionSchema = z.object({
  module_id: z.string().uuid(),
  version: z.string().min(1).max(40),
  scope: z.enum(["all", "white_label", "company"]),
  target_id: z.string().uuid().optional().nullable(),
  segment_filter: z.string().optional().nullable(),
});

export const applyModuleVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applyVersionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertSuperAdmin(supabase, userId);

    // Update modules.current_version when scope=all
    if (data.scope === "all") {
      await supabase.from("modules").update({ current_version: data.version }).eq("id", data.module_id);
    }

    let companyQ = supabase.from("companies").select("id").eq("is_master", false).eq("is_active", true);
    if (data.scope === "company" && data.target_id) companyQ = companyQ.eq("id", data.target_id);
    else if (data.scope === "white_label" && data.segment_filter) companyQ = companyQ.eq("segment", data.segment_filter);
    const { data: companies } = await companyQ;
    const ids = (companies ?? []).map((c: any) => c.id);
    if (ids.length) {
      await supabase
        .from("company_modules")
        .update({ installed_version: data.version, updated_at: new Date().toISOString() })
        .in("company_id", ids)
        .eq("module_id", data.module_id);
    }

    await logAudit(
      supabase,
      userId,
      (claims as any)?.email ?? null,
      "version",
      data.scope,
      data.module_id,
      { module_id: data.module_id, version: data.version, segment_filter: data.segment_filter },
      ids.length,
    );
    return { affected: ids.length };
  });

/* ============================================================
   3) CLONAR EMPRESA
   ============================================================ */
const cloneSchema = z.object({
  source_company_id: z.string().uuid(),
  new_name: z.string().min(2).max(160),
  new_owner_email: z.string().email().optional().nullable(),
});

export const cloneCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => cloneSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertSuperAdmin(supabase, userId);

    const { data: src, error: e1 } = await supabase
      .from("companies")
      .select("*")
      .eq("id", data.source_company_id)
      .maybeSingle();
    if (e1 || !src) throw new Error("Empresa de origem não encontrada");

    const insert: any = { ...src };
    delete insert.id;
    delete insert.created_at;
    delete insert.updated_at;
    insert.name = data.new_name;
    insert.trade_name = data.new_name;
    insert.legal_name = data.new_name;
    insert.is_master = false;
    insert.is_active = true;
    insert.email = data.new_owner_email ?? null;
    insert.document = null;
    insert.domain = null;
    insert.subdomain = null;

    const { data: created, error: e2 } = await supabase.from("companies").insert(insert).select().single();
    if (e2) throw e2;

    // Copia settings + módulos habilitados + templates customizados
    const [{ data: settings }, { data: modules }, { data: templates }] = await Promise.all([
      supabase.from("company_settings").select("key,value,value_type,category").eq("company_id", data.source_company_id),
      supabase.from("company_modules").select("module_id,is_enabled,installed_version,settings").eq("company_id", data.source_company_id),
      supabase.from("message_templates").select("event_code,channel,subject,body,is_active").eq("company_id", data.source_company_id),
    ]);
    if (settings?.length) {
      await supabase.from("company_settings").insert(settings.map((s: any) => ({ ...s, company_id: created.id })));
    }
    if (modules?.length) {
      await supabase.from("company_modules").insert(modules.map((m: any) => ({ ...m, company_id: created.id })));
    }
    if (templates?.length) {
      await supabase.from("message_templates").insert(templates.map((t: any) => ({ ...t, company_id: created.id })));
    }

    await logAudit(
      supabase,
      userId,
      (claims as any)?.email ?? null,
      "clone_company",
      "company",
      created.id,
      { source: data.source_company_id, new_name: data.new_name },
      1,
    );
    return { company_id: created.id, name: created.name };
  });

/* ============================================================
   4) COPIAR CONFIGURAÇÕES ENTRE EMPRESAS
   ============================================================ */
const copySchema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  areas: z.array(z.enum(["settings", "modules", "templates", "permissions"])).min(1),
});

export const copyCompanySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => copySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertSuperAdmin(supabase, userId);
    if (data.source_id === data.target_id) throw new Error("Origem e destino são iguais");

    const summary: Record<string, number> = {};

    if (data.areas.includes("settings")) {
      const { data: rows } = await supabase
        .from("company_settings")
        .select("key,value,value_type,category")
        .eq("company_id", data.source_id);
      if (rows?.length) {
        const payload = rows.map((r: any) => ({ ...r, company_id: data.target_id }));
        await supabase.from("company_settings").upsert(payload, { onConflict: "company_id,key" });
        summary.settings = rows.length;
      }
    }
    if (data.areas.includes("modules")) {
      const { data: rows } = await supabase
        .from("company_modules")
        .select("module_id,is_enabled,installed_version,settings")
        .eq("company_id", data.source_id);
      if (rows?.length) {
        const payload = rows.map((r: any) => ({ ...r, company_id: data.target_id }));
        await supabase.from("company_modules").upsert(payload, { onConflict: "company_id,module_id" });
        summary.modules = rows.length;
      }
    }
    if (data.areas.includes("templates")) {
      const { data: rows } = await supabase
        .from("message_templates")
        .select("event_code,channel,subject,body,is_active")
        .eq("company_id", data.source_id);
      if (rows?.length) {
        await supabase
          .from("message_templates")
          .delete()
          .eq("company_id", data.target_id);
        await supabase
          .from("message_templates")
          .insert(rows.map((r: any) => ({ ...r, company_id: data.target_id })));
        summary.templates = rows.length;
      }
    }

    await logAudit(
      supabase,
      userId,
      (claims as any)?.email ?? null,
      "copy_settings",
      "company",
      data.target_id,
      { source: data.source_id, areas: data.areas, summary },
      Object.values(summary).reduce((a, b) => a + b, 0),
    );
    return { summary };
  });

/* ============================================================
   5) TESTES DE PRONTIDÃO DO CLIENTE
   ============================================================ */
export const runClientHealthCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const cid = data.company_id;

    const [
      { data: company },
      { data: users },
      { data: settings },
      { data: modules },
      { data: contracts },
      { data: outbox },
      { data: templates },
    ] = await Promise.all([
      supabase.from("companies").select("*").eq("id", cid).maybeSingle(),
      supabase.from("user_profiles").select("user_id").eq("company_id", cid).eq("is_active", true),
      supabase.from("company_settings").select("key,value").eq("company_id", cid),
      supabase.from("company_modules").select("module_id,is_enabled").eq("company_id", cid),
      supabase.from("billing_contracts").select("id,status,pix_key").eq("company_id", cid),
      supabase.from("message_outbox").select("status,channel").eq("company_id", cid).order("created_at", { ascending: false }).limit(50),
      supabase.from("message_templates").select("channel").eq("company_id", cid),
    ]);

    const settingsByKey = new Map<string, any>((settings ?? []).map((s: any) => [s.key, s.value]));
    const moduleSlugs = (modules ?? []).filter((m: any) => m.is_enabled).map((m: any) => m.module_id);
    const tplChannels = new Set((templates ?? []).map((t: any) => t.channel));
    const outboxFailed = (outbox ?? []).filter((o: any) => o.status === "failed").length;

    const checks = [
      { key: "login", label: "Usuário master cadastrado", status: (users?.length ?? 0) > 0 ? "pass" : "fail" },
      { key: "company", label: "Empresa configurada", status: company?.name && company?.email ? "pass" : "pending" },
      {
        key: "whatsapp",
        label: "WhatsApp configurado",
        status: settingsByKey.has("whatsapp_token") || settingsByKey.has("whatsapp_number") ? "pass" : "pending",
      },
      {
        key: "email",
        label: "E-mail transacional configurado",
        status: tplChannels.has("email") ? "pass" : "pending",
      },
      {
        key: "agenda",
        label: "Agenda configurada",
        status: moduleSlugs.length > 0 ? "pass" : "pending",
      },
      {
        key: "cobranca",
        label: "Cobrança ativa",
        status: contracts?.some((c: any) => c.status === "active") ? "pass" : "pending",
      },
      {
        key: "pix",
        label: "Pix configurado",
        status: contracts?.some((c: any) => c.pix_key) ? "pass" : "pending",
      },
      {
        key: "nf",
        label: "Nota fiscal configurada",
        status: settingsByKey.has("nfe_token") || settingsByKey.has("nfe_provider") ? "pass" : "pending",
      },
      {
        key: "dashboard",
        label: "Dashboard disponível",
        status: moduleSlugs.length > 0 ? "pass" : "pending",
      },
      {
        key: "outbox",
        label: "Fila de mensagens saudável",
        status: outboxFailed > 5 ? "fail" : "pass",
      },
    ];

    const summary = {
      total: checks.length,
      pass: checks.filter((c) => c.status === "pass").length,
      fail: checks.filter((c) => c.status === "fail").length,
      pending: checks.filter((c) => c.status === "pending").length,
    };
    return { checks, summary };
  });

/* ============================================================
   6) ENTRAR COMO CLIENTE (LOG)
   ============================================================ */
export const enterAsClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; reason?: string }) =>
    z.object({ company_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertSuperAdmin(supabase, userId);
    const email = (claims as any)?.email ?? null;
    const { data: row, error } = await supabase
      .from("support_sessions")
      .insert({
        super_user_id: userId,
        super_user_email: email,
        company_id: data.company_id,
        reason: data.reason ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    await supabase.from("audit_logs").insert({
      user_id: userId,
      user_email: email,
      company_id: data.company_id,
      action: "support.session.started",
      entity: "support_session",
      entity_id: row.id,
      after: { reason: data.reason ?? null },
    });
    return { session_id: row.id };
  });

export const endSupportSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { session_id: string }) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);
    await supabase
      .from("support_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", data.session_id)
      .is("ended_at", null);
    return { ok: true };
  });

/* ============================================================
   7) VISÃO FINANCEIRA MASTER
   ============================================================ */
export const getFinancialMasterOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);

    const [
      { data: contracts },
      { data: invoices },
      { data: companies },
      { data: subs },
      { data: modules },
    ] = await Promise.all([
      supabase.from("billing_contracts").select("id,company_id,status,recurring_amount,plan_id"),
      supabase.from("billing_invoices").select("status,amount,due_date,paid_at,company_id"),
      supabase.from("companies").select("id,is_active,is_master,segment"),
      supabase.from("subscriptions").select("status,current_period_end"),
      supabase.from("company_modules").select("company_id,module_id,is_enabled"),
    ]);

    const activeContracts = (contracts ?? []).filter((c: any) => c.status === "active");
    const suspendedContracts = (contracts ?? []).filter((c: any) => c.status === "suspended");
    const mrr = activeContracts.reduce((s: number, c: any) => s + Number(c.recurring_amount ?? 0), 0);
    const arr = mrr * 12;

    const overdueAmount = (invoices ?? [])
      .filter((i: any) => i.status === "overdue" || (i.status === "open" && new Date(i.due_date) < new Date()))
      .reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0);

    const paidLast90 = (invoices ?? []).filter(
      (i: any) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= new Date(Date.now() - 90 * 86400000),
    );
    const revenueLast90 = paidLast90.reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0);

    const totalClients = (companies ?? []).filter((c: any) => !c.is_master && c.is_active).length;
    const churnEstimate = suspendedContracts.length;
    const ltvEstimate = totalClients > 0 ? mrr / Math.max(churnEstimate / 12, 0.01) : 0;

    // Revenue por segmento
    const segmentMap = new Map<string, number>();
    activeContracts.forEach((c: any) => {
      const co = (companies ?? []).find((x: any) => x.id === c.company_id);
      const seg = co?.segment ?? "—";
      segmentMap.set(seg, (segmentMap.get(seg) ?? 0) + Number(c.recurring_amount ?? 0));
    });

    return {
      mrr,
      arr,
      activeClients: totalClients,
      suspendedClients: suspendedContracts.length,
      overdueAmount,
      revenueLast90,
      churnEstimate,
      ltvEstimate,
      activeSubscriptions: (subs ?? []).filter((s: any) => s.status === "active").length,
      revenueBySegment: Array.from(segmentMap.entries()).map(([segment, amount]) => ({ segment, amount })),
    };
  });

/* ============================================================
   8) CENTRAL DE EVENTOS
   ============================================================ */
export const listEventCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);

    const [{ data: templates }, { data: outbox }] = await Promise.all([
      supabase.from("message_templates").select("event_code,channel,is_active,company_id,updated_at"),
      supabase
        .from("message_outbox")
        .select("event_code,channel,status,created_at,sent_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const map = new Map<string, any>();
    (templates ?? []).forEach((t: any) => {
      const key = `${t.event_code}::${t.channel}`;
      const cur = map.get(key) ?? { event_code: t.event_code, channel: t.channel, templates: 0, lastRun: null, totalSent: 0, totalFailed: 0 };
      cur.templates += 1;
      map.set(key, cur);
    });
    (outbox ?? []).forEach((o: any) => {
      const key = `${o.event_code}::${o.channel}`;
      const cur = map.get(key) ?? { event_code: o.event_code, channel: o.channel, templates: 0, lastRun: null, totalSent: 0, totalFailed: 0 };
      if (!cur.lastRun || new Date(o.created_at) > new Date(cur.lastRun)) cur.lastRun = o.created_at;
      if (o.status === "sent") cur.totalSent += 1;
      if (o.status === "failed") cur.totalFailed += 1;
      map.set(key, cur);
    });

    return { events: Array.from(map.values()).sort((a, b) => a.event_code.localeCompare(b.event_code)) };
  });

export const listClientsForGovernance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);
    const { data } = await supabase
      .from("companies")
      .select("id,name,segment,is_active")
      .eq("is_master", false)
      .order("name");
    return { companies: data ?? [] };
  });
