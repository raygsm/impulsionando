import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle2, Clock, AlertTriangle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/obrigacoes")({
  head: () => ({ meta: [{ title: "Obrigações Fiscais — Impulsionando" }] }),
  component: ContabObrigacoes,
});

interface Obligation {
  id: string; client_id: string; obligation_type: string; title: string;
  competence: string; due_date: string; amount: number | null; status: string;
  scope: string; paid_at: string | null;
}
interface Client { id: string; legal_name: string; trade_name: string | null; }

const TYPES = [
  "das", "darf", "gps", "fgts", "dctfweb", "sped_fiscal", "sped_contribuicoes",
  "defis", "irpj", "csll", "iss", "icms", "esocial", "outros",
];

const SCOPE = [
  { v: "federal", l: "Federal" },
  { v: "state", l: "Estadual" },
  { v: "municipal", l: "Municipal" },
  { v: "labor", l: "Trabalhista" },
  { v: "custom", l: "Personalizada" },
];

const STATUS = [
  { v: "pending", l: "Pendente", c: "bg-amber-500/15 text-amber-700" },
  { v: "in_progress", l: "Em andamento", c: "bg-blue-500/15 text-blue-700" },
  { v: "generated", l: "Gerada", c: "bg-indigo-500/15 text-indigo-700" },
  { v: "sent", l: "Enviada", c: "bg-purple-500/15 text-purple-700" },
  { v: "paid", l: "Paga", c: "bg-green-500/15 text-green-700" },
  { v: "overdue", l: "Atrasada", c: "bg-red-500/15 text-red-700" },
  { v: "cancelled", l: "Cancelada", c: "bg-gray-500/15 text-gray-600" },
  { v: "exempt", l: "Isenta", c: "bg-gray-500/15 text-gray-600" },
];

const today = new Date().toISOString().slice(0, 10);

function dueLabel(due: string, status: string) {
  if (status === "paid") return null;
  const diff = Math.round((new Date(due).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { txt: `${Math.abs(diff)}d atrasada`, c: "text-red-600" };
  if (diff === 0) return { txt: "Vence hoje", c: "text-amber-600" };
  if (diff <= 7) return { txt: `Vence em ${diff}d`, c: "text-amber-600" };
  return { txt: `Vence em ${diff}d`, c: "text-muted-foreground" };
}

function ContabObrigacoes() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("upcoming");
  const [form, setForm] = useState({
    client_id: "", obligation_type: "das", title: "", competence: today.slice(0, 7) + "-01",
    due_date: today, amount: 0, scope: "federal",
  });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contab_clients").select("id, legal_name, trade_name")
        .eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-obligations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_obligations")
        .select("*").eq("company_id", companyId!).order("due_date", { ascending: true });
      if (error) throw error;
      return data as Obligation[];
    },
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    if (filter === "overdue") return items.filter((o) => o.status !== "paid" && o.due_date < today);
    if (filter === "upcoming") return items.filter((o) => o.status !== "paid" && o.due_date >= today);
    if (filter === "paid") return items.filter((o) => o.status === "paid");
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    if (!items) return { overdue: 0, upcoming: 0, paid: 0 };
    return {
      overdue: items.filter((o) => o.status !== "paid" && o.due_date < today).length,
      upcoming: items.filter((o) => o.status !== "paid" && o.due_date >= today).length,
      paid: items.filter((o) => o.status === "paid").length,
    };
  }, [items]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contab_obligations").insert({
        company_id: companyId!,
        client_id: form.client_id,
        obligation_type: form.obligation_type,
        title: form.title || form.obligation_type.toUpperCase(),
        competence: form.competence,
        due_date: form.due_date,
        amount: form.amount || null,
        scope: form.scope,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obrigação criada (régua de lembretes D-7/D-3/D-1/D0/D+5 gerada)");
      qc.invalidateQueries({ queryKey: ["contab-obligations"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: { status: string; paid_at?: string } = { status };
      if (status === "paid") patch.paid_at = new Date().toISOString();
      const { error } = await supabase.from("contab_obligations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-obligations"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_obligations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removida"); qc.invalidateQueries({ queryKey: ["contab-obligations"] }); },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Obrigações Fiscais"
        description="Calendário de obrigações por cliente — régua automática D-7/D-3/D-1/D0/D+5."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <button onClick={() => setFilter("overdue")} className={`text-left ${filter === "overdue" ? "ring-2 ring-red-400" : ""}`}>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-4 h-4" /><span className="text-sm">Atrasadas</span></div>
            <div className="text-2xl font-bold mt-1">{stats.overdue}</div>
          </Card>
        </button>
        <button onClick={() => setFilter("upcoming")} className={`text-left ${filter === "upcoming" ? "ring-2 ring-primary" : ""}`}>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-amber-600"><Clock className="w-4 h-4" /><span className="text-sm">A vencer</span></div>
            <div className="text-2xl font-bold mt-1">{stats.upcoming}</div>
          </Card>
        </button>
        <button onClick={() => setFilter("paid")} className={`text-left ${filter === "paid" ? "ring-2 ring-green-400" : ""}`}>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-4 h-4" /><span className="text-sm">Pagas</span></div>
            <div className="text-2xl font-bold mt-1">{stats.paid}</div>
          </Card>
        </button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !filtered.length && (
        <EmptyState title="Nenhuma obrigação" description="Cadastre a primeira obrigação fiscal." />
      )}

      <div className="space-y-2">
        {filtered.map((o) => {
          const st = STATUS.find((s) => s.v === o.status);
          const client = clients?.find((c) => c.id === o.client_id);
          const due = dueLabel(o.due_date, o.status);
          return (
            <Card key={o.id} className="p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{o.title}</div>
                <div className="text-xs text-muted-foreground flex gap-2 flex-wrap mt-0.5">
                  <span>{client?.trade_name || client?.legal_name || "—"}</span>
                  <span>·</span>
                  <span>{o.obligation_type}</span>
                  <span>·</span>
                  <span>Vence {new Date(o.due_date).toLocaleDateString("pt-BR")}</span>
                  {o.amount && <><span>·</span><span>R$ {Number(o.amount).toFixed(2)}</span></>}
                </div>
              </div>
              {due && <span className={`text-xs font-medium ${due.c}`}>{due.txt}</span>}
              {st && <Badge className={st.c} variant="secondary">{st.l}</Badge>}
              <Select value={o.status} onValueChange={(v) => setStatus.mutate({ id: o.id, status: v })}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(o.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova obrigação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.obligation_type} onValueChange={(v) => setForm({ ...form, obligation_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Esfera</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SCOPE.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: DAS 06/2026" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Competência</Label>
                <Input type="month" value={form.competence.slice(0, 7)}
                  onChange={(e) => setForm({ ...form, competence: `${e.target.value}-01` })} />
              </div>
              <div><Label>Vencimento *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div><Label>Valor (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.client_id || !form.due_date || save.isPending}
              onClick={() => save.mutate()}>
              Criar obrigação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
