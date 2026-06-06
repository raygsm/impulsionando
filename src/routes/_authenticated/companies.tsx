import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "Empresas — Impulsionando" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", legal_name: "", document: "", email: "", niche_id: "", is_demo: false });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, legal_name, document, email, is_master, is_active, is_demo, status, created_at, niches:niche_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: niches } = useQuery({
    queryKey: ["niches-list"],
    queryFn: async () => (await supabase.from("niches").select("id, name").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").insert({
        name: form.name, legal_name: form.legal_name || null, document: form.document || null,
        email: form.email || null, niche_id: form.niche_id || null, is_demo: form.is_demo,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Empresa criada"); setOpen(false); setForm({ name: "", legal_name: "", document: "", email: "", niche_id: "", is_demo: false }); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Empresa removida"); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Clientes ativos da plataforma Impulsionando."
        action={
          me?.isSuperAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary shadow-elegant"><Plus className="w-4 h-4 mr-2" />Nova empresa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova empresa</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Razão social</Label><Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Documento (CNPJ)</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                    <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nicho</Label>
                    <Select value={form.niche_id} onValueChange={(v) => setForm({ ...form, niche_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{niches?.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div><div className="text-sm font-medium">Ambiente demo</div><div className="text-xs text-muted-foreground">Marcar como dados de demonstração.</div></div>
                    <Switch checked={form.is_demo} onCheckedChange={(v) => setForm({ ...form, is_demo: v })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Salvando..." : "Criar"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead><TableHead>Nicho</TableHead><TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>}
            {!isLoading && companies?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma empresa cadastrada.</TableCell></TableRow>}
            {companies?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email ?? c.document ?? "—"}</div>
                </TableCell>
                <TableCell><span className="text-sm">{(c.niches as { name: string } | null)?.name ?? "—"}</span></TableCell>
                <TableCell>{c.is_active ? <Badge className="bg-success text-success-foreground">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell>
                  {c.is_master && <Badge className="bg-gradient-primary">Mestre</Badge>}
                  {c.is_demo && <Badge variant="outline" className="ml-1">Demo</Badge>}
                </TableCell>
                <TableCell>
                  {me?.isSuperAdmin && !c.is_master && (
                    <Button size="icon" variant="ghost" aria-label={`Remover empresa ${c.name}`} onClick={() => confirm(`Remover ${c.name}?`) && remove.mutate(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
