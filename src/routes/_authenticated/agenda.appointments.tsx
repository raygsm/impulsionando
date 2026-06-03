import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/appointments")({
  head: () => ({ meta: [{ title: "Agendamentos — Agenda" }] }),
  component: AppointmentsPage,
});

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado", confirmed: "Confirmado", checked_in: "Check-in",
  in_progress: "Em atendimento", completed: "Concluído", no_show: "No-show", cancelled: "Cancelado",
};
const STATUS_FLOW: Record<string, string[]> = {
  scheduled: ["confirmed","checked_in","cancelled","no_show"],
  confirmed: ["checked_in","cancelled","no_show"],
  checked_in: ["in_progress","cancelled"],
  in_progress: ["completed"],
};

interface Appt {
  id: string; starts_at: string; ends_at: string; status: string;
  customer_name: string; customer_phone: string | null; notes: string | null; price: number;
  professional_id: string; service_id: string;
  agenda_professionals: { name: string; color: string } | null;
  agenda_services: { name: string; duration_min: number; price: number } | null;
}

function AppointmentsPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [tab, setTab] = useState<"today"|"upcoming"|"all">("today");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    professional_id: "", service_id: "", starts_at: "", customer_name: "", customer_phone: "", notes: "",
  });

  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const { data: appts } = useQuery({
    queryKey: ["agenda-appts", companyId, tab],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("agenda_appointments")
        .select("id, starts_at, ends_at, status, customer_name, customer_phone, notes, price, professional_id, service_id, agenda_professionals:professional_id(name,color), agenda_services:service_id(name,duration_min,price)")
        .eq("company_id", companyId).order("starts_at", { ascending: true }).limit(200);
      if (tab === "today") q = q.gte("starts_at", today.toISOString()).lte("starts_at", todayEnd.toISOString());
      if (tab === "upcoming") q = q.gte("starts_at", today.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Appt[];
    },
  });

  const { data: pros } = useQuery({
    queryKey: ["appt-pros", companyId],
    enabled: open && !!companyId,
    queryFn: async () => (await supabase.from("agenda_professionals").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: services } = useQuery({
    queryKey: ["appt-services", companyId],
    enabled: open && !!companyId,
    queryFn: async () => (await supabase.from("agenda_services").select("id,name,duration_min,price").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const svc = services?.find((s) => s.id === form.service_id);
      if (!svc) throw new Error("Selecione um serviço");
      const start = new Date(form.starts_at);
      const end = new Date(start.getTime() + svc.duration_min * 60_000);
      const { error } = await supabase.from("agenda_appointments").insert({
        company_id: companyId, professional_id: form.professional_id, service_id: form.service_id,
        starts_at: start.toISOString(), ends_at: end.toISOString(),
        customer_name: form.customer_name, customer_phone: form.customer_phone || null,
        notes: form.notes || null, price: svc.price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento criado");
      qc.invalidateQueries({ queryKey: ["agenda-appts"] });
      setOpen(false);
      setForm({ professional_id: "", service_id: "", starts_at: "", customer_name: "", customer_phone: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: { status: string; cancelled_at?: string } = { status };
      if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from("agenda_appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["agenda-appts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Agendamentos" description="Cria, confirma, atende e finaliza os atendimentos."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Novo
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-card divide-y mt-4">
        {!appts?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum agendamento.</div>}
        {appts?.map((a) => {
          const next = STATUS_FLOW[a.status] ?? [];
          return (
            <div key={a.id} className="p-3 flex items-center gap-3">
              <div className="w-1.5 self-stretch rounded-sm" style={{ background: a.agenda_professionals?.color ?? "#6366f1" }} />
              <div className="w-24 text-xs">
                <div className="font-mono">{new Date(a.starts_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
                <div className="text-muted-foreground">{new Date(a.starts_at).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{a.customer_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {a.agenda_services?.name} · {a.agenda_professionals?.name}
                  {a.customer_phone && ` · ${a.customer_phone}`}
                </div>
              </div>
              <Badge variant="outline">{STATUS_LABEL[a.status]}</Badge>
              {next.map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => move.mutate({ id: a.id, status: s })}>
                  {s === "cancelled" || s === "no_show" ? <X className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          );
        })}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Profissional *</Label>
                <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {pros?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço *</Label>
                <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.duration_min}min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Data e hora *</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.customer_name || !form.professional_id || !form.service_id || !form.starts_at || create.isPending}
              onClick={() => create.mutate()}>Criar agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
