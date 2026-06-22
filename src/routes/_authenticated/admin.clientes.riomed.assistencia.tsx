import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listServiceOrders, createServiceOrder } from "@/lib/riomed.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/assistencia")({
  head: () => ({ meta: [{ title: "RioMed — Assistência Técnica · Impulsionando" }] }),
  component: RioMedAT,
});

function RioMedAT() {
  const fetchOrders = useServerFn(listServiceOrders);
  const createOrder = useServerFn(createServiceOrder);
  const qc = useQueryClient();
  const [form, setForm] = useState({ order_number: "", customer_name: "", equipment_description: "", service_type: "corrective" as const, priority: "normal" as const });

  const orders = useQuery({ queryKey: ["riomed", "service-orders"], queryFn: () => fetchOrders() });

  const create = useMutation({
    mutationFn: () => createOrder({ data: form }),
    onSuccess: () => { setForm({ order_number: "", customer_name: "", equipment_description: "", service_type: "corrective", priority: "normal" }); qc.invalidateQueries({ queryKey: ["riomed", "service-orders"] }); },
  });

  const stats = {
    open: orders.data?.filter((o: any) => o.status === "open").length ?? 0,
    in_progress: orders.data?.filter((o: any) => o.status === "in_progress").length ?? 0,
    closed: orders.data?.filter((o: any) => o.status === "closed").length ?? 0,
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-bold">RioMed · Assistência Técnica</h1>
        <p className="text-sm text-muted-foreground">Ordens de Serviço, técnicos e SLA.</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Abertas" value={stats.open} />
        <Stat label="Em andamento" value={stats.in_progress} />
        <Stat label="Fechadas" value={stats.closed} />
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Nova OS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <input className="border rounded px-2 py-1 text-sm" placeholder="Nº OS" value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Cliente" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Equipamento" value={form.equipment_description} onChange={(e) => setForm({ ...form, equipment_description: e.target.value })} />
          <select className="border rounded px-2 py-1 text-sm" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value as any })}>
            <option value="corrective">Corretiva</option>
            <option value="preventive">Preventiva</option>
            <option value="installation">Instalação</option>
            <option value="calibration">Calibração</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <button disabled={create.isPending || !form.order_number || !form.customer_name || !form.equipment_description} onClick={() => create.mutate()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">
          {create.isPending ? "Abrindo…" : "Abrir OS"}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Ordens de Serviço</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Nº</th><th className="p-2">Cliente</th><th className="p-2">Equipamento</th><th className="p-2">Tipo</th><th className="p-2">Prio.</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {(orders.data ?? []).map((o: any) => (
                <tr key={o.id} className="border-t"><td className="p-2 font-mono">{o.order_number}</td><td className="p-2">{o.customer_name}</td><td className="p-2">{o.equipment_description}</td><td className="p-2">{o.service_type}</td><td className="p-2">{o.priority}</td><td className="p-2">{o.status}</td></tr>
              ))}
              {!orders.data?.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhuma OS.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="border rounded p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold">{value}</div></div>;
}
