import { supabase } from "@/integrations/supabase/client";

export async function getCurrentCompanyId(): Promise<string | null> {
  // Generated Supabase types may lag newly applied RPCs, so keep this adapter isolated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("current_user_company_id");
  if (error) throw error;
  return typeof data === "string" && data.length > 0 ? data : null;
}

export async function requireCurrentCompanyId(): Promise<string> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error("Nenhuma empresa ativa está vinculada a este acesso.");
  return companyId;
}
