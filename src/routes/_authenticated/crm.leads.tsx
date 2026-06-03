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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  head: () => ({ meta: [{ title: "Leads — CRM" }] }),
  component: LeadsPage,
});

interface Lead {
  id: string; name: string; email: string | null; phone: string | null;
  source: string | null; status: string; score: number; tags: string[]; created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "Novo", working: "Em atendimento", qualified: "Qualificado",
  disqualified: "Desqualificado", converted: "Convertido",
};

function LeadsPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "", notes: "" });

  const { data: leads } = useQuery({
    queryKey: ["crm-leads", companyId, search],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("crm_leads")
        .select("id, name, email, phone, source, status, score, tags, created_at")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_leads").insert({
        company_id: companyId, name: form.name, email: form.email || null,
        phone: form.phone || null, source: form.source || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead criado");
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      setForm({ name: "", email: "", phone: "", source: "", notes: "" });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crm_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead removido"); qc.invalidateQueries({ queryKey: ["crm-leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Cadastro e qualificação de contatos comerciais."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />Novo lead
            </Button>
          </div>
        }
      />

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead><TableHead>Status</TableHead>
              <TableHead>Criado</TableHead><TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lead.</TableCell></TableRow>}
            {leads?.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium">{l.name}</div>
                  {!!l.tags?.length && <div className="flex gap-1 mt-1">{l.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  <div>{l.email ?? "—"}</div>
                  <div className="text-muted-foreground">{l.phone ?? ""}</div>
                </TableCell>
                <TableCell className="text-xs">{l.source ?? "—"}</TableCell>
                <TableCell>
                  <Select value={l.status} onValueChange={(v) => updateStatus.mutate({ id: l.id, status: v })}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir lead?")) remove.mutate(l.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={creating} onOpenChange={(v) => !v && setCreating(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Origem</Label><Input placeholder="indicação, site, instagram..." value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant" disabled={!form.name || create.isPending} onClick={() => create.mutate()}>
              Criar lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
