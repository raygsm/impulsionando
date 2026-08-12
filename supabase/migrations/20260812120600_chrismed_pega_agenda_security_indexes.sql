revoke all on function public.chrismed_get_my_pega_agenda_state() from public, anon;
revoke all on function public.chrismed_decline_pega_agenda_offer(uuid) from public, anon;
revoke all on function public.chrismed_claim_pega_agenda_offer(uuid) from public, anon;
grant execute on function public.chrismed_get_my_pega_agenda_state() to authenticated;
grant execute on function public.chrismed_decline_pega_agenda_offer(uuid) to authenticated;
grant execute on function public.chrismed_claim_pega_agenda_offer(uuid) to authenticated;

-- Raw claim is implementation-only. Browser clients must use the CHRISMED wrapper,
-- which validates auth.uid(), active professional identity and offer ownership.
revoke all on function public.agenda_claim_open_slot(uuid,uuid,text,text) from public, anon, authenticated;

create index if not exists agenda_open_slots_appointment_id_idx on public.agenda_open_slots(appointment_id);
create index if not exists agenda_open_slots_claimed_by_idx on public.agenda_open_slots(claimed_by_professional_id);
create index if not exists agenda_open_slots_company_id_idx on public.agenda_open_slots(company_id);
create index if not exists agenda_open_slots_offering_id_idx on public.agenda_open_slots(offering_id);
create index if not exists agenda_open_slots_original_professional_idx on public.agenda_open_slots(original_professional_id);
create index if not exists agenda_professional_availability_company_idx on public.agenda_professional_availability(company_id);
create index if not exists agenda_professional_eligibility_company_idx on public.agenda_professional_eligibility(company_id);
create index if not exists agenda_professional_terms_company_idx on public.agenda_professional_terms(company_id);
create index if not exists agenda_slot_offers_company_idx on public.agenda_slot_offers(company_id);
create index if not exists agenda_professionals_user_idx on public.agenda_professionals(user_id);
create index if not exists chrismed_appointments_company_idx on public.chrismed_appointments(company_id);
create index if not exists chrismed_appointments_offering_idx on public.chrismed_appointments(offering_id);
create index if not exists chrismed_communication_outbox_company_idx on public.chrismed_communication_outbox(company_id);
