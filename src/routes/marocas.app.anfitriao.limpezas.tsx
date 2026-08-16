import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Clock3, Sparkles } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { listMarocasServices } from "@/lib/marocas.functions";
import { listMarocasTurnovers } from "@/lib/marocas-operations.functions";

export const Route = createFileRoute("/marocas/app/anfitriao/limpezas")({
  head: () => ({ meta: [{ title: "Limpezas — Marocas" }, { name: "robots", content: "noindex" }] }),
  loader: async () => {
    const [turnovers, services] = await Promise.all([listMarocasTurnovers(), listMarocasServices()]);
    return { turnovers, services };
  },
  component: LimpezasPage,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatMinutes(value: number | null | undefined) {
  if (value == null || value < 0) return "—";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}min` : `${minutes}min`;
}

function windowLabel(value: string) {
  return ({ critica: "Crítica", apertada: "Apertada", confortavel: "Confortável", impossivel: "Impossível" } as Record<string, string>)[value] ?? value;
}

function serviceStatusLabel(value?: string | null) {
  return ({ agendado: "Agendado", em_andamento: "Em execução", concluido: "Concluído", cancelado: "Cancelado", atrasado: "Atrasado" } as Record<string, string>)[value ?? ""] ?? "Sem serviço";
}

function LimpezasPage() {
  const { turnovers, services } = Route.useLoaderData();
  const cleaningServices = services.filter((row: any) => row.service_type === "limpeza" || row.service_type === "vistoria");
  const pending = cleaningServices.filter((row: any) => row.status === "agendado" || row.status === "atrasado").length;
  const completed = cleaningServices.filter((row: any) => row.status === "concluido").length;
  const critical = turnovers.filter((row: any) => row.window_status === "critica" || row.window_status === "impossivel").length;
  const measuredDurations = cleaningServices
    .filter((row: any) => row.started_at && row.completed_at)
    .map((row: any) => Math.max(0, Math.round((new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()) / 60000)));
  const avgDuration = measuredDurations.length ? Math.round(measuredDurations.reduce((sum: number, value: number) => sum + value, 0) / measuredDurations.length) : null;

  return (
    <MarocasAppShell
      title="Limpezas & giros"
      description="Operação real entre check-out e próximo check-in, com janela calculada, prioridade e serviço vinculado."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Limpezas" }]}
      actions={<Link to="/marocas/app/anfitriao/reservas" className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Cadastrar reserva</Link>}
    >
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Serviços reais" value={cleaningServices.length} icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard label="Pendentes" value={pending} tone={pending > 0 ? "warn" : "default"} />
        <KpiCard label="Concluídos" value={completed} tone="success" />
        <KpiCard label="Duração média" value={avgDuration == null ? "Sem dados" : formatMinutes(avgDuration)} hint={avgDuration == null ? "Calculada somente após serviços concluídos" : `${measuredDurations.length} serviço(s) medido(s)`} />
      </div>

      {critical > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><strong>{critical} giro(s) exigem atenção imediata.</strong><div className="text-muted-foreground">Janelas críticas ou impossíveis precisam de priorização operacional antes do próximo hóspede.</div></div>
        </div>
      )}

      <Section title="Giros entre hospedagens">
        {turnovers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum giro real calculado. Um giro é criado quando existem reservas consecutivas para o mesmo imóvel.
          </div>
        ) : (
          <DataTable
            rows={turnovers}
            columns={[
              { header: "Check-out", render: (row: any) => <span className="whitespace-nowrap text-xs">{formatDate(row.checkout_at)}</span> },
              { header: "Próximo check-in", render: (row: any) => <span className="whitespace-nowrap text-xs">{formatDate(row.next_checkin_at)}</span> },
              { header: "Imóvel", render: (row: any) => row.marocas_apartments?.title ?? row.marocas_apartments?.code ?? "—" },
              { header: "Janela", render: (row: any) => <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatMinutes(row.window_minutes)}</span> },
              { header: "Risco", render: (row: any) => <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${row.window_status === "critica" || row.window_status === "impossivel" ? "border-destructive/30 bg-destructive/5 text-destructive" : row.window_status === "apertada" ? "border-amber-500/30 bg-amber-500/10" : "bg-muted/40"}`}>{windowLabel(row.window_status)}</span> },
              { header: "Equipe", render: (row: any) => row.marocas_services?.marocas_professionals?.full_name ?? <span className="text-muted-foreground">a designar</span> },
              { header: "Serviço", render: (row: any) => <span className="rounded-full border px-2 py-0.5 text-xs">{serviceStatusLabel(row.marocas_services?.status)}</span> },
            ]}
          />
        )}
      </Section>
    </MarocasAppShell>
  );
}
