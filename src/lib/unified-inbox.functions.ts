import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Inbox Unificada Omnichannel — agrega inbound dos últimos 14 dias:
 *   - support_email_inbox  (e-mail de suporte)
 *   - marketing_leads      (formulários, captação)
 *   - whatsapp_message_events (mensagens recebidas)
 *   - crm_activities       (interações de pipeline)
 *
 * Tela única, ordenada por recência, com origem e tenant.
 * Nenhum SaaS BR (RD Station / Zendesk / HubSpot Free) entrega esses
 * 4 streams unificados sem integração externa paga.
 */
export const getUnifiedInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: d.days ?? 14 }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since = new Date(Date.now() - data.days * 86400000).toISOString();

    const [emails, leads, wapp, crm] = await Promise.all([
      supabaseAdmin.from("support_email_inbox").select("id, from_email, subject, received_at, company_id").gte("received_at", since).order("received_at", { ascending: false }).limit(200),
      supabaseAdmin.from("marketing_leads").select("id, name, email, phone, source, created_at, company_id").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("whatsapp_message_events").select("id, from_number, body, received_at, company_id").gte("received_at", since).order("received_at", { ascending: false }).limit(200),
      supabaseAdmin.from("crm_activities").select("id, title, notes, created_at, company_id, lead_id").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    ]);

    type Item = {
      kind: "email" | "lead" | "whatsapp" | "crm";
      id: string;
      when: string;
      from: string;
      title: string;
      preview: string;
      company_id: string | null;
    };
    const items: Item[] = [];

    for (const r of (emails.data as any[]) ?? []) items.push({
      kind: "email", id: r.id, when: r.received_at,
      from: r.from_email ?? "—", title: r.subject ?? "(sem assunto)", preview: "",
      company_id: r.company_id ?? null,
    });
    for (const r of (leads.data as any[]) ?? []) items.push({
      kind: "lead", id: r.id, when: r.created_at,
      from: r.email || r.phone || r.name || "—",
      title: `Lead via ${r.source ?? "site"}`,
      preview: r.name ?? "",
      company_id: r.company_id ?? null,
    });
    for (const r of (wapp.data as any[]) ?? []) items.push({
      kind: "whatsapp", id: r.id, when: r.received_at,
      from: r.from_number ?? "—", title: "Mensagem WhatsApp",
      preview: (r.body ?? "").slice(0, 120),
      company_id: r.company_id ?? null,
    });
    for (const r of (crm.data as any[]) ?? []) items.push({
      kind: "crm", id: r.id, when: r.created_at,
      from: "CRM", title: r.title ?? "Atividade",
      preview: (r.notes ?? "").slice(0, 120),
      company_id: r.company_id ?? null,
    });

    items.sort((a, b) => b.when.localeCompare(a.when));

    const summary = {
      total: items.length,
      by_kind: {
        email: items.filter((i) => i.kind === "email").length,
        lead: items.filter((i) => i.kind === "lead").length,
        whatsapp: items.filter((i) => i.kind === "whatsapp").length,
        crm: items.filter((i) => i.kind === "crm").length,
      },
    };

    return { summary, items: items.slice(0, 500) };
  });
