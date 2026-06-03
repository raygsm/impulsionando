DROP POLICY IF EXISTS "Public can insert marketing leads" ON public.marketing_leads;
CREATE POLICY "Public can insert marketing leads"
ON public.marketing_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (name    IS NULL OR length(name)    BETWEEN 1 AND 200)
  AND (email   IS NULL OR length(email)   BETWEEN 3 AND 200)
  AND (phone   IS NULL OR length(phone)   BETWEEN 3 AND 50)
  AND (company IS NULL OR length(company) <= 200)
  AND (message IS NULL OR length(message) <= 5000)
  AND (notes   IS NULL OR length(notes)   <= 5000)
  AND (source IN ('orcamento','contato','site','outro'))
  AND (status = 'novo')
  AND (assigned_to IS NULL)
  AND (
        coalesce(btrim(name),'')  <> ''
     OR coalesce(btrim(email),'') <> ''
     OR coalesce(btrim(phone),'') <> ''
  )
);