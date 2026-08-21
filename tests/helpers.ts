import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON || !SERVICE) {
  throw new Error("Missing SUPABASE env vars (URL, PUBLISHABLE, SERVICE_ROLE)");
}

export const admin = createClient(SUPABASE_URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const PROFILES = {
  superAdmin: "6fbbb7e6-01ae-447f-bd66-85aeba9f54c4",
  suporte: "91c932fc-a199-4dba-abfd-4a60a4514052",
  gestor: "fcaf3905-2f47-4afa-b16e-0844b92706e5",
  recepcao: "87e0595a-2cc9-45b5-8df0-4e288b191728",
};

export const MASTER_COMPANY = "eb102fc8-5575-4c71-91dc-3ed48be9b353";

export async function createUser(email: string, password = "TestPass123!") {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!;
}

export async function deleteUser(id: string) {
  await admin.auth.admin.deleteUser(id).catch(() => {});
}

export async function signIn(email: string, password = "TestPass123!") {
  const c = anonClient();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client: c, session: data.session! };
}

/**
 * Legacy helper. Retained to avoid silently breaking historical suites.
 * Ecosystem/Core tests should seed `user_roles` directly.
 */
export async function assignProfile(opts: {
  userId: string;
  companyId: string;
  profileId: string;
  email: string;
}) {
  const { error } = await admin.from("user_profiles").insert({
    user_id: opts.userId,
    company_id: opts.companyId,
    profile_id: opts.profileId,
    email: opts.email,
    display_name: opts.email.split("@")[0],
    is_active: true,
  });
  if (error) throw error;

  // Historical permission suites expect a commercially active company context.
  // Seed an active trial so user_has_permission() exercises the intended RLS path
  // without requiring a real subscription or external billing side effect.
  const { error: trialError } = await admin.from("trial_subscriptions").insert({
    company_id: opts.companyId,
    user_id: opts.userId,
    contact_name: opts.email.split("@")[0],
    contact_company: `E2E ${opts.companyId.slice(0, 8)}`,
    contact_email: opts.email,
    contact_whatsapp: "+5500000000000",
    chosen_plan: "essencial",
    status: "ativo",
    started_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    source: "e2e-helper",
  });
  if (trialError) throw trialError;
}

export async function createCompany(name: string) {
  // Synthetic E2E companies must never enter commercial provisioning, DNS,
  // billing or showcase automation. Marking them demo keeps tenant isolation
  // tests realistic while preventing production side effects.
  const { data, error } = await admin
    .from("companies")
    .insert({ name, is_active: true, is_demo: true, status: "active" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function deleteRows(table: string, companyId: string) {
  const { error } = await admin.from(table).delete().eq("company_id", companyId);
  if (error) throw new Error(`cleanup_${table}_failed:${error.message}`);
}

export async function deleteCompany(id: string) {
  // Company provisioning creates these rows automatically for commercial
  // companies. Keep defensive cleanup for historical suites created before
  // synthetic companies were marked as demo.
  await deleteRows("user_roles", id);
  await deleteRows("trial_subscriptions", id);
  // core_service_access_events is an immutable ledger and intentionally cannot
  // be deleted through service_role. Never weaken that guarantee for teardown.
  await deleteRows("core_service_access_state", id);
  await deleteRows("communication_tenants", id);
  await deleteRows("core_client_enrollment", id);
  // core_tenant_identity is ON DELETE CASCADE and is intentionally left to the FK.

  const { error } = await admin.from("companies").delete().eq("id", id);
  if (error) throw new Error(`cleanup_companies_failed:${error.message}`);

  const { data: stillThere, error: verifyError } = await admin
    .from("companies")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (verifyError) throw new Error(`cleanup_company_verify_failed:${verifyError.message}`);
  if (stillThere) throw new Error(`cleanup_company_verify_failed:${id}`);
}
