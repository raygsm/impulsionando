/**
 * /impulsionando/leads-kanban — Onda 5
 * Kanban interno dos leads capturados pelos formulários públicos da
 * Impulsionando (/quero-comecar, /orcamento, /contato). Reaproveita
 * marketing_leads e permite mover cartão entre colunas (status).
 */
import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/impulsionando/leads-kanban")({
  head: () => ({
    meta: [
      { title: "Kanban de Leads — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsKanbanPage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-8">Não encontrado</div>,
});

type Lead = {
  id: string;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  recommended_plan: string | null;
  status: string;
  created_at: string;
};

const COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "new", label: "Novos", tone: "bg-blue-500/10 border-blue-500/30" },
  { key: "contacted", label: "Contatados", tone: "bg-amber-500/10 border-amber-500/30" },
  { key: "qualified", label: "Qualificados", tone: "bg-violet-500/10 border-violet-500/30" },
  { key: "won", label: "Ganhos", tone: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "lost", label: "Perdidos", tone: "bg-muted border-border" },
];

const SOURCE_LABEL: Record<string, string> = {
  orcamento: "Orçamento",
  contato: "Contato",
  demo: "Demo",
  outro: "Quero começar",
};

function LeadsKanbanPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["impulsionando-leads-kanban"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("id, source, name, email, phone, company, message, recommended_plan, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
    refetchInterval: 20_000,
  });

  const mut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("marketing_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["impulsionando-leads-kanban"] });
      toast.success("Lead movido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [dragId, setDragId] = useState<string | null>(null);

  const grouped: Record<string, Lead[]> = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
  (data ?? []).forEach((l) => {
    const key = grouped[l.status] ? l.status : "new";
    grouped[key].push(l);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban de Leads</h1>
          <p className="text-sm text-muted-foreground">
            Arraste os cartões entre colunas para atualizar o status. Fonte: <code>marketing_leads</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/leads">Ver lista completa</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) mut.mutate({ id: dragId, status: col.key });
                setDragId(null);
              }}
              className={`rounded-lg border p-3 min-h-[300px] ${col.tone}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge variant="outline" className="text-[10px]">{grouped[col.key].length}</Badge>
              </div>
              <div className="space-y-2">
                {grouped[col.key].map((l) => (
                  <Card
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm truncate">{l.name ?? "Sem nome"}</div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {SOURCE_LABEL[l.source] ?? l.source}
                      </Badge>
                    </div>
                    {l.company && <div className="text-xs text-muted-foreground truncate">{l.company}</div>}
                    <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                      {l.email && <div className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{l.email}</div>}
                      {l.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{l.phone}</div>}
                    </div>
                    {l.message && (
                      <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{l.message}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                      {l.recommended_plan && <span>Plano: {l.recommended_plan}</span>}
                    </div>
                  </Card>
                ))}
                {grouped[col.key].length === 0 && (
                  <div className="text-[11px] text-muted-foreground text-center py-6 border border-dashed rounded">
                    Solte um cartão aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
