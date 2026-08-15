import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type OmnichannelAgentKey = 'impulsionito-core' | 'colors-iris' | 'chrismed-oliver' | 'wmp-millito';
export type OmnichannelChannel = 'web_chat' | 'whatsapp' | 'instagram' | 'facebook' | string;

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

export async function closeConversationForExternalIdentity(input: {
  agentKey: OmnichannelAgentKey;
  channel: OmnichannelChannel;
  provider: string;
  externalUserId: string;
}) {
  const externalUserId = input.externalUserId.trim();
  if (!externalUserId) throw new Error('external_user_id_required');

  const { data: runtime, error: runtimeError } = await supabaseAdmin
    .from('communication_agent_runtime' as never)
    .select('agent_id, communication_agents!inner(tenant_id)' as never)
    .eq('agent_key' as never, input.agentKey)
    .eq('active' as never, true)
    .maybeSingle();
  if (runtimeError || !runtime) throw new Error('agent_not_found');

  const agentId = String((runtime as any).agent_id);
  const tenantId = String((runtime as any).communication_agents?.tenant_id ?? '');
  if (!tenantId) throw new Error('tenant_not_found');

  const { data: identity, error: identityError } = await supabaseAdmin
    .from('communication_contact_identities' as never)
    .select('contact_id' as never)
    .eq('tenant_id' as never, tenantId)
    .eq('channel' as never, input.channel)
    .eq('provider' as never, input.provider)
    .eq('external_user_id' as never, externalUserId)
    .maybeSingle();
  if (identityError || !identity) throw new Error('contact_identity_not_found');

  const contactId = String((identity as any).contact_id);
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('communication_conversations' as never)
    .select('id,status' as never)
    .eq('tenant_id' as never, tenantId)
    .eq('agent_id' as never, agentId)
    .eq('contact_id' as never, contactId)
    .in('status' as never, ['OPEN','WAITING_HUMAN','HUMAN','RESOLVED'])
    .order('last_message_at' as never, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (conversationError || !conversation) throw new Error('open_conversation_not_found');

  const conversationId = String((conversation as any).id);
  const now = new Date().toISOString();
  const { error: closeError } = await supabaseAdmin
    .from('communication_conversations' as never)
    .update({ status: 'CLOSED', closed_at: now, updated_at: now } as never)
    .eq('id' as never, conversationId)
    .eq('tenant_id' as never, tenantId);
  if (closeError) throw new Error(`conversation_close_failed:${closeError.message}`);

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('communication_conversation_tickets' as never)
    .select('protocol,access_token,contact_id,export_status' as never)
    .eq('tenant_id' as never, tenantId)
    .eq('agent_id' as never, agentId)
    .eq('conversation_id' as never, conversationId)
    .maybeSingle();
  if (ticketError || !ticket) throw new Error('conversation_ticket_not_created');

  return {
    conversationId,
    contactId,
    protocol: String((ticket as any).protocol),
    accessToken: String((ticket as any).access_token),
    exportStatus: String((ticket as any).export_status ?? 'NOT_REQUESTED'),
  };
}
