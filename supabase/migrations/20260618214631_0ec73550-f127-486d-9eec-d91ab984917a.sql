
-- Habilita realtime para a tabela de tentativas de notificação
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_attempt_log;

-- Replica identity completa para Realtime payloads
ALTER TABLE public.notification_attempt_log REPLICA IDENTITY FULL;

-- Índices para busca e ordenação rápida em volumes grandes
CREATE INDEX IF NOT EXISTS notification_attempt_log_created_idx
  ON public.notification_attempt_log (created_at DESC);
CREATE INDEX IF NOT EXISTS notification_attempt_log_status_idx
  ON public.notification_attempt_log (status);
CREATE INDEX IF NOT EXISTS notification_attempt_log_event_idx
  ON public.notification_attempt_log (event);
