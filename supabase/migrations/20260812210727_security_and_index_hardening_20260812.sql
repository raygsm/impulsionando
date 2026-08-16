-- Historical security/index hardening was authored against a database that
-- already contained some functions/tables provisioned outside repository history.
-- Keep the hardening strict when objects exist, but make clean replay idempotent.

DO $$
BEGIN
  IF to_regprocedure('public.chrismed_create_patient_substitution_decision()') IS NOT NULL THEN
    EXECUTE 'revoke execute on function public.chrismed_create_patient_substitution_decision() from public, anon, authenticated';
    EXECUTE 'grant execute on function public.chrismed_create_patient_substitution_decision() to service_role';
  END IF;

  IF to_regprocedure('public.chrismed_notify_professional_cancellation()') IS NOT NULL THEN
    EXECUTE 'revoke execute on function public.chrismed_notify_professional_cancellation() from public, anon, authenticated';
    EXECUTE 'grant execute on function public.chrismed_notify_professional_cancellation() to service_role';
  END IF;
END $$;

drop index if exists public.uq_company_settings_company_key;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('idx_agenda_blocks_company_id','agenda_blocks','company_id'),
      ('idx_agenda_blocks_professional_id','agenda_blocks','professional_id'),
      ('idx_agenda_schedules_company_id','agenda_schedules','company_id'),
      ('idx_agenda_schedules_professional_id','agenda_schedules','professional_id'),
      ('idx_agenda_professionals_profession_id','agenda_professionals','profession_id'),
      ('idx_chrismed_change_events_company','chrismed_appointment_change_events','company_id'),
      ('idx_chrismed_change_events_professional','chrismed_appointment_change_events','professional_id'),
      ('idx_chrismed_change_events_open_slot','chrismed_appointment_change_events','open_slot_id'),
      ('idx_chrismed_substitution_company','chrismed_patient_substitution_decisions','company_id'),
      ('idx_chrismed_substitution_slot','chrismed_patient_substitution_decisions','open_slot_id'),
      ('idx_chrismed_substitution_professional','chrismed_patient_substitution_decisions','proposed_professional_id'),
      ('idx_chrismed_wallet_company','chrismed_professional_wallet_entries','company_id'),
      ('idx_chrismed_wallet_open_slot','chrismed_professional_wallet_entries','open_slot_id'),
      ('idx_chrismed_telepresence_user','chrismed_teleconsult_presence','user_id'),
      ('idx_chrismed_recording_consent_user','chrismed_teleconsult_recording_consents','user_id'),
      ('idx_chrismed_recording_room','chrismed_teleconsult_recordings','room_id'),
      ('idx_chrismed_recording_access_actor','chrismed_teleconsult_recording_access_logs','actor_user_id'),
      ('idx_communication_runtime_root','communication_agent_runtime','root_agent_id'),
      ('idx_communication_contacts_user','communication_contacts','user_id'),
      ('idx_communication_contacts_merged','communication_contacts','merged_into_contact_id'),
      ('idx_communication_channels_endpoint','communication_conversation_channels','endpoint_id'),
      ('idx_communication_messages_tenant','communication_conversation_messages','tenant_id'),
      ('idx_communication_messages_agent','communication_conversation_messages','agent_id'),
      ('idx_communication_messages_contact','communication_conversation_messages','contact_id'),
      ('idx_communication_messages_author','communication_conversation_messages','author_user_id'),
      ('idx_communication_messages_reply','communication_conversation_messages','reply_to_message_id'),
      ('idx_communication_conversations_contact_fk','communication_conversations','contact_id'),
      ('idx_communication_conversations_assigned','communication_conversations','assigned_user_id'),
      ('idx_communication_handoffs_conversation','communication_handoffs','conversation_id'),
      ('idx_communication_handoffs_assigned','communication_handoffs','assigned_user_id')
    ) AS v(index_name, table_name, column_name)
  LOOP
    IF to_regclass(format('public.%I', r.table_name)) IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns c
         WHERE c.table_schema='public'
           AND c.table_name=r.table_name
           AND c.column_name=r.column_name
       ) THEN
      EXECUTE format('create index if not exists %I on public.%I(%I)', r.index_name, r.table_name, r.column_name);
    END IF;
  END LOOP;
END $$;
