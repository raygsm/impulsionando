-- Register CHRISMED in the central communication core using only its owned domain.
-- Provider credentials remain external secrets and sending stays disabled until DNS/SMTP validation.
do $migration$
declare
  v_tenant_id uuid;
  v_brand_id uuid;
  v_provider_id uuid;
begin
  insert into public.communication_tenants (
    kind,
    slug,
    legal_name,
    display_name,
    locale,
    timezone,
    settings,
    active
  ) values (
    'COMPANY',
    'chrismed',
    'CHRISMED',
    'CHRISMED',
    'pt-BR',
    'America/Sao_Paulo',
    jsonb_build_object(
      'company_id', '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
      'owned_domain', 'chrismed.com.br',
      'email_domain', 'chrismed.com.br',
      'email_domain_policy', 'OWNED_DOMAIN_ONLY',
      'sender_status', 'PENDING_DNS_AND_SMTP_VALIDATION',
      'source', 'chrismed_operational_core'
    ),
    true
  )
  on conflict (slug) do update
    set legal_name = excluded.legal_name,
        display_name = excluded.display_name,
        locale = excluded.locale,
        timezone = excluded.timezone,
        settings = communication_tenants.settings || excluded.settings,
        active = true,
        deleted_at = null,
        updated_at = now()
  returning id into v_tenant_id;

  select id into v_brand_id
  from public.communication_brands
  where tenant_id = v_tenant_id
    and domain = 'chrismed.com.br'
    and deleted_at is null
  order by created_at
  limit 1;

  if v_brand_id is null then
    insert into public.communication_brands (
      tenant_id,
      name,
      domain,
      privacy_url,
      terms_url,
      support_url,
      primary_color,
      secondary_color,
      hide_impulsionando_brand,
      settings
    ) values (
      v_tenant_id,
      'CHRISMED',
      'chrismed.com.br',
      'https://chrismed.impulsionando.com.br/privacidade',
      'https://chrismed.impulsionando.com.br/termos',
      'mailto:sac@chrismed.com.br',
      '#006B68',
      '#F5B642',
      true,
      jsonb_build_object(
        'web_app_origin', 'https://chrismed.impulsionando.com.br',
        'email_domain', 'chrismed.com.br'
      )
    ) returning id into v_brand_id;
  else
    update public.communication_brands
    set name = 'CHRISMED',
        privacy_url = 'https://chrismed.impulsionando.com.br/privacidade',
        terms_url = 'https://chrismed.impulsionando.com.br/termos',
        support_url = 'mailto:sac@chrismed.com.br',
        primary_color = '#006B68',
        secondary_color = '#F5B642',
        hide_impulsionando_brand = true,
        settings = settings || jsonb_build_object(
          'web_app_origin', 'https://chrismed.impulsionando.com.br',
          'email_domain', 'chrismed.com.br'
        ),
        updated_at = now()
    where id = v_brand_id;
  end if;

  insert into public.communication_provider_accounts (
    tenant_id,
    provider,
    secret_reference,
    config,
    active
  ) values (
    v_tenant_id,
    'hostinger_smtp',
    'CHRISMED_SMTP_CREDENTIALS',
    jsonb_build_object(
      'host', 'smtp.hostinger.com',
      'port', 465,
      'security', 'implicit_tls',
      'credential_storage', 'supabase_edge_function_secret',
      'status', 'PENDING_CREDENTIAL_AND_DNS_VALIDATION'
    ),
    false
  )
  on conflict (tenant_id, provider) do update
    set secret_reference = excluded.secret_reference,
        config = communication_provider_accounts.config || excluded.config,
        active = false
  returning id into v_provider_id;

  insert into public.communication_senders (
    tenant_id,
    brand_id,
    name,
    email,
    reply_to,
    domain,
    provider_account_id,
    dns_status,
    verified_at,
    active
  ) values
    (
      v_tenant_id,
      v_brand_id,
      'CHRISMED — Relacionamento',
      'sac@chrismed.com.br',
      'sac@chrismed.com.br',
      'chrismed.com.br',
      v_provider_id,
      jsonb_build_object(
        'status', 'PENDING_VALIDATION',
        'spf', 'PENDING',
        'dkim', 'PENDING',
        'dmarc', 'PENDING',
        'smtp', 'PENDING'
      ),
      null,
      false
    ),
    (
      v_tenant_id,
      v_brand_id,
      'CHRISMED — Suporte Técnico',
      'ti@chrismed.com.br',
      'ti@chrismed.com.br',
      'chrismed.com.br',
      v_provider_id,
      jsonb_build_object(
        'status', 'PENDING_VALIDATION',
        'spf', 'PENDING',
        'dkim', 'PENDING',
        'dmarc', 'PENDING',
        'smtp', 'PENDING'
      ),
      null,
      false
    )
  on conflict (tenant_id, email) do update
    set brand_id = excluded.brand_id,
        name = excluded.name,
        reply_to = excluded.reply_to,
        domain = excluded.domain,
        provider_account_id = excluded.provider_account_id,
        dns_status = excluded.dns_status,
        verified_at = null,
        active = false;

  insert into public.company_settings (company_id, key, value, value_type, category)
  values
    ('642096b5-a9ff-4521-a82a-c004f6d2e2d2', 'comms.email_domain', to_jsonb('chrismed.com.br'::text), 'text', 'comunicacao'),
    ('642096b5-a9ff-4521-a82a-c004f6d2e2d2', 'comms.smtp_provider', to_jsonb('hostinger_smtp'::text), 'text', 'comunicacao'),
    ('642096b5-a9ff-4521-a82a-c004f6d2e2d2', 'comms.sender_email', to_jsonb('sac@chrismed.com.br'::text), 'text', 'comunicacao')
  on conflict (company_id, key) do update
    set value = excluded.value,
        value_type = excluded.value_type,
        category = excluded.category,
        updated_at = now();
end
$migration$;
