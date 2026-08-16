-- CHRISMED: canonical consultation pricing/duration and Oliver booking guidance.
-- Additive/idempotent data migration. The public booking UI resolves these slugs
-- explicitly, so Hepatology can never inherit the generic presencial price.

DO $migration$
DECLARE
  v_company_id uuid := '642096b5-a9ff-4521-a82a-c004f6d2e2d2'::uuid;
  v_next_version integer;
BEGIN
  IF to_regclass('public.chrismed_service_offerings') IS NOT NULL THEN
    -- Preserve the historical generic presencial row as the Hepatology offer.
    UPDATE public.chrismed_service_offerings
       SET slug = 'consulta-presencial-hepatologia',
           name = 'Consulta Presencial — Hepatologia',
           description = 'Consulta presencial de Hepatologia com duração de 60 minutos.',
           price_cents = 120000,
           duration_minutes = 60,
           requires_prepayment = true,
           active = true,
           display_order = 2,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'specialty_slug','hepatologia',
             'care_scope','single_specialty',
             'approved_at','2026-08-16'
           ),
           updated_at = now()
     WHERE company_id = v_company_id
       AND slug = 'consulta-presencial'
       AND NOT EXISTS (
         SELECT 1
           FROM public.chrismed_service_offerings existing
          WHERE existing.company_id = v_company_id
            AND existing.slug = 'consulta-presencial-hepatologia'
       );

    INSERT INTO public.chrismed_service_offerings(
      company_id, slug, name, description, modality, price_cents,
      duration_minutes, requires_prepayment, active, display_order, metadata
    ) VALUES (
      v_company_id,
      'consulta-presencial-hepatologia',
      'Consulta Presencial — Hepatologia',
      'Consulta presencial de Hepatologia com duração de 60 minutos.',
      'presencial', 120000, 60, true, true, 2,
      jsonb_build_object('specialty_slug','hepatologia','care_scope','single_specialty','approved_at','2026-08-16')
    )
    ON CONFLICT (company_id, slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      modality = excluded.modality,
      price_cents = excluded.price_cents,
      duration_minutes = excluded.duration_minutes,
      requires_prepayment = excluded.requires_prepayment,
      active = true,
      display_order = excluded.display_order,
      metadata = coalesce(public.chrismed_service_offerings.metadata, '{}'::jsonb) || excluded.metadata,
      updated_at = now();

    INSERT INTO public.chrismed_service_offerings(
      company_id, slug, name, description, modality, price_cents,
      duration_minutes, requires_prepayment, active, display_order, metadata
    ) VALUES (
      v_company_id,
      'consulta-presencial-gastro-clinica',
      'Consulta Presencial — Gastroenterologia ou Clínica Médica',
      'Consulta presencial de Gastroenterologia ou Clínica Médica com duração de 45 minutos.',
      'presencial', 100000, 45, true, true, 1,
      jsonb_build_object(
        'specialty_slugs', jsonb_build_array('gastroenterologia','clinica-medica'),
        'care_scope','single_specialty',
        'approved_at','2026-08-16'
      )
    )
    ON CONFLICT (company_id, slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      modality = excluded.modality,
      price_cents = excluded.price_cents,
      duration_minutes = excluded.duration_minutes,
      requires_prepayment = excluded.requires_prepayment,
      active = true,
      display_order = excluded.display_order,
      metadata = coalesce(public.chrismed_service_offerings.metadata, '{}'::jsonb) || excluded.metadata,
      updated_at = now();

    UPDATE public.chrismed_service_offerings
       SET price_cents = 60000,
           duration_minutes = 30,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'care_scope','360',
             'specialties',jsonb_build_array('gastroenterologia','hepatologia','clinica-medica'),
             'approved_at','2026-08-16'
           ),
           updated_at = now()
     WHERE company_id = v_company_id
       AND slug = 'telemedicina';

    UPDATE public.chrismed_service_offerings
       SET duration_minutes = 90,
           description = 'Consulta domiciliar com visão 360°: 60 minutos de consulta e janela operacional média de 30 minutos para deslocamento.',
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'care_scope','360',
             'clinical_minutes',60,
             'travel_minutes',30,
             'specialties',jsonb_build_array('gastroenterologia','hepatologia','clinica-medica'),
             'approved_at','2026-08-16'
           ),
           updated_at = now()
     WHERE company_id = v_company_id
       AND slug = 'visita-domiciliar';
  END IF;

  IF to_regclass('public.knowledge_articles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.knowledge_articles
        WHERE company_id = v_company_id
          AND slug = 'orientacao-especialidade-consulta-chrismed'
          AND summary = 'Regra oficial para Oliver orientar pacientes entre Clínica Médica, Gastroenterologia e Hepatologia, com valores e durações vigentes em 16/08/2026.'
          AND status = 'published'
     ) THEN
    SELECT coalesce(max(version),0) + 1
      INTO v_next_version
      FROM public.knowledge_articles
     WHERE company_id = v_company_id
       AND slug = 'orientacao-especialidade-consulta-chrismed';

    INSERT INTO public.knowledge_articles(
      company_id, slug, title, summary, body_markdown, category,
      status, audience, version, published_at, updated_at
    ) VALUES (
      v_company_id,
      'orientacao-especialidade-consulta-chrismed',
      'Como escolher a modalidade e a especialidade da consulta CHRISMED',
      'Regra oficial para Oliver orientar pacientes entre Clínica Médica, Gastroenterologia e Hepatologia, com valores e durações vigentes em 16/08/2026.',
      $md$
# Orientação oficial de agendamento CHRISMED

Oliver deve sempre oferecer ajuda ao paciente durante o agendamento e perguntar se existe alguma dúvida sobre modalidade ou especialidade antes de concluir a escolha.

Oliver **não diagnostica**, **não interpreta exames** e **não confirma diagnósticos**. Ele pode ajudar administrativamente a escolher a agenda adequada com base no relato do próprio paciente, em um encaminhamento ou em um pré-diagnóstico já informado por profissional de saúde.

## Consulta presencial — escolha obrigatória antes do pagamento

- **Clínica Médica** — para avaliação inicial/geral quando não há direcionamento clínico específico informado. **R$ 1.000,00 · 45 minutos**.
- **Gastroenterologia** — quando o paciente relata encaminhamento, pré-diagnóstico ou motivo relacionado ao aparelho digestivo. **R$ 1.000,00 · 45 minutos**.
- **Hepatologia** — quando houver encaminhamento, pré-diagnóstico, investigação ou motivo relacionado ao fígado/doença hepática. **R$ 1.200,00 · 60 minutos**.

Se o paciente mencionar doença do fígado, alteração hepática, hepatite, cirrose, esteatose/fígado gorduroso, enzimas hepáticas alteradas ou outro contexto claramente hepático, Oliver deve orientar que, para o agendamento presencial correto, a opção é **Hepatologia**, explicando que a reserva é de 60 minutos e custa R$ 1.200,00. Isso é orientação de agenda, não diagnóstico.

## Teleconsulta

Preço único de **R$ 600,00 · 30 minutos**. Não exige escolha prévia entre as três especialidades. O atendimento contempla visão integrada 360° de **Gastroenterologia, Hepatologia e Clínica Médica**.

## Consulta domiciliar

Também contempla visão integrada 360° das três especialidades, sem escolha prévia. A janela total é de **90 minutos**, sendo **60 minutos de consulta + 30 minutos de tempo operacional médio para deslocamento**. O valor deve ser sempre o valor vigente no catálogo transacional da CHRISMED.

## Conduta operacional do Oliver

1. Perguntar se o paciente tem alguma dúvida e oferecer conversa antes de avançar.
2. Quando necessário, perguntar se é avaliação inicial ou se já existe pré-diagnóstico/encaminhamento.
3. Contexto hepático informado pelo paciente: orientar **Hepatologia presencial — R$ 1.200 / 60 min**.
4. Contexto gastroenterológico informado pelo paciente: orientar **Gastroenterologia presencial — R$ 1.000 / 45 min**.
5. Sem direção clínica específica informada: explicar **Clínica Médica presencial — R$ 1.000 / 45 min** como opção de avaliação inicial.
6. Em dúvida clínica real, encaminhar para atendimento humano/médico; nunca inventar indicação clínica.
$md$,
      'agendamento', 'published', 'customer', v_next_version, now(), now()
    );
  END IF;
END
$migration$;
