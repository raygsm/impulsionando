import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export type CookieAdapter = {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll: (
    cookies: { name: string; value: string; options: CookieOptions }[],
  ) => void | Promise<void>;
};

/** Browser client — no service-role. Session cookies are host-scoped via @supabase/ssr. */
export function createBrowserSupabase(env: PublicSupabaseEnv) {
  return createBrowserClient(env.url, env.anonKey);
}

/** Request-scoped server client. Cookie adapter is provided by the host framework (Next cookies()). */
export function createServerSupabase(env: PublicSupabaseEnv, cookies: CookieAdapter) {
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (toSet) => cookies.setAll(toSet),
    },
  });
}

export async function getAccessTokenFromServer(
  env: PublicSupabaseEnv,
  cookies: CookieAdapter,
): Promise<string | null> {
  const supabase = createServerSupabase(env, cookies);
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getUserFromServer(env: PublicSupabaseEnv, cookies: CookieAdapter) {
  const supabase = createServerSupabase(env, cookies);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
