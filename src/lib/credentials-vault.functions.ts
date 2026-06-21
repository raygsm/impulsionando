import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export type VaultEntry = {
  id: string;
  source: "integration" | "whatsapp" | "mercadopago" | "fiscal";
  label: string;
  environment?: string;
  status?: string;
  activeFlag: boolean;
  hasSecret: boolean;
  secretRefs: string[];
  ageDays: number | null;
  updatedAt: string;
  lastTestAt?: string | null;
  meta?: Record<string, any>;
};

function ageInDays(ts?: string | null): number | null {
  if (!ts) return null;
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86400_000);
}

export const fetchCredentialVault = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const [intRes, waRes, mpRes, fxRes] = await Promise.all([
      context.supabase.from("core_integrations" as any).select("id,slug,name,environment,status,is_active,secret_refs,last_test_at,last_error,updated_at"),
      context.supabase.from("core_whatsapp_credentials" as any).select("id,label,provider,purpose,sender_number,is_active,is_verified,health_status,last_health_check_at,access_token_encrypted,webhook_secret,updated_at,company_id"),
      context.supabase.from("mpago_credentials" as any).select("id,environment,access_token_secret_name,public_key,webhook_secret_name,user_id_mp,active,updated_at,company_id"),
      context.supabase.from("core_fiscal_issuer_config" as any).select("id,legal_name,cnpj,provider,environment,is_active,updated_at"),
    ]);

    const entries: VaultEntry[] = [];

    for (const r of (intRes.data ?? []) as any[]) {
      const refs = Object.values(r.secret_refs ?? {}).filter(Boolean) as string[];
      entries.push({
        id: `int:${r.id}`, source: "integration",
        label: `${r.name} (${r.slug})`,
        environment: r.environment, status: r.status, activeFlag: !!r.is_active,
        hasSecret: refs.length > 0, secretRefs: refs.map(String),
        ageDays: ageInDays(r.last_test_at ?? r.updated_at),
        updatedAt: r.updated_at, lastTestAt: r.last_test_at,
        meta: { last_error: r.last_error },
      });
    }
    for (const r of (waRes.data ?? []) as any[]) {
      const refs = [r.access_token_encrypted, r.webhook_secret].filter(Boolean) as string[];
      entries.push({
        id: `wa:${r.id}`, source: "whatsapp",
        label: `${r.label} · ${r.sender_number}`,
        environment: r.provider, status: r.health_status, activeFlag: !!r.is_active,
        hasSecret: refs.length > 0, secretRefs: refs.map(maskSecret),
        ageDays: ageInDays(r.updated_at), updatedAt: r.updated_at, lastTestAt: r.last_health_check_at,
        meta: { purpose: r.purpose, verified: r.is_verified, company_id: r.company_id },
      });
    }
    for (const r of (mpRes.data ?? []) as any[]) {
      const refs = [r.access_token_secret_name, r.webhook_secret_name].filter(Boolean) as string[];
      entries.push({
        id: `mp:${r.id}`, source: "mercadopago",
        label: `Mercado Pago · ${r.environment}`,
        environment: r.environment, status: r.active ? "connected" : "disabled", activeFlag: !!r.active,
        hasSecret: refs.length > 0, secretRefs: refs.map(String),
        ageDays: ageInDays(r.updated_at), updatedAt: r.updated_at,
        meta: { user_id_mp: r.user_id_mp, public_key: maskSecret(r.public_key), company_id: r.company_id },
      });
    }
    for (const r of (fxRes.data ?? []) as any[]) {
      entries.push({
        id: `fx:${r.id}`, source: "fiscal",
        label: `${r.legal_name} · ${r.provider}`,
        environment: r.environment, status: r.is_active ? "connected" : "disabled", activeFlag: !!r.is_active,
        hasSecret: true, secretRefs: ["FOCUS_NFE_TOKEN"],
        ageDays: ageInDays(r.updated_at), updatedAt: r.updated_at,
        meta: { cnpj: r.cnpj },
      });
    }

    entries.sort((a, b) => (a.ageDays ?? -1) > (b.ageDays ?? -1) ? -1 : 1);

    const counts = entries.reduce(
      (acc, e) => {
        acc.total++;
        if (e.ageDays != null && e.ageDays > 180) acc.stale++;
        if (!e.activeFlag) acc.inactive++;
        if (!e.hasSecret) acc.missingSecret++;
        return acc;
      },
      { total: 0, stale: 0, inactive: 0, missingSecret: 0 },
    );

    return { entries, counts };
  });

function maskSecret(s: string | null | undefined): string {
  if (!s) return "—";
  const str = String(s);
  if (str.length <= 8) return "••••";
  return `${str.slice(0, 4)}••••${str.slice(-4)} (${str.length})`;
}

export const markRotatedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entryId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const [src, id] = data.entryId.split(":");
    const now = new Date().toISOString();
    const tableMap: Record<string, string> = {
      int: "core_integrations", wa: "core_whatsapp_credentials",
      mp: "mpago_credentials", fx: "core_fiscal_issuer_config",
    };
    const table = tableMap[src];
    if (!table) throw new Error("Origem desconhecida");
    // Update updated_at as rotation marker
    const { error } = await context.supabase.from(table as any).update({ updated_at: now }).eq("id", id);
    if (error) throw new Error(error.message);
    // Audit trail
    await context.supabase.from("audit_logs" as any).insert({
      user_id: context.userId,
      action: "credential.rotated",
      entity: table,
      entity_id: id,
      metadata: { reason: data.reason ?? null, rotated_at: now },
    });
    return { ok: true, rotatedAt: now };
  });
