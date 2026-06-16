import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Lista todas as empresas demo (uma por nicho) com contrato e fatura inicial.
 * Acessível por super admin / staff Impulsionando.
 */
export const listDemoCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select(
        `id, name, trade_name, email, environment, status, primary_color, secondary_color,
         niche:niche_id ( id, slug, name ),
         contracts:billing_contracts ( id, status, recurring_amount, setup_amount, next_due_date,
           invoices:billing_invoices ( id, status, amount, due_date )
         )`,
      )
      .eq("is_demo", true)
      .order("name");
    if (error) throw new Error(error.message);
    return { demos: data ?? [] };
  });

/**
 * Gera um magic link para "Entrar como" o admin de uma empresa demo.
 * Não cria usuário real — apenas devolve link de acesso temporário.
 */
export const impersonateDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, email, is_demo")
      .eq("id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!company || !company.is_demo) throw new Error("Empresa não é uma demo.");
    if (!company.email) throw new Error("Demo sem e-mail de acesso.");

    // garante usuário admin para a demo (idempotente)
    let adminUserId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === company.email!.toLowerCase());
    if (found) {
      adminUserId = found.id;
    } else {
      const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
        email: company.email,
        email_confirm: true,
        user_metadata: { display_name: `Admin Demo — ${company.name}`, is_demo: true },
      });
      if (uErr || !created.user) throw new Error(uErr?.message ?? "Falha ao criar usuário demo.");
      adminUserId = created.user.id;

      const { data: gestor } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("slug", "gestor-empresa")
        .maybeSingle();
      if (gestor) {
        await supabaseAdmin.from("user_profiles").upsert(
          {
            user_id: adminUserId,
            company_id: company.id,
            profile_id: gestor.id,
            display_name: `Admin Demo — ${company.name}`,
            email: company.email,
            is_active: true,
          } as never,
          { onConflict: "user_id,company_id" },
        );
      }
    }

    const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: company.email,
    });
    if (lErr) throw new Error(lErr.message);

    return {
      companyId: company.id,
      adminUserId,
      inviteLink: link?.properties?.action_link ?? null,
    };
  });

type SmokeStep = { key: string; ok: boolean; detail?: string };
type SmokeResult = {
  success: boolean;
  steps: SmokeStep[];
  ids: {
    companyId: string | null;
    contractId: string | null;
    firstInvoiceId: string | null;
    adminUserId: string | null;
    messageId: string | null;
  };
  durationMs: number;
  label: string;
  nicheSlug: string | null;
  error?: string;
};

async function executeSmokeOnce(opts: {
  label: string;
  nicheSlug: string | null;
}): Promise<SmokeResult> {
  const start = Date.now();
  const steps: SmokeStep[] = [];
  const ok = (key: string, detail?: string) =>
    steps.push({ key, ok: true, ...(detail ? { detail } : {}) });
  const fail = (key: string, detail: string) =>
    steps.push({ key, ok: false, detail });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  const slug = (opts.nicheSlug ?? "smoke").replace(/[^a-z0-9]/gi, "");
  const testEmail = `wizard-smoke+${slug}-${stamp}@impulsionando.com.br`;
  let companyId: string | null = null;
  let contractId: string | null = null;
  let firstInvoiceId: string | null = null;
  let adminUserId: string | null = null;
  let messageId: string | null = null;
  let errorMsg: string | undefined;

  try {
    // 1) plano
    const { data: plan } = await supabaseAdmin
      .from("billing_plans")
      .select("id, recurring_amount, setup_fee, due_day")
      .eq("is_active", true)
      .order("recurring_amount")
      .limit(1)
      .maybeSingle();
    if (!plan) throw new Error("Sem billing_plan ativo");
    ok("plano_localizado", plan.id);

    // 2) empresa
    let nicheId: string | null = null;
    if (opts.nicheSlug) {
      const { data: n } = await supabaseAdmin
        .from("niches")
        .select("id")
        .eq("slug", opts.nicheSlug)
        .maybeSingle();
      nicheId = n?.id ?? null;
    }
    const { data: comp, error: cErr } = await supabaseAdmin
      .from("companies")
      .insert({
        name: `Smoke ${opts.label}`,
        trade_name: `Smoke ${opts.label}`,
        email: testEmail,
        is_demo: true,
        is_active: true,
        status: "active",
        environment: "teste",
        niche_id: nicheId,
      } as never)
      .select("id")
      .single();
    if (cErr || !comp) throw new Error(`Empresa: ${cErr?.message}`);
    companyId = comp.id;
    ok("empresa_criada", companyId);

    // 3) admin
    const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
      user_metadata: { display_name: "Smoke Admin" },
    });
    if (uErr || !created.user) throw new Error(`Admin: ${uErr?.message}`);
    adminUserId = created.user.id;
    ok("admin_criado", adminUserId);

    const { data: gestor } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("slug", "gestor-empresa")
      .maybeSingle();
    if (gestor) {
      await supabaseAdmin.from("user_profiles").insert({
        user_id: adminUserId,
        company_id: companyId,
        profile_id: gestor.id,
        display_name: "Smoke Admin",
        email: testEmail,
        is_active: true,
      } as never);
      ok("admin_vinculado", "gestor-empresa");
    } else {
      fail("admin_vinculado", "perfil gestor-empresa não encontrado");
    }

    // 4) magic link
    const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });
    if (lErr) fail("magic_link", lErr.message);
    else ok("magic_link", link?.properties?.action_link ? "ok" : "vazio");

    // 5) contrato
    const dueDay = Math.min(plan.due_day ?? 10, 28);
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    const todayIso = today.toISOString().slice(0, 10);
    const dueIso = due.toISOString().slice(0, 10);
    const { data: ct, error: ctErr } = await supabaseAdmin
      .from("billing_contracts")
      .insert({
        company_id: companyId,
        plan_id: plan.id,
        start_date: todayIso,
        due_day: dueDay,
        next_due_date: dueIso,
        recurring_amount: Number(plan.recurring_amount),
        setup_amount: Number(plan.setup_fee ?? 0),
        status: "active",
      } as never)
      .select("id")
      .single();
    if (ctErr || !ct) throw new Error(`Contrato: ${ctErr?.message}`);
    contractId = ct.id;
    ok("contrato_criado", contractId);

    // 6) 1ª fatura
    const amount = Number(plan.recurring_amount) + Number(plan.setup_fee ?? 0);
    const { data: inv, error: invErr } = await supabaseAdmin
      .from("billing_invoices")
      .insert({
        contract_id: contractId,
        company_id: companyId,
        period_start: todayIso,
        period_end: dueIso,
        due_date: dueIso,
        amount,
        status: "open",
      } as never)
      .select("id")
      .single();
    if (invErr || !inv) throw new Error(`Fatura: ${invErr?.message}`);
    firstInvoiceId = inv.id;
    ok("fatura_gerada", `R$ ${amount.toFixed(2)}`);

    // 7) enqueue user_welcome
    await supabaseAdmin.rpc("enqueue_message", {
      _event_code: "user_welcome",
      _company_id: companyId,
      _recipient_user_id: adminUserId,
      _recipient_email: testEmail,
      _recipient_phone: "",
      _recipient_name: "Smoke Admin",
      _payload: {
        user_name: "Smoke Admin",
        user_email: testEmail,
        app_url: "https://impulsionando.com.br/onboarding",
        invite_link: link?.properties?.action_link ?? "",
      } as never,
      _channels: ["email", "whatsapp", "in_app"] as never,
      _reference_type: "factory_project",
      _reference_id: companyId,
    } as never);

    const { data: msg } = await supabaseAdmin
      .from("message_outbox")
      .select("id, event_code, channel")
      .eq("event_code", "user_welcome")
      .eq("recipient_email", testEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (msg) {
      messageId = (msg as { id: string }).id;
      ok("mensagem_enfileirada", `outbox#${messageId}`);
    } else {
      fail("mensagem_enfileirada", "linha não encontrada em message_outbox");
    }
  } catch (e) {
    errorMsg = (e as Error).message;
    fail("excecao", errorMsg);
  } finally {
    // cleanup — best-effort
    try {
      if (messageId !== null) {
        await supabaseAdmin.from("message_outbox").delete().eq("id", messageId);
      }
      if (firstInvoiceId) {
        await supabaseAdmin.from("billing_invoices").delete().eq("id", firstInvoiceId);
      }
      if (contractId) {
        await supabaseAdmin.from("billing_contracts").delete().eq("id", contractId);
      }
      if (adminUserId && companyId) {
        await supabaseAdmin.from("user_profiles").delete().eq("user_id", adminUserId).eq("company_id", companyId);
      }
      if (companyId) {
        await supabaseAdmin.from("companies").delete().eq("id", companyId);
      }
      if (adminUserId) {
        await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      }
    } catch {
      // silencioso
    }
  }

  return {
    success: steps.every((s) => s.ok),
    steps,
    ids: { companyId, contractId, firstInvoiceId, adminUserId, messageId },
    durationMs: Date.now() - start,
    label: opts.label,
    nicheSlug: opts.nicheSlug,
    ...(errorMsg ? { error: errorMsg } : {}),
  };
}

async function persistRun(
  triggeredBy: string,
  result: SmokeResult,
  batchId: string | null,
  replayOf: string | null = null,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("core_smoke_runs")
    .insert({
      triggered_by: triggeredBy,
      label: result.label,
      niche_slug: result.nicheSlug,
      success: result.success,
      duration_ms: result.durationMs,
      steps: result.steps as never,
      ids: result.ids as never,
      error: result.error ?? null,
      batch_id: batchId,
      replay_of: replayOf,
    } as never)
    .select("id")
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Smoke test do wizard — execução única.
 */
export const runWizardSmokeTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ label: z.string().optional(), nicheSlug: z.string().optional() })
      .optional()
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const result = await executeSmokeOnce({
      label: data?.label ?? `single-${Date.now()}`,
      nicheSlug: data?.nicheSlug ?? null,
    });
    await persistRun(userId, result, null);
    return result;
  });

/**
 * Smoke test em lote — executa para múltiplos nichos/labels em sequência.
 */
export const runWizardSmokeBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targets: z
          .array(z.object({ label: z.string(), nicheSlug: z.string().nullable() }))
          .min(1)
          .max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const batchId = crypto.randomUUID();
    const results: SmokeResult[] = [];
    for (const t of data.targets) {
      const r = await executeSmokeOnce({ label: t.label, nicheSlug: t.nicheSlug });
      results.push(r);
      await persistRun(userId, r, batchId);
    }
    const totalMs = results.reduce((acc, r) => acc + r.durationMs, 0);
    const okCount = results.filter((r) => r.success).length;
    return {
      batchId,
      totalMs,
      okCount,
      failCount: results.length - okCount,
      results,
    };
  });

/**
 * Reexecuta uma run registrada usando o mesmo label/nicho.
 * Observação: como o smoke test sempre limpa os artefatos no final, os IDs
 * originais (companyId/contractId/...) já não existem no banco. A reexecução
 * mantém os parâmetros (label/niche) e fica vinculada à run original via
 * `replay_of`, permitindo auditoria do encadeamento.
 */
export const replaySmokeRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: original, error } = await supabaseAdmin
      .from("core_smoke_runs")
      .select("id, label, niche_slug")
      .eq("id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!original) throw new Error("Execução original não encontrada.");

    const o = original as { id: string; label: string | null; niche_slug: string | null };
    const result = await executeSmokeOnce({
      label: o.label ?? `replay-${Date.now()}`,
      nicheSlug: o.niche_slug,
    });
    const newId = await persistRun(userId, result, null, o.id);
    return { ...result, newRunId: newId, replayOf: o.id };
  });

const historyFiltersSchema = z
  .object({
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
    sinceDays: z.number().int().min(1).max(3650).nullable().optional(),
    status: z.enum(["all", "success", "failure"]).optional(),
    search: z.string().optional(),
    nicheSlug: z.string().nullable().optional(),
  })
  .optional();

function buildHistoryQuery(
  client: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server").then>>["supabaseAdmin"],
  filters: {
    sinceDays?: number | null;
    status?: "all" | "success" | "failure";
    search?: string;
    nicheSlug?: string | null;
  },
  withCount: boolean,
) {
  let q = client
    .from("core_smoke_runs")
    .select(
      "id, triggered_by, label, niche_slug, success, duration_ms, steps, ids, error, batch_id, replay_of, created_at",
      withCount ? { count: "exact" } : undefined,
    )
    .order("created_at", { ascending: false });

  if (filters.sinceDays && filters.sinceDays > 0) {
    const since = new Date(Date.now() - filters.sinceDays * 86_400_000).toISOString();
    q = q.gte("created_at", since);
  }
  if (filters.status === "success") q = q.eq("success", true);
  else if (filters.status === "failure") q = q.eq("success", false);
  if (filters.nicheSlug) q = q.eq("niche_slug", filters.nicheSlug);
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().replace(/[%,]/g, "");
    q = q.or(`label.ilike.%${s}%,niche_slug.ilike.%${s}%,error.ilike.%${s}%`);
  }
  return q;
}

/**
 * Histórico das execuções do smoke test, paginado e filtrado.
 */
export const listSmokeHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => historyFiltersSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const limit = data?.limit ?? 50;
    const offset = data?.offset ?? 0;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error, count } = await buildHistoryQuery(
      supabaseAdmin,
      {
        sinceDays: data?.sinceDays ?? null,
        status: data?.status ?? "all",
        search: data?.search,
        nicheSlug: data?.nicheSlug ?? null,
      },
      true,
    ).range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { runs: rows ?? [], total: count ?? 0 };
  });

/**
 * Histórico completo (até 1000) para export CSV/PDF — usa os mesmos filtros da listagem.
 */
export const exportSmokeHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => historyFiltersSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await buildHistoryQuery(
      supabaseAdmin,
      {
        sinceDays: data?.sinceDays ?? null,
        status: data?.status ?? "all",
        search: data?.search,
        nicheSlug: data?.nicheSlug ?? null,
      },
      false,
    ).limit(1000);
    if (error) throw new Error(error.message);
    return { runs: rows ?? [] };
  });



