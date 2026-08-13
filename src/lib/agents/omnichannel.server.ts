import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type OmnichannelAgentKey = 'impulsionito-core' | 'chrismed-oliver';
export type OmnichannelChannel = 'web_chat' | 'whatsapp' | 'instagram' | string;

export type InboundMessageInput = {
  agentKey: OmnichannelAgentKey;
  channel: OmnichannelChannel;
  provider?: string;
  externalUserId: string;
  bodyText: string;
  providerMessageId?: string | null;
  endpointAddress?: string | null;
  displayName?: string | null;
  metadata?: Record<string, unknown>;
};

export type InboundLedger = {
  agent_id: string;
  tenant_id: string;
  contact_id: string;
  conversation_id: string;
  message_id: string;
  endpoint_id: string | null;
};

export async function recordInboundMessage(input: InboundMessageInput): Promise<InboundLedger> {
  if (!input.externalUserId?.trim()) throw new Error('external_user_id_required');
  if (!input.bodyText?.trim()) throw new Error('message_required');

  const { data, error } = await supabaseAdmin.rpc('communication_ingest_inbound', {
    p_agent_key: input.agentKey,
    p_channel: input.channel,
    p_provider: input.provider ?? 'unbound',
    p_external_user_id: input.externalUserId.trim().slice(0, 500),
    p_body_text: input.bodyText.trim().slice(0, 12000),
    p_provider_message_id: input.providerMessageId ?? null,
    p_endpoint_address: input.endpointAddress ?? null,
    p_display_name: input.displayName?.trim().slice(0, 200) ?? null,
    p_metadata: input.metadata ?? {},
  } as never);

  if (error) throw new Error(`omnichannel_inbound_failed:${error.message}`);
  return data as unknown as InboundLedger;
}

export async function recordOutboundMessage(input: {
  conversationId: string;
  bodyText: string;
  channel: OmnichannelChannel;
  provider?: string;
  providerMessageId?: string | null;
  endpointId?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  if (!input.bodyText?.trim()) throw new Error('message_required');

  const { data, error } = await supabaseAdmin.rpc('communication_record_outbound', {
    p_conversation_id: input.conversationId,
    p_body_text: input.bodyText.trim().slice(0, 12000),
    p_channel: input.channel,
    p_provider: input.provider ?? 'unbound',
    p_provider_message_id: input.providerMessageId ?? null,
    p_endpoint_id: input.endpointId ?? null,
    p_status: input.status ?? 'SENT',
    p_metadata: input.metadata ?? {},
  } as never);

  if (error) throw new Error(`omnichannel_outbound_failed:${error.message}`);
  return String(data);
}

export async function listConversationHistory(conversationId: string, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 40);
  const { data, error } = await supabaseAdmin
    .from('communication_conversation_messages' as never)
    .select('direction,author_type,body_text,channel,occurred_at' as never)
    .eq('conversation_id' as never, conversationId)
    .order('occurred_at' as never, { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(`omnichannel_history_failed:${error.message}`);

  return ((data ?? []) as unknown as Array<{
    direction: string;
    author_type: string;
    body_text: string | null;
    channel: string;
    occurred_at: string;
  }>).reverse();
}
