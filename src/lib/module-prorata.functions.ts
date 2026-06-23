import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const schema = z.object({
  companyId: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  moduleSlug: z.string().optional(),
  changeType: z.enum(['upgrade', 'downgrade', 'add', 'remove']),
  previousAmount: z.number().min(0).default(0),
  newAmount: z.number().min(0).default(0),
  cycleDays: z.number().int().min(1).max(366).default(30),
  notes: z.string().optional(),
});

/**
 * Calcula pro-rata da diferença pelo restante do ciclo:
 *   prorata = (newAmount - previousAmount) * (diasRestantes / cycleDays)
 * Aplica como ajuste na próxima fatura aberta (status='open') da empresa, se houver.
 */
export const applyModuleChangeProrata = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;

    const { data: isAdmin } = await sb.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!isAdmin) throw new Error('Forbidden');

    const today = new Date();
    const { data: openInvoice } = await sb
      .from('billing_invoices')
      .select('id, period_end, amount')
      .eq('company_id', data.companyId)
      .eq('status', 'open')
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    let prorataDays = data.cycleDays;
    if (openInvoice?.period_end) {
      const end = new Date(openInvoice.period_end);
      prorataDays = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
    }
    const delta = data.newAmount - data.previousAmount;
    const prorata = Math.round((delta * prorataDays * 100) / data.cycleDays) / 100;

    const { data: log, error: logErr } = await sb
      .from('module_change_log')
      .insert({
        company_id: data.companyId,
        module_id: data.moduleId ?? null,
        module_slug: data.moduleSlug ?? null,
        change_type: data.changeType,
        previous_amount: data.previousAmount,
        new_amount: data.newAmount,
        prorata_amount: prorata,
        prorata_days: prorataDays,
        cycle_days: data.cycleDays,
        applied_to_invoice_id: openInvoice?.id ?? null,
        changed_by: context.userId,
        notes: data.notes ?? null,
      })
      .select('*')
      .single();
    if (logErr) throw new Error(logErr.message);

    if (openInvoice && prorata !== 0) {
      await sb
        .from('billing_invoices')
        .update({ amount: Number(openInvoice.amount) + prorata })
        .eq('id', openInvoice.id);
    }

    return { ok: true, prorata, prorataDays, appliedInvoiceId: openInvoice?.id ?? null, logId: log.id };
  });
