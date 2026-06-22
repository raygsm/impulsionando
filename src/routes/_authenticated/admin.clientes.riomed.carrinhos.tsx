import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAbandonedCarts } from "@/lib/riomed.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/carrinhos")({
  head: () => ({ meta: [{ title: "RioMed — Carrinhos Abandonados · Impulsionando" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='carts' title='Carrinhos RioMed'><RioMedCarts /></TenantModuleShell>),
});

function RioMedCarts() {
  const fetchCarts = useServerFn(listAbandonedCarts);
  const { data, isLoading } = useQuery({ queryKey: ["riomed", "carts"], queryFn: () => fetchCarts() });

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  const stats = data?.stats ?? { pending: 0, recovered: 0, total_value: 0 };
  const carts = data?.carts ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="border-b pb-3">
        <h1 className="text-2xl font-bold">RioMed · Carrinhos Abandonados</h1>
        <p className="text-sm text-muted-foreground">Recuperação automática via jornadas do Core.</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Pendentes" value={String(stats.pending)} />
        <Stat label="Recuperados" value={String(stats.recovered)} />
        <Stat label="Valor total" value={`BOB ${stats.total_value.toFixed(2)}`} />
      </section>

      <section>
        <h2 className="font-semibold mb-2">Últimos carrinhos</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Cliente</th><th className="p-2">Contato</th><th className="p-2">Valor</th><th className="p-2">Abandono</th><th className="p-2">Tentativas</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {carts.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.customer_name ?? "—"}</td>
                  <td className="p-2 text-xs">{c.customer_email ?? c.customer_phone ?? "—"}</td>
                  <td className="p-2">BOB {Number(c.cart_value).toFixed(2)}</td>
                  <td className="p-2 text-xs">{new Date(c.abandoned_at).toLocaleString()}</td>
                  <td className="p-2">{c.recovery_attempts}</td>
                  <td className="p-2">{c.recovery_status}</td>
                </tr>
              ))}
              {!carts.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum carrinho abandonado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border rounded p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-bold">{value}</div></div>;
}
