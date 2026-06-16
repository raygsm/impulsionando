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

/**
 * Smoke test do wizard "Criar Cliente em 1 tela".
 * Cria empresa temporária, valida criação de admin, contrato, 1ª fatura e enqueue
 * de user_welcome, e em seguida limpa todos os artefatos.
 *
 * Retorna um relatório passo-a-passo. NÃO depende de service-role no cliente:
 * tudo roda server-side via supabaseAdmin.
 */
export const runWizardSmokeTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    type Step = { key: string; ok: boolean; detail?: string };
    const steps: Step[] = [];
    const ok = (key: string, detail?: string) => steps.push({ key, ok: true, ...(detail ? { detail } : {}) });
    const fail = (key: string, detail: string) => steps.push({ key, ok: false, detail });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stamp = Date.now();
    const testEmail = `wizard-smoke+${stamp}@impulsionando.com.br`;
    let companyId: string | null = null;
    let contractId: string | null = null;
    let firstInvoiceId: string | null = null;
    let adminUserId: string | null = null;
    let messageId: string | null = null;

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
      const { data: comp, error: cErr } = await supabaseAdmin
        .from("companies")
        .insert({
          name: `Smoke ${stamp}`,
          trade_name: `Smoke ${stamp}`,
          email: testEmail,
          is_demo: true,
          is_active: true,
          status: "active",
          environment: "teste",
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

      // verifica que a mensagem foi enfileirada
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

      return {
        success: steps.every((s) => s.ok),
        steps,
        ids: { companyId, contractId, firstInvoiceId, adminUserId, messageId },
      };
    } catch (e) {
      fail("excecao", (e as Error).message);
      return {
        success: false,
        steps,
        ids: { companyId, contractId, firstInvoiceId, adminUserId, messageId },
      };
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
        // silencioso — cleanup é best-effort
      }
    }
  });
