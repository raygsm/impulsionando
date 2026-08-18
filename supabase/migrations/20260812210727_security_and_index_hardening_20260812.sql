do $security$
begin
  if to_regprocedure('public.chrismed_create_patient_substitution_decision()') is not null then
    execute 'revoke execute on function public.chrismed_create_patient_substitution_decision() from public, anon, authenticated';
    execute 'grant execute on function public.chrismed_create_patient_substitution_decision() to service_role';
  end if;

  if to_regprocedure('public.chrismed_notify_professional_cancellation()') is not null then
    execute 'revoke execute on function public.chrismed_notify_professional_cancellation() from public, anon, authenticated';
    execute 'grant execute on function public.chrismed_notify_professional_cancellation() to service_role';
  end if;
end
$security$;

drop index if exists public.uq_company_settings_company_key;

create index if not exists idx_agenda_blocks_company_id on public.agenda_blocks(company_id);
create index if not exists idx_agenda_blocks_professional_id on public.agenda_blocks(professional_id);
create index if not exists idx_agenda_schedules_company_id on public.agenda_schedules(company_id);
create index if not exists idx_agenda_schedules_professional_id on public.agenda_schedules(professional_id);
create index if not exists idx_agenda_professionals_profession_id on public.agenda_professionals(profession_id);
create index if not exists idx_chrismed_change_events_company on public.chrismed_appointment_change_events(company_id);
create index if not exists idx_chrismed_change_events_professional on public.chrismed_appointment_change_events(professional_id);
create index if not exists idx_chrismed_change_events_open_slot on public.chrismed_appointment_change_events(open_slot_id);
create index if not exists idx_chrismed_substitution_company on public.chrismed_patient_substitution_decisions(company_id);
create index if not exists idx_chrismed_substitution_slot on public.chrismed_patient_substitution_decisions(open_slot_id);
create index if not exists idx_chrismed_substitution_professional on public.chrismed_patient_substitution_decisions(proposed_professional_id);
create index if not exists idx_chrismed_wallet_company on public.chrismed_professional_wallet_entries(company_id);
create index if not exists idx_chrismed_wallet_open_slot on public.chrismed_professional_wallet_entries(open_slot_id);
create index if not exists idx_chrismed_telepresence_user on public.chrismed_teleconsult_presence(user_id);
create index if not exists idx_chrismed_recording_consent_user on public.chrismed_teleconsult_recording_consents(user_id);
create index if not exists idx_chrismed_recording_room on public.chrismed_teleconsult_recordings(room_id);
create index if not exists idx_chrismed_recording_access_actor on public.chrismed_teleconsult_recording_access_logs(actor_user_id);
create index if not exists idx_communication_runtime_root on public.communication_agent_runtime(root_agent_id);
create index if not exists idx_communication_contacts_user on public.communication_contacts(user_id);
create index if not exists idx_communication_contacts_merged on public.communication_contacts(merged_into_contact_id);
create index if not exists idx_communication_channels_endpoint on public.communication_conversation_channels(endpoint_id);
create index if not exists idx_communication_messages_tenant on public.communication_conversation_messages(tenant_id);
create index if not exists idx_communication_messages_agent on public.communication_conversation_messages(agent_id);
create index if not exists idx_communication_messages_contact on public.communication_conversation_messages(contact_id);
create index if not exists idx_communication_messages_author on public.communication_conversation_messages(author_user_id);
create index if not exists idx_communication_messages_reply on public.communication_conversation_messages(reply_to_message_id);
create index if not exists idx_communication_conversations_contact_fk on public.communication_conversations(contact_id);
create index if not exists idx_communication_conversations_assigned on public.communication_conversations(assigned_user_id);
create index if not exists idx_communication_handoffs_conversation on public.communication_handoffs(conversation_id);
create index if not exists idx_communication_handoffs_assigned on public.communication_handoffs(assigned_user_id);
