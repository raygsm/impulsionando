import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/onda-y/fretes')({
  component: FretesAdmin,
});

const MODALITIES = ['expresso', 'padrao', 'economico'] as const;

function FretesAdmin() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState<string>('');
  const [form, setForm] = useState({
    region_code: 'BR-SP',
    modality: 'padrao' as (typeof MODALITIES)[number],
    base_amount: '15',
    per_kg_amount: '5',
    eta_days_min: '2',
    eta_days_max: '5',
    max_weight_g: '30000',
  });

  const companies = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id,name,slug').order('name');
      return data ?? [];
    },
  });

  const rates = useQuery({
    queryKey: ['rates', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('logistics_shipping_rates')
        .select('*')
        .eq('company_id', companyId)
        .order('region_code');
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('logistics_shipping_rates').insert({
        company_id: companyId,
        region_code: form.region_code,
        modality: form.modality,
        base_amount: Number(form.base_amount),
        per_kg_amount: Number(form.per_kg_amount),
        eta_days_min: Number(form.eta_days_min),
        eta_days_max: Number(form.eta_days_max),
        max_weight_g: Number(form.max_weight_g),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Frete cadastrado');
      qc.invalidateQueries({ queryKey: ['rates', companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase
        .from('logistics_shipping_rates')
        .update({ is_active: !row.is_active })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rates', companyId] }),
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Tabela de Fretes</h1>

      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        className="border rounded px-3 py-2 w-full max-w-md"
      >
        <option value="">Selecione o tenant…</option>
        {(companies.data ?? []).map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.slug})
          </option>
        ))}
      </select>

      {companyId && (
        <>
          <div className="border rounded-lg p-4 grid sm:grid-cols-4 gap-3">
            {(['region_code', 'base_amount', 'per_kg_amount', 'eta_days_min', 'eta_days_max', 'max_weight_g'] as const).map(
              (k) => (
                <label key={k} className="text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <input
                    value={(form as any)[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="border rounded px-2 py-1 w-full mt-1"
                  />
                </label>
              ),
            )}
            <label className="text-sm">
              <span className="text-muted-foreground">modality</span>
              <select
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value as any })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="bg-primary text-primary-foreground rounded px-4 py-2 col-span-full"
            >
              Cadastrar frete
            </button>
          </div>

          <table className="w-full text-sm border rounded">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Região</th>
                <th className="text-left p-2">Modalidade</th>
                <th className="text-right p-2">Base</th>
                <th className="text-right p-2">R$/kg</th>
                <th className="text-center p-2">ETA</th>
                <th className="text-center p-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {(rates.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.region_code}</td>
                  <td className="p-2">{r.modality}</td>
                  <td className="p-2 text-right">{Number(r.base_amount).toFixed(2)}</td>
                  <td className="p-2 text-right">{Number(r.per_kg_amount).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    {r.eta_days_min}-{r.eta_days_max}d
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => toggle.mutate(r)} className="underline">
                      {r.is_active ? 'sim' : 'não'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
