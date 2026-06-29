import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Archive, History, PauseCircle, PlayCircle, RotateCcw, Search } from "lucide-react";
import {
  archiveTenant, lifecycleSummary, listLifecycleEvents, listLifecycleTenants,
  reactivateTenant, restoreTenant, suspendTenant, type LifecycleStatus,
} from "@/lib/tenant-lifecycle.functions";

type StatusFilter = "all" | "active" | "suspended" | "archived";

export const Route = createFileRoute("/_authenticated/admin/lifecycle")({
  head: () => ({ meta: [{ title: "Lifecycle de Tenants — Impulsionando" }] }),
  component: AdminLifecyclePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card className="p-4 text-sm text-destructive">{String(error?.message ?? error)}</Card>
        <Button className="mt-3" size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

type Action = "suspend" | "reactivate" | "archive" | "restore";

function AdminLifecyclePage() {
  const fnList = useServerFn(listLifecycleTenants);
  const fnSummary = useServerFn(lifecycleSummary);
  const fnSuspend = useServerFn(suspendTenant);
  const fnReact = useServerFn(reactivateTenant);
  const fnArchive = useServerFn(archiveTenant);
  const fnRestore = useServerFn(restoreTenant);
  const fnEvents = useServerFn(listLifecycleEvents);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; action: Action } | null>(null);
  const [reason, setReason] = useState("");
  const [eventsFor, setEventsFor] = useState<{ id: string; name: string } | null>(null);

  const summaryQ = useQuery({ queryKey: ["lifecycle-summary"], queryFn: () => fnSummary() });
  const listQ = useQuery({
    queryKey: ["lifecycle-list", status, search],
    queryFn: () => fnList({ data: { status, query: search } }),
  });
  const eventsQ = useQuery({
    queryKey: ["lifecycle-events", eventsFor?.id],
    queryFn: () => fnEvents({ data: { companyId: eventsFor!.id, limit: 40 } }),
    enabled: !!eventsFor,
  });

  function runAction(action: Action, companyId: string) {
    const fn = action === "suspend" ? fnSuspend : action === "reactivate" ? fnReact : action === "archive" ? fnArchive : fnRestore;
    return fn({ data: { companyId, reason: reason.trim() || null } });
  }

  const mut = useMutation({
    mutationFn: () => runAction(pending!.action, pending!.id),
    onSuccess: () => {
      toast.success("Operação concluída");
      setPending(null);
      setReason("");
      listQ.refetch();
      summaryQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha na operação"),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lifecycle de Tenants"
        description="Provisionamento, suspensão, reativação e arquivamento. Toda ação é auditada em audit_logs."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Ativos" value={summaryQ.data?.active} accent="text-emerald-600" />
        <KpiCard label="Suspensos" value={summaryQ.data?.suspended} accent="text-amber-600" />
        <KpiCard label="Arquivados" value={summaryQ.data?.archived} accent="text-muted-foreground" />
        <KpiCard label="Demos" value={summaryQ.data?.demos} accent="text-sky-600" />
      </div>

      <Card className="p-3 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="suspended">Suspensos</TabsTrigger>
              <TabsTrigger value="archived">Arquivados</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative md:ml-auto md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por nome ou slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQ.isLoading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!listQ.isLoading && (listQ.data ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  {t.public_slug ? (
                    <Link to="/admin/clientes/$slug" params={{ slug: t.public_slug }} className="hover:underline">
                      {t.name}
                    </Link>
                  ) : t.name}
                  {t.is_demo && <Badge variant="outline" className="ml-2 text-[10px]">demo</Badge>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.public_slug ?? "—"}</TableCell>
                <TableCell><StatusBadge lifecycle={t.lifecycle} /></TableCell>
                <TableCell className="text-xs">{t.company_kind ?? t.environment ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Histórico" onClick={() => setEventsFor({ id: t.id, name: t.name })}>
                      <History className="h-4 w-4" />
                    </Button>
                    {t.lifecycle === "active" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setPending({ id: t.id, name: t.name, action: "suspend" })}>
                          <PauseCircle className="h-4 w-4 mr-1" /> Suspender
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPending({ id: t.id, name: t.name, action: "archive" })}>
                          <Archive className="h-4 w-4 mr-1" /> Arquivar
                        </Button>
                      </>
                    )}
                    {t.lifecycle === "suspended" && (
                      <>
                        <Button size="sm" onClick={() => setPending({ id: t.id, name: t.name, action: "reactivate" })}>
                          <PlayCircle className="h-4 w-4 mr-1" /> Reativar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPending({ id: t.id, name: t.name, action: "archive" })}>
                          <Archive className="h-4 w-4 mr-1" /> Arquivar
                        </Button>
                      </>
                    )}
                    {t.lifecycle === "archived" && (
                      <Button size="sm" variant="outline" onClick={() => setPending({ id: t.id, name: t.name, action: "restore" })}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!listQ.isLoading && (listQ.data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhum tenant.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) { setPending(null); setReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionLabel(pending?.action)} — {pending?.name}</AlertDialogTitle>
            <AlertDialogDescription>{actionHint(pending?.action)}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Motivo (opcional, fica registrado em audit_logs)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={mut.isPending} onClick={() => mut.mutate()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!eventsFor} onOpenChange={(o) => { if (!o) setEventsFor(null); }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Histórico — {eventsFor?.name}</AlertDialogTitle>
            <AlertDialogDescription>Últimas 40 ações de lifecycle deste tenant.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[55vh] overflow-y-auto space-y-2">
            {eventsQ.isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {(eventsQ.data ?? []).map((e: any) => (
              <div key={e.id} className="border rounded-md p-2 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{e.action}</Badge>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                {e.user_email && <div className="mt-1">por <span className="font-medium">{e.user_email}</span></div>}
                {e.metadata?.reason && <div className="mt-1 italic">"{e.metadata.reason}"</div>}
              </div>
            ))}
            {!eventsQ.isLoading && (eventsQ.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">Sem eventos.</div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function actionLabel(a?: Action) {
  return a === "suspend" ? "Suspender tenant" : a === "reactivate" ? "Reativar tenant" : a === "archive" ? "Arquivar tenant" : "Restaurar tenant";
}
function actionHint(a?: Action) {
  if (a === "suspend") return "Tenant fica indisponível para login operacional (is_active=false) mas dados preservados.";
  if (a === "reactivate") return "Retorna o tenant ao status ativo.";
  if (a === "archive") return "Move para status=archived. Tenant deixa de aparecer em listagens padrão.";
  return "Restaura tenant arquivado para active.";
}

function StatusBadge({ lifecycle }: { lifecycle: LifecycleStatus }) {
  if (lifecycle === "active") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30" variant="outline">Ativo</Badge>;
  if (lifecycle === "suspended") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30" variant="outline">Suspenso</Badge>;
  return <Badge variant="outline">Arquivado</Badge>;
}

function KpiCard({ label, value, accent }: { label: string; value?: number; accent?: string }) {
  return (
    <Card className="p-3 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${accent ?? ""}`}>{value ?? "—"}</div>
    </Card>
  );
}
