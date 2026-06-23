import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const bySector = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.sector] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Perfis & Permissões RioMed</h1>
        <p className="text-muted-foreground mt-1">
          13 perfis de sistema. Atribuição a usuários: <code>riomed_user_scopes</code> via Setores & Membros.
        </p>
      </header>

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
                <div className="flex flex-wrap gap-1">
                  {t.scopes.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded bg-muted">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
