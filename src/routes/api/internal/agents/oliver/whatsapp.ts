import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { askOliver } from '@/lib/oliver-chat.functions';

const CHRISMED_WHATSAPP = '5521972537868';
const CHRISMED_ENDPOINT = '+5521972537868';

const InputSchema = z.object({
  phone: z.string().min(8),
  message: z.string().min(1).max(12000),
  messageId: z.string().min(1).max(255),
  displayName: z.string().max(255).optional().nullable(),
  connectedPhone: z.string().optional().nullable(),
  instanceId: z.string().optional().nullable(),
  provider: z.enum(['wppconnect', 'zapi', 'meta']).default('wppconnect'),
  transportMode: z.enum(['qr_session', 'official_api']).default('qr_session'),
});

function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function timingSafeEqualText(a: string, b: string) {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let diff = 0;
  for (let i = 0; i < ae.length; i += 1) diff |= ae[i] ^ be[i];
  return diff === 0;
}

export const Route = createFileRoute('/api/internal/agents/oliver/whatsapp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedToken = process.env.N8N_OLIVER_BRIDGE_TOKEN?.trim();
        if (!expectedToken) return json({ ok: false, error: 'bridge_not_configured' }, 503);

        const auth = request.headers.get('authorization') ?? '';
        const providedToken = auth.toLowerCase().startsWith('bearer ')
          ? auth.slice(7).trim()
          : '';
        if (!providedToken || !timingSafeEqualText(providedToken, expectedToken)) {
          return json({ ok: false, error: 'unauthorized' }, 401);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: 'invalid_json' }, 400);
        }

        const parsed = InputSchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: 'invalid_payload' }, 422);
        const input = parsed.data;

        const connectedPhone = onlyDigits(input.connectedPhone);
        if (connectedPhone && connectedPhone !== CHRISMED_WHATSAPP) {
          return json({ ok: false, error: 'wrong_connected_phone' }, 409);
        }

        const externalUserId = onlyDigits(input.phone);
        if (!externalUserId) return json({ ok: false, error: 'invalid_phone' }, 422);

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { data: ingestRaw, error: ingestError } = await supabaseAdmin.rpc(
          'communication_ingest_inbound' as never,
          {
            p_agent_key: 'chrismed-oliver',
            p_channel: 'whatsapp',
            p_provider: input.provider,
            p_external_user_id: externalUserId,
            p_body_text: input.message.trim(),
            p_provider_message_id: input.messageId,
            p_endpoint_address: CHRISMED_ENDPOINT,
            p_display_name: input.displayName ?? null,
            p_metadata: {
              orchestrator: 'n8n',
              transport: input.provider,
              transport_mode: input.transportMode,
              instance_id: input.instanceId ?? null,
              connected_phone: connectedPhone || CHRISMED_WHATSAPP,
            },
          } as never,
        );

        if (ingestError || !ingestRaw) {
          console.error('[oliver-whatsapp] ingest failed', ingestError);
          return json({ ok: false, error: 'ingest_failed' }, 500);
        }

        const ingest = ingestRaw as unknown as {
          conversation_id: string;
          endpoint_id: string | null;
        };

        const { data: historyRows, error: historyError } = await supabaseAdmin
          .from('communication_conversation_messages' as never)
          .select('direction,body_text,occurred_at')
          .eq('conversation_id', ingest.conversation_id)
          .order('occurred_at', { ascending: true })
          .limit(20);

        if (historyError) console.error('[oliver-whatsapp] history failed', historyError);

        const history = ((historyRows ?? []) as unknown as Array<{
          direction: string;
          body_text: string | null;
        }>)
          .filter((row) => row.body_text?.trim())
          .map((row) => ({
            role: row.direction === 'OUTBOUND' ? ('assistant' as const) : ('user' as const),
            content: String(row.body_text),
          }));

        const oliver = await askOliver({
          data: {
            messages: history.length
              ? history
              : [{ role: 'user' as const, content: input.message.trim() }],
            pathname: '/whatsapp',
            lang: 'pt',
          },
        });

        const reply = oliver.reply?.trim();
        if (!reply) return json({ ok: false, error: 'empty_reply' }, 502);

        const { data: outboundMessageId, error: outboundError } = await supabaseAdmin.rpc(
          'communication_record_outbound' as never,
          {
            p_conversation_id: ingest.conversation_id,
            p_body_text: reply,
            p_channel: 'whatsapp',
            p_provider: input.provider,
            p_provider_message_id: null,
            p_endpoint_id: ingest.endpoint_id,
            p_status: 'QUEUED',
            p_metadata: {
              orchestrator: 'n8n',
              transport: input.provider,
              transport_mode: input.transportMode,
              agent_key: 'chrismed-oliver',
              openai_direct: true,
            },
          } as never,
        );

        if (outboundError) console.error('[oliver-whatsapp] outbound ledger failed', outboundError);

        return json({
          ok: true,
          reply,
          phone: externalUserId,
          provider: input.provider,
          transportMode: input.transportMode,
          conversationId: ingest.conversation_id,
          outboundMessageId: outboundMessageId ?? null,
        });
      },
    },
  },
});
