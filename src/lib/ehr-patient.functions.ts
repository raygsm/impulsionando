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
      .select("id, company_id, customer_id, customers(id, name, email, patient_user_id)")
      .eq("id", data.recordId)
      .maybeSingle();
    if (recErr) throw new Error(recErr.message);
    if (!rec) throw new Error("Prontuário não encontrado ou sem acesso");

    const customer = (rec as any).customers as {
      id: string;
      name: string | null;
      email: string | null;
      patient_user_id: string | null;
    };

    if (customer.patient_user_id) {
      return { ok: true, alreadyLinked: true, userId: customer.patient_user_id };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const siteOrigin =
      process.env.SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      "https://impulsionando.com.br";

    // Try to find an existing user with this email
    let targetUserId: string | null = null;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data?.users?.find(
      (u) => (u.email || "").toLowerCase() === data.email.toLowerCase(),
    );
    if (existing) {
      targetUserId = existing.id;
    } else {
      const inv = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
        redirectTo: `${siteOrigin}/paciente`,
        data: {
          display_name: data.name || customer.name || data.email.split("@")[0],
          is_patient: true,
        },
      });
      if (inv.error || !inv.data?.user) {
        throw new Error(inv.error?.message || "Falha ao convidar paciente");
      }
      targetUserId = inv.data.user.id;
    }

    // Link patient to customer
    const { error: updErr } = await supabaseAdmin
      .from("customers")
      .update({
        patient_user_id: targetUserId,
        patient_invited_at: new Date().toISOString(),
        email: customer.email || data.email,
      })
      .eq("id", customer.id);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, alreadyLinked: false, userId: targetUserId, invitedBy: userId };
  });
