create table if not exists public.whatsapp_inbound_receipts (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'zapi',
  instance_id text not null,
  provider_message_id text not null,
  connected_phone text,
  sender_phone text,
  conversation_id uuid references public.communication_conversations(id) on delete set null,
  inbound_message_id uuid references public.communication_conversation_messages(id) on delete set null,
  outbound_message_id uuid references public.communication_conversation_messages(id) on delete set null,
  status text not null default 'received' check (status in ('received','processing','replied','ignored','failed')),
  error_message text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider,instance_id,provider_message_id)
);
create index if not exists idx_whatsapp_inbound_receipts_sender on public.whatsapp_inbound_receipts(sender_phone,created_at desc);
create index if not exists idx_whatsapp_inbound_receipts_status on public.whatsapp_inbound_receipts(status,created_at desc);
alter table public.whatsapp_inbound_receipts enable row level security;
revoke all on public.whatsapp_inbound_receipts from anon,authenticated;
grant all on public.whatsapp_inbound_receipts to service_role;

update public.communication_channel_endpoints
set provider='zapi',
    webhook_path='/api/public/hooks/zapi-received',
    config=coalesce(config,'{}'::jsonb) || jsonb_build_object(
      'official',true,
      'provider_adapter_required',false,
      'provider','zapi',
      'connected_phone','5521972537868'
    ),
    updated_at=now()
where channel='whatsapp' and address='+5521972537868' and agent_id=(select id from public.communication_agents where name='Oliver' limit 1);