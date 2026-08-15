drop policy if exists chrismed_professional_fiscal_storage_delete on storage.objects;

create policy chrismed_professional_fiscal_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id='chrismed-professional-fiscal'
  and (storage.foldername(name))[1]='642096b5-a9ff-4521-a82a-c004f6d2e2d2'
  and (storage.foldername(name))[2]=auth.uid()::text
  and exists (
    select 1
    from public.chrismed_professional_fiscal_invoices fi
    join public.agenda_professionals ap on ap.id=fi.professional_id
    where fi.storage_path=storage.objects.name
      and ap.user_id=auth.uid()
      and fi.status in ('pending','rejected')
  )
);
