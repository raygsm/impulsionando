
-- Fix broad-write bypass: these permissive policies granted authenticated users
-- INSERT/UPDATE/DELETE on ALL non-fiscal-reports storage buckets.
DROP POLICY IF EXISTS fiscal_reports_block_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS fiscal_reports_block_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS fiscal_reports_block_authenticated_delete ON storage.objects;

-- Re-block fiscal-reports writes using RESTRICTIVE policies (AND-combined),
-- so they only deny fiscal-reports writes without granting anything elsewhere.
CREATE POLICY fiscal_reports_block_authenticated_insert
  ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'fiscal-reports');

CREATE POLICY fiscal_reports_block_authenticated_update
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id <> 'fiscal-reports')
  WITH CHECK (bucket_id <> 'fiscal-reports');

CREATE POLICY fiscal_reports_block_authenticated_delete
  ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id <> 'fiscal-reports');
