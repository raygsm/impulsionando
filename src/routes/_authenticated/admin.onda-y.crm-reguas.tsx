import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { upsertCrmTouchRule } from '@/lib/crm-touch.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/onda-y/crm-reguas')({
  component: CrmReguasAdmin,
});

const TRIGGERS = [
  'order_paid',
  'order_delivered',
  'cart_abandoned',
  'no_contact_days',
  'lead_created',
] as const;

function CrmReguasAdmin() {
  const qc = useQueryClient();
  const save = useServerFn(upsertCrmTouchRule);
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    triggerEvent: 'order_paid' as (typeof TRIGGERS)[number],
    offsetDays: '3',
    channel: 'inapp' as 'inapp' | 'email' | 'whatsapp' | 'task',
    templateCode: '',
    assignTo: 'seller' as 'seller' | 'sector' | 'owner' | 'none',
    sectorCode: '',
  });

  const companies = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => (await supabase.from('companies').select('id,name').order('name')).data ?? [],
  });
  const rules = useQuery({
    queryKey: ['crm-touch-rules', companyId],
    enabled: !!companyId,
    queryFn: async () =>
      (await supabase.from('crm_touch_rules').select('*').eq('company_id', companyId).order('trigger_event')).data ?? [],
  });

  const mut = useMutation({
    mutationFn: async () =>
      save({
        data: {
          companyId,
          code: form.code,
          name: form.name,
          triggerEvent: form.triggerEvent,
          offsetDays: Number(form.offsetDays),
          channel: form.channel,
          templateCode: form.templateCode || null,
          assignTo: form.assignTo,
          sectorCode: form.sectorCode || null,
          isActive: true,
        },
      }),
    onSuccess: () => {
      toast.success('Régua salva');
      qc.invalidateQueries({ queryKey: ['crm-touch-rules', companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">CRM — Réguas de toque</h1>
      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        className="border rounded px-3 py-2 w-full max-w-md"
      >
        <option value="">Selecione o tenant…</option>
        {(companies.data ?? []).map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {companyId && (
        <>
          <div className="border rounded-lg p-4 grid sm:grid-cols-3 gap-3">
            {(['code', 'name', 'offsetDays', 'templateCode', 'sectorCode'] as const).map((k) => (
              <label key={k} className="text-sm">
                <span className="text-muted-foreground">{k}</span>
                <input
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="border rounded px-2 py-1 w-full mt-1"
                />
              </label>
            ))}
            <label className="text-sm">
              <span className="text-muted-foreground">trigger</span>
              <select
                value={form.triggerEvent}
                onChange={(e) => setForm({ ...form, triggerEvent: e.target.value as any })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                {TRIGGERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">channel</span>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as any })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                {['inapp', 'email', 'whatsapp', 'task'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">assign_to</span>
              <select
                value={form.assignTo}
                onChange={(e) => setForm({ ...form, assignTo: e.target.value as any })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                {['seller', 'sector', 'owner', 'none'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => mut.mutate()}
              disabled={!form.code || !form.name || mut.isPending}
              className="bg-primary text-primary-foreground rounded px-4 py-2 sm:col-span-3"
            >
              Salvar régua
            </button>
          </div>

          <table className="w-full text-sm border rounded">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Trigger</th>
                <th className="text-right p-2">+dias</th>
                <th className="text-left p-2">Canal</th>
                <th className="text-left p-2">Assignee</th>
                <th className="text-center p-2">Ativa</th>
              </tr>
            </thead>
            <tbody>
              {(rules.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{r.code}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.trigger_event}</td>
                  <td className="p-2 text-right">{r.offset_days}</td>
                  <td className="p-2">{r.channel}</td>
                  <td className="p-2">{r.assign_to}{r.sector_code ? `:${r.sector_code}` : ''}</td>
                  <td className="p-2 text-center">{r.is_active ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
