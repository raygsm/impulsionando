import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRentalAssets, createRentalAsset, listRentalContracts } from "@/lib/riomed.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/locacao")({
  head: () => ({ meta: [{ title: "RioMed — Locação · Impulsionando" }] }),
  component: RioMedLocacao,
});

function RioMedLocacao() {
  const fetchAssets = useServerFn(listRentalAssets);
  const fetchContracts = useServerFn(listRentalContracts);
  const createAsset = useServerFn(createRentalAsset);
  const qc = useQueryClient();
  const [form, setForm] = useState({ asset_code: "", name: "", category: "", daily_rate: 0 });

  const assets = useQuery({ queryKey: ["riomed", "assets"], queryFn: () => fetchAssets() });
  const contracts = useQuery({ queryKey: ["riomed", "contracts"], queryFn: () => fetchContracts() });

  const create = useMutation({
    mutationFn: () => createAsset({ data: { ...form, daily_rate: Number(form.daily_rate) || undefined } }),
    onSuccess: () => { setForm({ asset_code: "", name: "", category: "", daily_rate: 0 }); qc.invalidateQueries({ queryKey: ["riomed", "assets"] }); },
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-bold">RioMed · Locação</h1>
        <p className="text-sm text-muted-foreground">Equipamentos hospitalares e contratos de aluguel.</p>
      </header>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Novo ativo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1 text-sm" placeholder="Código" value={form.asset_code} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" type="number" placeholder="Diária (BOB)" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: Number(e.target.value) })} />
        </div>
        <button disabled={create.isPending || !form.asset_code || !form.name} onClick={() => create.mutate()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">
          {create.isPending ? "Salvando…" : "Cadastrar ativo"}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Ativos ({assets.data?.length ?? 0})</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Código</th><th className="p-2">Nome</th><th className="p-2">Categoria</th><th className="p-2">Diária</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {(assets.data ?? []).map((a: any) => (
                <tr key={a.id} className="border-t"><td className="p-2 font-mono">{a.asset_code}</td><td className="p-2">{a.name}</td><td className="p-2">{a.category ?? "—"}</td><td className="p-2">{a.daily_rate ?? "—"}</td><td className="p-2">{a.status}</td></tr>
              ))}
              {!assets.data?.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum ativo cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Contratos ({contracts.data?.length ?? 0})</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Nº</th><th className="p-2">Cliente</th><th className="p-2">Início</th><th className="p-2">Fim</th><th className="p-2">Total</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {(contracts.data ?? []).map((c: any) => (
                <tr key={c.id} className="border-t"><td className="p-2 font-mono">{c.contract_number}</td><td className="p-2">{c.customer_name}</td><td className="p-2">{c.start_date}</td><td className="p-2">{c.end_date ?? "—"}</td><td className="p-2">{c.total_amount}</td><td className="p-2">{c.status}</td></tr>
              ))}
              {!contracts.data?.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum contrato.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
