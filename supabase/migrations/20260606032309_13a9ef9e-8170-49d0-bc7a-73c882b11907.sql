-- Substituir a policy de UPDATE permissiva por uma restrita
DROP POLICY IF EXISTS "Anyone can update own quote by id" ON public.quotes;

CREATE POLICY "Anyone can update draft quote within 24h"
  ON public.quotes FOR UPDATE
  TO anon, authenticated
  USING (
    status = 'draft'
    AND accepted_at IS NULL
    AND created_at > (now() - INTERVAL '24 hours')
  )
  WITH CHECK (
    status IN ('draft','reviewed','accepted','payment_requested')
    AND created_at > (now() - INTERVAL '24 hours')
  );

-- Revogar EXECUTE público das funções trigger (uso interno apenas)
REVOKE EXECUTE ON FUNCTION public.tg_quotes_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_quotes_set_number() FROM PUBLIC, anon, authenticated;