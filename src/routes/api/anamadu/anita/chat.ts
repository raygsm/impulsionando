import { createFileRoute } from '@tanstack/react-router';
import { randomUUID } from 'crypto';
import { streamText, type ModelMessage } from 'ai';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const SYSTEM = `Você é Anita, agente virtual oficial da Ana Madu Acessórios e instância especializada do Impulsionito. Fale em português do Brasil com eleg