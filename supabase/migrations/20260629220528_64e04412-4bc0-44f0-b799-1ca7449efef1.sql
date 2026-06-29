
ALTER TABLE public.uptime_state
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uptime_state_public_slug_key
  ON public.uptime_state(public_slug) WHERE public_slug IS NOT NULL;

-- Auto-generate slug from label or URL host+path when null
CREATE OR REPLACE FUNCTION public.uptime_state_autoslug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  IF NEW.public_slug IS NOT NULL AND length(NEW.public_slug) > 0 THEN
    RETURN NEW;
  END IF;
  base := lower(coalesce(NEW.label, regexp_replace(NEW.url, '^https?://', '')));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF base IS NULL OR length(base) = 0 THEN
    base := 'svc';
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.uptime_state WHERE public_slug = candidate AND url <> NEW.url) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  NEW.public_slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_uptime_state_autoslug ON public.uptime_state;
CREATE TRIGGER trg_uptime_state_autoslug
  BEFORE INSERT OR UPDATE OF label, url, public_slug ON public.uptime_state
  FOR EACH ROW EXECUTE FUNCTION public.uptime_state_autoslug();

-- Backfill existing rows
UPDATE public.uptime_state SET public_slug = NULL WHERE public_slug IS NULL;
UPDATE public.uptime_state SET url = url WHERE public_slug IS NULL;

-- Allow anon read of slug/label/visibility for public detail pages
GRANT SELECT (url, label, public_slug, show_on_public, sort_order, paused) ON public.uptime_state TO anon;
