import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function resolveCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("communication_tenants")
    .select("company_id").eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

// Mantido por compatibilidade da área administrativa. Não existem mais jobs Lovable.
export const runRiomedEmbeddingJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(data ?? {}))
  .handler(async () => ({
    processed: 0,
    errors: 0,
    semanticEnabled: false,
    message: "Indexação semântica não está habilitada. A busca textual Core permanece disponível.",
  }));

export const searchRiomedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    query: z.string().min(1).max(500).optional(),
    imageUrl: z.string().url().optional(),
    channel: z.enum(["web", "whatsapp", "api", "b2b"]).default("web"),
    limit: z.number().int().min(1).max(50).default(12),
    minSimilarity: z.number().min(0).max(1).default(0.45),
  }).refine(d => d.query || d.imageUrl, { message: "Informe texto ou imagem" }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase);
    if (!data.query && data.imageUrl) {
      throw new Error("Busca por imagem ainda não está habilitada neste cliente. Use a busca por texto enquanto a IA visual Core não for homologada.");
    }
    const t0 = Date.now();
    const query = String(data.query ?? "").trim();
    const safe = query.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
    if (!safe) throw new Error("Informe um termo de busca válido");

    const pattern = `%${safe}%`;
    const { data: products, error } = await supabase.from("riomed_products")
      .select("id,name,sku,description,category,image_url,price_sale,price_rental_daily,price_rental_monthly,currency,stock,modality")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .or(`name.ilike.${pattern},sku.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`)
      .order("display_order", { ascending: true })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const rows = products ?? [];
    const normalizedQuery = safe.toLowerCase();
    const results = rows.map((product: any) => {
      const name = String(product.name ?? "").toLowerCase();
      const sku = String(product.sku ?? "").toLowerCase();
      const category = String(product.category ?? "").toLowerCase();
      const score = sku === normalizedQuery ? 1 : name === normalizedQuery ? 0.98 : name.includes(normalizedQuery) ? 0.9 : category.includes(normalizedQuery) ? 0.75 : 0.6;
      return { product_id: product.id, similarity: score, product };
    }).sort((a: any, b: any) => b.similarity - a.similarity);

    const latency = Date.now() - t0;
    const { error: logError } = await supabase.from("riomed_search_queries").insert({
      company_id: companyId,
      user_id: userId ?? null,
      channel: data.channel,
      query_text: query,
      query_image_url: data.imageUrl ?? null,
      query_kind: data.imageUrl ? "multimodal" : "text",
      results_count: results.length,
      top_product_id: results[0]?.product_id ?? null,
      top_score: results[0]?.similarity ?? null,
      latency_ms: latency,
      metadata: { engine: "core_text_search", semantic_enabled: false },
    });
    if (logError) throw new Error(logError.message);

    return { results, latency_ms: latency, kind: data.imageUrl ? "multimodal" : "text", semanticEnabled: false };
  });

export const getRiomedSearchOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const [{ count: searchable }, { data: recent, error }] = await Promise.all([
      supabase.from("riomed_products").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
      supabase.from("riomed_search_queries").select("id,query_text,query_kind,results_count,top_score,latency_ms,created_at")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(15),
    ]);
    if (error) throw new Error(error.message);
    return {
      indexed: searchable ?? 0,
      pending: 0,
      errors: 0,
      recent: recent ?? [],
      semanticEnabled: false,
      engine: "core_text_search",
    };
  });