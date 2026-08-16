-- RioMed latest language strategy: pt-BR default with contextual multilingual support.
update public.communication_tenants
set locale='pt-BR',
    settings = coalesce(settings,'{}'::jsonb)
      || jsonb_build_object(
        'default_locale','pt-BR',
        'supported_locales',jsonb_build_array('pt-BR','es-BO','es','pt'),
        'locale_strategy','contextual_by_country_and_user',
        'country','Bolivia',
        'multi_country',true,
        'locale_review_required',false
      ),
    updated_at=now()
where slug='rio-med' and active=true and deleted_at is null;

update public.communication_agent_runtime
set config = coalesce(config,'{}'::jsonb)
      || jsonb_build_object(
        'locale','pt-BR',
        'default_locale','pt-BR',
        'supported_locales',jsonb_build_array('pt-BR','es-BO','es','pt'),
        'locale_strategy','contextual_by_country_and_user'
      ),
    updated_at=now()
where agent_key='riomed-medicito';