/**
 * Auditoria detalhada para ações clínicas (CHRISMED e demais clínicas).
 * Sempre registra company_id + user_id e snapshot before/after.
 *
 * Categorias cobertas:
 *  - patient.create / patient.update / patient.delete / patient.view
 *  - appointment.create / appointment.update / appointment.cancel / appointment.complete / appointment.no_show
 *  - payment.charge / payment.refund / payment.failed
 *  - template.create / template.update / template.delete
 *  - permission.grant / permission.revoke / permission.role_change
 *  - access.login / access.impersonate / access.export
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ClinicalAction = z.enum([
  "patient.create", "patient.update", "patient.delete", "patient.view",
  "appointment.create", "appointment.update", "appointment.cancel",
  "appointment.complete", "appointment.no_show",
  "payment.charge", "payment.refund", "payment.failed",
  "template.create", "template.update", "template.delete",
  "permission.grant", "permission.revoke", "permission.role_change",
  "access.login", "access.impersonate", "access.export",
]);

const Input = z.object({
  company_id: z.string().uuid(),
  action: ClinicalAction,
  entity: z.string().min(1),
  entity_id: z.string().optional(),
  before: z.record(z.any()).optional(),
  after: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const logClinicalAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    // Confirma que o usuário pertence à company_id informada (defesa em profundidade
    // — RLS de audit_logs também valida, mas evita gravar metadados de outra empresa).
    const { data: prof } = await context.supabase
      .from("user_profiles")
      .select("company_id, email")
      .eq("user_id", context.userId)
      .eq("company_id", data.company_id)
      .maybeSingle();

    if (!prof) {
      const { data: staff } = await context.supabase.rpc("is_impulsionando_staff", {
        _user: context.userId,
      });
      if (!staff) throw new Response("Forbidden: user not in company", { status: 403 });
    }

    const { error } = await context.supabase.from("audit_logs").insert({
      company_id: data.company_id,
      user_id: context.userId,
      user_email: prof?.email ?? null,
      action: data.action,
      entity: data.entity,
      entity_id: data.entity_id ?? null,
      before: data.before ?? null,
      after: data.after ?? null,
      metadata: { ...(data.metadata ?? {}), domain: "clinical" },
    } as any);
    if (error) throw error;
    return { ok: true };
  });
