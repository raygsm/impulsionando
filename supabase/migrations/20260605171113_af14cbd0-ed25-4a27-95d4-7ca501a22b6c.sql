
-- ============================================================
-- Fase 1A — Comunicação multi-canal
-- ============================================================

CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email','in_app')),
  locale text NOT NULL DEFAULT 'pt-BR',
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX message_templates_global_uniq
  ON public.message_templates(event_code, channel, locale)
  WHERE company_id IS NULL;
CREATE UNIQUE INDEX message_templates_company_uniq
  ON public.message_templates(company_id, event_code, channel, locale)
  WHERE company_id IS NOT NULL;
CREATE INDEX message_templates_event_idx ON public.message_templates(event_code, channel);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY mt_select ON public.message_templates FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR public.is_super_admin(auth.uid())
    OR public.user_belongs_to_company(auth.uid(), company_id)
  );
CREATE POLICY mt_insert ON public.message_templates FOR INSERT TO authenticated
  WITH CHECK (
    (company_id IS NULL AND public.is_super_admin(auth.uid()))
    OR (company_id IS NOT NULL AND (public.is_super_admin(auth.uid())
        OR public.user_has_permission(auth.uid(), company_id, 'communication.template.write')))
  );
CREATE POLICY mt_update ON public.message_templates FOR UPDATE TO authenticated
  USING (
    (company_id IS NULL AND public.is_super_admin(auth.uid()))
    OR (company_id IS NOT NULL AND (public.is_super_admin(auth.uid())
        OR public.user_has_permission(auth.uid(), company_id, 'communication.template.write')))
  )
  WITH CHECK (
    (company_id IS NULL AND public.is_super_admin(auth.uid()))
    OR (company_id IS NOT NULL AND (public.is_super_admin(auth.uid())
        OR public.user_has_permission(auth.uid(), company_id, 'communication.template.write')))
  );
CREATE POLICY mt_delete ON public.message_templates FOR DELETE TO authenticated
  USING (
    (company_id IS NULL AND public.is_super_admin(auth.uid()))
    OR (company_id IS NOT NULL AND (public.is_super_admin(auth.uid())
        OR public.user_has_permission(auth.uid(), company_id, 'communication.template.write')))
  );

CREATE TRIGGER trg_mt_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.message_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  event_code text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email','in_app')),
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  recipient_user_id uuid,
  recipient_email text,
  recipient_phone text,
  recipient_name text,
  subject text,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','skipped','cancelled')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text,
  external_message_id text,
  reference_type text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX message_outbox_status_idx ON public.message_outbox(status, scheduled_at);
CREATE INDEX message_outbox_company_idx ON public.message_outbox(company_id, created_at DESC);
CREATE INDEX message_outbox_ref_idx ON public.message_outbox(reference_type, reference_id);

GRANT SELECT, INSERT, UPDATE ON public.message_outbox TO authenticated;
GRANT ALL ON public.message_outbox TO service_role;

ALTER TABLE public.message_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY mo_select ON public.message_outbox FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_has_permission(auth.uid(), company_id, 'communication.outbox.read'))
    OR recipient_user_id = auth.uid()
  );
CREATE POLICY mo_insert ON public.message_outbox FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_has_permission(auth.uid(), company_id, 'communication.send'))
  );
CREATE POLICY mo_update ON public.message_outbox FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_has_permission(auth.uid(), company_id, 'communication.outbox.read'))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.user_has_permission(auth.uid(), company_id, 'communication.outbox.read'))
  );

CREATE TRIGGER trg_mo_updated_at BEFORE UPDATE ON public.message_outbox
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.permissions(code, module, description) VALUES
  ('communication.template.read','communication','Ver templates de comunicação (WhatsApp/e-mail/in-app)'),
  ('communication.template.write','communication','Criar e editar templates de comunicação'),
  ('communication.outbox.read','communication','Ver fila de envios e status das mensagens'),
  ('communication.send','communication','Enfileirar mensagens manualmente')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.render_template(_template text, _payload jsonb)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  _result text := COALESCE(_template, '');
  _key text;
  _value text;
BEGIN
  IF _payload IS NULL THEN RETURN _result; END IF;
  FOR _key, _value IN SELECT key, COALESCE(value, '') FROM jsonb_each_text(_payload) LOOP
    _result := replace(_result, '{{' || _key || '}}', _value);
  END LOOP;
  RETURN _result;
END $$;

CREATE OR REPLACE FUNCTION public.enqueue_message(
  _event_code text,
  _company_id uuid,
  _recipient_user_id uuid,
  _recipient_email text,
  _recipient_phone text,
  _recipient_name text,
  _payload jsonb DEFAULT '{}'::jsonb,
  _channels text[] DEFAULT ARRAY['whatsapp','email','in_app'],
  _reference_type text DEFAULT NULL,
  _reference_id text DEFAULT NULL
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ch text;
  _tpl RECORD;
  _enabled boolean;
  _count int := 0;
  _subj text;
  _body text;
BEGIN
  FOREACH _ch IN ARRAY _channels LOOP
    IF _ch = 'email'    AND COALESCE(_recipient_email,'') = '' THEN CONTINUE; END IF;
    IF _ch = 'whatsapp' AND COALESCE(_recipient_phone,'') = '' THEN CONTINUE; END IF;
    IF _ch = 'in_app'   AND _recipient_user_id IS NULL          THEN CONTINUE; END IF;

    IF _ch = 'in_app' THEN
      SELECT enabled INTO _enabled FROM public.notification_preferences
       WHERE user_id = _recipient_user_id AND category = _event_code AND channel = 'in_app'
         AND (company_id = _company_id OR company_id IS NULL)
       ORDER BY company_id NULLS LAST LIMIT 1;
      IF _enabled = false THEN CONTINUE; END IF;
    END IF;

    SELECT * INTO _tpl FROM public.message_templates
     WHERE event_code = _event_code AND channel = _ch AND is_active = true
       AND (company_id = _company_id OR company_id IS NULL)
     ORDER BY company_id NULLS LAST LIMIT 1;
    IF NOT FOUND THEN CONTINUE; END IF;

    _body := public.render_template(_tpl.body, _payload);
    _subj := CASE WHEN _tpl.subject IS NOT NULL THEN public.render_template(_tpl.subject, _payload) ELSE NULL END;

    INSERT INTO public.message_outbox(
      company_id, event_code, channel, template_id,
      recipient_user_id, recipient_email, recipient_phone, recipient_name,
      subject, body, payload, status, reference_type, reference_id, sent_at
    ) VALUES (
      _company_id, _event_code, _ch, _tpl.id,
      _recipient_user_id, _recipient_email, _recipient_phone, _recipient_name,
      _subj, _body, _payload,
      CASE WHEN _ch = 'in_app' THEN 'sent' ELSE 'queued' END,
      _reference_type, _reference_id,
      CASE WHEN _ch = 'in_app' THEN now() ELSE NULL END
    );
    _count := _count + 1;

    IF _ch = 'in_app' THEN
      PERFORM public.notify_user(
        _recipient_user_id, _company_id, _event_code, 'info',
        COALESCE(_subj, left(_body, 80)), _body, NULL, NULL
      );
    END IF;
  END LOOP;
  RETURN _count;
END $$;

-- Seed PT-BR (templates globais)
INSERT INTO public.message_templates(event_code, channel, subject, body) VALUES
('lead_created','in_app',  NULL, 'Novo lead recebido: {{nome_cliente}}'),
('lead_created','email',   'Recebemos seu contato', 'Olá, {{nome_cliente}}.

Recebemos sua mensagem e em breve nossa equipe entrará em contato.

Equipe {{nome_empresa}}'),
('lead_created','whatsapp',NULL, 'Olá, {{nome_cliente}}. Recebemos seu contato e em breve falaremos com você. Equipe {{nome_empresa}}.'),

('customer_created','in_app', NULL, 'Bem-vindo(a), {{nome_cliente}}!'),
('customer_created','email',  'Bem-vindo(a) à {{nome_empresa}}', 'Olá, {{nome_cliente}}.

Sua conta foi criada com sucesso. Você já pode acessar seus dados e acompanhar suas contratações em {{link_acesso}}.'),
('customer_created','whatsapp', NULL, 'Olá, {{nome_cliente}}. Sua conta na {{nome_empresa}} foi criada com sucesso.'),

('cart_abandoned','email','Você ainda pode concluir sua contratação', 'Olá, {{nome_cliente}}.

Você iniciou a contratação de {{nome_item}}, mas o pagamento ainda não foi concluído.

Para finalizar, acesse: {{link_pagamento}}

Se já concluiu, desconsidere esta mensagem.'),
('cart_abandoned','whatsapp', NULL, 'Olá, {{nome_cliente}}. Vimos que você iniciou a contratação de {{nome_item}}, mas ainda não concluiu o pagamento. Para finalizar: {{link_pagamento}}'),

('payment_pending','email','Pagamento pendente — {{nome_item}}', 'Olá, {{nome_cliente}}.

Seu pagamento de {{nome_item}} no valor de {{valor}} está aguardando confirmação.

Conclua o pagamento em: {{link_pagamento}}'),
('payment_pending','whatsapp', NULL, 'Olá, {{nome_cliente}}. Pagamento de {{nome_item}} ({{valor}}) está pendente. Conclua em: {{link_pagamento}}'),

('pix_generated','email','Seu Pix está disponível', 'Olá, {{nome_cliente}}.

Seu Pix de {{valor}} referente a {{nome_item}} foi gerado.

Pague pelo QR Code ou copia e cola em: {{link_pix}}

A confirmação do serviço é automática após o pagamento.'),
('pix_generated','whatsapp', NULL, 'Olá, {{nome_cliente}}. Seu Pix de {{valor}} referente a {{nome_item}} está pendente. Pague em: {{link_pix}}'),

('boleto_generated','email','Seu boleto está disponível', 'Olá, {{nome_cliente}}.

Seu boleto de {{valor}} referente a {{nome_item}} está disponível.

Acesse: {{link_boleto}}

A confirmação do serviço ocorre somente após a compensação bancária.'),
('boleto_generated','whatsapp', NULL, 'Olá, {{nome_cliente}}. Boleto de {{nome_item}} disponível: {{link_boleto}}. Confirmação após compensação.'),

('card_link_generated','email','Link de pagamento por cartão', 'Olá, {{nome_cliente}}.

Você pode concluir o pagamento de {{nome_item}} ({{valor}}) com cartão de crédito ou débito em: {{link_cartao}}'),
('card_link_generated','whatsapp', NULL, 'Olá, {{nome_cliente}}. Pague {{nome_item}} ({{valor}}) com cartão em: {{link_cartao}}'),

('payment_failed','email','Pagamento não aprovado', 'Olá, {{nome_cliente}}.

Não conseguimos confirmar o pagamento de {{nome_item}}.

Você pode tentar novamente por Pix, cartão ou boleto: {{link_pagamento}}'),
('payment_failed','whatsapp', NULL, 'Olá, {{nome_cliente}}. Seu pagamento de {{nome_item}} não foi aprovado. Tente novamente: {{link_pagamento}}'),

('payment_retry','email','Nova tentativa de pagamento disponível', 'Olá, {{nome_cliente}}.

Disponibilizamos uma nova tentativa de pagamento para {{nome_item}}.

Escolha Pix, cartão ou boleto em: {{link_pagamento}}'),
('payment_retry','whatsapp', NULL, 'Olá, {{nome_cliente}}. Nova tentativa de pagamento disponível para {{nome_item}}: {{link_pagamento}}'),

('payment_approved','in_app', NULL, 'Pagamento aprovado: {{nome_item}}'),
('payment_approved','email','Pagamento confirmado', 'Olá, {{nome_cliente}}.

Recebemos a confirmação do pagamento.

Item: {{nome_item}}
Valor: {{valor}}
Forma: {{forma_pagamento}}
Data: {{data_pagamento}}

Seu serviço foi confirmado/liberado conforme as regras da operação.'),
('payment_approved','whatsapp', NULL, 'Pagamento confirmado, {{nome_cliente}}. {{nome_item}} ({{valor}}) foi aprovado. Seu serviço já está confirmado/liberado.'),

('welcome_post_purchase','email','Boas-vindas — {{nome_empresa}}', 'Olá, {{nome_cliente}}.

Sua contratação foi confirmada. Aqui você acompanha tudo: {{link_acesso}}

Qualquer dúvida, fale com a gente.'),
('welcome_post_purchase','whatsapp', NULL, 'Olá, {{nome_cliente}}. Sua contratação na {{nome_empresa}} está confirmada. Acompanhe em: {{link_acesso}}'),

('service_released','in_app', NULL, 'Serviço liberado: {{nome_item}}'),
('service_released','email','Seu serviço foi liberado', 'Olá, {{nome_cliente}}.

O serviço {{nome_item}} foi liberado. Você já pode utilizá-lo conforme as regras da operação.'),
('service_released','whatsapp', NULL, 'Olá, {{nome_cliente}}. O serviço {{nome_item}} foi liberado e já está disponível.'),

('appointment_confirmed','email','Consulta confirmada', 'Olá, {{nome_cliente}}.

Sua consulta foi confirmada para {{data_reserva}} às {{hora_reserva}}.

Em caso de necessidade de remarcação, siga as regras informadas.'),
('appointment_confirmed','whatsapp', NULL, 'Olá, {{nome_cliente}}. Sua consulta está confirmada para {{data_reserva}} às {{hora_reserva}}.'),

('appointment_reminder','whatsapp', NULL, 'Olá, {{nome_cliente}}. Lembrete: você tem consulta marcada para {{data_reserva}} às {{hora_reserva}}.'),
('appointment_reminder','email','Lembrete de consulta', 'Olá, {{nome_cliente}}.

Lembramos que sua consulta está marcada para {{data_reserva}} às {{hora_reserva}}.'),

('reservation_confirmed','email','Reserva confirmada', 'Olá, {{nome_cliente}}.

Sua reserva foi confirmada para {{data_reserva}} às {{hora_reserva}}.

Confira as regras de tolerância e cancelamento.'),
('reservation_confirmed','whatsapp', NULL, 'Olá, {{nome_cliente}}. Sua reserva está confirmada para {{data_reserva}} às {{hora_reserva}}.'),

('order_confirmed','email','Pedido #{{numero_pedido}} confirmado', 'Olá, {{nome_cliente}}.

Seu pedido #{{numero_pedido}} no valor de {{valor}} foi confirmado e entrou em preparo.'),
('order_confirmed','whatsapp', NULL, 'Pedido #{{numero_pedido}} confirmado, {{nome_cliente}}. Valor {{valor}}. Já entrou em preparo.'),

('ticket_confirmed','email','Ingresso confirmado', 'Olá, {{nome_cliente}}.

Seu ingresso para {{nome_item}} foi confirmado. Apresente no check-in do evento.'),
('ticket_confirmed','whatsapp', NULL, 'Olá, {{nome_cliente}}. Seu ingresso para {{nome_item}} está confirmado. Apresente no check-in.'),

('plan_activated','email','Plano ativado', 'Olá, {{nome_cliente}}.

Seu plano {{nome_item}} foi ativado. Acesse: {{link_acesso}}'),
('plan_activated','whatsapp', NULL, 'Olá, {{nome_cliente}}. Seu plano {{nome_item}} foi ativado. Acesse: {{link_acesso}}'),

('satisfaction_survey','email','Como foi sua experiência?', 'Olá, {{nome_cliente}}.

Sua opinião é importante. Pode responder em 1 minuto: {{link_pesquisa}}

Obrigado!'),
('satisfaction_survey','whatsapp', NULL, 'Olá, {{nome_cliente}}. Como foi sua experiência com {{nome_item}}? Responda em 1 minuto: {{link_pesquisa}}'),

('customer_inactive','email','Sentimos sua falta', 'Olá, {{nome_cliente}}.

Faz um tempo que não nos vemos. Que tal voltar? {{link_acesso}}'),
('customer_inactive','whatsapp', NULL, 'Olá, {{nome_cliente}}. Sentimos sua falta. Quer voltar? {{link_acesso}}'),

('reactivation','email','Uma oferta especial para você', 'Olá, {{nome_cliente}}.

Preparamos uma condição especial para sua volta: {{link_acesso}}'),
('reactivation','whatsapp', NULL, 'Olá, {{nome_cliente}}. Temos uma condição especial pra sua volta: {{link_acesso}}'),

('repurchase','email','Hora de repor?', 'Olá, {{nome_cliente}}.

Pelo seu histórico, talvez seja hora de uma nova contratação de {{nome_item}}: {{link_acesso}}'),
('repurchase','whatsapp', NULL, 'Olá, {{nome_cliente}}. Hora de repor {{nome_item}}? {{link_acesso}}'),

('loyalty_club_invite','email','Convite — Clube de vantagens', 'Olá, {{nome_cliente}}.

Você foi convidado para o nosso clube de vantagens. Conheça: {{link_acesso}}'),
('loyalty_club_invite','whatsapp', NULL, 'Olá, {{nome_cliente}}. Convite para nosso clube de vantagens: {{link_acesso}}'),

('affiliate_commission_generated','in_app', NULL, 'Nova comissão de afiliado: {{valor}}'),
('affiliate_commission_generated','email','Nova comissão gerada', 'Olá, {{nome_cliente}}.

Uma nova comissão de {{valor}} foi registrada na sua conta. Acompanhe em {{link_acesso}}.'),

('payout_released','in_app', NULL, 'Repasse liberado: {{valor}}'),
('payout_released','email','Repasse liberado', 'Olá, {{nome_cliente}}.

O repasse de {{valor}} foi liberado e será creditado em até 3 dias úteis.');
