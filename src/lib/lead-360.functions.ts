import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lead 360 — unifica em uma única tela tudo o que o ecossistema Impulsionando
 * sabe sobre um lead/contato: identidade, oportunidades, atividades, tickets
 * de suporte, agenda, comunicações enviadas (whatsapp/email) e conversões
 * para customer/contrato. Cross-módulo, base do CRM 360 cliente-a-cliente.
 */
export const getLead360 = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { leadId: string }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const leadId = data.leadId;

    const { data: lead, error } = await supabaseAdmin
      .from("crm_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();
    if (error) throw error;
    if (!lead) throw new Error("Lead não encontrado.");

    // Autorização: super admin OU pertence à empresa do lead
    const { data: isStaff } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });
    if (!isStaff) {
      const { data: belongs } = await supabaseAdmin.rpc("user_belongs_to_company", {
        _user_id: userId,
        _company_id: lead.company_id,
      });
      if (!belongs) throw new Error("Sem acesso a este lead.");
    }

    const companyId = lead.company_id;
    const email = lead.email ?? "__none__";
    const phone = lead.phone ?? "__none__";

    const [opps, acts, tickets, customer, quotes, outbox, appts] = await Promise.all([
      supabaseAdmin
        .from("crm_opportunities")
        .select("id, title, value, currency, status, stage_id, expected_close_at, created_at, closed_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("crm_activities")
        .select("id, type, subject, occurred_at, payload")
        .eq("lead_id", leadId)
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("support_tickets")
        .select("id, subject, status, priority, created_at, first_response_at, resolved_at")
        .eq("company_id", companyId)
        .or(`requester_email.eq.${email},requester_phone.eq.${phone}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("customers")
        .select("id, name, email, status, created_at")
        .eq("lead_id", leadId)
        .maybeSingle(),
      supabaseAdmin
        .from("riomed_quotes")
        .select("id, status, total_value, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("message_outbox")
        .select("id, channel, status, subject, created_at, sent_at")
        .eq("company_id", companyId)
        .or(`recipient_email.eq.${email},recipient_phone.eq.${phone}`)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("agenda_appointments")
        .select("id, status, starts_at, ends_at, customer_email, customer_phone")
        .eq("company_id", companyId)
        .or(`customer_email.eq.${email},customer_phone.eq.${phone}`)
        .order("starts_at", { ascending: false })
        .limit(20),
    ]);

    const openOpps = (opps.data ?? []).filter((o: any) => o.status === "open");
    const wonOpps = (opps.data ?? []).filter((o: any) => o.status === "won");
    const totalPipeline = openOpps.reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
    const totalWon = wonOpps.reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
    const openTickets = (tickets.data ?? []).filter((t: any) =>
      ["open", "pending", "in_progress", "waiting"].includes(String(t.status))
    ).length;

    return {
      lead,
      summary: {
        opportunities: opps.data?.length ?? 0,
        openOpportunities: openOpps.length,
        wonOpportunities: wonOpps.length,
        pipelineValue: totalPipeline,
        wonValue: totalWon,
        activities: acts.data?.length ?? 0,
        tickets: tickets.data?.length ?? 0,
        openTickets,
        messagesSent: outbox.data?.length ?? 0,
        appointments: appts.data?.length ?? 0,
        isCustomer: !!customer.data,
      },
      opportunities: opps.data ?? [],
      activities: acts.data ?? [],
      tickets: tickets.data ?? [],
      customer: customer.data,
      quotes: quotes.data ?? [],
      messages: outbox.data ?? [],
      appointments: appts.data ?? [],
    };
  });

export const addLead360Activity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { leadId: string; type: string; subject: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: lead } = await supabaseAdmin
      .from("crm_leads")
      .select("company_id")
      .eq("id", data.leadId)
      .maybeSingle();
    if (!lead) throw new Error("Lead não encontrado.");

    const { error } = await supabaseAdmin.from("crm_activities").insert({
      lead_id: data.leadId,
      company_id: lead.company_id,
      type: data.type,
      subject: data.subject,
      payload: data.notes ? { notes: data.notes } : null,
      occurred_at: new Date().toISOString(),
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });
