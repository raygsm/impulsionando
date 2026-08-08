
-- audit_logs: block anon role explicitly for all writes and reads
CREATE POLICY "audit_logs_anon_no_select" ON public.audit_logs
  FOR SELECT TO anon USING (false);
CREATE POLICY "audit_logs_anon_no_insert" ON public.audit_logs
  FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "audit_logs_anon_no_update" ON public.audit_logs
  FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "audit_logs_anon_no_delete" ON public.audit_logs
  FOR DELETE TO anon USING (false);

-- message_outbox: explicit deny for INSERT from client roles
-- (writes happen exclusively via SECURITY DEFINER function enqueue_message)
CREATE POLICY "message_outbox_no_client_insert" ON public.message_outbox
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "message_outbox_no_client_delete" ON public.message_outbox
  FOR DELETE TO anon, authenticated USING (false);
