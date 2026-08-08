
-- Tarefas internas
CREATE TABLE public.contab_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid REFERENCES public.contab_clients(id) ON DELETE CASCADE,
  obligation_id uuid REFERENCES public.contab_obligations(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.contab_documents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  assigned_to uuid,
  due_date date,
  done_at timestamptz,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_tasks TO authenticated;
GRANT ALL ON public.contab_tasks TO service_role;
ALTER TABLE public.contab_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_tasks_select ON public.contab_tasks FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_tasks_write ON public.contab_tasks FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.task.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.task.write'));
CREATE INDEX idx_contab_tasks_company ON public.contab_tasks(company_id, status, due_date);
CREATE INDEX idx_contab_tasks_assigned ON public.contab_tasks(assigned_to, status);
CREATE TRIGGER trg_contab_tasks_updated BEFORE UPDATE ON public.contab_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Departamentos para triagem
CREATE TABLE public.contab_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  color text DEFAULT '#10b981',
  whatsapp_phone text,
  whatsapp_keywords text[] DEFAULT ARRAY[]::text[],
  lead_user_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_departments TO authenticated;
GRANT ALL ON public.contab_departments TO service_role;
ALTER TABLE public.contab_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY contab_dept_select ON public.contab_departments FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY contab_dept_write ON public.contab_departments FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.department.write'))
WITH CHECK (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), company_id, 'contab.department.write'));
CREATE INDEX idx_contab_dept_company ON public.contab_departments(company_id, is_active, sort_order);
CREATE TRIGGER trg_contab_dept_updated BEFORE UPDATE ON public.contab_departments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Token do portal do cliente
ALTER TABLE public.contab_clients ADD COLUMN portal_token uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.contab_clients SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;

-- Função pública somente-leitura para o portal do cliente
CREATE OR REPLACE FUNCTION public.get_contab_portal_data(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client public.contab_clients%ROWTYPE;
  v_docs jsonb;
  v_obl jsonb;
BEGIN
  SELECT * INTO v_client FROM public.contab_clients WHERE portal_token = _token AND status != 'churned';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', d.id, 'title', d.title, 'doc_type', d.doc_type,
    'competence', d.competence, 'status', d.status, 'created_at', d.created_at
  ) ORDER BY d.created_at DESC), '[]'::jsonb)
  INTO v_docs FROM public.contab_documents d
  WHERE d.client_id = v_client.id AND d.status IN ('pending','received','processed')
  LIMIT 30;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'title', o.title, 'obligation_type', o.obligation_type,
    'due_date', o.due_date, 'amount', o.amount, 'status', o.status
  ) ORDER BY o.due_date ASC), '[]'::jsonb)
  INTO v_obl FROM public.contab_obligations o
  WHERE o.client_id = v_client.id AND o.status != 'paid'
  LIMIT 30;

  RETURN jsonb_build_object(
    'client', jsonb_build_object(
      'legal_name', v_client.legal_name,
      'trade_name', v_client.trade_name,
      'document', v_client.document,
      'document_type', v_client.document_type
    ),
    'documents', v_docs,
    'obligations', v_obl
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_contab_portal_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contab_portal_data(uuid) TO anon, authenticated;

-- Permissões base
INSERT INTO public.permissions (code, module, description) VALUES
  ('contab.task.write', 'contabilidade', 'Gerenciar tarefas contábeis'),
  ('contab.department.write', 'contabilidade', 'Gerenciar departamentos')
ON CONFLICT (code) DO NOTHING;
