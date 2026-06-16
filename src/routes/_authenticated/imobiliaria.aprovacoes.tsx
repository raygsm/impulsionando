import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listApprovalQueue,
  approveProperty,
  rejectProperty,
  requestPropertyChanges,
  listPropertyReviewHistory,
  exportPropertyApprovalCsv,
  exportApprovalQueueCsv,
  canApproveProperties,
} from "@/lib/realestate.functions";

import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check, X, AlertCircle, History, Download, Printer, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovação de Imóveis — Imobiliária" }] }),
  component: Page,
});

type Status = "pending" | "changes_requested" | "rejected" | "approved";

type QueueItem = {
  id: string;
  reference_code: string | null;
  title: string;
  operation: string;
  property_type: string;
  sale_price: number | null;
  rent_price: number | null;
  neighborhood: string | null;
  city: string | null;
  approval_status: Status;
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  submitted_by: string | null;
  review_notes: string | null;
  photos: string[] | null;
};

type Review = {
  id: string;
  action: "submitted" | "approved" | "rejected" | "changes_requested";
  actor_id: string | null;
  notes: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<Review["action"], string> = {
  submitted: "Enviado para revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  changes_requested: "Ajustes solicitados",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Aguardando",
  changes_requested: "Ajustes",
  rejected: "Rejeitado",
  approved: "Aprovado",
};

function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const fetchQueue = useServerFn(listApprovalQueue);
  const fetchApprove = useServerFn(approveProperty);
  const fetchReject = useServerFn(rejectProperty);
  const fetchChanges = useServerFn(requestPropertyChanges);
  const fetchExport = useServerFn(exportPropertyApprovalCsv);
  const fetchCanApprove = useServerFn(canApproveProperties);
  const fetchBatchExport = useServerFn(exportApprovalQueueCsv);


  const [status, setStatus] = useState<Status[]>(["pending"]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reviewerId, setReviewerId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [historyFor, setHistoryFor] = useState<QueueItem | null>(null);
  const [actionFor, setActionFor] = useState<{ item: QueueItem; mode: "reject" | "changes" } | null>(null);
  const [notes, setNotes] = useState("");

  const { data: canApproveResp } = useQuery({
    queryKey: ["realestate-can-approve", companyId],
    enabled: !!companyId,
    queryFn: () => fetchCanApprove({ data: { companyId } }),
  });
  const canApprove = !!canApproveResp?.canApprove;

  const queryArgs = useMemo(() => ({
    companyId: companyId!,
    status,
    search: search || null,
    reviewerId: reviewerId || null,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
    dateTo: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : null,
    page,
    pageSize,
  }), [companyId, status, search, reviewerId, dateFrom, dateTo, page, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["realestate-approvals", queryArgs],
    enabled: !!companyId,
    queryFn: () => fetchQueue({ data: queryArgs }),
  });
  const items = (data?.items ?? []) as QueueItem[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const directory = (data?.directory ?? []) as Array<{ id: string; name: string }>;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["realestate-approvals"] });
    qc.invalidateQueries({ queryKey: ["realestate-props", companyId] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => fetchApprove({ data: { propertyId: id, notes: null } }),
    onSuccess: () => { toast.success("Imóvel aprovado"); invalidate(); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });
  const submitAction = useMutation({
    mutationFn: ({ id, mode, n }: { id: string; mode: "reject" | "changes"; n: string }) =>
      mode === "reject"
        ? fetchReject({ data: { propertyId: id, notes: n } })
        : fetchChanges({ data: { propertyId: id, notes: n } }),
    onSuccess: () => {
      toast.success("Revisão registrada");
      invalidate();
      setActionFor(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const exportCsv = useMutation({
    mutationFn: (propertyId: string) => fetchExport({ data: { propertyId } }),
    onSuccess: (resp) => downloadFile(resp.filename, resp.csv),
    onError: (e: any) => toast.error(e.message ?? "Erro ao exportar"),
  });

  const toggleStatus = (s: Status) => {
    setPage(1);
    setStatus((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const applySearch = () => { setPage(1); setSearch(searchInput.trim()); };
  const clearFilters = () => {
    setStatus(["pending"]); setSearch(""); setSearchInput("");
    setReviewerId(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aprovação de imóveis"
        description={canApprove
          ? "Revise imóveis enviados pelos corretores antes de publicar."
          : "Você não tem permissão de aprovação — apenas visualização da fila."}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/imobiliaria/imoveis">Voltar à carteira</Link>
          </Button>
        }
      />

      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["pending", "changes_requested", "rejected", "approved"] as Status[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status.includes(s) ? "default" : "outline"}
                  onClick={() => toggleStatus(s)}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <Label className="text-xs">Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Título, referência, bairro ou cidade"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                  />
                  <Button size="icon" variant="outline" onClick={applySearch}><Search className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Revisor</Label>
                <Select value={reviewerId || "all"} onValueChange={(v) => { setPage(1); setReviewerId(v === "all" ? "" : v); }}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {directory.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{isFetching ? "Atualizando…" : `${total} resultado(s)`}</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
            </div>
          </Card>

          {isLoading ? (
            <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
          ) : items.length === 0 ? (
            <EmptyState title="Nada por aqui" description="Nenhum imóvel com os filtros atuais." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((p) => {
                const reviewerName = directory.find((u) => u.id === p.reviewed_by)?.name;
                const submitterName = directory.find((u) => u.id === p.submitted_by)?.name;
                const variant: any = p.approval_status === "approved" ? "default"
                  : p.approval_status === "rejected" ? "destructive"
                  : p.approval_status === "pending" ? "secondary" : "outline";
                return (
                  <Card key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.reference_code ? `Ref ${p.reference_code} · ` : ""}{p.neighborhood ?? "-"}, {p.city ?? "-"}
                        </div>
                      </div>
                      <Badge variant={variant}>{STATUS_LABEL[p.approval_status]}</Badge>
                    </div>

                    {p.photos && p.photos.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto">
                        {p.photos.slice(0, 4).map((u, i) => (
                          <img key={i} src={u} alt="" className="h-20 w-28 object-cover rounded" loading="lazy" />
                        ))}
                      </div>
                    )}

                    <div className="text-sm flex flex-wrap gap-2">
                      <Badge variant="outline">{p.operation}</Badge>
                      <Badge variant="outline">{p.property_type}</Badge>
                    </div>
                    <div className="text-sm font-medium">
                      {p.operation === "locacao"
                        ? p.rent_price ? `R$ ${Number(p.rent_price).toLocaleString("pt-BR")}/mês` : "—"
                        : p.sale_price ? `R$ ${Number(p.sale_price).toLocaleString("pt-BR")}` : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>Enviado {p.submitted_for_review_at ? new Date(p.submitted_for_review_at).toLocaleString("pt-BR") : "—"}{submitterName ? ` · por ${submitterName}` : ""}</div>
                      {p.reviewed_at && (
                        <div>Revisado {new Date(p.reviewed_at).toLocaleString("pt-BR")}{reviewerName ? ` · por ${reviewerName}` : ""}</div>
                      )}
                    </div>
                    {p.review_notes && (
                      <div className="text-xs rounded bg-muted p-2"><span className="font-medium">Nota:</span> {p.review_notes}</div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {canApprove && p.approval_status !== "approved" && (
                        <>
                          <Button size="sm" onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>
                            <Check className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setActionFor({ item: p, mode: "changes" }); setNotes(""); }}>
                            <AlertCircle className="w-3 h-3 mr-1" /> Solicitar ajustes
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setActionFor({ item: p, mode: "reject" }); setNotes(""); }}>
                            <X className="w-3 h-3 mr-1" /> Rejeitar
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setHistoryFor(p)}>
                        <History className="w-3 h-3 mr-1" /> Histórico
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportCsv.mutate(p.id)} disabled={exportCsv.isPending}>
                        <Download className="w-3 h-3 mr-1" /> CSV
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/imobiliaria/aprovacoes/$id/imprimir" params={{ id: p.id }} target="_blank">
                          <Printer className="w-3 h-3 mr-1" /> PDF
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!actionFor} onOpenChange={(o) => !o && setActionFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionFor?.mode === "reject" ? "Rejeitar imóvel" : "Solicitar ajustes"}</DialogTitle>
            <DialogDescription>{actionFor?.item.title}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={actionFor?.mode === "reject" ? "Motivo da rejeição (obrigatório)" : "O que precisa ser ajustado?"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionFor(null)}>Cancelar</Button>
            <Button
              variant={actionFor?.mode === "reject" ? "destructive" : "default"}
              disabled={!notes.trim() || submitAction.isPending}
              onClick={() => actionFor && submitAction.mutate({ id: actionFor.item.id, mode: actionFor.mode, n: notes.trim() })}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryDialog item={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}

function HistoryDialog({ item, onClose }: { item: QueueItem | null; onClose: () => void }) {
  const fetchHistory = useServerFn(listPropertyReviewHistory);
  const { data } = useQuery({
    queryKey: ["realestate-review-history", item?.id],
    enabled: !!item,
    queryFn: () => fetchHistory({ data: { propertyId: item!.id } }),
  });
  const reviews = (data?.reviews ?? []) as Review[];
  const actors = (data?.actors ?? {}) as Record<string, string>;
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de revisão</DialogTitle>
          <DialogDescription>{item?.title}</DialogDescription>
        </DialogHeader>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem histórico.</p>
        ) : (
          <ol className="space-y-3 max-h-96 overflow-y-auto">
            {reviews.map((r) => (
              <li key={r.id} className="border-l-2 pl-3 py-1">
                <div className="text-sm font-medium">{ACTION_LABEL[r.action]}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                  {r.actor_id && actors[r.actor_id] ? ` · ${actors[r.actor_id]}` : ""}
                </div>
                {r.notes && <div className="text-sm mt-1">{r.notes}</div>}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
