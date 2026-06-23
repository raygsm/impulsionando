/**
 * Rio Med — debug-only server function.
 *
 * Re-runs the same query as `listRiomedPublicProducts`, but instrumented:
 * returns timings per stage (FX rate fetch, products query, transformation),
 * the SQL-like description of the query that was issued, the raw row count
 * and, on failure, the captured stack trace.
 *
 * Read-only, uses the public (anon) client — safe to call from /riomed/debug.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function pubClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } as any },
  );
}

type StageMeta = Record<string, string | number | boolean | null>;
type Stage = {
  name: string;
  status: "ok" | "error" | "skipped";
  durationMs: number;
  message?: string;
  stack?: string;
  meta?: StageMeta;
};

async function timed<T>(
  name: string,
  stages: Stage[],
  fn: () => Promise<T>,
  meta?: StageMeta,
): Promise<{ ok: boolean; value: T | null }> {
  const t0 = Date.now();
  try {
    const value = await fn();
    stages.push({
      name,
      status: "ok",
      durationMs: Date.now() - t0,
      meta,
    });
    return { ok: true, value };
  } catch (err) {
    const e = err as Error;
    stages.push({
      name,
      status: "error",
      durationMs: Date.now() - t0,
      message: e?.message ?? String(err),
      stack: e?.stack,
      meta,
    });
    return { ok: false, value: null };
  }
}

export const debugListProductos = createServerFn({ method: "GET" })
  .inputValidator(
    (d: { search?: string; category?: string; limit?: number } = {}) => d,
  )
  .handler(async ({ data }) => {
    const stages: Stage[] = [];
    const search = data.search?.trim() || undefined;
    const category = data.category?.trim() || undefined;
    const limit = data.limit ?? 60;

    // Reconstruct a human-readable query description (mirrors the real fn).
    const filters: string[] = ["is_active = true"];
    if (search) filters.push(`name|sku|brand ILIKE '%${search}%'`);
    if (category) filters.push(`category = '${category}'`);
    const queryDescription =
      `SELECT id, sku, name, description, category, brand, model, image_url,\n` +
      `       is_active, modality, price_sale, price_rental_daily,\n` +
      `       price_rental_monthly, currency, stock, metadata\n` +
      `  FROM public.riomed_products\n` +
      ` WHERE ${filters.join("\n   AND ")}\n` +
      ` ORDER BY display_order ASC\n` +
      ` LIMIT ${limit};`;

    const supa = pubClient();

    // Stage 1 — FX (BOB/USD)
    const fx = await timed("fx-query (cotacao_bob_usd)", stages, async () => {
      const { data: row, error } = await supa
        .from("cotacao_bob_usd")
        .select("rate,source,captured_at")
        .eq("is_active", true)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return row;
    });

    // Stage 2 — Products query
    const products = await timed(
      "supabase-query (riomed_products)",
      stages,
      async () => {
        let q = supa
          .from("riomed_products")
          .select(
            "id,sku,name,description,category,brand,model,image_url,is_active,modality,price_sale,price_rental_daily,price_rental_monthly,currency,stock,metadata",
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(limit);
        if (search)
          q = q.or(
            `name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`,
          );
        if (category) q = q.eq("category", category);
        const { data: rows, error } = await q;
        if (error) throw new Error(error.message);
        return rows ?? [];
      },
      { search: search ?? "", category: category ?? "", limit },
    );

    // Stage 3 — Transform (compute USD prices using FX rate)
    let transformedCount = 0;
    await timed("transform (BOB→USD)", stages, async () => {
      const rate = (fx.value as any)?.rate ? Number((fx.value as any).rate) : 6.96;
      const rows = (products.value as any[]) ?? [];
      transformedCount = rows.length;
      rows.forEach((r: any) => {
        if (r.price_sale && rate) r.price_sale_usd = +(r.price_sale / rate).toFixed(2);
      });
      return rows;
    });

    const totalMs = stages.reduce((a, s) => a + s.durationMs, 0);

    return {
      queryDescription,
      params: { search, category, limit },
      stages,
      totalMs,
      rowCount: transformedCount,
      ok: stages.every((s) => s.status !== "error"),
      generatedAt: new Date().toISOString(),
    };
  });
