
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.riomed_product_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.riomed_product_variants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('text','image','multimodal')),
  source text NOT NULL,
  source_hash text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-embedding-001',
  dims int NOT NULL DEFAULT 1536,
  embedding vector(1536) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX riomed_embeddings_unique_idx
  ON public.riomed_product_embeddings(product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, source_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_product_embeddings TO authenticated;
GRANT ALL ON public.riomed_product_embeddings TO service_role;
ALTER TABLE public.riomed_product_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY rpe_company_rw ON public.riomed_product_embeddings
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_product_embeddings.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_product_embeddings.company_id)
  );

CREATE INDEX riomed_embeddings_product_idx ON public.riomed_product_embeddings(product_id);
CREATE INDEX riomed_embeddings_company_kind_idx ON public.riomed_product_embeddings(company_id, kind);
CREATE INDEX riomed_embeddings_hnsw_idx
  ON public.riomed_product_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_riomed_embeddings_updated_at
  BEFORE UPDATE ON public.riomed_product_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.riomed_search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('web','whatsapp','api','b2b')),
  query_text text,
  query_image_url text,
  query_kind text NOT NULL DEFAULT 'text' CHECK (query_kind IN ('text','image','multimodal')),
  results_count int NOT NULL DEFAULT 0,
  top_product_id uuid REFERENCES public.riomed_products(id) ON DELETE SET NULL,
  top_score numeric(6,4),
  latency_ms int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_search_queries TO authenticated;
GRANT ALL ON public.riomed_search_queries TO service_role;
ALTER TABLE public.riomed_search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY rsq_company_rw ON public.riomed_search_queries
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_search_queries.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_search_queries.company_id)
  );

CREATE INDEX riomed_search_queries_company_created_idx
  ON public.riomed_search_queries(company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.riomed_match_products(
  p_company_id uuid,
  p_query_embedding vector(1536),
  p_kind text DEFAULT NULL,
  p_match_count int DEFAULT 20,
  p_min_similarity float DEFAULT 0.5
)
RETURNS TABLE (
  product_id uuid,
  variant_id uuid,
  kind text,
  source text,
  similarity float,
  metadata jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    e.product_id,
    e.variant_id,
    e.kind,
    e.source,
    1 - (e.embedding <=> p_query_embedding) AS similarity,
    e.metadata
  FROM public.riomed_product_embeddings e
  WHERE e.company_id = p_company_id
    AND (p_kind IS NULL OR e.kind = p_kind)
    AND 1 - (e.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

CREATE TABLE public.riomed_embedding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.riomed_products(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('text','image','multimodal')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_embedding_jobs TO authenticated;
GRANT ALL ON public.riomed_embedding_jobs TO service_role;
ALTER TABLE public.riomed_embedding_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rej_company_rw ON public.riomed_embedding_jobs
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_embedding_jobs.company_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = riomed_embedding_jobs.company_id)
  );

CREATE INDEX riomed_embedding_jobs_status_idx
  ON public.riomed_embedding_jobs(status, created_at) WHERE status IN ('pending','error');

CREATE TRIGGER trg_riomed_embedding_jobs_updated_at
  BEFORE UPDATE ON public.riomed_embedding_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.riomed_enqueue_embedding_on_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.riomed_embedding_jobs (company_id, product_id, kind)
  VALUES (NEW.company_id, NEW.id, 'text');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_riomed_products_embed_enqueue
  AFTER INSERT OR UPDATE OF name, description ON public.riomed_products
  FOR EACH ROW EXECUTE FUNCTION public.riomed_enqueue_embedding_on_change();

INSERT INTO public.riomed_embedding_jobs (company_id, product_id, kind)
SELECT company_id, id, 'text' FROM public.riomed_products;
