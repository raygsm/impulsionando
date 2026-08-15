import { createServerFn } from '@tanstack/react-start';
import { askOliver } from '@/lib/oliver-chat.functions';
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
} from '@/lib/agents/omnichannel.server';

type OliverMessage = { role: 'user' | 'assistant'; content: string };

type OliverOmnichannelInput = {
  messages: OliverMessage[];
  pathname?: string;
  lang?: 'pt' | 'en' | 'es';
  sessionId?: string;
};

function validate(input: unknown): OliverOmnichannelInput {
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const raw = input as Record<string, unknown>;
  const messages: OliverMessage[] = (Array.isArray(raw.messages) ? raw.messages : [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m): OliverMessage => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').trim().slice(0, 4000),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-20);
  if (!messages.length) throw new Error('Empty conversation');

  const suppliedSession = typeof raw.sessionId === 'string' ? raw.sessionId.trim() : '';
  const sessionId = /^web:chrismed:[A-Za-z0-9:_-]{8,180}$/.test(suppliedSession)
    ? suppliedSession
    : undefined;

  return {
    messages,
    pathname: typeof raw.pathname === 'string' ? raw.pathname.slice(0, 200) : undefined,
    lang: raw.lang === 'en' || raw.lang === 'es' ? raw.lang : 'pt',
    sessionId,
  };
}

function toOliverHistory(history: Awaited<ReturnType<typeof listConversationHistory>>): OliverMessage[] {
  return history.flatMap((message): OliverMessage[] => {
    const content = (message.body_text ?? '').trim();
    if (!content) return [];
    if (message.direction === 'INBOUND' || message.author_type === 'CONTACT') {
      return [{ role: 'user', content }];
    }
    if (message.direction === 'OUTBOUND' && message.author_type === 'AGENT') {
      return [{ role: 'assistant', content }];
    }
    return [];
  }).slice(-20);
}

/**
 * Oliver precisa permanecer disponível mesmo se a camada de persistência
 * omnichannel estiver temporariamente degradada. O ledger enriquece a jornada,
 * mas nunca pode impedir a chamada ao cérebro OpenAI.
 */
export const askOliverOmnichannel = createServerFn({ method: 'POST' })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const lastUser = [...data.messages].reverse().find((message) => message.role === 'user');
    if (!lastUser?.content.trim()) throw new Error('Empty conversation');

    const externalUserId = data.sessionId ?? `web:chrismed:ephemeral:${crypto.randomUUID()}`;
    let conversationId: string | null = null;
    let endpointId: string | null = null;
    let messages = data.messages;

    try {
      const ledger = await recordInboundMessage({
        agentKey: 'chrismed-oliver',
        channel: 'web_chat',
        provider: 'chrismed_front',
        externalUserId,
        bodyText: lastUser.content,
        endpointAddress: 'https://chrismed.impulsionando.com.br',
        metadata: {
          pathname: data.pathname ?? null,
          lang: data.lang ?? 'pt',
          source: 'chrismed_oliver_web_chat',
          health_context: true,
        },
      });

      conversationId = ledger.conversation_id;
      endpointId = ledger.endpoint_id;

      try {
        const persisted = toOliverHistory(await listConversationHistory(ledger.conversation_id, 30));
        if (persisted.length) messages = persisted;
      } catch (error) {
        console.error('[askOliverOmnichannel] history read failed; continuing with browser history', error);
      }
    } catch (error) {
      console.error('[askOliverOmnichannel] ledger unavailable; Oliver will continue online without persistence', error);
    }

    const result = await askOliver({
      data: {
        messages: messages.slice(-20),
        pathname: data.pathname,
        lang: data.lang,
      },
    });

    const reply = String(result.reply ?? '').trim();
    if (reply && conversationId) {
      try {
        await recordOutboundMessage({
          conversationId,
          bodyText: reply,
          channel: 'web_chat',
          provider: 'chrismed_front',
          endpointId,
          status: result.error ? 'DEGRADED' : 'SENT',
          metadata: {
            source: 'chrismed_oliver_web_chat',
            fallback: Boolean(result.error),
            fallback_reason: result.error ?? null,
          },
        });
      } catch (error) {
        console.error('[askOliverOmnichannel] outbound ledger failed; reply already delivered', error);
      }
    }

    return {
      ...result,
      conversationId,
      persistence: conversationId ? 'online' : 'degraded',
    };
  });
