import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  listStatusSubscribers,
  listStatusDispatchLog,
  listStatusServiceBreakdown,
  forceUnsubscribeStatusSubscriber,
  resendStatusConfirmation,
  broadcastStatusAnnouncement,
} from "@/lib/status-subscribers.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/status-subscribers")({
  component: AdminStatusSubscribers,
});

type StatusFilter = "all" | "confirmed" | "pending" | "unsubscribed" | "bounced";

function AdminStatusSubscribers() {
  const list = useServerFn(listStatusSubscribers);
  const logFn = useServerFn(listStatusDispatchLog);
  const breakdownFn = useServerFn(listStatusServiceBreakdown);
  const unsubFn = useServerFn(forceUnsubscribeStatusSubscriber);
  const resendFn = useServerFn(resendStatusConfirmation);
  const broadcastFn = useServerFn(broadcastStatusAnnouncement);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-status-subs", statusFilter, search],
    queryFn: () =>
      list({ data: { status: statusFilter, search, limit: 200 } }),
  });

  const { data: logData, refetch: refetchLog } = useQuery({
    queryKey: ["admin-status-dispatch", selectedId],
    queryFn: () =>
      logFn({ data: { subscriber_id: selectedId ?? undefined, limit: 100 } }),
  });

  const { data: breakdown } = useQuery({
    queryKey: ["admin-status-breakdown"],
    queryFn: () => breakdownFn(),
  });

  const unsubMut = useMutation({
    mutationFn: (id: string) => unsubFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Inscrição cancelada");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => resendFn({ data: { id } }),
    onSuccess: () => toast.success("Confirmação reenviada"),
    onError: (e: any) => toast.error(e.message),
  });

  const [bSubject, setBSubject] = useState("");
  const [bBody, setBBody] = useState("");
  const [bTag, setBTag] = useState("manual_broadcast");
  const broadcastMut = useMutation({
    mutationFn: () =>
      broadcastFn({ data: { subject: bSubject, body: bBody, tag: bTag } }),
    onSuccess: (r) => {
      toast.success(`Enfileirado: ${r.enqueued} • Dedup: ${r.skipped}`);
      setBSubject("");
      setBBody("");
      refetchLog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const counts = data?.counts;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inscritos do Status</h1>
        <p className="text-muted-foreground">
          Gestão de inscrições por email da página pública /status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: counts?.total ?? 0 },
          { label: "Confirmados", value: counts?.confirmed ?? 0 },
          { label: "Pendentes", value: counts?.pending ?? 0 },
          { label: "Cancelados", value: counts?.unsubscribed ?? 0 },
          { label: "Bounced", value: counts?.bounced ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>Assunto</Label>
              <Input
                value={bSubject}
                onChange={(e) => setBSubject(e.target.value)}
                placeholder="Aviso programado: manutenção 23/06"
              />
            </div>
            <div>
              <Label>Tag</Label>
              <Input value={bTag} onChange={(e) => setBTag(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Corpo (texto)</Label>
            <Textarea
              rows={6}
              value={bBody}
              onChange={(e) => setBBody(e.target.value)}
              placeholder="Mensagem que será enviada para todos os inscritos confirmados."
            />
          </div>
          <Button
            onClick={() => broadcastMut.mutate()}
            disabled={
              broadcastMut.isPending || bSubject.length < 3 || bBody.length < 10
            }
          >
            {broadcastMut.isPending ? "Enviando..." : "Enfileirar broadcast"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Dedupe por <code>tag + minuto</code>: reenviar o mesmo broadcast no
            mesmo minuto não duplica destinatários.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inscritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-48">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="unsubscribed">Cancelados</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-64">
              <Label>Buscar email</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="parte@email"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Atualizar
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nenhum inscrito encontrado.</p>
          ) : (
            <div className="border rounded-md divide-y">
              {(data?.items ?? []).map((s: any) => {
                const state = s.bounced_at
                  ? { label: "Bounced", variant: "destructive" as const }
                  : s.unsubscribed_at
                    ? { label: "Cancelado", variant: "secondary" as const }
                    : s.confirmed_at
                      ? { label: "Confirmado", variant: "default" as const }
                      : { label: "Pendente", variant: "outline" as const };
                return (
                  <div
                    key={s.id}
                    className={`p-3 flex flex-wrap items-center gap-3 ${selectedId === s.id ? "bg-accent" : ""}`}
                  >
                    <div className="flex-1 min-w-64">
                      <div className="font-medium">{s.email}</div>
                      <div className="text-xs text-muted-foreground">
                        criado {new Date(s.created_at).toLocaleString()}
                        {s.last_notified_at
                          ? ` • último envio ${new Date(s.last_notified_at).toLocaleString()}`
                          : ""}
                        {s.source ? ` • origem ${s.source}` : ""}
                      </div>
                    </div>
                    <Badge variant={state.variant}>{state.label}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedId(s.id)}
                    >
                      Histórico
                    </Button>
                    {!s.confirmed_at && !s.unsubscribed_at && !s.bounced_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendMut.mutate(s.id)}
                        disabled={resendMut.isPending}
                      >
                        Reenviar
                      </Button>
                    )}
                    {!s.unsubscribed_at && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Cancelar inscrição de ${s.email}?`))
                            unsubMut.mutate(s.id);
                        }}
                        disabled={unsubMut.isPending}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Dispatch log{" "}
            {selectedId ? (
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedId(null)}
              >
                limpar filtro
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(logData?.items ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nenhum envio registrado.</p>
          ) : (
            <div className="border rounded-md divide-y text-sm">
              {(logData?.items ?? []).map((l: any) => (
                <div key={l.id} className="p-2 flex flex-wrap gap-3">
                  <span className="text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                  <Badge variant="outline">{l.event_kind}</Badge>
                  <span className="font-mono text-xs truncate flex-1">
                    {l.reference_key}
                  </span>
                  {l.error ? (
                    <Badge variant="destructive">erro</Badge>
                  ) : l.delivered_at ? (
                    <Badge>entregue</Badge>
                  ) : (
                    <Badge variant="secondary">enfileirado</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
