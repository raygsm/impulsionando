DELETE FROM public.trial_abuse_index WHERE trial_id IN (SELECT id FROM public.trial_subscriptions WHERE contact_email LIKE 'qatest+%');
DELETE FROM public.trial_events WHERE trial_id IN (SELECT id FROM public.trial_subscriptions WHERE contact_email LIKE 'qatest+%');
DELETE FROM public.trial_subscriptions WHERE contact_email LIKE 'qatest+%';