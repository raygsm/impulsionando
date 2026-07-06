import { createServerFn } from "@tanstack/react-start";

/**
 * Diagnóstico das variáveis de ambiente do Supabase no servidor.
 * NÃO retorna valores — apenas presença, comprimento e primeiros caracteres
 * para permitir identificar rapidamente env vars ausentes ou trocadas.
 */
export const getSupabaseEnvDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  const check = (name: string) => {
    const v = process.env[name];
    return {
      name,
      present: typeof v === "string" && v.length > 0,
      length: v?.length ?? 0,
      preview: v ? `${v.slice(0, 8)}…` : null,
    };
  };
  return {
    timestamp: new Date().toISOString(),
    host: process.env.HOSTNAME ?? null,
    server: [
      check("SUPABASE_URL"),
      check("SUPABASE_PUBLISHABLE_KEY"),
      check("SUPABASE_ANON_KEY"),
      check("SUPABASE_PROJECT_ID"),
      check("SUPABASE_SERVICE_ROLE_KEY"),
    ],
  };
});
