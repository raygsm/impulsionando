/**
 * impulsionito-context.functions.ts (W18)
 *
 * Server fn que devolve um snapshot do tenant para alimentar o Impulsionito
 * (assistente IA do core Impulsionando). Todas as leituras são scoped por
 * company_id e protegidas por RLS — o usuário precisa ser membro da empresa.
 *
 * Devolve apenas contadores e amostras (sem PII completa) para alimentar o
 * contexto do agente em tempo real, sem expor base inteira.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({ companyId: z.string().uuid() });

export type ImpulsionitoTenantContext = {
  companyId: string;
  companyName: string | null;
  niche: string | null;
  capturedAt: string;
  metrics: {
    customers: number;
    products: number;
    appointmentsLast30d: number;
    openTickets: number;
    eventTicketsSold: number;
    vitrineActive: number;
  };
  recent: {
    customers: Array<{ id: string; name: string | null; created_at: string }>;
    appointments: Array<{ id: string; start_at: string | null; status: string | null }>;
    tickets: Array<{ id: string; subject: string | null; status: string | null; created_at: string }>;
  };
};

export const getImpulsionitoTenantContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data, context }): Promise<ImpulsionitoTenantContext> => {
    const { supabase } = context;
    const { companyId } = data;
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [company, custCount, prodCount, apptCount, openTickCount, evtCount, vitrineCount, recentCust, recentAppt, recentTick] = await Promise.all([
      supabase.from("companies").select("name, niche_code").eq("id", companyId).maybeSingle(),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("inv_products").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("agenda_appointments").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("starts_at", since30),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["new", "received", "waiting_customer", "waiting_core", "in_review", "in_development", "reopened"]),
      supabase.from("evt_tickets").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["sold", "paid", "checked_in"]),
      supabase.from("companies_vitrine_public").select("id", { count: "exact", head: true }).eq("id", companyId),
      supabase.from("customers").select("id, name, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
      supabase.from("agenda_appointments").select("id, starts_at, status").eq("company_id", companyId).order("starts_at", { ascending: false }).limit(5),
      supabase.from("support_tickets").select("id, subject, status, created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
    ]);

    return {
      companyId,
      companyName: (company.data as { name?: string } | null)?.name ?? null,
      niche: (company.data as { niche_code?: string } | null)?.niche_code ?? null,
      capturedAt: new Date().toISOString(),
      metrics: {
        customers: custCount.count ?? 0,
        products: prodCount.count ?? 0,
        appointmentsLast30d: apptCount.count ?? 0,
        openTickets: openTickCount.count ?? 0,
        eventTicketsSold: evtCount.count ?? 0,
        vitrineActive: vitrineCount.count ?? 0,
      },
      recent: {
        customers: ((recentCust.data ?? []) as unknown) as ImpulsionitoTenantContext["recent"]["customers"],
        appointments: (((recentAppt.data ?? []) as unknown) as Array<{ id: string; starts_at: string | null; status: string | null }>)
          .map((a) => ({ id: a.id, start_at: a.starts_at, status: a.status })),
        tickets: ((recentTick.data ?? []) as unknown) as ImpulsionitoTenantContext["recent"]["tickets"],
      },
    };
  });
