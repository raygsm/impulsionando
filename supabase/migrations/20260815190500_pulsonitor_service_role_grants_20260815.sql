-- Pulsonitor worker runs server-side as service_role.
-- RLS bypass is not enough when table privileges were not granted explicitly.

grant select on public.imp_monitoring_targets to service_role;
grant select,insert on public.imp_monitoring_checks to service_role;
grant select,insert,update on public.imp_monitoring_state to service_role;
grant select,insert,update on public.imp_operational_incidents to service_role;
grant usage,select on sequence public.imp_monitoring_checks_id_seq to service_role;
grant execute on function public.pulsonitor_register_check(uuid,text,boolean,integer,integer,text,text,jsonb) to service_role;
