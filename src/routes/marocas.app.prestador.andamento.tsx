import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { EmptyState, EventPill, Section, StatusBadge } from "@/components/marocas/MarocasUI";
import { MOCK_PRESTADOR_AGENDA, fmtBRL, fmtDateBR } from "@/components/marocas/marocasMockData";
import { Route as RouteIcon, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/andamento")({
  head: () => ({ meta: [{ title: "Em andamento — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AndamentoPage,
});

function AndamentoPage() {
  const rows = MOCK_PRESTADOR_AGENDA.filter((r) => r.status === "em_andamento");
  return (
    <MarocasAppShell
      title="Serviços em andamento"
      description="Ao concluir, confirme para liberar o próximo passo do fluxo (vistoria, check-in, etc.)."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Em andamento" }]}
    >
      <Section title={`${rows.length} em execução`}>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum serviço em andamento" icon={<RouteIcon className="h-5 w-5" />} />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {rows.map((r) => (
              <article key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <EventPill type={r.tipo} />
                  <StatusBadge status={r.status} />
                </div>
                <h3 className="font-semibold">{r.imovelApelido} · {r.bairro}</h3>
                <p className="text-sm text-muted-foreground tabular-nums">{fmtDateBR(r.data)} · {r.hora} · {fmtBRL(r.valor)}</p>
                <button className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Marcar como concluído
                </button>
              </article>
            ))}
          </div>
        )}
      </Section>
    </MarocasAppShell>
  );
}
