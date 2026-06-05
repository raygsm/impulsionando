
-- =========================================================================
-- Fase 1B: Conectar enqueue_message aos triggers existentes
-- Estratégia: SUBSTITUIR funções dos triggers preservando a lógica antiga
-- (notify_user continua sendo chamado) e ADICIONAR enqueue_message ao lado.
-- =========================================================================

-- 1) Boas-vindas (auth.users -> tg_notify_welcome)
CREATE OR REPLACE FUNCTION public.tg_notify_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _name text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1));

  -- mantém notificação in-app via notifications
  INSERT INTO public.notifications (user_id, category, severity, title, message, action_url, action_label)
  VALUES (
    NEW.id, 'system', 'success',
    'Bem-vindo à Impulsionando!',
    'Sua conta foi criada com sucesso. Comece explorando o painel.',
    '/dashboard', 'Ir para o painel'
  );

  -- enfileira mensagens multicanal (email, whatsapp se houver telefone, in_app)
  PERFORM public.enqueue_message(
    'user_welcome',
    NULL,
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone',''),
    _name,
    jsonb_build_object(
      'user_name', _name,
      'user_email', NEW.email,
      'app_url', 'https://impulsionando.com.br/dashboard'
    ),
    ARRAY['email','in_app']::text[],
    'auth_user',
    NEW.id::text
  );
  RETURN NEW;
END $$;

-- 2) Lead do site (marketing_leads)
CREATE OR REPLACE FUNCTION public.tg_notify_marketing_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE u RECORD;
BEGIN
  FOR u IN
    SELECT DISTINCT up.user_id, up.email, up.display_name
    FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE p.is_master_profile = true AND up.is_active = true
  LOOP
    PERFORM public.notify_user(
      u.user_id, NULL, 'crm', 'info',
      'Novo lead do site (' || NEW.source || ')',
      COALESCE(NEW.name, NEW.email, NEW.phone, 'Sem nome informado'),
      '/marketing/leads', 'Ver leads'
    );

    PERFORM public.enqueue_message(
      'marketing_lead_new',
      NULL,
      u.user_id,
      u.email,
      NULL,
      u.display_name,
      jsonb_build_object(
        'lead_name', COALESCE(NEW.name,'Sem nome'),
        'lead_email', COALESCE(NEW.email,''),
        'lead_phone', COALESCE(NEW.phone,''),
        'lead_source', COALESCE(NEW.source,''),
        'lead_message', COALESCE(NEW.message,'')
      ),
      ARRAY['email','in_app']::text[],
      'marketing_lead',
      NEW.id::text
    );
  END LOOP;
  RETURN NEW;
END $$;

-- 3) Novo lead no CRM (crm_leads)
CREATE OR REPLACE FUNCTION public.tg_notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _target uuid; _email text; _name text;
BEGIN
  _target := COALESCE(NEW.owner_user_id, NEW.created_by);

  PERFORM public.notify_user(
    _target, NEW.company_id, 'crm', 'info',
    'Novo lead: ' || NEW.name,
    COALESCE('Origem: ' || NEW.source, 'Acesse o CRM para qualificar.'),
    '/crm/leads', 'Abrir CRM'
  );

  SELECT email, display_name INTO _email, _name
    FROM public.user_profiles
    WHERE user_id = _target AND company_id = NEW.company_id
    LIMIT 1;

  PERFORM public.enqueue_message(
    'crm_lead_new',
    NEW.company_id,
    _target,
    _email,
    NULL,
    _name,
    jsonb_build_object(
      'lead_name', NEW.name,
      'lead_source', COALESCE(NEW.source,''),
      'lead_email', COALESCE(NEW.email,''),
      'lead_phone', COALESCE(NEW.phone,'')
    ),
    ARRAY['email','in_app']::text[],
    'crm_lead',
    NEW.id::text
  );
  RETURN NEW;
END $$;

-- 4) Venda confirmada (sales_orders) — notifica operador + cliente quando houver e-mail/telefone
CREATE OR REPLACE FUNCTION public.tg_notify_sale_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _op_email text; _op_name text; _cust_email text; _cust_phone text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND OLD.status <> 'confirmed' AND NEW.status = 'confirmed') THEN

    PERFORM public.notify_user(
      NEW.created_by, NEW.company_id, 'sales', 'success',
      'Venda #' || NEW.number || ' confirmada',
      'Total: R$ ' || to_char(NEW.total, 'FM999G999G990D00'),
      '/sales/orders', 'Ver pedidos'
    );

    SELECT email, display_name INTO _op_email, _op_name
      FROM public.user_profiles
      WHERE user_id = NEW.created_by AND company_id = NEW.company_id
      LIMIT 1;

    -- mensagem para o operador
    PERFORM public.enqueue_message(
      'sale_confirmed_internal',
      NEW.company_id,
      NEW.created_by,
      _op_email,
      NULL,
      _op_name,
      jsonb_build_object(
        'order_number', NEW.number::text,
        'order_total', to_char(NEW.total, 'FM999G999G990D00'),
        'customer_name', COALESCE(NEW.customer_name,'')
      ),
      ARRAY['email','in_app']::text[],
      'sales_order',
      NEW.id::text
    );

    -- mensagem para o cliente (se houver dados)
    SELECT email, phone INTO _cust_email, _cust_phone
      FROM public.customers WHERE id = NEW.customer_id;

    IF COALESCE(_cust_email,'') <> '' OR COALESCE(_cust_phone,'') <> '' THEN
      PERFORM public.enqueue_message(
        'sale_confirmed_customer',
        NEW.company_id,
        NULL,
        _cust_email,
        _cust_phone,
        NEW.customer_name,
        jsonb_build_object(
          'order_number', NEW.number::text,
          'order_total', to_char(NEW.total, 'FM999G999G990D00'),
          'customer_name', COALESCE(NEW.customer_name,'')
        ),
        ARRAY['whatsapp','email']::text[],
        'sales_order',
        NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 5) Novo agendamento (agenda_appointments) — notifica profissional + cliente
CREATE OR REPLACE FUNCTION public.tg_notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pro_user uuid; _pro_name text; _pro_email text;
  _cust_email text; _cust_phone text; _cust_name text;
  _svc_name text;
  _when_str text;
BEGIN
  SELECT ap.user_id, ap.name INTO _pro_user, _pro_name
    FROM public.agenda_professionals ap WHERE ap.id = NEW.professional_id;

  SELECT up.email INTO _pro_email
    FROM public.user_profiles up
    WHERE up.user_id = _pro_user AND up.company_id = NEW.company_id
    LIMIT 1;

  SELECT c.email, c.phone, c.name INTO _cust_email, _cust_phone, _cust_name
    FROM public.customers c WHERE c.id = NEW.customer_id;

  SELECT s.name INTO _svc_name
    FROM public.agenda_services s WHERE s.id = NEW.service_id;

  _when_str := to_char(NEW.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');

  PERFORM public.notify_user(
    _pro_user, NEW.company_id, 'agenda', 'info',
    'Novo agendamento',
    'Em ' || _when_str,
    '/agenda/appointments', 'Ver agenda'
  );

  -- profissional
  PERFORM public.enqueue_message(
    'appointment_new_professional',
    NEW.company_id,
    _pro_user,
    _pro_email,
    NULL,
    _pro_name,
    jsonb_build_object(
      'professional_name', COALESCE(_pro_name,''),
      'customer_name', COALESCE(_cust_name,''),
      'service_name', COALESCE(_svc_name,''),
      'appointment_when', _when_str
    ),
    ARRAY['email','in_app']::text[],
    'appointment',
    NEW.id::text
  );

  -- cliente
  IF COALESCE(_cust_email,'') <> '' OR COALESCE(_cust_phone,'') <> '' THEN
    PERFORM public.enqueue_message(
      'appointment_new_customer',
      NEW.company_id,
      NULL,
      _cust_email,
      _cust_phone,
      _cust_name,
      jsonb_build_object(
        'customer_name', COALESCE(_cust_name,''),
        'professional_name', COALESCE(_pro_name,''),
        'service_name', COALESCE(_svc_name,''),
        'appointment_when', _when_str
      ),
      ARRAY['whatsapp','email']::text[],
      'appointment',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END $$;

-- 6) Estoque baixo (inv_products) — preserva fan-out atual + enfileira email
CREATE OR REPLACE FUNCTION public.tg_notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE u RECORD;
BEGIN
  IF NEW.track_stock = false OR NEW.min_stock <= 0 THEN RETURN NEW; END IF;
  IF NEW.current_stock < NEW.min_stock
     AND (OLD.current_stock IS NULL OR OLD.current_stock >= NEW.min_stock) THEN
    FOR u IN
      SELECT DISTINCT up.user_id, up.email, up.display_name
      FROM public.user_profiles up
      JOIN public.profile_permissions pp ON pp.profile_id = up.profile_id
      JOIN public.permissions p ON p.id = pp.permission_id
      WHERE up.company_id = NEW.company_id
        AND up.is_active = true
        AND p.code = 'inventory.product.read'
    LOOP
      PERFORM public.notify_user(
        u.user_id, NEW.company_id, 'inventory', 'warning',
        'Estoque baixo: ' || NEW.name,
        'Saldo atual ' || NEW.current_stock || ' / mínimo ' || NEW.min_stock,
        '/inventory/products', 'Ver produto'
      );

      PERFORM public.enqueue_message(
        'inventory_low_stock',
        NEW.company_id,
        u.user_id,
        u.email,
        NULL,
        u.display_name,
        jsonb_build_object(
          'product_name', NEW.name,
          'current_stock', NEW.current_stock::text,
          'min_stock', NEW.min_stock::text
        ),
        ARRAY['email','in_app']::text[],
        'inv_product',
        NEW.id::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
