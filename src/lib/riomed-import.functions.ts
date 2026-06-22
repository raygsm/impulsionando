import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]).optional());

const InputSchema = z.object({
  jobId: z.string().uuid().optional(),
  sourceLabel: z.string().optional(),
  mapping: z.record(z.string(), z.string()),
  mappingName: z.string().optional(),
  rows: z.array(RowSchema).min(1).max(5000),
});

type RioMedTargets =
  | "sku" | "name" | "description" | "category" | "stock"
  | "price_sale" | "price_rental_daily" | "price_rental_monthly"
  | "image_url" | "barcode";

const ALLOWED_TARGETS: RioMedTargets[] = [
  "sku", "name", "description", "category", "stock",
  "price_sale", "price_rental_daily", "price_rental_monthly",
  "image_url", "barcode",
];

function pickValue(row: Record<string, unknown>, mapping: Record<string, string>, target: RioMedTargets): string | null {
  for (const [col, tgt] of Object.entries(mapping)) {
    if (tgt === target) {
      const v = row[col];
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    }
  }
  return null;
}

function toNumber(v: string | null): number | null {
  if (!v) return null;
  const cleaned = v.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: string | null): number | null {
  const n = toNumber(v);
  return n === null ? null : Math.trunc(n);
}

export const runRiomedImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) Empresa do usuário (ou Rio Med se admin master)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    let companyId = profile?.company_id ?? null;
    if (!companyId) {
      const { data: tenant } = await supabase
        .from("core_tenant_identity")
        .select("company_id")
        .eq("subdomain", "riomed")
        .maybeSingle();
      companyId = tenant?.company_id ?? null;
    }
    if (!companyId) throw new Error("Empresa não identificada para o usuário.");

    // 2) Almoxarifado default + lista de preço pública
    const { data: warehouse } = await supabase
      .from("riomed_warehouses")
      .select("id")
      .eq("company_id", companyId)
      .eq("is_default", true)
      .maybeSingle();
    if (!warehouse) throw new Error("Almoxarifado padrão não configurado.");

    const { data: priceList } = await supabase
      .from("riomed_price_lists")
      .select("id")
      .eq("company_id", companyId)
      .eq("code", "PUBLIC")
      .maybeSingle();
    if (!priceList) throw new Error("Lista de preço pública não configurada.");

    // 3) Cria ou atualiza job
    let jobId = data.jobId;
    if (!jobId) {
      const { data: job, error } = await supabase
        .from("riomed_import_jobs")
        .insert({
          company_id: companyId,
          entity: "product",
          source_label: data.sourceLabel ?? "Importação CSV",
          mapping_snapshot: data.mapping,
          total_rows: data.rows.length,
          status: "running",
          started_at: new Date().toISOString(),
          created_by: userId,
        })
        .select("id")
        .single();
      if (error || !job) throw error ?? new Error("Falha ao criar job");
      jobId = job.id;
    } else {
      await supabase
        .from("riomed_import_jobs")
        .update({ status: "running", started_at: new Date().toISOString(), total_rows: data.rows.length, mapping_snapshot: data.mapping })
        .eq("id", jobId);
    }

    // 4) Salva mapeamento reutilizável (opcional)
    if (data.mappingName) {
      await supabase
        .from("riomed_import_mappings")
        .upsert({ company_id: companyId, name: data.mappingName, mapping: data.mapping, entity: "product" }, { onConflict: "company_id,name" });
    }

    // 5) Processa linhas
    let created = 0, updated = 0, skipped = 0, failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i] as Record<string, unknown>;
      try {
        const sku = pickValue(row, data.mapping, "sku");
        const name = pickValue(row, data.mapping, "name");
        if (!sku || !name) { skipped++; continue; }

        const description = pickValue(row, data.mapping, "description");
        const category = pickValue(row, data.mapping, "category");
        const stock = toInt(pickValue(row, data.mapping, "stock"));
        const priceSale = toNumber(pickValue(row, data.mapping, "price_sale"));
        const rentDaily = toNumber(pickValue(row, data.mapping, "price_rental_daily"));
        const rentMonthly = toNumber(pickValue(row, data.mapping, "price_rental_monthly"));
        const imageUrl = pickValue(row, data.mapping, "image_url");
        const barcode = pickValue(row, data.mapping, "barcode");

        // Existe produto?
        const { data: existing } = await supabase
          .from("riomed_products")
          .select("id")
          .eq("company_id", companyId)
          .eq("sku", sku)
          .maybeSingle();

        const productPayload = {
          company_id: companyId,
          sku, name,
          description: description ?? undefined,
          category: category ?? undefined,
          price_sale: priceSale ?? undefined,
          price_rental_daily: rentDaily ?? undefined,
          price_rental_monthly: rentMonthly ?? undefined,
          image_url: imageUrl ?? undefined,
          stock: stock ?? 0,
          is_active: true,
        };

        let productId: string;
        if (existing) {
          const { error } = await supabase.from("riomed_products").update(productPayload).eq("id", existing.id);
          if (error) throw error;
          productId = existing.id;
          updated++;
        } else {
          const { data: ins, error } = await supabase.from("riomed_products").insert(productPayload).select("id").single();
          if (error || !ins) throw error ?? new Error("insert failed");
          productId = ins.id;
          created++;
        }

        // Variante default
        const { data: variant } = await supabase
          .from("riomed_product_variants")
          .select("id")
          .eq("product_id", productId)
          .eq("is_default", true)
          .maybeSingle();

        let variantId: string;
        if (variant) {
          variantId = variant.id;
          await supabase.from("riomed_product_variants").update({ sku, name, barcode: barcode ?? null }).eq("id", variantId);
        } else {
          const { data: v, error } = await supabase
            .from("riomed_product_variants")
            .insert({ product_id: productId, company_id: companyId, sku, name, barcode: barcode ?? null, is_default: true })
            .select("id").single();
          if (error || !v) throw error ?? new Error("variant insert failed");
          variantId = v.id;
        }

        // Estoque
        if (stock !== null) {
          await supabase.from("riomed_stock_levels").upsert(
            { company_id: companyId, variant_id: variantId, warehouse_id: warehouse.id, qty_available: stock, last_movement_at: new Date().toISOString() },
            { onConflict: "variant_id,warehouse_id" },
          );
          await supabase.from("riomed_stock_movements").insert({
            company_id: companyId, variant_id: variantId, warehouse_id: warehouse.id,
            kind: "import", qty: stock, reason: "Importação CSV", ref_table: "riomed_import_jobs", ref_id: jobId, performed_by: userId,
          });
        }

        // Preço público
        if (priceSale !== null) {
          await supabase.from("riomed_prices").upsert(
            { company_id: companyId, price_list_id: priceList.id, variant_id: variantId, price: priceSale, is_active: true },
            { onConflict: "price_list_id,variant_id" },
          );
        }
      } catch (e) {
        failed++;
        errors.push({ row: i + 2, message: (e as Error).message ?? "erro desconhecido" });
        if (errors.length > 100) errors.length = 100;
      }
    }

    // 6) Fecha job
    await supabase
      .from("riomed_import_jobs")
      .update({
        status: failed > 0 && created + updated === 0 ? "failed" : "done",
        finished_at: new Date().toISOString(),
        rows_created: created,
        rows_updated: updated,
        rows_skipped: skipped,
        rows_failed: failed,
        errors: errors,
        summary: { created, updated, skipped, failed, total: data.rows.length },
      })
      .eq("id", jobId);

    return { jobId, created, updated, skipped, failed, errors };
  });

export { ALLOWED_TARGETS };
export type { RioMedTargets };
