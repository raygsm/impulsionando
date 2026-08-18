import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const TENANT_SLUG = 'impulsionando';
const INSTANCE = 'impulsionito-core';
const WEBHOOK_PATH = '/api/impulsionando/whatsapp/webhook';

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role