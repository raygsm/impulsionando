import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Módulo Comunidade/Associações/Clubes. */

const UUID = z.string().uuid();

export const listCommunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => ({ companyId: UUID.parse(d.companyId) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("comm_communities").select("*").eq("company_id", data.companyId).order("name");
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

const CommInput = z.object({
  id: UUID.optional(),
  companyId: UUID,
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  kind: z.enum(["comunidade", "associacao", "clube", "igreja", "ong"]).default("comunidade"),
  description: z.string().max(2000).optional(),
  monthlyFee: z.number().min(0).default(0),
  acceptsDonations: z.boolean().default(true),
  donationPurpose: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
export const upsertCommunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CommInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      company_id: data.companyId, name: data.name, slug: data.slug, kind: data.kind,
      description: data.description ?? null, monthly_fee: data.monthlyFee,
      accepts_donations: data.acceptsDonations, donation_purpose: data.donationPurpose ?? null,
      is_active: data.isActive,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("comm_communities")
        .update(row).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return out;
    }
    const { data: out, error } = await context.supabase.from("comm_communities")
      .insert(row).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

export const getCommunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: UUID.parse(d.id) }))
  .handler(async ({ data, context }) => {
    const [{ data: comm, error }, members, memberships, donations, attendance] = await Promise.all([
      context.supabase.from("comm_communities").select("*").eq("id", data.id).single(),
      context.supabase.from("comm_members").select("*").eq("community_id", data.id).order("name"),
      context.supabase.from("comm_memberships").select("*").eq("community_id", data.id)
        .order("due_date", { ascending: false }).limit(500),
      context.supabase.from("comm_donations").select("*").eq("community_id", data.id)
        .order("received_at", { ascending: false }).limit(200),
      context.supabase.from("comm_attendance").select("*").eq("community_id", data.id)
        .order("event_date", { ascending: false }).limit(500),
    ]);
    if (error) throw new Error(error.message);
    return {
      community: comm,
      members: members.data ?? [],
      memberships: memberships.data ?? [],
      donations: donations.data ?? [],
      attendance: attendance.data ?? [],
    };
  });

const MemberInput = z.object({
  id: UUID.optional(),
  companyId: UUID, communityId: UUID,
  name: z.string().min(2).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  document: z.string().max(40).optional().nullable(),
  birthdate: z.string().date().optional().nullable(),
  status: z.enum(["ativo", "inadimplente", "afastado", "desligado"]).default("ativo"),
  notes: z.string().max(2000).optional(),
});
export const upsertMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MemberInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      company_id: data.companyId, community_id: data.communityId, name: data.name,
      email: data.email ?? null, phone: data.phone ?? null, document: data.document ?? null,
      birthdate: data.birthdate ?? null, status: data.status, notes: data.notes ?? null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("comm_members")
        .update(row).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return out;
    }
    const { data: out, error } = await context.supabase.from("comm_members")
      .insert(row).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

export const createMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    companyId: string; communityId: string; memberId: string;
    year: number; month: number; amount: number; dueDate: string;
  }) => ({
    companyId: UUID.parse(d.companyId), communityId: UUID.parse(d.communityId),
    memberId: UUID.parse(d.memberId),
    year: z.number().int().min(2020).max(2100).parse(d.year),
    month: z.number().int().min(1).max(12).parse(d.month),
    amount: z.number().min(0).parse(d.amount),
    dueDate: z.string().date().parse(d.dueDate),
  }))
  .handler(async ({ data, context }) => {
    const { data: out, error } = await context.supabase.from("comm_memberships").insert({
      company_id: data.companyId, community_id: data.communityId, member_id: data.memberId,
      period_year: data.year, period_month: data.month, amount: data.amount,
      due_date: data.dueDate, status: "em_aberto",
    }).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

export const markMembershipPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; method?: string; reference?: string }) => ({
    id: UUID.parse(d.id), method: d.method, reference: d.reference,
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("comm_memberships")
      .update({
        status: "pago", paid_at: new Date().toISOString(),
        payment_method: data.method ?? null, payment_reference: data.reference ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    companyId: string; communityId: string; memberId: string;
    eventName: string; eventDate: string; status: "presente" | "ausente" | "justificado";
    notes?: string;
  }) => ({
    companyId: UUID.parse(d.companyId), communityId: UUID.parse(d.communityId),
    memberId: UUID.parse(d.memberId),
    eventName: z.string().min(1).max(200).parse(d.eventName),
    eventDate: z.string().date().parse(d.eventDate),
    status: d.status, notes: d.notes,
  }))
  .handler(async ({ data, context }) => {
    const { data: out, error } = await context.supabase.from("comm_attendance").insert({
      company_id: data.companyId, community_id: data.communityId, member_id: data.memberId,
      event_name: data.eventName, event_date: data.eventDate, status: data.status,
      notes: data.notes ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return out;
  });

export const recordDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    companyId: string; communityId: string; memberId?: string;
    donorName: string; donorEmail?: string; donorPhone?: string;
    amount: number; purpose?: string; paymentMethod?: string; paymentReference?: string;
  }) => ({
    companyId: UUID.parse(d.companyId), communityId: UUID.parse(d.communityId),
    memberId: d.memberId ? UUID.parse(d.memberId) : undefined,
    donorName: z.string().min(2).max(200).parse(d.donorName),
    donorEmail: d.donorEmail ? z.string().email().parse(d.donorEmail) : undefined,
    donorPhone: d.donorPhone, amount: z.number().positive().parse(d.amount),
    purpose: d.purpose, paymentMethod: d.paymentMethod, paymentReference: d.paymentReference,
  }))
  .handler(async ({ data, context }) => {
    const { data: out, error } = await context.supabase.from("comm_donations").insert({
      company_id: data.companyId, community_id: data.communityId,
      member_id: data.memberId ?? null,
      donor_name: data.donorName, donor_email: data.donorEmail ?? null,
      donor_phone: data.donorPhone ?? null, amount: data.amount,
      purpose: data.purpose ?? null, payment_method: data.paymentMethod ?? null,
      payment_reference: data.paymentReference ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return out;
  });
