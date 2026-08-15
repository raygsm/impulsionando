import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]).optional());
const InputSchema = z.object({
  jobId: z.string().uuid().optional(), sourceLabel: z.string().optional(), mapping: z.record(z.string(), z.string()),
  mappingName: z.string().optional(), rows: z.array(RowSchema).min(1).max(5000),
});

type RioMedTargets = "sku" | "name" | "description" | "category" | "stock" | "price_sale" | "price_rental_daily" | "price_rental_monthly" | "image_url" | "barcode";
const ALLOWED_TARGETS: RioMedTargets[] = ["sku", "name", "description", "category", "stock", "price_sale", "price_rental_daily", "price_rental_monthly", "image_url", "barcode"];

async function companyId(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("communication_tenants").select("company_id")
    .eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

function pickValue(row: Record<string, unknown>, mapping: Record<string, string>, target: RioMedTargets): string | null {
  for (const [col, tgt] of Object.entries(mapping)) {
    if (tgt !== target) continue;
    const v = row[col];
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  }
  return null;
}
function toNumber(v: string | null): number | null {
  if (!v) return null;
  const cleaned = v.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
function toInt(v: string | null): number | null { const n = toNumber(v); return n === null ? null : Math.trunc(n); }

export const runRiomedImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const cid = await companyId(supabase);
    let jobId = data.jobId;
    if (!jobId) {
      const { data: job, error } = await supabase.from("riomed_import_jobs").insert({
        company_id: cid, entity: "product", source_label: data.sourceLabel ?? "Importação CSV",
        mapping_snapshot: data.mapping, total_rows: data.rows.length, status: "running",
        started_at: new Date().toISOString(), created_by: userId ?? null,
      }).select("id").single();
      if (error || !job) throw new Error(error?.message ?? "Falha ao criar importação");
      jobId = job.id;
    } else {
      const { data: job, error } = await supabase.from("riomed_import_jobs").update({
        status: "running", started_at: new Date().toISOString(), total_rows: data.rows.length, mapping_snapshot: data.mapping,
      }).eq("id", jobId).eq("company_id", cid).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      if (!job) throw new Error("Importação não encontrada");
    }

    if (data.mappingName) {
      const { error } = await supabase.from("riomed_import_mappings").upsert({ company_id: cid, name: data.mappingName, mapping: data.mapping, entity: "product" }, { onConflict: "company_id,name" });
      if (error) throw new Error(error.message);
    }

    let created = 0, updated = 0, skipped = 0, failed = 0;
    const errors: Array<{ row: number; message: string }> = [];
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i] as Record<string, unknown>;
      try {
        const sku = pickValue(row, data.mapping, "sku");
        const name = pickValue(row, data.mapping, "name");
        if (!sku || !name) { skipped++; continue; }
        const stock = toInt(pickValue(row, data.mapping, "stock"));
        const priceSale = toNumber(pickValue(row, data.mapping, "price_sale"));
        const rentDaily = toNumber(pickValue(row, data.mapping, "price_rental_daily"));
        const rentMonthly = toNumber(pickValue(row, data.mapping, "price_rental_monthly"));
        const barcode = pickValue(row, data.mapping, "barcode");
        const { data: existing, error: lookupError } = await supabase.from("riomed_products").select("id,metadata").eq("company_id", cid).eq("sku", sku).maybeSingle();
        if (lookupError) throw new Error(lookupError.message);
        const metadata = { ...(existing?.metadata ?? {}), ...(barcode ? { barcode } : {}), import_job_id: jobId, last_imported_at: new Date().toISOString(), ...(stock !== null ? { last_stock_movement_at: new Date().toISOString() } : {}) };
        const payload = {
          company_id: cid, sku, name,
          description: pickValue(row, data.mapping, "description"), category: pickValue(row, data.mapping, "category"),
          price_sale: priceSale, price_rental_daily: rentDaily, price_rental_monthly: rentMonthly,
          image_url: pickValue(row, data.mapping, "image_url"), stock: stock ?? 0, is_active: true, metadata,
        };
        if (existing) {
          const { error } = await supabase.from("riomed_products").update(payload).eq("id", existing.id).eq("company_id", cid);
          if (error) throw new Error(error.message);
          updated++;
        } else {
          const { error } = await supabase.from("riomed_products").insert(payload);
          if (error) throw new Error(error.message);
          created++;
        }
      } catch (e) {
        failed++;
        if (errors.length < 100) errors.push({ row: i + 2, message: (e as Error).message ?? "erro desconhecido" });
      }
    }

    const status = failed > 0 && created + updated === 0 ? "failed" : "done";
    const { error: finishError } = await supabase.from("riomed_import_jobs").update({
      status, finished_at: new Date().toISOString(), rows_created: created, rows_updated: updated,
      rows_skipped: skipped, rows_failed: failed, errors, summary: { created, updated, skipped, failed, total: data.rows.length },
    }).eq("id", jobId).eq("company_id", cid);
    if (finishError) throw new Error(finishError.message);
    return { jobId, created, updated, skipped, failed, errors };
  });

export { ALLOWED_TARGETS };
export type { RioMedTargets };