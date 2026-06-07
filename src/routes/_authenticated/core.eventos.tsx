import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listEventCenter } from "@/lib/governance.functions";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/eventos")({
  head: () => ({ meta: [{ title: "Central de Eventos — Core" }, { name: "robots", content: "noindex" }] }),
  component: EventosPage,
});

function EventosPage() {
  const fetcher = useServerFn(listEventCenter);
  const { data, isLoading } = useQuery({ queryKey: ["event-center"], queryFn: () => fetcher() });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Central de Eventos</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Evento × canal × template × última execução. Fonte: <code>message_templates</code> + <code>message_outbox</code>.
        </p>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Evento</th>
                <th className="text-left p-3">Canal</th>
                <th className="text-right p-3">Templates</th>
                <th className="text-right p-3">Enviadas</th>
                <th className="text-right p-3">Falhas</th>
                <th className="text-left p-3">Última execução</th>
              </tr>
            </thead>
            <tbody>
              {(data?.events ?? []).map((e: any) => (
                <tr key={`${e.event_code}-${e.channel}`} className="border-t">
                  <td className="p-3 font-mono text-xs">{e.event_code}</td>
                  <td className="p-3"><Badge variant="outline">{e.channel}</Badge></td>
                  <td className="p-3 text-right">{e.templates}</td>
                  <td className="p-3 text-right text-emerald-600">{e.totalSent}</td>
                  <td className="p-3 text-right text-destructive">{e.totalFailed}</td>
                  <td className="p-3 text-muted-foreground">
                    {e.lastRun ? new Date(e.lastRun).toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
              {(data?.events ?? []).length === 0 && !isLoading && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum evento registrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
