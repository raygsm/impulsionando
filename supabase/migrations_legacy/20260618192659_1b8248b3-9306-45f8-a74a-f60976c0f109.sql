-- Allow brewery owners to insert/update lead preferences captured on behalf of consumers
-- (e.g. at a tasting/QR), as long as the row is anonymous (no consumer_user_id) and belongs to a brand they own.
CREATE POLICY "Brand owner captures anonymous leads"
  ON public.brewery_lead_preferences FOR INSERT TO authenticated
  WITH CHECK (
    consumer_user_id IS NULL
    AND brand_id IS NOT NULL
    AND public.has_brewery_access(auth.uid(), brand_id)
  );

CREATE POLICY "Brand owner updates anonymous leads"
  ON public.brewery_lead_preferences FOR UPDATE TO authenticated
  USING (
    consumer_user_id IS NULL
    AND brand_id IS NOT NULL
    AND public.has_brewery_access(auth.uid(), brand_id)
  )
  WITH CHECK (
    consumer_user_id IS NULL
    AND brand_id IS NOT NULL
    AND public.has_brewery_access(auth.uid(), brand_id)
  );