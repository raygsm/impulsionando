/**
 * /finance/webhook-log — visualização e replay seguro de eventos de
 * webhook (financeiro). Lista a tabela `webhook_event_log` com filtros
 * por origem, status e busca textual, e permite reprocessar eventos
 * de `close-invoice` informando o motivo (auditado).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listWebhookEventLog,
  webhookEventLogSummary,
  replayWebhookEvent,
} from "@/lib/webhook-event-log.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  History,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance/webhook-log")({
  component: WebhookLogPage,
});

function WebhookLogPage() {
  const list = useServerFn(listWebhookEventLog);
  const summary = useServerFn(webhookEventLogSummary);
  const replay = useServerFn(replayWebhookEvent);
  const qc = useQueryClient();

  const [source, setSource] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filters = {
    source: source === "all" ? undefined : source,
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
  };

  const sumQ = useQuery({
    queryKey: ["webhook-log-summary"],
    queryFn: () => summary(),
  });
  const logQ = useQuery({
    queryKey: ["webhook-log", filters],
    queryFn: () => list({ data: { ...filters, limit: 200 } }),
  });

  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  const replayMut = useMutation({
    mutationFn: async (args: { id: string; reason: string }) =>
      replay({ data: args }),
    onSuccess: () => {
      toast.success("Evento reprocessado com sucesso.");
      setSelected(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["webhook-log"] });
      qc.invalidateQueries({ queryKey: ["webhook-log-summary"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao reprocessar"),
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6" /> Log de Webhooks
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e reprocesse eventos de pagamento de forma idempotente.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Últimos 7d</div>
          <div className="text-2xl font-bold">{sumQ.data?.total ?? "—"}</div>
        </Card>
        {(["processed", "duplicate", "error", "replayed"] as const).map((s) => (
          <Card key={s} className="p-3">
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
            <div className="text-2xl font-bold">
              {sumQ.data?.byStatus?.[s] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Origem</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="close-invoice">close-invoice</SelectItem>
                <SelectItem value="infinitepay">infinitepay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="processed">processed</SelectItem>
                <SelectItem value="error">error</SelectItem>
                <SelectItem value="duplicate">duplicate</SelectItem>
                <SelectItem value="replayed">replayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Busca (target_id / event_id)</Label>
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="UUID, hash..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => logQ.refetch()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr>
              <th className="text-left p-2">Quando</th>
              <th className="text-left p-2">Origem</th>
              <th className="text-left p-2">Kind</th>
              <th className="text-left p-2">Target</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Replays</th>
              <th className="text-right p-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {logQ.isLoading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {(logQ.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="p-2 whitespace-nowrap text-xs">
                  {new Date(r.processed_at).toLocaleString("pt-BR")}
                </td>
                <td className="p-2">{r.source}</td>
                <td className="p-2">{r.target_kind ?? "—"}</td>
                <td className="p-2 font-mono text-xs truncate max-w-[200px]">
                  {r.target_id ?? r.event_id}
                </td>
                <td className="p-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-2">{r.replay_count ?? 0}</td>
                <td className="p-2 text-right">
                  {r.source === "close-invoice" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(r)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Reprocessar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!logQ.isLoading && (logQ.data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprocessar evento</DialogTitle>
            <DialogDescription>
              Esta ação reexecuta o RPC de fechamento. É idempotente — se a
              fatura já estiver paga, ela apenas confirma. Informe o motivo
              para auditoria.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-xs space-y-1 bg-muted/40 p-3 rounded">
                <div>
                  <strong>Kind:</strong> {selected.target_kind}
                </div>
                <div>
                  <strong>Invoice:</strong>{" "}
                  <span className="font-mono">{selected.target_id}</span>
                </div>
                <div>
                  <strong>Status atual:</strong> {selected.status}
                </div>
                {selected.error && (
                  <div className="text-red-600">
                    <strong>Erro:</strong> {selected.error}
                  </div>
                )}
                {selected.replay_count > 0 && (
                  <div>
                    <strong>Já reprocessado:</strong> {selected.replay_count}x
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="reason">Motivo do reprocessamento</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: provedor indicou pagamento confirmado fora do webhook..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              disabled={reason.trim().length < 3 || replayMut.isPending}
              onClick={() =>
                replayMut.mutate({ id: selected.id, reason: reason.trim() })
              }
            >
              {replayMut.isPending ? "Reprocessando..." : "Confirmar replay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; icon: any; label: string }> = {
    processed: { variant: "default", icon: CheckCircle2, label: "processed" },
    duplicate: { variant: "secondary", icon: Clock, label: "duplicate" },
    error: { variant: "destructive", icon: AlertCircle, label: "error" },
    replayed: { variant: "outline", icon: RefreshCw, label: "replayed" },
  };
  const cfg = map[status] ?? {
    variant: "outline",
    icon: Clock,
    label: status,
  };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="w-3 h-3" /> {cfg.label}
    </Badge>
  );
}
