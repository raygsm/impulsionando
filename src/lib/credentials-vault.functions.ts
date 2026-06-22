import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Cofre de Credenciais — super-only.
 * Expõe contratos:
 *  - fetchCredentialVault: inventário unificado normalizado {counts, entries}
 *    (consumido por /admin/cofre-credenciais).
 *  - markRotatedFn: registra rotação no audit_logs e atualiza updated_at.
 *  - listCredentialsVault / toggleCredentialActive / recordIntegrationTest:
 *    APIs auxiliares por tabela.
 *
 * Valores secretos reais ficam em Supabase Vault — aqui só referências/máscaras.
 */

const mask = (s: string | null | undefined) => {
  if (!s) return null;
  const v = String(s);
  if (v.length <= 6) return "•".repeat(v.length);
  return v.slice(0, 3) + "•".repeat(Math.max(4, v.length - 6)) + v.slice(-3);
};

async function requireStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
  if (!staff) throw new Error("Apenas equipe Impulsionando.");
  return supabaseAdmin;
}

const ageDays = (iso: string | null | undefined) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
};

/* ============================================================================
 * fetchCredentialVault — inventário unificado para /admin/cofre-credenciais
 * ============================================================================ */

export const fetchCredentialVault = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await requireStaff(context.userId);

    const [mpRes, waRes, fiRes, intRes] = await Promise.all([
      supabaseAdmin.from("mpago_credentials").select("id, company_id, environment, access_token_secret_name, public_key, webhook_secret_name, user_id_mp, active, created_at, updated_at").limit(2000),
      supabaseAdmin.from("core_whatsapp_credentials").select("id, company_id, label, provider, sender_number, api_base_url, access_token_encrypted, webhook_secret, is_active, is_verified, last_health_check_at, health_status, created_at, updated_at").limit(2000),
      supabaseAdmin.from("core_fiscal_issuer_config").select("id, legal_name, trade_name, cnpj, provider, environment, rps_serie, next_rps_number, is_active, created_at, updated_at").limit(2000),
      supabaseAdmin.from("core_integrations").select("id, slug, name, environment, status, secret_refs, last_test_at, last_error, is_active, created_at, updated_at").limit(2000),
    ]);
    const err = mpRes.error || waRes.error || fiRes.error || intRes.error;
    if (err) throw new Error(err.message);

    const entries: any[] = [];

    for (const r of (intRes.data ?? []) as any[]) {
      entries.push({
        id: `int:${r.id}`, source: "integration", label: r.name ?? r.slug,
        environment: r.environment, status: r.status,
        activeFlag: !!r.is_active,
        hasSecret: !!r.secret_refs && Object.keys(r.secret_refs).length > 0,
        secretRefs: r.secret_refs ? Object.keys(r.secret_refs) : [],
        ageDays: ageDays(r.updated_at ?? r.created_at),
        updatedAt: r.updated_at ?? r.created_at,
      });
    }
    for (const r of (waRes.data ?? []) as any[]) {
      const refs: string[] = [];
      if (r.access_token_encrypted) refs.push("access_token");
      if (r.webhook_secret) refs.push("webhook_secret");
      entries.push({
        id: `wa:${r.id}`, source: "whatsapp", label: r.label ?? r.provider ?? mask(r.sender_number) ?? "WhatsApp",
        environment: r.provider, status: r.health_status ?? (r.is_verified ? "connected" : "pending"),
        activeFlag: !!r.is_active, hasSecret: refs.length > 0, secretRefs: refs,
        ageDays: ageDays(r.updated_at ?? r.created_at), updatedAt: r.updated_at ?? r.created_at,
      });
    }
    for (const r of (mpRes.data ?? []) as any[]) {
      const refs = [r.access_token_secret_name, r.webhook_secret_name].filter(Boolean) as string[];
      entries.push({
        id: `mp:${r.id}`, source: "mercadopago", label: `MP ${r.environment} · ${mask(r.user_id_mp) ?? "—"}`,
        environment: r.environment, status: r.active ? "connected" : "inactive",
        activeFlag: !!r.active, hasSecret: refs.length > 0, secretRefs: refs,
        ageDays: ageDays(r.updated_at ?? r.created_at), updatedAt: r.updated_at ?? r.created_at,
      });
    }
    for (const r of (fiRes.data ?? []) as any[]) {
      entries.push({
        id: `fi:${r.id}`, source: "fiscal", label: r.legal_name ?? r.trade_name ?? "Emissor fiscal",
        environment: r.environment, status: r.is_active ? "connected" : "inactive",
        activeFlag: !!r.is_active, hasSecret: !!r.provider, secretRefs: r.provider ? [r.provider] : [],
        ageDays: ageDays(r.updated_at ?? r.created_at), updatedAt: r.updated_at ?? r.created_at,
      });
    }

    entries.sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));

    const counts = {
      total: entries.length,
      stale: entries.filter((e) => e.ageDays != null && e.ageDays > 180).length,
      inactive: entries.filter((e) => !e.activeFlag).length,
      missingSecret: entries.filter((e) => !e.hasSecret).length,
    };

    return { counts, entries };
  });

/* ============================================================================
 * markRotatedFn — registra rotação no audit_logs e bump updated_at.
 * ============================================================================ */

const TABLE_BY_PREFIX: Record<string, string> = {
  int: "core_integrations", wa: "core_whatsapp_credentials",
  mp: "mpago_credentials", fi: "core_fiscal_issuer_config",
};

export const markRotatedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entryId: string; reason?: string | null }) => ({
    entryId: String(d.entryId), reason: d.reason ?? null,
  }))
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await requireStaff(context.userId);
    const [prefix, realId] = data.entryId.split(":");
    const table = TABLE_BY_PREFIX[prefix];
    if (!table || !realId) throw new Error("Identificador inválido.");

    const { error } = await (supabaseAdmin as any).from(table).update({ updated_at: new Date().toISOString() }).eq("id", realId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId, action: "credential.rotate", entity: table, entity_id: realId,
      metadata: { reason: data.reason, source_prefix: prefix },
    });
    return { ok: true };
  });

/* ============================================================================
 * APIs auxiliares por tabela (úteis para integrações futuras / scripts)
 * ============================================================================ */

export const listCredentialsVault = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId?: string | null }) => ({ companyId: d?.companyId ?? null }))
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await requireStaff(context.userId);
    let mpQ = supabaseAdmin.from("mpago_credentials").select("id, company_id, environment, access_token_secret_name, public_key, webhook_secret_name, user_id_mp, active, created_at, updated_at");
    let waQ = supabaseAdmin.from("core_whatsapp_credentials").select("id, company_id, label, provider, sender_number, is_active, is_verified, health_status, created_at, updated_at");
    let fiQ = supabaseAdmin.from("core_fiscal_issuer_config").select("id, legal_name, trade_name, cnpj, provider, environment, is_active, created_at, updated_at");
    if (data.companyId) { mpQ = mpQ.eq("company_id", data.companyId); waQ = waQ.eq("company_id", data.companyId); }
    const intQ = supabaseAdmin.from("core_integrations").select("id, slug, name, environment, status, last_test_at, last_error, is_active");

    const [mp, wa, fi, it] = await Promise.all([mpQ.limit(2000), waQ.limit(2000), fiQ.limit(2000), intQ.limit(2000)]);
    const err = mp.error || wa.error || fi.error || it.error;
    if (err) throw new Error(err.message);
    return {
      mercadoPago: (mp.data ?? []).map((r: any) => ({ ...r, public_key_masked: mask(r.public_key), user_id_mp_masked: mask(r.user_id_mp) })),
      whatsapp: (wa.data ?? []).map((r: any) => ({ ...r, sender_number_masked: mask(r.sender_number) })),
      fiscal: (fi.data ?? []).map((r: any) => ({ ...r, cnpj_masked: mask(r.cnpj) })),
      integrations: it.data ?? [],
    };
  });

export const toggleCredentialActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: "mpago_credentials" | "core_whatsapp_credentials" | "core_fiscal_issuer_config" | "core_integrations"; id: string; active: boolean }) => d)
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await requireStaff(context.userId);
    const col = data.table === "mpago_credentials" ? "active" : "is_active";
    const { error } = await (supabaseAdmin as any).from(data.table).update({ [col]: data.active, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId, action: "credential.toggle", entity: data.table, entity_id: data.id, metadata: { active: data.active },
    });
    return { ok: true };
  });

export const recordIntegrationTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { integrationId: string; ok: boolean; error?: string }) => d)
  .handler(async ({ context, data }) => {
    const supabaseAdmin = await requireStaff(context.userId);
    const { error } = await supabaseAdmin.from("core_integrations").update({
      last_test_at: new Date().toISOString(),
      last_error: data.ok ? null : (data.error ?? "Falha não identificada"),
      status: data.ok ? "ok" : "error",
      updated_at: new Date().toISOString(),
    }).eq("id", data.integrationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
