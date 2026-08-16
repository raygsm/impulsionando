import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function currentCompany(supabase: any) {
  const { data, error } = await supabase.rpc("current_user_company_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Empresa atual não encontrada.");
  return String(data);
}

export const searchCouponCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ query: z.string().min(2).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await currentCompany(context.supabase);
    const { data: rows, error } = await context.supabase.rpc("core_coupon_search_customers", { p_company_id: companyId, p_query: data.query });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listCustomerCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await currentCompany(context.supabase);
    const { data, error } = await context.supabase
      .from("core_customer_discount_coupons" as any)
      .select("id,customer_user_id,contact_id,service_ref,service_name_snapshot,original_price_cents,discount_type,discount_percent,fixed_price_cents,validity_type,starts_at,expires_at,status,reason,created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const createSchema = z.object({
  customerUserId: z.string().uuid(),
  contactId: z.string().uuid().nullable().optional(),
  serviceRef: z.string().min(1).max(160),
  serviceName: z.string().min(1).max(200),
  originalPriceCents: z.number().int().min(0),
  discountType: z.enum(["PERCENT", "FIXED_PRICE"]),
  discountValue: z.number().min(0),
  validityType: z.enum(["INDETERMINATE", "DAYS_30"]),
  reason: z.string().max(500).nullable().optional(),
});

export const createCustomerCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await currentCompany(context.supabase);
    const { data: id, error } = await context.supabase.rpc("core_coupon_create", {
      p_company_id: companyId,
      p_customer_user_id: data.customerUserId,
      p_contact_id: data.contactId ?? null,
      p_service_ref: data.serviceRef,
      p_service_name: data.serviceName,
      p_original_price_cents: data.originalPriceCents,
      p_discount_type: data.discountType,
      p_discount_value: data.discountValue,
      p_validity_type: data.validityType,
      p_reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, id };
  });

export const setCustomerCouponStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ couponId: z.string().uuid(), status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]), reason: z.string().max(500).nullable().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("core_coupon_set_status", { p_coupon_id: data.couponId, p_status: data.status, p_reason: data.reason ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const fetchCouponBI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ from: z.string().datetime().nullable().optional(), to: z.string().datetime().nullable().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const companyId = await currentCompany(context.supabase);
    const { data: bi, error } = await context.supabase.rpc("core_coupon_bi", { p_company_id: companyId, p_from: data.from ?? null, p_to: data.to ?? null });
    if (error) throw new Error(error.message);
    return bi ?? {};
  });
