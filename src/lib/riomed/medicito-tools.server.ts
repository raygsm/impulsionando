import { tool } from "ai";
import { z } from "zod";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type MedicitoToolContext = {
  tenantId: string;
  companyId: string;
  conversationId: string;
};

function clean(value: string | null | undefined, max = 300) {
  return (value ?? "").trim().slice(0, max);
}

function cleanSearchTerm(value: string) {
  return clean(value, 120)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s._\/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function auditTool(ctx: MedicitoToolContext, action: string, after: Record<string, unknown>) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      company_id: ctx.companyId,
      action: `riomed.medicito.${action}`,
      entity: "communication_conversations",
      entity_id: ctx.conversationId,
      after,
      metadata: { agent_key: "riomed-medicito", source: "tool_call" },
      correlation_id: `medicito:${ctx.conversationId}`,
    });
  } catch (error) {
    console.error(`[riomed/medicito] audit ${action} failed`, error);
  }
}

export function buildMedicitoTools(ctx: MedicitoToolContext) {
  return {
    search_inventory: tool({
      description: "Pesquisar produtos reais e ativos da RioMed por nome, descrição, categoria, SKU, marca, modelo ou código presente nos metadados. Use antes de afirmar existência, estoque ou preço.",
      inputSchema: z.object({
        query: z.string().min(2).max(120),
        limit: z.number().int().min(1).max(12).default(8),
      }),
      execute: async ({ query, limit }) => {
        const q = cleanSearchTerm(query);
        if (q.length < 2) return { ok: false, query: q, count: 0, products: [], reason: "search_term_invalid" };
        const { data, error } = await supabaseAdmin
          .from("riomed_products")
          .select("id,sku,name,description,category,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,image_url,metadata")
          .eq("company_id", ctx.companyId)
          .eq("is_active", true)
          .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,sku.ilike.%${q}%`)
          .order("display_order", { ascending: true })
          .limit(limit);
        if (error) throw new Error(`inventory_search_failed:${error.message}`);
        const rows = data ?? [];
        await auditTool(ctx, "search_inventory", { query: q, results: rows.length });
        return { ok: true, query: q, count: rows.length, products: rows };
      },
    }),

    get_product_by_sku: tool({
      description: "Consultar um SKU exato da RioMed e retornar somente dados reais de produto, preço e estoque. Nunca use memória do modelo para preencher campos ausentes.",
      inputSchema: z.object({ sku: z.string().min(1).max(120) }),
      execute: async ({ sku }) => {
        const normalized = clean(sku, 120);
        const { data, error } = await supabaseAdmin
          .from("riomed_products")
          .select("id,sku,name,description,category,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,image_url,metadata")
          .eq("company_id", ctx.companyId)
          .eq("is_active", true)
          .ilike("sku", normalized)
          .maybeSingle();
        if (error) throw new Error(`sku_lookup_failed:${error.message}`);
        await auditTool(ctx, "get_product_by_sku", { sku: normalized, found: Boolean(data) });
        return { ok: true, found: Boolean(data), product: data ?? null };
      },
    }),

    list_available_sellers: tool({
      description: "Consultar vendedores reais ativos e disponíveis da RioMed antes de oferecer encaminhamento. Não inventa pessoa nem agenda.",
      inputSchema: z.object({ territory: z.string().max(100).optional() }),
      execute: async ({ territory }) => {
        let query = supabaseAdmin
          .from("riomed_sellers")
          .select("id,full_name,territory,status,metadata")
          .eq("company_id", ctx.companyId)
          .eq("status", "active")
          .limit(20);
        if (territory?.trim()) query = query.ilike("territory", clean(territory, 100));
        const { data, error } = await query;
        if (error) throw new Error(`seller_lookup_failed:${error.message}`);
        const rows = (data ?? []).filter((s: any) => s.metadata?.available !== false && s.metadata?.on_leave !== true);
        await auditTool(ctx, "list_available_sellers", { territory: territory ?? null, results: rows.length });
        return { ok: true, count: rows.length, sellers: rows };
      },
    }),

    create_lead: tool({
      description: "Registrar lead real no Core somente quando o usuário pedir contato, cotação, locação, manutenção ou atendimento e fornecer nome e telefone. O bridge RioMed cria/atualiza contato e oportunidade e tenta distribuição auditável quando houver vendedor real disponível.",
      inputSchema: z.object({
        name: z.string().min(2).max(160),
        phone: z.string().min(6).max(40),
        email: z.string().email().max(200).optional(),
        interest: z.string().min(2).max(240),
        profile: z.string().max(100).optional(),
        notes: z.string().max(1000).optional(),
      }),
      execute: async ({ name, phone, email, interest, profile, notes }) => {
        const payload = {
          company_id: ctx.companyId,
          customer_name: clean(name, 160),
          customer_phone: clean(phone, 40),
          customer_email: email ? clean(email, 200).toLowerCase() : null,
          interest: clean(interest, 240),
          profile: profile ? clean(profile, 100) : null,
          notes: clean([notes, `Medicito conversation=${ctx.conversationId}`].filter(Boolean).join(" | "), 1000),
          status: "novo",
        };
        const { data, error } = await supabaseAdmin
          .from("riomed_seller_leads")
          .insert(payload)
          .select("id,contact_id,opportunity_id,assigned_seller_id,status,created_at")
          .single();
        if (error) throw new Error(`lead_creation_failed:${error.message}`);
        await auditTool(ctx, "create_lead", { lead_id: data.id, contact_id: data.contact_id, opportunity_id: data.opportunity_id, assigned_seller_id: data.assigned_seller_id });
        return {
          ok: true,
          lead_id: data.id,
          contact_id: data.contact_id,
          opportunity_id: data.opportunity_id,
          assigned_seller_id: data.assigned_seller_id,
          status: data.status,
          seller_assigned: Boolean(data.assigned_seller_id),
        };
      },
    }),

    create_support_ticket: tool({
      description: "Abrir um chamado real de suporte/manutenção quando o usuário pedir isso e fornecer nome e telefone. O bridge RioMed cria o ticket canônico do Core, SLA e protocolo real.",
      inputSchema: z.object({
        name: z.string().min(2).max(160),
        phone: z.string().min(6).max(40),
        email: z.string().email().max(200).optional(),
        equipmentType: z.string().max(160).optional(),
        equipmentBrand: z.string().max(120).optional(),
        category: z.enum(["mantenimiento_preventivo", "correctivo", "calibracion", "instalacion", "capacitacion", "otro"]),
        urgency: z.enum(["baja", "normal", "alta", "critica"]).default("normal"),
        description: z.string().min(3).max(2000),
        city: z.string().max(120).optional(),
        preferredWindow: z.string().max(160).optional(),
      }),
      execute: async ({ name, phone, email, equipmentType, equipmentBrand, category, urgency, description, city, preferredWindow }) => {
        const provisional = `RM-TMP-${randomUUID().slice(0, 8).toUpperCase()}`;
        const { data, error } = await supabaseAdmin
          .from("riomed_support_tickets")
          .insert({
            company_id: ctx.companyId,
            protocol: provisional,
            customer_name: clean(name, 160),
            customer_phone: clean(phone, 40),
            customer_email: email ? clean(email, 200).toLowerCase() : null,
            equipment_type: equipmentType ? clean(equipmentType, 160) : null,
            equipment_brand: equipmentBrand ? clean(equipmentBrand, 120) : null,
            issue_category: category,
            urgency,
            description: clean(description, 2000),
            location_city: city ? clean(city, 120) : null,
            preferred_window: preferredWindow ? clean(preferredWindow, 160) : null,
          })
          .select("id,protocol,core_ticket_id,core_ticket_code,status,created_at")
          .single();
        if (error) throw new Error(`ticket_creation_failed:${error.message}`);
        await auditTool(ctx, "create_support_ticket", { ticket_id: data.id, core_ticket_id: data.core_ticket_id, protocol: data.core_ticket_code ?? data.protocol });
        return {
          ok: true,
          ticket_id: data.id,
          core_ticket_id: data.core_ticket_id,
          protocol: data.core_ticket_code ?? data.protocol,
          status: data.status,
        };
      },
    }),
  };
}
