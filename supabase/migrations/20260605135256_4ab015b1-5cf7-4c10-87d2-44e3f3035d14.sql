DROP POLICY IF EXISTS "Public can insert marketing leads" ON public.marketing_leads;

CREATE POLICY "Public can insert marketing leads"
ON public.marketing_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ((name IS NULL) OR ((length(name) >= 1) AND (length(name) <= 200)))
  AND ((email IS NULL) OR ((length(email) >= 3) AND (length(email) <= 200)))
  AND ((phone IS NULL) OR ((length(phone) >= 3) AND (length(phone) <= 50)))
  AND ((company IS NULL) OR (length(company) <= 200))
  AND ((message IS NULL) OR (length(message) <= 5000))
  AND ((notes IS NULL) OR (length(notes) <= 5000))
  AND (source = ANY (ARRAY['orcamento'::text, 'contato'::text, 'demo'::text, 'outro'::text]))
  AND (status = 'new'::text)
  AND (assigned_to IS NULL)
  AND (
    (COALESCE(btrim(name), '') <> '')
    OR (COALESCE(btrim(email), '') <> '')
    OR (COALESCE(btrim(phone), '') <> '')
  )
);