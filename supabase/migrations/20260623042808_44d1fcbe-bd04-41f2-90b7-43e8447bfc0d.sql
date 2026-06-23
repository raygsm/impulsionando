INSERT INTO public.core_integrations (slug, name, environment, status, config) VALUES
  ('facebook_lead_ads', 'Facebook Lead Ads', 'production', 'not_configured', '{"scope":"riomed","purpose":"lead_capture"}'::jsonb),
  ('instagram_lead_ads', 'Instagram Lead Ads', 'production', 'not_configured', '{"scope":"riomed","purpose":"lead_capture"}'::jsonb),
  ('whatsapp_cloud_riomed', 'WhatsApp Cloud API — RioMed', 'production', 'not_configured', '{"scope":"riomed","country":"BO"}'::jsonb),
  ('sin_bolivia', 'SIN Bolívia — Facturación Electrónica', 'sandbox', 'not_configured', '{"scope":"riomed","country":"BO","modalidad":"computarizada_en_linea"}'::jsonb),
  ('resend_riomed', 'Resend — E-mail Transacional RioMed', 'production', 'not_configured', '{"scope":"riomed","from_domain":"riomed.bo"}'::jsonb),
  ('cotacao_bob_usd', 'Cotação BOB/USD — Banco Central BO', 'production', 'not_configured', '{"scope":"riomed","source":"bcb_bo","schedule":"daily"}'::jsonb),
  ('google_maps_bo', 'Google Maps — Geocoding BO', 'production', 'not_configured', '{"scope":"riomed","country":"BO"}'::jsonb),
  ('site_publico_riomed', 'Site Público RioMed — Catálogo', 'production', 'not_configured', '{"scope":"riomed","sync":"catalog"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;