
CREATE TYPE public.aff_product_status AS ENUM ('draft','active','paused','blocked','closed');
CREATE TYPE public.aff_product_kind AS ENUM ('fisico','digital','servico','evento','assinatura','plano','consulta','agenda','curso','experiencia');
CREATE TYPE public.aff_offer_billing AS ENUM ('a_vista','parcelado','recorrente','assinatura');
CREATE TYPE public.aff_affiliate_status AS ENUM ('pendente','aprovado','reprovado','suspenso','bloqueado','inativo');
CREATE TYPE public.aff_link_kind AS ENUM ('link','cupom','qrcode');
CREATE TYPE public.aff_sale_status AS ENUM (
  'venda_registrada','pagto_pendente','aprovado','aguardando_gateway',
  'aguardando_prazo_interno','disponivel','saque_solicitado','saque_aprovado',
  'pago','cancelado','estornado','chargeback','bloqueado'
);
CREATE TYPE public.aff_commission_kind AS ENUM ('produtor','coprodutor','afiliado','gerente','plataforma');
CREATE TYPE public.aff_payout_status AS ENUM ('solicitado','aprovado','pago','rejeitado','cancelado');

CREATE TABLE public.aff_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  niche_slug text,
  kind public.aff_product_kind NOT NULL DEFAULT 'digital',
  base_price numeric(14,2) NOT NULL DEFAULT 0,
  image_url text,
  sales_page_url text,
  checkout_url text,
  status public.aff_product_status NOT NULL DEFAULT 'draft',
  producer_user_id uuid,
  default_commission_pct numeric(6,3) NOT NULL DEFAULT 30,
  allow_affiliate boolean NOT NULL DEFAULT true,
  require_affiliate_approval boolean NOT NULL DEFAULT true,
  allow_coupon boolean NOT NULL DEFAULT true,
  allow_unique_link boolean NOT NULL DEFAULT true,
  allow_qrcode boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_products TO authenticated;
GRANT ALL ON public.aff_products TO service_role;
ALTER TABLE public.aff_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_products_select ON public.aff_products FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_products_write ON public.aff_products FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.product.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.product.write'));
CREATE TRIGGER aff_products_updated_at BEFORE UPDATE ON public.aff_products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_products_company_idx ON public.aff_products(company_id);
CREATE INDEX aff_products_status_idx ON public.aff_products(company_id, status);

CREATE TABLE public.aff_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(14,2) NOT NULL DEFAULT 0,
  billing public.aff_offer_billing NOT NULL DEFAULT 'a_vista',
  installments int NOT NULL DEFAULT 1,
  recurring_interval text,
  trial_days int NOT NULL DEFAULT 0,
  allow_coupon boolean NOT NULL DEFAULT true,
  allow_affiliate boolean NOT NULL DEFAULT true,
  commission_pct numeric(6,3),
  landing_url text,
  checkout_url text,
  status public.aff_product_status NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_offers TO authenticated;
GRANT ALL ON public.aff_offers TO service_role;
ALTER TABLE public.aff_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_offers_select ON public.aff_offers FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_offers_write ON public.aff_offers FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.product.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.product.write'));
CREATE TRIGGER aff_offers_updated_at BEFORE UPDATE ON public.aff_offers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_offers_product_idx ON public.aff_offers(product_id);

CREATE TABLE public.aff_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  email text,
  whatsapp text,
  commission_pct numeric(6,3) NOT NULL DEFAULT 5,
  commission_fixed numeric(14,2),
  status public.aff_affiliate_status NOT NULL DEFAULT 'aprovado',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_managers TO authenticated;
GRANT ALL ON public.aff_managers TO service_role;
ALTER TABLE public.aff_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_managers_select ON public.aff_managers FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) OR user_id = auth.uid() OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_managers_write ON public.aff_managers FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.manager.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.manager.write'));
CREATE TRIGGER aff_managers_updated_at BEFORE UPDATE ON public.aff_managers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_managers_company_idx ON public.aff_managers(company_id);

CREATE TABLE public.aff_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  document text,
  email text,
  whatsapp text,
  city text,
  state text,
  country text DEFAULT 'BR',
  instagram text,
  site text,
  main_channel text,
  pix_key text,
  bank_data jsonb,
  status public.aff_affiliate_status NOT NULL DEFAULT 'pendente',
  manager_id uuid REFERENCES public.aff_managers(id) ON DELETE SET NULL,
  notes text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_affiliates TO authenticated;
GRANT ALL ON public.aff_affiliates TO service_role;
ALTER TABLE public.aff_affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_affiliates_select ON public.aff_affiliates FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) OR user_id = auth.uid() OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_affiliates_write ON public.aff_affiliates FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'));
CREATE POLICY aff_affiliates_self_update ON public.aff_affiliates FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER aff_affiliates_updated_at BEFORE UPDATE ON public.aff_affiliates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_affiliates_company_idx ON public.aff_affiliates(company_id);
CREATE INDEX aff_affiliates_user_idx ON public.aff_affiliates(user_id);
CREATE INDEX aff_affiliates_manager_idx ON public.aff_affiliates(manager_id);

CREATE TABLE public.aff_coproducers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.aff_offers(id) ON DELETE SET NULL,
  name text NOT NULL,
  document text,
  email text,
  whatsapp text,
  participation_pct numeric(6,3),
  fixed_amount numeric(14,2),
  scope text NOT NULL DEFAULT 'product',
  applies_to_affiliate_sales boolean NOT NULL DEFAULT true,
  applies_to_upsell boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status public.aff_affiliate_status NOT NULL DEFAULT 'aprovado',
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_coproducers TO authenticated;
GRANT ALL ON public.aff_coproducers TO service_role;
ALTER TABLE public.aff_coproducers ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_coproducers_select ON public.aff_coproducers FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) OR user_id = auth.uid() OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_coproducers_write ON public.aff_coproducers FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.coproducer.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.coproducer.write'));
CREATE TRIGGER aff_coproducers_updated_at BEFORE UPDATE ON public.aff_coproducers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_copro_product_idx ON public.aff_coproducers(product_id);

CREATE TABLE public.aff_affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.aff_affiliates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE CASCADE,
  custom_commission_pct numeric(6,3),
  status public.aff_affiliate_status NOT NULL DEFAULT 'aprovado',
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_affiliate_products TO authenticated;
GRANT ALL ON public.aff_affiliate_products TO service_role;
ALTER TABLE public.aff_affiliate_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_ap_select ON public.aff_affiliate_products FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id)
         OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
         OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_ap_write ON public.aff_affiliate_products FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.affiliate.write'));
CREATE TRIGGER aff_ap_updated_at BEFORE UPDATE ON public.aff_affiliate_products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.aff_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  affiliate_id uuid REFERENCES public.aff_affiliates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.aff_products(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.aff_offers(id) ON DELETE SET NULL,
  campaign text,
  kind public.aff_link_kind NOT NULL DEFAULT 'link',
  slug text NOT NULL UNIQUE,
  destination_url text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  clicks int NOT NULL DEFAULT 0,
  leads int NOT NULL DEFAULT 0,
  sales int NOT NULL DEFAULT 0,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  commission_total numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_links TO authenticated;
GRANT ALL ON public.aff_links TO service_role;
GRANT SELECT ON public.aff_links TO anon;
ALTER TABLE public.aff_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_links_public_read ON public.aff_links FOR SELECT TO anon USING (is_active = true);
CREATE POLICY aff_links_select ON public.aff_links FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id)
         OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
         OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_links_write ON public.aff_links FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.link.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.link.write'));
CREATE TRIGGER aff_links_updated_at BEFORE UPDATE ON public.aff_links FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_links_affiliate_idx ON public.aff_links(affiliate_id);
CREATE INDEX aff_links_product_idx ON public.aff_links(product_id);

CREATE TABLE public.aff_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.aff_products(id) ON DELETE RESTRICT,
  offer_id uuid REFERENCES public.aff_offers(id) ON DELETE SET NULL,
  link_id uuid REFERENCES public.aff_links(id) ON DELETE SET NULL,
  affiliate_id uuid REFERENCES public.aff_affiliates(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.aff_managers(id) ON DELETE SET NULL,
  campaign text,
  customer_name text,
  customer_email text,
  customer_doc text,
  payment_method text,
  gross_amount numeric(14,2) NOT NULL,
  gateway_fee numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL,
  status public.aff_sale_status NOT NULL DEFAULT 'venda_registrada',
  gateway_id text,
  gateway_provider text,
  external_id text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  gateway_release_at timestamptz,
  internal_release_at timestamptz,
  available_at timestamptz,
  refunded_at timestamptz,
  chargeback_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_sales TO authenticated;
GRANT ALL ON public.aff_sales TO service_role;
ALTER TABLE public.aff_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_sales_select ON public.aff_sales FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id)
         OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
         OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_sales_write ON public.aff_sales FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.sale.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.sale.write'));
CREATE TRIGGER aff_sales_updated_at BEFORE UPDATE ON public.aff_sales FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_sales_company_idx ON public.aff_sales(company_id, status);
CREATE INDEX aff_sales_affiliate_idx ON public.aff_sales(affiliate_id);

CREATE TABLE public.aff_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.aff_sales(id) ON DELETE CASCADE,
  recipient_kind public.aff_commission_kind NOT NULL,
  recipient_user_id uuid,
  affiliate_id uuid REFERENCES public.aff_affiliates(id) ON DELETE SET NULL,
  coproducer_id uuid REFERENCES public.aff_coproducers(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.aff_managers(id) ON DELETE SET NULL,
  pct numeric(6,3),
  amount numeric(14,2) NOT NULL,
  status public.aff_sale_status NOT NULL DEFAULT 'venda_registrada',
  release_at timestamptz,
  released_at timestamptz,
  paid_at timestamptz,
  payout_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_commissions TO authenticated;
GRANT ALL ON public.aff_commissions TO service_role;
ALTER TABLE public.aff_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_commissions_select ON public.aff_commissions FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id)
         OR recipient_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.aff_managers m WHERE m.id = manager_id AND m.user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.aff_coproducers c WHERE c.id = coproducer_id AND c.user_id = auth.uid())
         OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_commissions_write ON public.aff_commissions FOR ALL TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.commission.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.commission.write'));
CREATE TRIGGER aff_commissions_updated_at BEFORE UPDATE ON public.aff_commissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_commissions_sale_idx ON public.aff_commissions(sale_id);
CREATE INDEX aff_commissions_recipient_idx ON public.aff_commissions(company_id, recipient_kind, status);
CREATE INDEX aff_commissions_release_idx ON public.aff_commissions(release_at) WHERE status IN ('aguardando_gateway','aguardando_prazo_interno');

CREATE TABLE public.aff_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_kind public.aff_commission_kind NOT NULL,
  recipient_user_id uuid,
  affiliate_id uuid REFERENCES public.aff_affiliates(id) ON DELETE SET NULL,
  coproducer_id uuid REFERENCES public.aff_coproducers(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.aff_managers(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  pix_key text,
  bank_data jsonb,
  status public.aff_payout_status NOT NULL DEFAULT 'solicitado',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  paid_at timestamptz,
  paid_by uuid,
  external_payment_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aff_payouts TO authenticated;
GRANT ALL ON public.aff_payouts TO service_role;
ALTER TABLE public.aff_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY aff_payouts_select ON public.aff_payouts FOR SELECT TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id)
         OR recipient_user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
         OR is_impulsionando_staff(auth.uid()));
CREATE POLICY aff_payouts_insert_self ON public.aff_payouts FOR INSERT TO authenticated
  WITH CHECK (recipient_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.aff_affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
    OR (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.payout.write')));
CREATE POLICY aff_payouts_update ON public.aff_payouts FOR UPDATE TO authenticated
  USING (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.payout.write'))
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND user_has_permission(auth.uid(), company_id, 'aff.payout.write'));
CREATE TRIGGER aff_payouts_updated_at BEFORE UPDATE ON public.aff_payouts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX aff_payouts_company_idx ON public.aff_payouts(company_id, status);

INSERT INTO public.permissions (module, code, description) VALUES
  ('affiliates','aff.module.read', 'Visualizar módulo Afiliados e Produtos'),
  ('affiliates','aff.product.write', 'Criar/editar produtos e ofertas'),
  ('affiliates','aff.affiliate.write', 'Aprovar e gerenciar afiliados'),
  ('affiliates','aff.coproducer.write', 'Gerenciar coprodutores'),
  ('affiliates','aff.manager.write', 'Gerenciar gerentes de afiliados'),
  ('affiliates','aff.link.write', 'Gerenciar links, cupons e QR codes'),
  ('affiliates','aff.sale.write', 'Registrar/ajustar vendas comissionáveis'),
  ('affiliates','aff.commission.write', 'Ajustar comissões'),
  ('affiliates','aff.payout.write', 'Aprovar e pagar saques')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profile_permissions (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profiles p, public.permissions perm
WHERE p.is_master_profile = true AND perm.code LIKE 'aff.%'
ON CONFLICT DO NOTHING;
