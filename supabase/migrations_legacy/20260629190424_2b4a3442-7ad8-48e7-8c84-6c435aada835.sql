
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'module',
  ADD COLUMN IF NOT EXISTS parent_module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_kind_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_kind_check CHECK (kind IN ('module','resource'));

CREATE INDEX IF NOT EXISTS modules_parent_idx ON public.modules(parent_module_id);
CREATE INDEX IF NOT EXISTS modules_kind_idx ON public.modules(kind);
