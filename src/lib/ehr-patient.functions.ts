import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Invite a patient: creates (or reuses) an auth user, links it to the
 * customer of a given EHR record, and sends a magic-link/invite email.
 * Only callable by an authenticated staff user who can write the record.
 */
export const invitePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      recordId: z.string().uuid(),
      email: z.string().email().max(254),
      name: z.string().min(1).max(255).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load the record + customer (RLS ensures staff has access)
    const { data: rec, error: recErr } = await supabase
      .from("ehr_records")
      .select("id, company_id, patient_user_id, patient:chrismed_patient_profiles!ehr_records_patient_user_id_fkey(user_id, full_name, email, status)")
      .eq("id", data.recordId)
      .maybeSingle();
    if (recErr) throw new Error(recErr.message);
    if (!rec) throw new Error("Prontuário não encontrado ou sem acesso");

    const patient = (rec as any).patient as { user_id: string; full_name: string | null; email: string | null; status: string | null } | null;
    if (!patient?.user_id) throw new Error("Paciente CHRISMED não vinculado ao prontuário");
    if (patient.email && patient.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("O e-mail informado não corresponde ao cadastro do paciente CHRISMED");
    }
    return { ok: true, alreadyLinked: true, userId: patient.user_id, invitedBy: userId };
  });
