import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/clientes/riomed/marketplace')({
  component: RiomedMarketplace,
});

function useSupplier() {
  return useSuspenseQuery({
    queryKey: ['riomed_mp_supplier'],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', 'riomed%')
        .limit(1);
      const company = companies?.[0];
      if (!company) return { company: null, supplier: null, items: [] };
      const { data: suppliers } = await supabase
        .from('mp_suppliers')
        .select('id, display_name, supplier_type, status, regions_served')
        .eq('company_id', company.id)
        .limit(1);
      const supplier = suppliers?.[0] ?? null;
      const { data: items } = supplier
        ? await supabase
            .from('mp_catalog_items')
            .select('id, sku, name, price_cents, unit, active')
            .eq('supplier_id', supplier.id)
            .order('created_at', { ascending: false })
            .limit(50)
        : { data: [] as any[] };
      return { company, supplier, items: items ?? [] };
    },
  });
}

function RiomedMarketplace() {
  const { data } = useSupplier();
  const { company, supplier, items } = data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Marketplace RioMed</h1>
        <p className="text-muted-foreground mt-1">
          Publicação no Marketplace Impulsionando — categoria Médico-hospitalar.
        </p>
      </header>

      {!company && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          Empresa RioMed ainda não provisionada.
        </div>
      )}

      {company && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Fornecedor</div>
              <div className="font-semibold">{supplier?.display_name ?? company.name}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${supplier?.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted'}`}>
              {supplier ? supplier.status : 'não publicado'}
            </span>
          </div>
          {supplier && (
            <div className="text-sm text-muted-foreground">
              Categoria: <code>{supplier.supplier_type}</code>
              {supplier.regions_served?.length ? ` · Regiões: ${supplier.regions_served.join(', ')}` : ''}
            </div>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Itens do catálogo ({items.length})</h2>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhum item publicado ainda. Use o painel de Produtos para sincronizar com o marketplace.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {items.map((it: any) => (
              <div key={it.id} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.sku ? `SKU ${it.sku} · ` : ''}{it.unit}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span>R$ {(it.price_cents / 100).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${it.active ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted'}`}>
                    {it.active ? 'ativo' : 'pausado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
