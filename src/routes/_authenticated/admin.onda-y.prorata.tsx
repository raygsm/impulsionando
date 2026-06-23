import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { applyModuleChangeProrata } from '@/lib/module-prorata.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/onda-y/prorata')({
  component: ProrataAdmin,
});

function ProrataAdmin() {
  const qc = useQueryClient();
  const apply = useServerFn(applyModuleChangeProrata);
  const [form, setForm] = useState({
    companyId: '',
    moduleSlug: '',
    changeType: 'upgrade' as 'upgrade' | 'downgrade' | 'add' | 'remove',
    previousAmount: '0',
    newAmount: '0',
    cycleDays: '30',
    notes: '',
  });

  const companies = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => (await supabase.from('companies').select('id,name,slug').order('name')).data ?? [],
  });

  const history = useQuery({
    queryKey: ['module-change-log', form.companyId],
    enabled: !!form.companyId,
    queryFn: async () =>
      (
        await supabase
          .from('module_change_log')
          .select('*')
          .eq('company_id', form.companyId)
          .order('created_at', { ascending: false })
          .limit(50)
      ).data ?? [],
  });

  const mut = useMutation({
    mutationFn: async () =>
      apply({
        data: {
          companyId: form.companyId,
          moduleSlug: form.moduleSlug || undefined,
          changeType: form.changeType,
          previousAmount: Number(form.previousAmount),
          newAmount: Number(form.newAmount),
          cycleDays: Number(form.cycleDays),
          notes: form.notes || undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Pro-rata aplicada: R$ ${r.prorata.toFixed(2)} (${r.prorataDays}d)`);
      qc.invalidateQueries({ queryKey: ['module-change-log', form.companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Módulos & Pro-rata</h1>
      <div className="border rounded-lg p-4 grid sm:grid-cols-2 gap-3">
        <label className="text-sm sm:col-span-2">
          <span className="text-muted-foreground">Tenant</span>
          <select
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          >
            <option value="">Selecione…</option>
            {(companies.data ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Módulo (slug)</span>
          <input
            value={form.moduleSlug}
            onChange={(e) => setForm({ ...form, moduleSlug: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Tipo</span>
          <select
            value={form.changeType}
            onChange={(e) => setForm({ ...form, changeType: e.target.value as any })}
            className="border rounded px-2 py-1 w-full mt-1"
          >
            <option value="upgrade">upgrade</option>
            <option value="downgrade">downgrade</option>
            <option value="add">add</option>
            <option value="remove">remove</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Valor anterior</span>
          <input
            type="number"
            step="0.01"
            value={form.previousAmount}
            onChange={(e) => setForm({ ...form, previousAmount: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Valor novo</span>
          <input
            type="number"
            step="0.01"
            value={form.newAmount}
            onChange={(e) => setForm({ ...form, newAmount: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Ciclo (dias)</span>
          <input
            value={form.cycleDays}
            onChange={(e) => setForm({ ...form, cycleDays: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-muted-foreground">Notas</span>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="border rounded px-2 py-1 w-full mt-1"
          />
        </label>
        <button
          onClick={() => mut.mutate()}
          disabled={!form.companyId || mut.isPending}
          className="bg-primary text-primary-foreground rounded px-4 py-2 sm:col-span-2"
        >
          Calcular & aplicar pro-rata
        </button>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Histórico</h2>
        <table className="w-full text-sm border rounded">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Data</th>
              <th className="text-left p-2">Módulo</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-right p-2">Anterior</th>
              <th className="text-right p-2">Novo</th>
              <th className="text-right p-2">Pro-rata</th>
              <th className="text-right p-2">Dias</th>
            </tr>
          </thead>
          <tbody>
            {(history.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-2">{r.module_slug ?? '-'}</td>
                <td className="p-2">{r.change_type}</td>
                <td className="p-2 text-right">{Number(r.previous_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.new_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{Number(r.prorata_amount).toFixed(2)}</td>
                <td className="p-2 text-right">{r.prorata_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
