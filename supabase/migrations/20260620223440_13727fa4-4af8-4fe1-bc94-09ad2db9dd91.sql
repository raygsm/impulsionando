
ALTER TABLE public.core_payout_ledger ADD COLUMN IF NOT EXISTS receipt_path text;

DROP POLICY IF EXISTS "payout_receipts_select_staff_or_owner" ON storage.objects;
CREATE POLICY "payout_receipts_select_staff_or_owner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payout-receipts' AND (
    public.is_impulsionando_staff(auth.uid())
    OR public.mp_user_in_company(auth.uid(), split_part(name, '/', 1)::uuid)
  )
);

DROP POLICY IF EXISTS "payout_receipts_write_staff" ON storage.objects;
CREATE POLICY "payout_receipts_write_staff"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payout-receipts' AND public.is_impulsionando_staff(auth.uid()));

DROP POLICY IF EXISTS "payout_receipts_update_staff" ON storage.objects;
CREATE POLICY "payout_receipts_update_staff"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payout-receipts' AND public.is_impulsionando_staff(auth.uid()))
WITH CHECK (bucket_id = 'payout-receipts' AND public.is_impulsionando_staff(auth.uid()));
