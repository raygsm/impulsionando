
INSERT INTO public.user_profiles (user_id, company_id, profile_id, display_name, email, is_active)
SELECT '73285c6d-7c8a-421d-b94c-7f24a59f54a0',
       'eb102fc8-5575-4c71-91dc-3ed48be9b353',
       '6fbbb7e6-01ae-447f-bd66-85aeba9f54c4',
       'Mozart Silva Neto',
       'mozartsn@yahoo.com.br',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE user_id='73285c6d-7c8a-421d-b94c-7f24a59f54a0'
    AND company_id='eb102fc8-5575-4c71-91dc-3ed48be9b353'
    AND profile_id='6fbbb7e6-01ae-447f-bd66-85aeba9f54c4'
);
