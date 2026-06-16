import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listApprovalQueue,
  approveProperty,
  rejectProperty,
  requestPropertyChanges,
  listPropertyReviewHistory,
} from "@/lib/realestate.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovação de Imóveis — Imobiliária" }] }),
  component: Page,
});

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
  approval_status: "pending" | "changes_requested" | "rejected" | "approved";
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
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

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const fetchQueue = useServerFn(listApprovalQueue);
  const fetchApprove = useServerFn(approveProperty);
  const fetchReject = useServerFn(rejectProperty);
  const fetchChanges = useServerFn(requestPropertyChanges);

  const [tab, setTab] = useState<"pending" | "changes_requested" | "rejected">("pending");
  const [historyFor, setHistoryFor] = useState<QueueItem | null>(null);
  const [actionFor, setActionFor] = useState<{ item: QueueItem; mode: "reject" | "changes" } | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-approvals", companyId],
    enabled: !!companyId,
    queryFn: () => fetchQueue({ data: { companyId } }),
  });
  const items = (data?.items ?? []) as QueueItem[];
  const visible = items.filter((i) => i.approval_status === tab);

  const counts = {
    pending: items.filter((i) => i.approval_status === "pending").length,
    changes_requested: items.filter((i) => i.approval_status === "changes_requested").length,
    rejected: items.filter((i) => i.approval_status === "rejected").length,
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["realestate-approvals", companyId] });
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aprovação de imóveis"
        description="Revise imóveis enviados pelos corretores antes de publicar no site, portais e CRM."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/imobiliaria/imoveis">Voltar à carteira</Link>
          </Button>
        }
      />

      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
            <TabsTrigger value="changes_requested">Ajustes ({counts.changes_requested})</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados ({counts.rejected})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
            ) : visible.length === 0 ? (
              <EmptyState title="Nada por aqui" description="Nenhum imóvel nesta etapa." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visible.map((p) => (
                  <Card key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.reference_code ? `Ref ${p.reference_code} · ` : ""}{p.neighborhood ?? "-"}, {p.city ?? "-"}
                        </div>
                      </div>
                      <Badge variant={p.approval_status === "pending" ? "secondary" : p.approval_status === "rejected" ? "destructive" : "outline"}>
                        {p.approval_status === "pending" ? "Aguardando" : p.approval_status === "rejected" ? "Rejeitado" : "Ajustes"}
                      </Badge>
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
                    <div className="text-xs text-muted-foreground">
                      Enviado {p.submitted_for_review_at ? new Date(p.submitted_for_review_at).toLocaleString("pt-BR") : "—"}
                    </div>
                    {p.review_notes && (
                      <div className="text-xs rounded bg-muted p-2"><span className="font-medium">Nota anterior:</span> {p.review_notes}</div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>
                        <Check className="w-3 h-3 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setActionFor({ item: p, mode: "changes" }); setNotes(""); }}>
                        <AlertCircle className="w-3 h-3 mr-1" /> Solicitar ajustes
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setActionFor({ item: p, mode: "reject" }); setNotes(""); }}>
                        <X className="w-3 h-3 mr-1" /> Rejeitar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryFor(p)}>
                        <History className="w-3 h-3 mr-1" /> Histórico
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!actionFor} onOpenChange={(o) => !o && setActionFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionFor?.mode === "reject" ? "Rejeitar imóvel" : "Solicitar ajustes"}
            </DialogTitle>
            <DialogDescription>
              {actionFor?.item.title}
            </DialogDescription>
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
              onClick={() =>
                actionFor && submitAction.mutate({ id: actionFor.item.id, mode: actionFor.mode, n: notes.trim() })
              }
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
          <ol className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="border-l-2 pl-3 py-1">
                <div className="text-sm font-medium">{ACTION_LABEL[r.action]}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                {r.notes && <div className="text-sm mt-1">{r.notes}</div>}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
