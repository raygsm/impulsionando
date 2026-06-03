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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Check, Phone, Mail, MessageCircle, Calendar, ClipboardList, StickyNote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/activities")({
  head: () => ({ meta: [{ title: "Atividades — CRM" }] }),
  component: ActivitiesPage,
});

interface Activity {
  id: string; activity_type: string; subject: string; content: string | null;
  due_at: string | null; done_at: string | null;
  lead_id: string | null; opportunity_id: string | null;
  crm_leads: { name: string } | null;
  crm_opportunities: { title: string } | null;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: StickyNote, call: Phone, email: Mail, meeting: Calendar, task: ClipboardList, whatsapp: MessageCircle,
};

function ActivitiesPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [tab, setTab] = useState<"pending"|"done"|"all">("pending");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    activity_type: "task", subject: "", content: "", due_at: "", lead_id: "__none__",
  });

  const { data: activities } = useQuery({
    queryKey: ["crm-activities", companyId, tab],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("crm_activities")
        .select("id, activity_type, subject, content, due_at, done_at, lead_id, opportunity_id, crm_leads:lead_id(name), crm_opportunities:opportunity_id(title)")
        .eq("company_id", companyId).order("due_at", { ascending: true, nullsFirst: false }).limit(200);
      if (tab === "pending") q = q.is("done_at", null);
      if (tab === "done") q = q.not("done_at", "is", null);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Activity[];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["crm-leads-opt-act", companyId],
    enabled: creating && !!companyId,
    queryFn: async () => (await supabase.from("crm_leads").select("id, name").eq("company_id", companyId).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_activities").insert({
        company_id: companyId, activity_type: form.activity_type,
        subject: form.subject, content: form.content || null,
        due_at: form.due_at || null,
        lead_id: form.lead_id === "__none__" ? null : form.lead_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atividade criada");
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      setForm({ activity_type: "task", subject: "", content: "", due_at: "", lead_id: "__none__" });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_activities").update({ done_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Concluída"); qc.invalidateQueries({ queryKey: ["crm-activities"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Atividades"
        description="Tarefas, ligações, e-mails, reuniões e follow-ups."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />Nova atividade
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="done">Concluídas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="shadow-card divide-y">
            {!activities?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem atividades.</div>}
            {activities?.map((a) => {
              const Icon = ICONS[a.activity_type] ?? ClipboardList;
              const overdue = !a.done_at && a.due_at && new Date(a.due_at) < new Date();
              return (
                <div key={a.id} className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center ${a.done_at ? "bg-muted text-muted-foreground" : overdue ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`font-medium text-sm truncate ${a.done_at ? "line-through text-muted-foreground" : ""}`}>{a.subject}</div>
                      {overdue && <Badge variant="outline" className="text-[9px] border-red-500 text-red-600">atrasada</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.crm_leads?.name && <span>Lead: {a.crm_leads.name} · </span>}
                      {a.crm_opportunities?.title && <span>Op.: {a.crm_opportunities.title} · </span>}
                      {a.due_at ? new Date(a.due_at).toLocaleString("pt-BR") : "sem data"}
                    </div>
                  </div>
                  {!a.done_at && (
                    <Button size="sm" variant="outline" onClick={() => complete.mutate(a.id)}>
                      <Check className="w-4 h-4 mr-1" />Concluir
                    </Button>
                  )}
                </div>
              );
            })}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={creating} onOpenChange={(v) => !v && setCreating(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="note">Nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data/hora</Label>
                <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
              </div>
            </div>
            <div><Label>Assunto</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Nenhum —</SelectItem>
                  {leads?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Conteúdo</Label><Textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant" disabled={!form.subject || create.isPending} onClick={() => create.mutate()}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
