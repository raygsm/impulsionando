import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Building2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useImpersonation } from "@/hooks/use-impersonation";

export const Route = createFileRoute("/_authenticated/units")({
  head: () => ({ meta: [{ title: "Unidades — Impulsionando" }] }),
  component: UnitsPage,
});

function UnitsPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const { companyId: activeCompanyId, options: companyOptions } = useActiveCompany();
  const { isImpersonating, impersonatedCompanyName } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", state: "", phone: "" });

  // Master mode: super admin sem impersonation enxerga todas as empresas.
  // Em qualquer outro caso, trava na empresa ativa (impersonada ou única membership).
  const isMasterView = !!me?.isSuperAdmin && !isImpersonating;
  const scopedCompanyId = isMasterView ? null : activeCompanyId || null;
  const activeCompanyName = useMemo(() => {
    if (isImpersonating) return impersonatedCompanyName ?? "Cliente";
    return companyOptions.find((c) => c.id === activeCompanyId)?.name ?? "—";
  }, [isImpersonating, impersonatedCompanyName, companyOptions, activeCompanyId]);

  const { data: units } = useQuery({
    queryKey: ["units", scopedCompanyId ?? "master"],
    queryFn: async () => {
      let q = supabase
        .from("company_units")
        .select("id, name, code, city, state, phone, is_active, company_id, companies:company_id(name)")
        .order("created_at", { ascending: false });
      if (scopedCompanyId) q = q.eq("company_id", scopedCompanyId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-options-master"],
    enabled: isMasterView,
    queryFn: async () => (await supabase.from("companies").select("id, name").eq("is_active", true).eq("is_master", false).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const company_id = scopedCompanyId ?? (form as { company_id?: string }).company_id;
      if (!company_id) throw new Error("Selecione uma empresa");
      const { error } = await supabase.from("company_units").insert({ ...form, company_id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unidade criada");
      setOpen(false);
      setForm({ name: "", code: "", city: "", state: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_units").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Unidade removida"); qc.invalidateQueries({ queryKey: ["units"] }); },
  });

  return (
    <div>
      <PageHeader
        title="Unidades"
        description={isMasterView
          ? "Visão Master: todas as unidades de todas as empresas clientes."
          : `Unidades da empresa: ${activeCompanyName}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant"><Plus className="w-4 h-4 mr-2" />Nova unidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova unidade</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {isMasterView ? (
                  <div className="space-y-2">
                    <Label>Empresa*</Label>
                    <Select
                      value={(form as { company_id?: string }).company_id ?? ""}
                      onValueChange={(v) => setForm({ ...form, company_id: v } as typeof form & { company_id: string })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresa: <strong>{activeCompanyName}</strong>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>UF</Label><Input value={form.state} maxLength={2} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.name || (isMasterView && !(form as { company_id?: string }).company_id)} onClick={() => create.mutate()}>
                  {create.isPending ? "Salvando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isMasterView && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Shield className="w-4 h-4 text-primary" />
          Você está no <strong>Core Master</strong>. Para ver unidades de uma empresa específica, acesse-a em <em>Clientes → Acessar como</em>.
        </div>
      )}

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              {isMasterView && <TableHead>Empresa</TableHead>}
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {units?.length === 0 && (
              <TableRow>
                <TableCell colSpan={isMasterView ? 5 : 4} className="text-center text-muted-foreground py-8">
                  Nenhuma unidade cadastrada{!isMasterView ? ` para ${activeCompanyName}` : ""}.
                </TableCell>
              </TableRow>
            )}
            {units?.map((u) => (
              <TableRow key={u.id}>
                <TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.code ?? "—"}</div></TableCell>
                {isMasterView && (
                  <TableCell className="text-sm">{(u.companies as { name: string } | null)?.name ?? "—"}</TableCell>
                )}
                <TableCell className="text-sm">{[u.city, u.state].filter(Boolean).join(" / ") || "—"}</TableCell>
                <TableCell>{u.is_active ? <Badge className="bg-success text-success-foreground">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell>{(me?.isSuperAdmin) && (
                  <Button size="icon" variant="ghost" aria-label={`Remover unidade ${u.name}`} onClick={() => confirm("Remover unidade?") && remove.mutate(u.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
