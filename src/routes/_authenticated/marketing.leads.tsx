import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, Mail, Phone, ExternalLink, RefreshCw, Inbox,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketing/leads")({
  component: MarketingLeadsPage,
});

type Lead = {
  id: string;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  answers: Record<string, unknown> | null;
  recommended_plan: string | null;
  recommended_modules: string[] | null;
  status: string;
  notes: string | null;
  page_url: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  won: "Ganho",
  lost: "Perdido",
  spam: "Spam",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  qualified: "secondary",
  won: "default",
  lost: "outline",
  spam: "destructive",
};

const SOURCE_LABEL: Record<string, string> = {
  orcamento: "Orçamento",
  contato: "Contato",
  demo: "Demo",
  outro: "Outro",
};

function MarketingLeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.message]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [data, search, statusFilter, sourceFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: data?.length ?? 0 };
    (data ?? []).forEach((l) => { c[l.status] = (c[l.status] ?? 0) + 1; });
    return c;
  }, [data]);

  const updateMut = useMutation({
    mutationFn: async (patch: { id: string; status?: string; notes?: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("marketing_leads").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-leads"] });
      toast.success("Lead atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads do site</h1>
          <p className="text-sm text-muted-foreground">
            Mensagens recebidas pelos formulários públicos (orçamento, contato).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total", key: "total" },
          { label: "Novos", key: "new" },
          { label: "Contatados", key: "contacted" },
          { label: "Qualificados", key: "qualified" },
          { label: "Ganhos", key: "won" },
          { label: "Perdidos", key: "lost" },
        ].map((s) => (
          <Card key={s.key} className="p-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold">{counts[s.key] ?? 0}</div>
          </Card>
        ))}
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, WhatsApp, mensagem…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(SOURCE_LABEL).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Inbox className="w-10 h-10 mx-auto opacity-40" />
            <div className="font-medium">Nenhum lead capturado ainda</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Os leads enviados pelos formulários públicos (Orçamento, Contato, Showroom Fitness e landings de soluções) aparecem aqui automaticamente,
              com origem, plano de interesse e status para qualificação.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <a href="/orcamento" target="_blank" rel="noopener noreferrer">Abrir formulário público</a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <a href="/contato" target="_blank" rel="noopener noreferrer">Página de contato</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Quando</th>
                  <th className="text-left p-3">Origem</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Contato</th>
                  <th className="text-left p-3">Plano</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short", timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{SOURCE_LABEL[l.source] ?? l.source}</Badge>
                    </td>
                    <td className="p-3 font-medium">{l.name ?? "—"}</td>
                    <td className="p-3 space-y-0.5 text-xs">
                      {l.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</div>}
                      {l.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</div>}
                    </td>
                    <td className="p-3 text-xs">{l.recommended_plan ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[l.status] ?? "default"}>
                        {STATUS_LABEL[l.status] ?? l.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(l)}>Abrir</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LeadDialog
        lead={selected}
        onClose={() => setSelected(null)}
        onSave={(patch) => updateMut.mutate(patch)}
        saving={updateMut.isPending}
      />
    </div>
  );
}

function LeadDialog({
  lead, onClose, onSave, saving,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSave: (patch: { id: string; status?: string; notes?: string }) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState(lead?.status ?? "new");
  const [notes, setNotes] = useState(lead?.notes ?? "");

  // Sincroniza quando trocar de lead
  useMemo(() => {
    setStatus(lead?.status ?? "new");
    setNotes(lead?.notes ?? "");
  }, [lead?.id]);

  if (!lead) return null;

  const whatsURL = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, "")}`
    : null;

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.name ?? "Lead sem nome"}
            <Badge variant="outline">{SOURCE_LABEL[lead.source] ?? lead.source}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            {lead.email && (
              <div>
                <div className="text-xs text-muted-foreground">E-mail</div>
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline break-all">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div>
                <div className="text-xs text-muted-foreground">WhatsApp</div>
                <a href={whatsURL!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.phone}</a>
              </div>
            )}
            {lead.company && (
              <div>
                <div className="text-xs text-muted-foreground">Empresa</div>
                <div>{lead.company}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Recebido</div>
              <div>{new Date(lead.created_at).toLocaleString("pt-BR")}</div>
            </div>
          </div>

          {lead.message && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Mensagem</div>
              <div className="rounded-md border border-border bg-muted/30 p-3 whitespace-pre-wrap">{lead.message}</div>
            </div>
          )}

          {(lead.recommended_plan || (lead.recommended_modules?.length ?? 0) > 0) && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Recomendação do briefing</div>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                {lead.recommended_plan && <div><span className="font-medium">Plano:</span> {lead.recommended_plan}</div>}
                {(lead.recommended_modules?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lead.recommended_modules!.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {lead.answers && (
            <details className="rounded-md border border-border p-3">
              <summary className="text-xs text-muted-foreground cursor-pointer">Respostas do briefing</summary>
              <pre className="mt-2 text-[11px] whitespace-pre-wrap">{JSON.stringify(lead.answers, null, 2)}</pre>
            </details>
          )}

          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {lead.page_url && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Página de origem</div>
                <a href={lead.page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 break-all">
                  <ExternalLink className="w-3 h-3" /> {lead.page_url}
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Notas internas</div>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {whatsURL && (
            <Button asChild variant="outline">
              <a href={whatsURL} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
            </Button>
          )}
          <Button onClick={() => onSave({ id: lead.id, status, notes })} disabled={saving} className="bg-gradient-primary">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
