import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, StatusBadge, DataTable } from "@/components/marocas/MarocasUI";
import { MOCK_AUTOMACOES, type OperationStatus } from "@/components/marocas/marocasMockData";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/automacoes")({
  head: () => ({ meta: [{ title: "Automações — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AutomacoesPage,
});

const STATUS_MAP: Record<string, OperationStatus> = { ativa: "confirmado", pausada: "pendente", rascunho: "cancelado" };

function AutomacoesPage() {
  return (
    <MarocasAppShell
      title="Automações"
      description="Fluxos N8N que rodam por trás da operação — comunicação com hóspedes, alertas internos e cobrança."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Automações" }]}
      actions={<button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Nova automação</button>}
    >
      <Section title="Fluxos configurados">
        <DataTable
          rows={MOCK_AUTOMACOES}
          columns={[
            { header: "Nome", render: (a) => <span className="inline-flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-amber-500" />{a.nome}</span> },
            { header: "Gatilho", render: (a) => <span className="text-xs">{a.gatilho}</span> },
            { header: "Canal", render: (a) => <span className="text-xs px-2 py-0.5 rounded bg-muted">{a.canal}</span> },
            { header: "Execuções 30d", render: (a) => <span className="tabular-nums">{a.execucoes30d}</span> },
            { header: "Status", render: (a) => <StatusBadge status={STATUS_MAP[a.status]} /> },
          ]}
        />
      </Section>

      <p className="mt-6 text-xs text-muted-foreground max-w-2xl">
        Fluxos N8N pré-configurados: boas-vindas, instruções de check-in, pesquisa pós-estadia, alerta de urgência,
        recuperação de reservas e onboarding de prestador. A ativação real com credenciais (WhatsApp Business, SMTP,
        gateway de pagamento) será feita pelo Codex.
      </p>
    </MarocasAppShell>
  );
}
