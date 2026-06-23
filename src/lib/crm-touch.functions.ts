import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const ruleSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  triggerEvent: z.string().min(2),
  offsetDays: z.number().int().min(0).default(0),
  channel: z.enum(['inapp', 'email', 'whatsapp', 'task']).default('inapp'),
  templateCode: z.string().optional().nullable(),
  assignTo: z.enum(['seller', 'sector', 'owner', 'none']).default('seller'),
  sectorCode: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const upsertCrmTouchRule = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ruleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: isAdmin } = await sb.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');
    const row = {
      id: data.id,
      company_id: data.companyId,
      code: data.code,
      name: data.name,
      trigger_event: data.triggerEvent,
      offset_days: data.offsetDays,
      channel: data.channel,
      template_code: data.templateCode ?? null,
      assign_to: data.assignTo,
      sector_code: data.sectorCode ?? null,
      is_active: data.isActive,
    };
    const { data: saved, error } = await sb
      .from('crm_touch_rules')
      .upsert(row, { onConflict: 'company_id,code' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const listCrmTouchRules = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('crm_touch_rules')
      .select('*')
      .eq('company_id', data.companyId)
      .order('trigger_event')
      .order('offset_days');
    if (error) throw new Error(error.message);
    return rows;
  });
