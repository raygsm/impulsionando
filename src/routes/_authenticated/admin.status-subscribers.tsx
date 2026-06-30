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
  setStatusSubscriberSeverity,
  setStatusSubscriberCategories,
  listStatusCategories,
  sendStatusTestEmail,
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
  const severityFn = useServerFn(setStatusSubscriberSeverity);
  const categoriesFn = useServerFn(setStatusSubscriberCategories);
  const listCatsFn = useServerFn(listStatusCategories);
  const testEmailFn = useServerFn(sendStatusTestEmail);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<
    "any" | "info" | "minor" | "major" | "critical"
  >("any");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-status-subs", statusFilter, search, categoryFilter, severityFilter],
    queryFn: () =>
      list({
        data: {
          status: statusFilter,
          search,
          category: categoryFilter,
          min_severity: severityFilter,
          limit: 200,
        },
      }),
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

  const severityMut = useMutation({
    mutationFn: (vars: { id: string; min_severity: "info" | "minor" | "major" | "critical" }) =>
      severityFn({ data: vars }),
    onSuccess: () => {
      toast.success("Severidade mínima atualizada");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const categoriesMut = useMutation({
    mutationFn: (vars: { id: string; categories: string[] }) =>
      categoriesFn({ data: vars }),
    onSuccess: () => {
      toast.success("Categorias atualizadas");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: catsData } = useQuery({
    queryKey: ["admin-status-cats"],
    queryFn: () => listCatsFn(),
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

  const [testTo, setTestTo] = useState("");
  const [testKind, setTestKind] = useState<
    "incident_opened" | "incident_resolved" | "maintenance_scheduled" | "broadcast"
  >("incident_opened");
  const [testSeverity, setTestSeverity] = useState<
    "info" | "minor" | "major" | "critical"
  >("minor");
  const testEmailMut = useMutation({
    mutationFn: () =>
      testEmailFn({
        data: { to: testTo, kind: testKind, severity: testSeverity },
      }),
    onSuccess: (r) => {
      toast.success(`Email de teste enfileirado para ${r.to}`);
      setTestTo("");
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
          <CardTitle>Cobertura por serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Inscritos ativos: <strong>{breakdown?.activeSubscribers ?? 0}</strong>
            {" • "}Sem filtro (recebem tudo): <strong>{breakdown?.subsAllServices ?? 0}</strong>
            {" • "}Com filtro: <strong>{breakdown?.subsWithFilter ?? 0}</strong>
          </p>
          {(breakdown?.breakdown ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum serviço público configurado.</p>
          ) : (
            <div className="border rounded-md divide-y text-sm">
              {(breakdown?.breakdown ?? []).map((b: any) => (
                <div key={b.slug} className="p-2 flex flex-wrap items-center gap-3">
                  <span className="font-medium flex-1 min-w-48">{b.label}</span>
                  <code className="text-xs text-muted-foreground">{b.slug}</code>
                  {!b.show_on_public && <Badge variant="secondary">oculto</Badge>}
                  <span className="text-xs text-muted-foreground">
                    explícito: <strong>{b.explicit_subscribers}</strong>
                  </span>
                  <Badge>{b.effective_subscribers} efetivos</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


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
          <CardTitle>Email de teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Envia um email simulado para um endereço específico sem afetar
            inscritos reais. Útil para validar templates e roteamento.
          </p>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Destinatário</Label>
              <Input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={testKind} onValueChange={(v) => setTestKind(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident_opened">Incidente aberto</SelectItem>
                  <SelectItem value="incident_resolved">Incidente resolvido</SelectItem>
                  <SelectItem value="maintenance_scheduled">Manutenção programada</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidade</Label>
              <Select
                value={testSeverity}
                onValueChange={(v) => setTestSeverity(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => testEmailMut.mutate()}
            disabled={testEmailMut.isPending || !/^.+@.+\..+$/.test(testTo)}
          >
            {testEmailMut.isPending ? "Enviando..." : "Enviar email de teste"}
          </Button>
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
            <div className="w-48">
              <Label>Categoria</Label>
              <Select
                value={categoryFilter || "__all__"}
                onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {(catsData?.categories ?? []).map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Severidade mín.</Label>
              <Select
                value={severityFilter}
                onValueChange={(v) => setSeverityFilter(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="info">Tudo (info)</SelectItem>
                  <SelectItem value="minor">Minor+</SelectItem>
                  <SelectItem value="major">Major+</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const rows = (data?.items ?? []) as any[];
                if (rows.length === 0) {
                  toast.info("Nenhum inscrito para exportar");
                  return;
                }
                const header = [
                  "email",
                  "status",
                  "source",
                  "min_severity",
                  "categories",
                  "services",
                  "created_at",
                  "confirmed_at",
                  "last_notified_at",
                ];
                const esc = (v: unknown) => {
                  const s = v == null ? "" : String(v);
                  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                };
                const lines = [header.join(",")];
                for (const r of rows) {
                  const status = r.bounced_at
                    ? "bounced"
                    : r.unsubscribed_at
                      ? "unsubscribed"
                      : r.confirmed_at
                        ? "confirmed"
                        : "pending";
                  lines.push(
                    [
                      r.email,
                      status,
                      r.source ?? "",
                      r.min_severity ?? "info",
                      (r.categories ?? []).join("|"),
                      (r.services ?? []).join("|"),
                      r.created_at ?? "",
                      r.confirmed_at ?? "",
                      r.last_notified_at ?? "",
                    ]
                      .map(esc)
                      .join(","),
                  );
                }
                const blob = new Blob([lines.join("\n")], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `status-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar CSV
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
                      {(s.services?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.services.map((slug: string) => (
                            <Badge key={slug} variant="outline" className="text-[10px]">
                              {slug}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground mt-1">
                          recebe todos os serviços
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Categorias:</span>
                        <Input
                          defaultValue={(s.categories ?? []).join(", ")}
                          placeholder={
                            (catsData?.categories ?? []).length > 0
                              ? `vazio = todas • disponíveis: ${(catsData?.categories ?? []).join(", ")}`
                              : "vazio = todas as categorias"
                          }
                          className="h-7 text-xs flex-1 min-w-48"
                          onBlur={(e) => {
                            const next = e.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean);
                            const prev = (s.categories ?? []) as string[];
                            if (
                              next.length === prev.length &&
                              next.every((v, i) => v === prev[i])
                            )
                              return;
                            categoriesMut.mutate({ id: s.id, categories: next });
                          }}
                        />
                      </div>
                    </div>

                    <Badge variant={state.variant}>{state.label}</Badge>
                    <Select
                      value={(s.min_severity ?? "info") as string}
                      onValueChange={(v) =>
                        severityMut.mutate({ id: s.id, min_severity: v as any })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Tudo (info)</SelectItem>
                        <SelectItem value="minor">Minor+</SelectItem>
                        <SelectItem value="major">Major+</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
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
