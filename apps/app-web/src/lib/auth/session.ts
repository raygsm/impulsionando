import { cookies } from "next/headers";
import { getAccessTokenFromServer, getUserFromServer, type CookieAdapter } from "@impulsionando/auth";
import { missingAuthEnvNames } from "@impulsionando/config";
import { appWebEnv } from "@/lib/config/env";

async function cookieAdapter(): Promise<CookieAdapter> {
  const store = await cookies();
  return {
    getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (toSet) => {
      try {
        for (const c of toSet) {
          store.set(c.name, c.value, c.options);
        }
      } catch {
        // Called from a Server Component that cannot set cookies — middleware refresh handles it.
      }
    },
  };
}

export async function readAccessToken(): Promise<string | null> {
  const env = appWebEnv();
  if (missingAuthEnvNames(env).length) return null;
  return getAccessTokenFromServer(
    { url: env.supabaseUrl, anonKey: env.supabaseAnonKey },
    await cookieAdapter(),
  );
}

export async function readUser() {
  const env = appWebEnv();
  if (missingAuthEnvNames(env).length) return null;
  return getUserFromServer({ url: env.supabaseUrl, anonKey: env.supabaseAnonKey }, await cookieAdapter());
}
