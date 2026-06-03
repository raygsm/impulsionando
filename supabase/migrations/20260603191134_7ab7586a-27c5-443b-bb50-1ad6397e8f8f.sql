
-- LGPD CONSENTS
CREATE TABLE public.lgpd_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  terms_version text NOT NULL DEFAULT '1.0',
  accepted boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_consents TO authenticated;
GRANT ALL ON public.lgpd_consents TO service_role;
ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consents" ON public.lgpd_consents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admin reads all consents" ON public.lgpd_consents
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_lgpd_consents_updated_at BEFORE UPDATE ON public.lgpd_consents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_lgpd_consents_user ON public.lgpd_consents(user_id, consent_type);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'system',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  action_url text,
  action_label text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Super admin inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- NOTIFICATION PREFERENCES
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  channel text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notif_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE UNIQUE INDEX uq_notif_prefs_with_company ON public.notification_preferences(user_id, company_id, category, channel)
  WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_notif_prefs_no_company ON public.notification_preferences(user_id, category, channel)
  WHERE company_id IS NULL;

-- DATA EXPORT REQUESTS
CREATE TABLE public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  download_url text,
  expires_at timestamptz,
  processed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_export_requests TO authenticated;
GRANT ALL ON public.data_export_requests TO service_role;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own export requests" ON public.data_export_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admin reads all export requests" ON public.data_export_requests
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admin updates export requests" ON public.data_export_requests
  FOR UPDATE USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_export_requests_updated_at BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- DATA DELETION REQUESTS
CREATE TABLE public.data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz,
  processed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.data_deletion_requests TO service_role;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own deletion requests" ON public.data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own deletion requests" ON public.data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Users cancel own pending deletion" ON public.data_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));
CREATE POLICY "Super admin manages deletion requests" ON public.data_deletion_requests
  FOR UPDATE USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_deletion_requests_updated_at BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
