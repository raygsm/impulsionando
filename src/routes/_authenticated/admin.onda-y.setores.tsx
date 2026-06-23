import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { upsertSectorMember } from '@/lib/sector-members.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/onda-y/setores')({
  component: SetoresAdmin,
});

function SetoresAdmin() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertSectorMember);
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState({
    sectorId: '',
    userId: '',
    roleInSector: 'member' as 'lead' | 'member' | 'viewer',
    inapp: true,
    email: false,
    whatsapp: false,
  });

  const companies = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => (await supabase.from('companies').select('id,name').order('name')).data ?? [],
  });
  const sectors = useQuery({
    queryKey: ['sectors', companyId],
    enabled: !!companyId,
    queryFn: async () =>
      (await supabase.from('sectors').select('id,code,name').eq('company_id', companyId).order('name')).data ?? [],
  });
  const members = useQuery({
    queryKey: ['sector-members', companyId],
    enabled: !!companyId,
    queryFn: async () =>
      (
        await supabase
          .from('sector_members')
          .select('*, sectors(code,name)')
          .eq('company_id', companyId)
      ).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const channels = [
        form.inapp && 'inapp',
        form.email && 'email',
        form.whatsapp && 'whatsapp',
      ].filter(Boolean) as ('inapp' | 'email' | 'whatsapp')[];
      return upsert({
        data: {
          companyId,
          sectorId: form.sectorId,
          userId: form.userId,
          roleInSector: form.roleInSector,
          notifyChannels: channels.length ? channels : ['inapp'],
          isActive: true,
        },
      });
    },
    onSuccess: () => {
      toast.success('Membro vinculado ao setor');
      qc.invalidateQueries({ queryKey: ['sector-members', companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Setores & Membros</h1>
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
          <div className="border rounded-lg p-4 grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Setor</span>
              <select
                value={form.sectorId}
                onChange={(e) => setForm({ ...form, sectorId: e.target.value })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                <option value="">Selecione…</option>
                {(sectors.data ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">User ID (UUID)</span>
              <input
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="border rounded px-2 py-1 w-full mt-1"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Papel</span>
              <select
                value={form.roleInSector}
                onChange={(e) => setForm({ ...form, roleInSector: e.target.value as any })}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                <option value="lead">lead</option>
                <option value="member">member</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
            <div className="text-sm flex items-center gap-3 mt-5">
              {(['inapp', 'email', 'whatsapp'] as const).map((c) => (
                <label key={c} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={(form as any)[c]}
                    onChange={(e) => setForm({ ...form, [c]: e.target.checked })}
                  />
                  {c}
                </label>
              ))}
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={!form.sectorId || !form.userId || save.isPending}
              className="bg-primary text-primary-foreground rounded px-4 py-2 sm:col-span-2"
            >
              Vincular ao setor
            </button>
          </div>

          <table className="w-full text-sm border rounded">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Setor</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Papel</th>
                <th className="text-left p-2">Canais</th>
                <th className="text-center p-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {(members.data ?? []).map((m: any) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.sectors?.name ?? '-'}</td>
                  <td className="p-2 font-mono text-xs">{m.user_id.slice(0, 8)}…</td>
                  <td className="p-2">{m.role_in_sector}</td>
                  <td className="p-2">{(m.notify_channels ?? []).join(', ')}</td>
                  <td className="p-2 text-center">{m.is_active ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
