do $$
declare
  v_tenant uuid;
  v_brand uuid;
  v_lead_template uuid;
  v_post_template uuid;
  v_now timestamptz := now();
begin
  select id into v_tenant from public.communication_tenants where slug='wmp' and active=true limit 1;
  if v_tenant is null then raise exception 'WMP tenant not found'; end if;

  select id,brand_id into v_lead_template,v_brand
  from public.communication_templates
  where tenant_id=v_tenant and template_key='wmp.lead.received' and deleted_at is null
  order by created_at asc limit 1;

  if v_brand is null then
    select id into v_brand from public.communication_brands where tenant_id=v_tenant and deleted_at is null order by created_at asc limit 1;
  end if;

  if v_lead_template is not null and not exists (
    select 1 from public.communication_template_versions where template_id=v_lead_template and version=2
  ) then
    insert into public.communication_template_versions(
      tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
      variables_schema,required_variables,optional_variables,fallback_values,approval_status,published_at
    ) values (
      v_tenant,v_lead_template,2,
      'Recebemos seu pedido — a WMP já começou',
      'Seu atendimento com o Milito já está organizado no ecossistema WMP.',
      '<p>Olá {{nome}}.</p><p>O <strong>Milito</strong> recebeu seu pedido e já está organizando os dados do seu evento. Você pode continuar enviando detalhes, fotos e referências pelo atendimento WMP.</p><p>Quando houver informações suficientes, seguimos para briefing, proposta e próximos passos de forma organizada.</p>',
      'Olá {{nome}}. O Milito recebeu seu pedido e já está organizando os dados do seu evento. Você pode continuar enviando detalhes, fotos e referências pelo atendimento WMP. Quando houver informações suficientes, seguimos para briefing, proposta e próximos passos de forma organizada.',
      '{}'::jsonb,array['nome']::text[],array[]::text[],'{}'::jsonb,'APPROVED',v_now
    );
    update public.communication_templates set current_version=2,status='PUBLISHED',updated_at=v_now where id=v_lead_template;
  end if;

  select id into v_post_template from public.communication_templates where tenant_id=v_tenant and template_key='wmp.event.completed' and channel='EMAIL' and locale='pt-BR' and deleted_at is null limit 1;
  if v_post_template is null then
    insert into public.communication_templates(
      tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version
    ) values (
      v_tenant,v_brand,'wmp.event.completed','wmp.event.completed','EMAIL','SERVICE','pt-BR','PUBLISHED',1
    ) returning id into v_post_template;
    insert into public.communication_template_versions(
      tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
      variables_schema,required_variables,optional_variables,fallback_values,approval_status,published_at
    ) values (
      v_tenant,v_post_template,1,
      'Obrigado por viver este evento com a WMP',
      'Seu evento foi concluído. Queremos ouvir como foi a experiência.',
      '<p>Olá {{nome}}.</p><p>Seu evento <strong>{{evento}}</strong> foi concluído e queremos agradecer pela confiança na WMP.</p><p>Seu retorno ajuda nossa equipe a aperfeiçoar curadoria, operação e experiência. Quando o link de avaliação estiver disponível, você poderá compartilhar sua percepção por aqui: {{feedback_url}}</p><p>Se já estiver pensando no próximo evento, o Milito pode retomar todo o contexto e organizar a nova demanda.</p>',
      'Olá {{nome}}. Seu evento {{evento}} foi concluído e queremos agradecer pela confiança na WMP. Seu retorno ajuda nossa equipe a aperfeiçoar curadoria, operação e experiência. Avaliação: {{feedback_url}}. Se já estiver pensando no próximo evento, o Milito pode retomar todo o contexto e organizar a nova demanda.',
      '{}'::jsonb,array['nome','evento']::text[],array['feedback_url']::text[],jsonb_build_object('feedback_url','https://wmp.impulsionando.com.br/'), 'APPROVED',v_now
    );
  end if;
end $$;
