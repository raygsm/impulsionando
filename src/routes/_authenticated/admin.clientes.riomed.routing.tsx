import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRoutingRules, createRoutingRule } from "@/lib/riomed.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/routing")({
  head: () => ({ meta: [{ title: "RioMed — Roteamento de Leads · Impulsionando" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='routing' title='Roteamento de Leads RioMed'><RioMedRouting /></TenantModuleShell>),
});

function RioMedRouting() {
  const fetchRules = useServerFn(listRoutingRules);
  const createRule = useServerFn(createRoutingRule);
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", priority: 100, assign_strategy: "round_robin" as const, segment: "" });

  const rules = useQuery({ queryKey: ["riomed", "routing"], queryFn: () => fetchRules() });

  const create = useMutation({
    mutationFn: () => createRule({ data: {
      name: form.name, priority: Number(form.priority), assign_strategy: form.assign_strategy,
      conditions: form.segment ? { segment: form.segment } : {},
    } }),
    onSuccess: () => { setForm({ name: "", priority: 100, assign_strategy: "round_robin", segment: "" }); qc.invalidateQueries({ queryKey: ["riomed", "routing"] }); },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-bold">RioMed · Roteamento de Leads</h1>
        <p className="text-sm text-muted-foreground">Regras de distribuição entre os 7 vendedores por segmento e prioridade.</p>
      </header>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Nova regra</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" type="number" placeholder="Prioridade" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Segmento (ex: hospital)" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
          <select className="border rounded px-2 py-1 text-sm" value={form.assign_strategy} onChange={(e) => setForm({ ...form, assign_strategy: e.target.value as any })}>
            <option value="round_robin">Round-robin</option>
            <option value="least_loaded">Menor carga</option>
            <option value="specific">Vendedor específico</option>
          </select>
        </div>
        <button disabled={create.isPending || !form.name} onClick={() => create.mutate()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">
          {create.isPending ? "Salvando…" : "Criar regra"}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Regras ativas ({rules.data?.length ?? 0})</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Prio.</th><th className="p-2">Nome</th><th className="p-2">Estratégia</th><th className="p-2">Condições</th><th className="p-2">Ativa</th></tr></thead>
            <tbody>
              {(rules.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{r.priority}</td><td className="p-2">{r.name}</td>
                  <td className="p-2">{r.assign_strategy}</td>
                  <td className="p-2 text-xs"><code>{JSON.stringify(r.conditions)}</code></td>
                  <td className="p-2">{r.is_active ? "✓" : "—"}</td>
                </tr>
              ))}
              {!rules.data?.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhuma regra configurada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
