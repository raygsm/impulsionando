-- HOMOLOGACAO: expand dunning intent to email + WhatsApp.
-- billing_run_cycle already supports both channels; WhatsApp delivery remains dependent
-- on an ACTIVE provider endpoint. No false-positive delivery state is introduced.

begin;

update public.billing_dunning_policy
set steps = '[
  {"code":"d_minus_5","channels":["email","whatsapp"],"offset_days":-5,"template_code":"billing.reminder.5d"},
  {"code":"d_minus_1","channels":["email","whatsapp"],"offset_days":-1,"template_code":"billing.reminder.1d"},
  {"code":"d_zero","channels":["email","whatsapp"],"offset_days":0,"template_code":"billing.due.today"},
  {"code":"d_plus_1","channels":["email","whatsapp"],"offset_days":1,"template_code":"billing.overdue.1d"},
  {"code":"d_plus_3","channels":["email","whatsapp"],"offset_days":3,"template_code":"billing.overdue.3d"},
  {"code":"d_plus_5","channels":["email","whatsapp"],"offset_days":5,"template_code":"billing.overdue.5d"},
  {"code":"d_plus_7","channels":["email","whatsapp"],"offset_days":7,"template_code":"billing.restricted"},
  {"code":"d_plus_10","channels":["email","whatsapp"],"offset_days":10,"template_code":"billing.suspended"},
  {"code":"d_plus_15","channels":["email","whatsapp"],"offset_days":15,"template_code":"billing.recovery"}
]'::jsonb,
updated_at = now()
where is_default = true and is_active = true;

commit;
