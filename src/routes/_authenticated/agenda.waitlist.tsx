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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Phone, PhoneOff, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/waitlist")({
  head: () => ({ meta: [{ title: "Fila de espera — Agenda" }] }),
  component: WaitlistPage,
});

interface Wait {
  id: string; customer_name: string; customer_phone: string | null; customer_email: string | null;
  preferred_date: string | null; notes: string | null; status: string; position: number;
  professional_id: string | null; service_id: string | null;
  agenda_professionals: { name: string } | null;
  agenda_services: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  waiting: "Aguardando", contacted: "Contactado", converted: "Convertido", expired: "Expirado", cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-700", contacted: "bg-blue-100 text-blue-700",
  converted: "bg-emerald-100 text-emerald-700", expired: "bg-gray-100 text-gray-700", cancelled: "bg-red-100 text-red-700",
};

function WaitlistPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "", preferred_date: "",
    professional_id: "__none__", service_id: "__none__", notes: "",
  });

  const { data: items } = useQuery({
    queryKey: ["agenda-waitlist", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_waitlist")
        .select("id, customer_name, customer_phone, customer_email, preferred_date, notes, status, position, professional_id, service_id, agenda_professionals:professional_id(name), agenda_services:service_id(name)")
        .eq("company_id", companyId).order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      return data as unknown as Wait[];
    },
  });

  const { data: pros } = useQuery({
    queryKey: ["wl-pros", companyId],
    enabled: open && !!companyId,
    queryFn: async () => (await supabase.from("agenda_professionals").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: services } = useQuery({
    queryKey: ["wl-services", companyId],
    enabled: open && !!companyId,
    queryFn: async () => (await supabase.from("agenda_services").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_waitlist").insert({
        company_id: companyId, customer_name: form.customer_name,
        customer_phone: form.customer_phone || null, customer_email: form.customer_email || null,
        preferred_date: form.preferred_date || null,
        professional_id: form.professional_id === "__none__" ? null : form.professional_id,
        service_id: form.service_id === "__none__" ? null : form.service_id,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado à fila");
      qc.invalidateQueries({ queryKey: ["agenda-waitlist"] });
      setOpen(false);
      setForm({ customer_name: "", customer_phone: "", customer_email: "", preferred_date: "", professional_id: "__none__", service_id: "__none__", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agenda_waitlist").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["agenda-waitlist"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Fila de espera" description="Clientes interessados quando não há horário disponível."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
        }
      />

      <Card className="shadow-card divide-y">
        {!items?.length && <div className="p-8 text-center text-sm text-muted-foreground">Fila vazia.</div>}
        {items?.map((w) => (
          <div key={w.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm truncate">{w.customer_name}</div>
                <Badge variant="outline" className={STATUS_COLOR[w.status]}>{STATUS_LABEL[w.status]}</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {w.agenda_services?.name ?? "Qualquer serviço"} · {w.agenda_professionals?.name ?? "Qualquer profissional"}
                {w.preferred_date && ` · prefere ${new Date(w.preferred_date).toLocaleDateString("pt-BR")}`}
                {w.customer_phone && ` · ${w.customer_phone}`}
              </div>
            </div>
            {w.status === "waiting" && (
              <Button size="sm" variant="outline" onClick={() => update.mutate({ id: w.id, status: "contacted" })}>
                <Phone className="w-3.5 h-3.5 mr-1" />Contatado
              </Button>
            )}
            {w.status === "contacted" && (
              <Button size="sm" variant="outline" onClick={() => update.mutate({ id: w.id, status: "converted" })}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" />Converter
              </Button>
            )}
            {(w.status === "waiting" || w.status === "contacted") && (
              <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: w.id, status: "cancelled" })}>
                <PhoneOff className="w-3.5 h-3.5 mr-1 text-red-500" />Cancelar
              </Button>
            )}
          </div>
        ))}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar à fila</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Profissional</Label>
                <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Qualquer</SelectItem>
                    {pros?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Qualquer</SelectItem>
                    {services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Data preferida</Label><Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div>
            <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.customer_name || create.isPending} onClick={() => create.mutate()}>Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
