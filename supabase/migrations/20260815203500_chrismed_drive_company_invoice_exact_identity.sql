create or replace function public.chrismed_try_link_historical_company_invoice(p_drive_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_doc public.client_drive_documents%rowtype;
  v_company public.chrismed_occ_client_companies%rowtype;
  v_count integer;
begin
  select * into v_doc from public.client_drive_documents where id=p_drive_document_id;
  if v_doc.id is null then return jsonb_build_object('linked',false,'reason','document_not_found'); end if;
  if not exists(select 1 from public.companies c where c.id=v_doc.company_id and regexp_replace(coalesce(c.document,''),'[^0-9]','','g')='42625058000170') then
    return jsonb_build_object('linked',false,'reason','wrong_company');
  end if;
  if v_doc.document_type not in ('invoice','nfse','nota_fiscal') then return jsonb_build_object('linked',false,'reason','not_invoice'); end if;
  if public.normalize_identity_document(v_doc.party_document) is null or length(public.normalize_identity_document(v_doc.party_document))<>14 or public.normalize_identity_name(v_doc.party_name) is null then
    return jsonb_build_object('linked',false,'reason','company_identity_incomplete');
  end if;

  select count(*) into v_count
  from public.chrismed_occ_client_companies c
  where c.company_id=v_doc.company_id
    and c.status in ('approved','active')
    and public.normalize_identity_document(c.document)=public.normalize_identity_document(v_doc.party_document)
    and public.normalize_identity_name(c.legal_name)=public.normalize_identity_name(v_doc.party_name);

  if v_count<>1 then
    insert into public.client_drive_audit_log(company_id,drive_document_id,actor_type,action,result,metadata)
    values(v_doc.company_id,v_doc.id,'oliver','historical_company_invoice_match','review_required',jsonb_build_object('candidate_count',v_count,'match_rule','cnpj_exact_and_legal_name_exact'));
    return jsonb_build_object('linked',false,'reason','ambiguous_or_no_exact_company_match','candidate_count',v_count);
  end if;

  select * into v_company
  from public.chrismed_occ_client_companies c
  where c.company_id=v_doc.company_id
    and c.status in ('approved','active')
    and public.normalize_identity_document(c.document)=public.normalize_identity_document(v_doc.party_document)
    and public.normalize_identity_name(c.legal_name)=public.normalize_identity_name(v_doc.party_name)
  limit 1;

  insert into public.client_drive_document_links(company_id,drive_document_id,entity_type,entity_id,match_method,match_score,match_evidence,release_to_entity,approved_at)
  values(v_doc.company_id,v_doc.id,'company',v_company.id,'exact_identity',1.0000,jsonb_build_object('cnpj_exact',true,'legal_name_exact',true),true,now())
  on conflict(drive_document_id,entity_type,entity_id) do update set match_method='exact_identity',match_score=1.0000,match_evidence=excluded.match_evidence,release_to_entity=true,approved_at=now();

  update public.client_drive_documents set release_policy='company_owner_only',updated_at=now() where id=v_doc.id;
  insert into public.client_drive_audit_log(company_id,drive_document_id,actor_type,action,entity_type,entity_id,result,metadata)
  values(v_doc.company_id,v_doc.id,'oliver','historical_company_invoice_linked','company',v_company.id,'success',jsonb_build_object('cnpj_exact',true,'legal_name_exact',true));

  return jsonb_build_object('linked',true,'client_company_id',v_company.id);
end;$$;

revoke execute on function public.chrismed_try_link_historical_company_invoice(uuid) from public,anon,authenticated;
grant execute on function public.chrismed_try_link_historical_company_invoice(uuid) to service_role;
