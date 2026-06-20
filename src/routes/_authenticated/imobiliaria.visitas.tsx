import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Home } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/visitas")({
  head: () => ({ meta: [{ title: "Visitas — Imobiliária" }] }),
  component: Page,
});

type Visit = {
  id: string; company_id: string; property_id: string | null; broker_user_id: string | null;
  client_name: string; client_phone: string | null; client_email: string | null;
  scheduled_at: string; duration_minutes: number;
  status: "scheduled" | "done" | "canceled" | "noshow"; feedback: string | null; notes: string | null;
};
type Form = Partial<Visit>;

const STATUS_LABEL: Record<Visit["status"], string> = {
  scheduled: "Agendada", done: "Realizada", canceled: "Cancelada", noshow: "No-show",
};
const STATUS_COLOR: Record<Visit["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  canceled: "bg-zinc-200 text-zinc-700",
  noshow: "bg-rose-100 text-rose-800",
};

const EMPTY: Form = { client_name: "", scheduled_at: "", duration_minutes: 60, status: "scheduled" };

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | Visit["status"]>("all");
  const [editing, setEditing] = useState<Form | null>(null);
  const [open, setOpen] = useState(false);

  const { data: properties } = useQuery({
    queryKey: ["realestate-properties-short", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_properties").select("id, title").eq("company_id", companyId).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-visits", companyId, statusFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("realestate_visits").select("*")
        .eq("company_id", companyId).order("scheduled_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Visit[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Form) => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!p.client_name?.trim()) throw new Error("Nome do cliente obrigatório");
      if (!p.scheduled_at) throw new Error("Data/hora obrigatória");
      const row = {
        company_id: companyId,
        property_id: p.property_id || null,
        client_name: p.client_name.trim(),
        client_phone: p.client_phone?.trim() || null,
        client_email: p.client_email?.trim() || null,
        scheduled_at: p.scheduled_at,
        duration_minutes: p.duration_minutes ?? 60,
        status: p.status ?? "scheduled",
        feedback: p.feedback?.trim() || null,
        notes: p.notes?.trim() || null,
      };
      if (p.id) {
        const { error } = await supabase.from("realestate_visits").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("realestate_visits").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Visita salva");
      qc.invalidateQueries({ queryKey: ["realestate-visits"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Visita removida"); qc.invalidateQueries({ queryKey: ["realestate-visits"] }); },
  });

  const visits = data ?? [];
  const propMap = new Map((properties ?? []).map(p => [p.id, p.title]));

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PageHeader
        title="Visitas"
        description="Agendamento de visitas a imóveis, com acompanhamento de status e feedback."
        action={<Button onClick={() => { setEditing({ ...EMPTY }); setOpen(true); }} disabled={!companyId}>
          <Plus className="h-4 w-4 mr-1" /> Nova visita
        </Button>}
      />

      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!companyId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">Selecione uma empresa.</div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : visits.length === 0 ? (
        <EmptyState title="Nenhuma visita" description="Agende a primeira visita." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Data/Hora</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Imóvel</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2 font-medium">{new Date(v.scheduled_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">
                    <div>{v.client_name}</div>
                    <div className="text-xs text-muted-foreground">{v.client_phone ?? v.client_email ?? ""}</div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground flex items-center gap-1">
                    <Home className="h-3 w-3" />{v.property_id ? (propMap.get(v.property_id) ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-2"><Badge className={STATUS_COLOR[v.status]}>{STATUS_LABEL[v.status]}</Badge></td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(v); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-rose-600"
                      onClick={() => { if (confirm("Remover visita?")) del.mutate(v.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar visita" : "Nova visita"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Cliente *</Label>
                <Input value={editing.client_name ?? ""} onChange={(e) => setEditing({ ...editing, client_name: e.target.value })} />
              </div>
              <div><Label>Telefone</Label><Input value={editing.client_phone ?? ""} onChange={(e) => setEditing({ ...editing, client_phone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input value={editing.client_email ?? ""} onChange={(e) => setEditing({ ...editing, client_email: e.target.value })} /></div>
              <div>
                <Label>Data/Hora *</Label>
                <Input type="datetime-local" value={editing.scheduled_at ? editing.scheduled_at.slice(0,16) : ""}
                  onChange={(e) => setEditing({ ...editing, scheduled_at: e.target.value })} />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" value={editing.duration_minutes ?? 60} onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Imóvel</Label>
                <Select value={editing.property_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, property_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhum —</SelectItem>
                    {(properties ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status ?? "scheduled"} onValueChange={(v) => setEditing({ ...editing, status: v as Visit["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Feedback pós-visita</Label>
                <Textarea rows={2} value={editing.feedback ?? ""} onChange={(e) => setEditing({ ...editing, feedback: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Observações internas</Label>
                <Textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => editing && upsert.mutate(editing)} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
