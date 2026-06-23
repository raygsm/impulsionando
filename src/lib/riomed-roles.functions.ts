import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

const AssignSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  templateCode: z.string().min(1),
});

/**
 * Aplica um template de perfil (riomed_role_templates) a um usuário,
 * gravando uma linha por scope em riomed_user_scopes (idempotente).
 */
export const assignRoleTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AssignSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { data: tpl, error: tplErr } = await supabase
      .from('riomed_role_templates')
      .select('scopes')
      .eq('code', data.templateCode)
      .is('company_id', null)
      .maybeSingle();
    if (tplErr) throw tplErr;
    if (!tpl) throw new Error(`Template '${data.templateCode}' não encontrado.`);

    const rows = tpl.scopes.map((scope: string) => ({
      company_id: data.companyId,
      user_id: data.userId,
      scope,
      granted_by: userId,
    }));
    if (rows.length === 0) return { ok: true, granted: 0 };

    const { error } = await supabase
      .from('riomed_user_scopes')
      .upsert(rows, { onConflict: 'company_id,user_id,scope', ignoreDuplicates: true });
    if (error) throw error;

    return { ok: true, granted: rows.length };
  });

const RevokeSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  templateCode: z.string().min(1),
});

export const revokeRoleTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RevokeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { data: tpl } = await supabase
      .from('riomed_role_templates')
      .select('scopes')
      .eq('code', data.templateCode)
      .is('company_id', null)
      .maybeSingle();
    if (!tpl) throw new Error('Template não encontrado.');

    const { error } = await supabase
      .from('riomed_user_scopes')
      .delete()
      .eq('company_id', data.companyId)
      .eq('user_id', data.userId)
      .in('scope', tpl.scopes as string[]);
    if (error) throw error;
    return { ok: true };
  });
