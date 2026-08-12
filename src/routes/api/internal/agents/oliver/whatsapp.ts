import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { askOliver } from '@/lib/oliver-chat.functions';

const CHRISMED_WHATSAPP = '5521972537868';
const CHRISMED_ENDPOINT = '+5521972537868';

const InputSchema = z.object({
  phone: z.string().min(8),
  message: z