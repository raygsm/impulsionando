import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { assignRoleTemplate, revokeRoleTemplate } from '@/lib/riomed-roles.functions';

export const Route = createFileRoute('/_authenticated/admin/clientes/riomed/permissoes')({
  component: RiomedPermissoes,
});

type Template = {
  id: string;
  code: string;
  label: string;
  sector: string;
  scopes: string[];
  description: string | null;
  display_order: number;
};

function useTemplates() {
  return useSuspenseQuery({
    queryKey: ['riomed_role_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riomed_role_templates')
        .select('id, code, label, sector, scopes, description, display_order')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });
}

function RiomedPermissoes() {
  const { data: templates } = useTemplates();
  const assign = useServerFn(assignRoleTemplate);
  const revoke = useServerFn(revokeRoleTemplate);
  const [companyId, setCompanyId] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const bySector = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.sector] ||= []).push(t);
    return acc;
  }, {});

  async function handle(kind: 'assign' | 'revoke', code: string) {
    if (!companyId || !userId) {
      setMsg('Informe Company ID e User ID.');
      return;
    }
    setBusy(code + kind);
    setMsg(null);
    try {
      const fn = kind === 'assign' ? assign : revoke;
      const res = await fn({ data: { companyId, userId, templateCode: code } });
      setMsg(kind === 'assign' ? `Aplicado (${(res as any).granted ?? 0} scopes).` : 'Revogado.');
    } catch (e: any) {
      setMsg(`Erro: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Perfis & Permissões RioMed</h1>
        <p className="text-muted-foreground mt-1">
          13 perfis de sistema. Aplicação grava em <code>riomed_user_scopes</code>.
        </p>
      </header>

      <div className="rounded-lg border bg-card p-4 grid sm:grid-cols-3 gap-3 items-end">
        <label className="text-sm">
          Company ID
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="uuid da empresa RioMed"
            className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm"
          />
        </label>
        <label className="text-sm">
          User ID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="uuid do usuário"
            className="mt-1 w-full px-2 py-1.5 rounded border bg-background text-sm"
          />
        </label>
        {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      </div>

      {Object.entries(bySector).map(([sector, list]) => (
        <section key={sector} className="space-y-3">
          <h2 className="text-lg font-semibold capitalize">{sector}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((t) => (
              <div key={t.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{t.label}</h3>
                  <code className="text-xs text-muted-foreground">{t.code}</code>
                </div>
                {t.description && (
                  <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.scopes.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded bg-muted">{s}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => handle('assign', t.code)}
                    className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    {busy === t.code + 'assign' ? '...' : 'Aplicar'}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => handle('revoke', t.code)}
                    className="text-xs px-2 py-1 rounded border disabled:opacity-50"
                  >
                    {busy === t.code + 'revoke' ? '...' : 'Revogar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
