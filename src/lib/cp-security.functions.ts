import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCpReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff, error: staffError } = await context.supabase.rpc("is_impulsionando_staff", { _user: context.userId });
    if (staffError) throw new Error(staffError.message);
    if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");

    const { data, error } = await context.supabase.rpc("cp_readiness_snapshot");
    if (error) throw new Error(error.message);
    return data as {
      module_status_tecnico: string;
      module_status_comercial: string;
      readiness_status: string;
      checklist: Record<string, boolean>;
      security_profile_version: string | null;
      security_profile_status: string | null;
      provider_has_decryption_keys: boolean;
      content_backups_allowed: boolean;
      legacy_payload_rows: number;
      dedicated_payload_rows: number;
      message_writes_fail_closed: boolean;
      captured_at: string;
    };
  });
