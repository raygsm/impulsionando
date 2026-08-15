drop policy if exists chrismed_records_insert on public.chrismed_clinical_records;
create policy chrismed_records_insert on public.chrismed_clinical_records
for insert to authenticated
with check (
  company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and (
    public.chrismed_is_clinical_admin(company_id)
    or exists (
      select 1 from public.agenda_professionals ap
      where ap.id=professional_id
        and ap.user_id=auth.uid()
        and ap.company_id=chrismed_clinical_records.company_id
        and ap.is_active is true
        and ap.profile_status in ('approved','active')
    )
  )
);

drop policy if exists chrismed_records_update on public.chrismed_clinical_records;
create policy chrismed_records_update on public.chrismed_clinical_records
for update to authenticated
using (
  company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and (
    public.chrismed_is_clinical_admin(company_id)
    or exists (
      select 1 from public.agenda_professionals ap
      where ap.id=professional_id
        and ap.user_id=auth.uid()
        and ap.company_id=chrismed_clinical_records.company_id
        and ap.is_active is true
        and ap.profile_status in ('approved','active')
    )
  )
)
with check (
  company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and (
    public.chrismed_is_clinical_admin(company_id)
    or exists (
      select 1 from public.agenda_professionals ap
      where ap.id=professional_id
        and ap.user_id=auth.uid()
        and ap.company_id=chrismed_clinical_records.company_id
        and ap.is_active is true
        and ap.profile_status in ('approved','active')
    )
  )
);

drop policy if exists chrismed_documents_insert on public.chrismed_patient_documents;
create policy chrismed_documents_insert on public.chrismed_patient_documents
for insert to authenticated
with check (
  company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and (
    (patient_user_id=auth.uid() and source='patient' and visibility='patient_and_care_team')
    or public.chrismed_is_clinical_admin(company_id)
    or exists (
      select 1 from public.agenda_professionals ap
      where ap.id=professional_id
        and ap.user_id=auth.uid()
        and ap.company_id=chrismed_patient_documents.company_id
        and ap.is_active is true
        and ap.profile_status in ('approved','active')
    )
  )
);

drop policy if exists occ_client_companies_insert on public.chrismed_occ_client_companies;
create policy occ_client_companies_insert on public.chrismed_occ_client_companies
for insert to authenticated
with check (
  company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
  and (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id=auth.uid()
        and ur.company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid
        and ur.role::text in ('admin','gestor')
    )
    or public.is_impulsionando_staff(auth.uid())
  )
);
