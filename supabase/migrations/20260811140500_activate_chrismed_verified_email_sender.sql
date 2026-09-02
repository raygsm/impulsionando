-- Activate only the CHRISMED sender that passed SMTP delivery and public DNS checks.
do $migration$
declare
  v_tenant_id uuid;
begin
  select id into strict v_tenant_id
  from public.communication_tenants
  where slug = 'chrismed';

  update public.communication_tenants
  set settings = settings || jsonb_build_object(
        'sender_status', 'ACTIVE',
        'email_validation', jsonb_build_object(
          'spf', 'VERIFIED',
          'dkim', 'VERIFIED',
          'dmarc', 'VERIFIED_MONITORING_POLICY',
          'mx', 'VERIFIED',
          'smtp', 'VERIFIED',
          'auth_hook', 'VERIFIED'
        )
      ),
      updated_at = now()
  where id = v_tenant_id;

  update public.communication_provider_accounts
  set config = config || jsonb_build_object(
        'status', 'VERIFIED',
        'verified_sender', 'sac@chrismed.com.br'
      ),
      active = true
  where tenant_id = v_tenant_id
    and provider = 'hostinger_smtp';

  update public.communication_senders
  set dns_status = jsonb_build_object(
        'status', 'VERIFIED',
        'spf', 'VERIFIED',
        'dkim', 'VERIFIED',
        'dmarc', 'VERIFIED_MONITORING_POLICY',
        'mx', 'VERIFIED',
        'smtp', 'VERIFIED',
        'auth_hook', 'VERIFIED'
      ),
      verified_at = now(),
      active = true
  where tenant_id = v_tenant_id
    and email = 'sac@chrismed.com.br';

  update public.communication_senders
  set dns_status = jsonb_build_object(
        'status', 'DOMAIN_VERIFIED_SMTP_PENDING',
        'spf', 'VERIFIED',
        'dkim', 'VERIFIED',
        'dmarc', 'VERIFIED_MONITORING_POLICY',
        'mx', 'VERIFIED',
        'smtp', 'PENDING_MAILBOX_OR_ALIAS_TEST'
      ),
      verified_at = null,
      active = false
  where tenant_id = v_tenant_id
    and email = 'ti@chrismed.com.br';
end
$migration$;
