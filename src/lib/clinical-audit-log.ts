/**
 * Client helper for clinical audit logging (CHRISMED + clinics).
 * Fire-and-forget: failures are logged but never block the UI mutation.
 */
import { logClinicalAudit } from "@/lib/clinical-audit.functions";

type Action =
  | "patient.create" | "patient.update" | "patient.delete" | "patient.view"
  | "appointment.create" | "appointment.update" | "appointment.cancel"
  | "appointment.complete" | "appointment.no_show"
  | "payment.charge" | "payment.refund" | "payment.failed"
  | "template.create" | "template.update" | "template.delete"
  | "permission.grant" | "permission.revoke" | "permission.role_change"
  | "access.login" | "access.impersonate" | "access.export";

export function auditClinical(input: {
  company_id: string;
  action: Action;
  entity: string;
  entity_id?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): void {
  void logClinicalAudit({ data: input }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("[clinical-audit] log failed", err);
  });
}
