import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EmptyState, Section } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_HISTORICO, fmtDateBR } from "@/components/marocas/marocasMockData";
import { History, Star } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/historico")({
  head: () => ({ meta: [{ title: "Meu histórico — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: HistoricoPage,
});

function HistoricoPage() {
  return (
    <MarocasAppShell
      title="Meu histórico"
      description="Todas as suas estadias com a Marocas."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Histórico" }]}
    >
      <Section title={`${MOCK_HOSPEDE_HISTORICO.length} estadias anteriores`}>
        {MOCK_HOSPEDE_HISTORICO.length === 0 ? (
          <EmptyState title="Você ainda não teve estadias" icon={<History className="h-5 w-5" />} />
        ) : (
          <DataTable
            rows={MOCK_HOSPEDE_HISTORICO}
            columns={[
              { header: "Código", render: (h) => <span className="font-mono text-xs">{h.codigo}</span> },
              { header: "Imóvel", render: (h) => h.imovel },
              { header: "Check-in", render: (h) => fmtDateBR(h.checkin) },
              { header: "Check-out", render: (h) => fmtDateBR(h.checkout) },
              { header: "Nota dada", render: (h) => <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />{h.nota}</span> },
            ]}
          />
        )}
      </Section>
    </MarocasAppShell>
  );
}
