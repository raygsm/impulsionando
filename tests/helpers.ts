import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
// The application-facing publishable key is the source of truth for public/RLS tests.
// Keep SUPABASE_PUBLISHABLE_KEY as a compatibility fallback only.
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

// Legacy profile ids are kept only for older test modules that have not yet
// migrated to the current user_roles model. New Core tests must use user_roles.
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
}

export async function createCompany(name: string) {
  const { data, error } = await admin
    .from("companies")
    .insert({ name, is_active: true, status: "active" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteCompany(id: string) {
  await admin.from("user_roles").delete().eq("company_id", id);
  await admin.from("companies").delete().eq("id", id);
}
