/**
 * Auto-provisioning — fluxo de implantação automática após pagamento aprovado.
 *
 * Idempotente. Disparado pelo webhook do Mercado Pago e pela verificação
 * manual de status. Reutiliza 100% da infra existente:
 *  - companies (triggers bootstrap CRM/Financeiro/Estoque já existentes)
 *  - user_profiles + profiles (perfil "gestor-empresa")
 *  - billing_contracts + billing_plans (plano padrão)
 *  - company_modules + modules (instala módulos contratados)
 *  - onboarding_checklist (marca etapas concluídas)
 *  - enqueue_message (boas-vindas + onboarding)
 *  - audit_logs (rastreabilidade)
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Payment = {
  mp_payment_id: string;
  status: string;
  user_id: string | null;
  empresa_id: string | null;
  payer_name: string | null;
  payer_email: string | null;
  customer_phone: string | null;
  modulo_id: string | null;
  module_slugs: string[] | null;
  amount_cents: number;
  paid_at: string | null;
  approved_at: string | null;
  provisioning_status: string;
};

function slugify(s: string): string {
  return (s || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

async function appendLog(mpPaymentId: string, entry: Record<string, unknown>) {
  const { data } = await (supabaseAdmin as any)
    .from("mpago_payments")
    .select("provisioning_log")
    .eq("mp_payment_id", mpPaymentId)
    .maybeSingle();
  const log = Array.isArray(data?.provisioning_log) ? (data!.provisioning_log as any[]) : [];
  log.push({ at: new Date().toISOString(), ...entry });
  await (supabaseAdmin as any)
    .from("mpago_payments")
    .update({ provisioning_log: log })
    .eq("mp_payment_id", mpPaymentId);
}

/**
 * Faz todo o fluxo de provisionamento. Idempotente: se já provisionou, retorna.
 *
 * @param mpPaymentId  ID do pagamento no Mercado Pago (mp_payment_id).
 */
export async function autoProvisionFromPayment(mpPaymentId: string): Promise<{
  ok: boolean;
  companyId?: string;
  userId?: string;
  installedSlugs: string[];
  skipped?: string;
}> {
  const { data: row, error } = await (supabaseAdmin as any)
    .from("mpago_payments")
    .select(
      "mp_payment_id, status, user_id, empresa_id, payer_name, payer_email, customer_phone, modulo_id, module_slugs, amount_cents, paid_at, approved_at, provisioning_status",
    )
    .eq("mp_payment_id", mpPaymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return { ok: false, installedSlugs: [], skipped: "not_found" };
  const p = row as Payment;

  if (p.status !== "approved") return { ok: false, installedSlugs: [], skipped: "not_paid" };
  if (p.provisioning_status === "done") return { ok: true, installedSlugs: [], skipped: "already_done" };

  await (supabaseAdmin as any)
    .from("mpago_payments")
    .update({ provisioning_status: "running" })
    .eq("mp_payment_id", mpPaymentId);

  const paidAt = p.paid_at ?? p.approved_at;

  // 1. Empresa
  let companyId = p.empresa_id;
  if (!companyId) {
    const baseName = p.payer_name || (p.payer_email?.split("@")[0] ?? "Empresa Cliente");
    const { data: company, error: cErr } = await supabaseAdmin
      .from("companies")
      .insert({
        name: baseName,
        email: p.payer_email,
        phone: p.customer_phone,
        is_active: true,
        is_master: false,
      })
      .select("id")
      .single();
    if (cErr) {
      await appendLog(mpPaymentId, { step: "company", error: cErr.message });
      await (supabaseAdmin as any)
        .from("mpago_payments")
        .update({ provisioning_status: "error" })
        .eq("mp_payment_id", mpPaymentId);
      throw new Error(cErr.message);
    }
    companyId = company.id;
    await appendLog(mpPaymentId, { step: "company", id: companyId, slug: slugify(baseName) });
  }

  // 2. Usuário administrador (se ainda não existe)
  let userId = p.user_id;
  if (!userId && p.payer_email) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users?.find((u: any) => (u.email ?? "").toLowerCase() === p.payer_email!.toLowerCase());
    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
        email: p.payer_email,
        email_confirm: true,
        user_metadata: { display_name: p.payer_name, phone: p.customer_phone },
      });
      if (uErr) {
        await appendLog(mpPaymentId, { step: "user", error: uErr.message });
      } else {
        userId = created.user?.id ?? null;
        await appendLog(mpPaymentId, { step: "user", id: userId });
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: p.payer_email,
        });
      }
    }
  }

  // 3. Vincula usuário à nova empresa com perfil "Gestor da Empresa"
  if (userId && companyId) {
    const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("slug", "gestor-empresa").maybeSingle();
    if (profile) {
      await supabaseAdmin.from("user_profiles").upsert(
        {
          user_id: userId,
          company_id: companyId,
          profile_id: profile.id,
          display_name: p.payer_name,
          email: p.payer_email,
          is_active: true,
        },
        { onConflict: "user_id,company_id" },
      );
      await appendLog(mpPaymentId, { step: "user_profile", profile: "gestor-empresa" });
    }
  }

  // 4. Contrato recorrente (plano padrão)
  if (companyId) {
    const { data: existingContract } = await supabaseAdmin
      .from("billing_contracts")
      .select("id")
      .eq("company_id", companyId)
      .maybeSingle();
    if (!existingContract) {
      const { data: plan } = await supabaseAdmin
        .from("billing_plans")
        .select("id, recurring_amount, setup_fee, due_day")
        .eq("is_default", true)
        .maybeSingle();
      if (plan) {
        const today = new Date();
        const due = new Date(today.getFullYear(), today.getMonth() + 1, plan.due_day);
        await supabaseAdmin.from("billing_contracts").insert({
          company_id: companyId,
          plan_id: plan.id,
          start_date: today.toISOString().slice(0, 10),
          due_day: plan.due_day,
          next_due_date: due.toISOString().slice(0, 10),
          recurring_amount: plan.recurring_amount,
          setup_amount: plan.setup_fee,
          setup_paid_at: paidAt,
          status: "active",
        });
        await appendLog(mpPaymentId, { step: "contract", plan_id: plan.id });
      }
    }
  }

  // 5. Módulos contratados
  const slugs = new Set<string>();
  (p.module_slugs ?? []).forEach((s) => s && slugs.add(s));
  if (p.modulo_id) slugs.add(p.modulo_id);
  ["dashboard", "configuracoes", "usuarios"].forEach((s) => slugs.add(s));

  const installed: string[] = [];
  if (companyId && slugs.size > 0) {
    const { data: mods } = await supabaseAdmin
      .from("modules")
      .select("id, slug, current_version, dependencies")
      .in("slug", Array.from(slugs))
      .eq("is_active", true);
    const allSlugs = new Set<string>(Array.from(slugs));
    (mods ?? []).forEach((m: any) => (m.dependencies ?? []).forEach((d: string) => allSlugs.add(d)));
    const { data: allMods } = await supabaseAdmin
      .from("modules")
      .select("id, slug, current_version")
      .in("slug", Array.from(allSlugs))
      .eq("is_active", true);
    for (const m of allMods ?? []) {
      await supabaseAdmin.from("company_modules").upsert(
        {
          company_id: companyId,
          module_id: m.id,
          is_enabled: true,
          installed_version: m.current_version,
          installed_at: new Date().toISOString(),
          enabled_at: new Date().toISOString(),
        },
        { onConflict: "company_id,module_id" },
      );
      await supabaseAdmin.from("audit_logs").insert({
        company_id: companyId,
        action: "module.auto_installed",
        entity: "company_modules",
        entity_id: m.id,
        after: { slug: m.slug, version: m.current_version, source: "mercadopago", mp_payment_id: mpPaymentId },
      } as never);
      installed.push(m.slug);
    }
    await appendLog(mpPaymentId, { step: "modules", installed });
  }

  // 6. Checklist
  if (companyId) {
    const items = ["payment_approved", "modules_activated"];
    for (const k of items) {
      await supabaseAdmin.from("onboarding_checklist").upsert(
        {
          company_id: companyId,
          item_key: k,
          status: "done",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "company_id,item_key" },
      );
    }
  }

  // 7. Comunicação (e-mail + WhatsApp + in-app)
  if (companyId) {
    try {
      await supabaseAdmin.rpc("enqueue_message", {
        _event_code: "user_welcome",
        _company_id: companyId,
        _recipient_user_id: userId ?? undefined,
        _recipient_email: p.payer_email ?? "",
        _recipient_phone: p.customer_phone ?? "",
        _recipient_name: p.payer_name ?? "Cliente",
        _payload: {
          user_name: p.payer_name ?? "Cliente",
          user_email: p.payer_email ?? "",
          app_url: "https://impulsionando.com.br/onboarding",
          modules: installed.join(", "),
        },
        _channels: ["email", "whatsapp", "in_app"],
        _reference_type: "mpago_payment",
        _reference_id: mpPaymentId,
      } as never);
      await appendLog(mpPaymentId, { step: "comms", ok: true });
    } catch (e: any) {
      await appendLog(mpPaymentId, { step: "comms", error: e.message });
    }
  }

  // 8. Finaliza
  await (supabaseAdmin as any)
    .from("mpago_payments")
    .update({
      provisioning_status: "done",
      provisioned_at: new Date().toISOString(),
      empresa_id: companyId,
      user_id: userId,
      paid_at: paidAt ?? new Date().toISOString(),
    })
    .eq("mp_payment_id", mpPaymentId);

  return { ok: true, companyId: companyId ?? undefined, userId: userId ?? undefined, installedSlugs: installed };
}
