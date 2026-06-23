import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const upsertSchema = z.object({
  companyId: z.string().uuid(),
  sectorId: z.string().uuid(),
  userId: z.string().uuid(),
  roleInSector: z.enum(['lead', 'member', 'viewer']).default('member'),
  notifyChannels: z.array(z.enum(['inapp', 'email', 'whatsapp'])).default(['inapp']),
  isActive: z.boolean().default(true),
});

export const upsertSectorMember = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: isAdmin } = await sb.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');

    const { data: row, error } = await sb
      .from('sector_members')
      .upsert(
        {
          company_id: data.companyId,
          sector_id: data.sectorId,
          user_id: data.userId,
          role_in_sector: data.roleInSector,
          notify_channels: data.notifyChannels,
          is_active: data.isActive,
        },
        { onConflict: 'company_id,sector_id,user_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, member: row };
  });

export const listSectorMembers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('sector_members')
      .select('*, sectors(code,name)')
      .eq('company_id', data.companyId);
    if (error) throw new Error(error.message);
    return rows;
  });
