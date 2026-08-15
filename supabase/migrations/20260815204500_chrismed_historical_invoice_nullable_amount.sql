create or replace function public.chrismed_try_link_historical_invoice(p_drive_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_doc public.client_drive_documents%rowtype;
  v_patient public.chrismed_patient_profiles%rowtype;
  v_count integer;
  v_invoice_id uuid;
begin
  select * into v_doc from public.client_drive_documents where id=p_drive_document_id;
  if v_doc.id is null then return jsonb_build_object('linked',false,'reason','document_not_found'); end if;
  if not exists(select 1 from public.companies c where c.id=v_doc.company_id and regexp_replace(coalesce(c.document,''),'[^0-9]','','g')='42625058000170') then return jsonb_build_object('linked',false,'reason','wrong_company'); end if;
  if v_doc.document_type not in ('invoice','nfse','nota_fiscal') then return jsonb_build_object('linked',false,'reason','not_invoice'); end if;
  if public.normalize_identity_document(v_doc.party_document) is null or public.normalize_identity_name(v_doc.party_name) is null then return jsonb_build_object('linked',false,'reason','identity_incomplete'); end if;

  select count(*) into v_count from public.chrismed_patient_profiles p
  where p.company_id=v_doc.company_id and p.status='approved'
    and public.normalize_identity_document(p.cpf)=public.normalize_identity_document(v_doc.party_document)
    and public.normalize_identity_name(p.full_name)=public.normalize_identity_name(v_doc.party_name);

  if v_count<>1 then
    insert into public.client_drive_audit_log(company_id,drive_document_id,actor_type,action,result,metadata)
    values(v_doc.company_id,v_doc.id,'oliver','historical_invoice_match','review_required',jsonb_build_object('candidate_count',v_count,'match_rule','cpf_exact_and_name_exact'));
    return jsonb_build_object('linked',false,'reason','ambiguous_or_no_exact_match','candidate_count',v_count);
  end if;

  select * into v_patient from public.chrismed_patient_profiles p
  where p.company_id=v_doc.company_id and p.status='approved'
    and public.normalize_identity_document(p.cpf)=public.normalize_identity_document(v_doc.party_document)
    and public.normalize_identity_name(p.full_name)=public.normalize_identity_name(v_doc.party_name)
  limit 1;

  insert into public.client_drive_document_links(company_id,drive_document_id,entity_type,entity_id,match_method,match_score,match_evidence,release_to_entity,approved_at)
  values(v_doc.company_id,v_doc.id,'patient',v_patient.user_id,'exact_identity',1.0000,jsonb_build_object('cpf_exact',true,'name_exact',true),true,now())
  on conflict(drive_document_id,entity_type,entity_id) do update set match_method='exact_identity',match_score=1.0000,match_evidence=excluded.match_evidence,release_to_entity=true,approved_at=now();

  select id into v_invoice_id from public.chrismed_patient_invoices where drive_document_id=v_doc.id limit 1;
  if v_invoice_id is null then
    insert into public.chrismed_patient_invoices(company_id,patient_user_id,invoice_number,status,amount_cents,pdf_storage_path,issued_at,metadata,drive_document_id,drive_file_id,drive_web_view_url)
    values(v_doc.company_id,v_patient.user_id,v_doc.document_number,'issued',v_doc.amount_cents,null,v_doc.issued_at,jsonb_build_object('source','google_drive_historical','matched_by','exact_identity','amount_extracted',v_doc.amount_cents is not null),v_doc.id,v_doc.drive_file_id,v_doc.web_view_url)
    returning id into v_invoice_id;
  end if;

  update public.client_drive_documents set release_policy='authenticated_owner_only',updated_at=now() where id=v_doc.id;
  insert into public.client_drive_audit_log(company_id,drive_document_id,actor_type,action,entity_type,entity_id,result,metadata)
  values(v_doc.company_id,v_doc.id,'oliver','historical_invoice_linked','patient',v_patient.user_id,'success',jsonb_build_object('invoice_id',v_invoice_id,'cpf_exact',true,'name_exact',true,'amount_extracted',v_doc.amount_cents is not null));
  return jsonb_build_object('linked',true,'patient_user_id',v_patient.user_id,'invoice_id',v_invoice_id);
end;$$;

revoke execute on function public.chrismed_try_link_historical_invoice(uuid) from public,anon,authenticated;
grant execute on function public.chrismed_try_link_historical_invoice(uuid) to service_role;
