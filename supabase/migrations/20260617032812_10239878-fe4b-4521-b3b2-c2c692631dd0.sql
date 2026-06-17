-- Tipo app_role
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','white_label','gestor','operador','profissional','consumidor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário lê seus próprios papéis" ON public.user_roles;
CREATE POLICY "Usuário lê seus próprios papéis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Função has_role (security definer para evitar recursão em policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon, service_role;