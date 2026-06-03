
-- =========================================================
-- Função auxiliar: cria notificação respeitando preferências
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid,
  _company_id uuid,
  _category text,
  _severity text,
  _title text,
  _message text DEFAULT NULL,
  _action_url text DEFAULT NULL,
  _action_label text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid; _enabled boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;

  -- Respeita opt-out do canal in_app para a categoria
  SELECT enabled INTO _enabled FROM public.notification_preferences
   WHERE user_id = _user_id AND category = _category AND channel = 'in_app'
     AND (company_id = _company_id OR company_id IS NULL)
   ORDER BY company_id NULLS LAST LIMIT 1;
  IF _enabled = false THEN RETURN NULL; END IF;

  INSERT INTO public.notifications
    (user_id, company_id, category, severity, title, message, action_url, action_label)
  VALUES (_user_id, _company_id, _category, _severity, _title, _message, _action_url, _action_label)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- =========================================================
-- TRIGGER: Novo lead → notifica owner / created_by
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_notify_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _target uuid;
BEGIN
  _target := COALESCE(NEW.owner_user_id, NEW.created_by);
  PERFORM public.notify_user(
    _target, NEW.company_id, 'crm', 'info',
    'Novo lead: ' || NEW.name,
    COALESCE('Origem: ' || NEW.source, 'Acesse o CRM para qualificar.'),
    '/crm/leads', 'Abrir CRM'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_new_lead AFTER INSERT ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_lead();

-- =========================================================
-- TRIGGER: Novo agendamento → notifica profissional
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_notify_new_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pro_user uuid; _pro_name text;
BEGIN
  SELECT user_id, name INTO _pro_user, _pro_name
    FROM public.agenda_professionals WHERE id = NEW.professional_id;
  PERFORM public.notify_user(
    _pro_user, NEW.company_id, 'agenda', 'info',
    'Novo agendamento',
    'Em ' || to_char(NEW.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI'),
    '/agenda/appointments', 'Ver agenda'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_new_appointment AFTER INSERT ON public.agenda_appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_appointment();

-- =========================================================
-- TRIGGER: Venda confirmada → notifica created_by
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_notify_sale_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND OLD.status <> 'confirmed' AND NEW.status = 'confirmed') THEN
    PERFORM public.notify_user(
      NEW.created_by, NEW.company_id, 'sales', 'success',
      'Venda #' || NEW.number || ' confirmada',
      'Total: R$ ' || to_char(NEW.total, 'FM999G999G990D00'),
      '/sales/orders', 'Ver pedidos'
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_sale_confirmed AFTER INSERT OR UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_sale_confirmed();

-- =========================================================
-- TRIGGER: Estoque baixo → notifica todos com inventory.product.read
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_notify_low_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u RECORD;
BEGIN
  IF NEW.track_stock = false OR NEW.min_stock <= 0 THEN RETURN NEW; END IF;
  -- Só dispara quando cruza o limite de cima para baixo
  IF NEW.current_stock < NEW.min_stock
     AND (OLD.current_stock IS NULL OR OLD.current_stock >= NEW.min_stock) THEN
    FOR u IN
      SELECT DISTINCT up.user_id
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
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_low_stock AFTER UPDATE OF current_stock ON public.inv_products
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_low_stock();

-- =========================================================
-- TRIGGER: Boas-vindas ao novo usuário
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_notify_welcome()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, category, severity, title, message, action_url, action_label)
  VALUES (
    NEW.id, 'system', 'success',
    'Bem-vindo à Impulsionando!',
    'Sua conta foi criada com sucesso. Comece explorando o painel.',
    '/dashboard', 'Ir para o painel'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_welcome AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_welcome();
