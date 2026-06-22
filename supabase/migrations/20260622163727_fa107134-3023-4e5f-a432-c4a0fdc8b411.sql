
UPDATE public.core_tenant_identity
SET metadata = jsonb_set(
      jsonb_set(
        jsonb_set(
          metadata,
          '{social,instagram}',
          '"https://www.instagram.com/riomedequiposmedicos"'::jsonb,
          true
        ),
        '{social,instagram_handle}',
        '"riomedequiposmedicos"'::jsonb,
        true
      ),
      '{ai_assistant,official_channels,instagram}',
      '"https://www.instagram.com/riomedequiposmedicos"'::jsonb,
      true
    ),
    updated_at = now()
WHERE company_id = (SELECT id FROM public.companies WHERE subdomain = 'riomed' LIMIT 1);
