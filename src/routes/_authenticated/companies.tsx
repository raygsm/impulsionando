import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useImpersonation } from "@/hooks/use-impersonation";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "Empresas — Impulsionando" }] }),
  component: CompaniesPage,
});

type CompanyKind = "real" | "demo" | "sandbox" | "interna";
type StatusCommercial = "lead" | "proposta" | "contratada" | "implantacao" | "ativa" | "pausada" | "cancelada";
type StatusFinancial = "adimplente" | "a_vencer" | "inadimplente" | "suspensa";
type StatusTechnical = "configuracao" | "testes" | "operacional" | "atualizacao" | "migracao";

type CompanyRow = {
  id: string;
  name: string;
  legal_name: string | null;
  document: string | null;
  email: string | null;
  is_master: boolean | null;
  is_active: boolean | null;
  is_demo: boolean | null;
  status: string | null;
  company_kind: CompanyKind | null;
  status_commercial: StatusCommercial | null;
  status_financial: StatusFinancial | null;
  status_technical: StatusTechnical | null;
  created_at: string;
  niches: { name: string } | null;
};

const KIND_LABEL: Record<CompanyKind, string> = { real: "Real", demo: "Demo", sandbox: "Sandbox", interna: "Interna" };
const FIN_VARIANT: Record<StatusFinancial, string> = {
  adimplente: "bg-success text-success-foreground",
  a_vencer: "bg-warning text-warning-foreground",
  inadimplente: "bg-destructive text-destructive-foreground",
  suspensa: "bg-muted text-muted-foreground",
};

function CompaniesPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyRow | null>(null);
  const [tab, setTab] = useState<"all" | "real" | "demo" | "suspensas" | "implantacao" | "cancelada">("all");
  const [form, setForm] = useState({ name: "", legal_name: "", document: "", email: "", niche_id: "", is_demo: false });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, legal_name, document, email, is_master, is_active, is_demo, status, company_kind, status_commercial, status_financial, status_technical, created_at, niches:niche_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CompanyRow[];
    },
  });

  const { data: niches } = useQuery({
    queryKey: ["niches-list"],
    queryFn: async () => (await supabase.from("niches").select("id, name").order("name")).data ?? [],
  });

  const filtered = useMemo(() => {
    if (!companies) return [];
    switch (tab) {
      case "real": return companies.filter((c) => c.company_kind === "real");
      case "demo": return companies.filter((c) => c.company_kind === "demo" || c.is_demo);
      case "suspensas": return companies.filter((c) => c.status_financial === "suspensa" || c.status_commercial === "pausada");
      case "implantacao": return companies.filter((c) => c.status_commercial === "implantacao" || c.status_technical === "configuracao");
      case "cancelada": return companies.filter((c) => c.status_commercial === "cancelada");
      default: return companies;
    }
  }, [companies, tab]);

  const counts = useMemo(() => {
    const c = companies ?? [];
    return {
      all: c.length,
      real: c.filter((x) => x.company_kind === "real").length,
      demo: c.filter((x) => x.company_kind === "demo" || x.is_demo).length,
      suspensas: c.filter((x) => x.status_financial === "suspensa" || x.status_commercial === "pausada").length,
      implantacao: c.filter((x) => x.status_commercial === "implantacao" || x.status_technical === "configuracao").length,
      cancelada: c.filter((x) => x.status_commercial === "cancelada").length,
    };
  }, [companies]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").insert({
        name: form.name, legal_name: form.legal_name || null, document: form.document || null,
        email: form.email || null, niche_id: form.niche_id || null, is_demo: form.is_demo,
        company_kind: form.is_demo ? "demo" : "real",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Empresa criada"); setOpen(false); setForm({ name: "", legal_name: "", document: "", email: "", niche_id: "", is_demo: false }); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<CompanyRow> & { id: string }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase.from("companies").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Empresa atualizada"); setEditing(null); qc.invalidateQueries({ queryKey: ["companies"] }); },
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
          <TabsTrigger value="real">Reais ({counts.real})</TabsTrigger>
          <TabsTrigger value="demo">Demo ({counts.demo})</TabsTrigger>
          <TabsTrigger value="implantacao">Implantação ({counts.implantacao})</TabsTrigger>
          <TabsTrigger value="suspensas">Suspensas ({counts.suspensas})</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas ({counts.cancelada})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Comercial</TableHead>
              <TableHead>Financeiro</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma empresa nesta aba.</TableCell></TableRow>}
            {filtered.map((c) => (
              <TableRow key={c.id} className={c.company_kind === "demo" || c.is_demo ? "bg-muted/30" : undefined}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email ?? c.document ?? "—"}</div>
                </TableCell>
                <TableCell><span className="text-sm">{c.niches?.name ?? "—"}</span></TableCell>
                <TableCell>
                  {c.is_master && <Badge className="bg-gradient-primary">Mestre</Badge>}
                  {!c.is_master && <Badge variant={c.company_kind === "demo" ? "outline" : "secondary"}>{KIND_LABEL[c.company_kind ?? "real"]}</Badge>}
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{c.status_commercial ?? "—"}</Badge></TableCell>
                <TableCell>
                  {c.status_financial
                    ? <Badge className={FIN_VARIANT[c.status_financial]}>{c.status_financial.replace("_", " ")}</Badge>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{c.status_technical ?? "—"}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {me?.isSuperAdmin && (
                      <Button size="icon" variant="ghost" aria-label={`Editar ${c.name}`} onClick={() => setEditing(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {me?.isSuperAdmin && !c.is_master && c.is_active && (
                      <Button size="sm" variant="outline"
                        onClick={() => { startImpersonation({ companyId: c.id, companyName: c.name }); navigate({ to: "/dashboard" }); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" />Acessar
                      </Button>
                    )}
                    {me?.isSuperAdmin && !c.is_master && (
                      <Button size="icon" variant="ghost" aria-label={`Remover empresa ${c.name}`} onClick={() => confirm(`Remover ${c.name}?`) && remove.mutate(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Editar empresa — {editing.name}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Razão social</Label><Input value={editing.legal_name ?? ""} onChange={(e) => setEditing({ ...editing, legal_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Documento</Label><Input value={editing.document ?? ""} onChange={(e) => setEditing({ ...editing, document: e.target.value })} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editing.company_kind ?? "real"} onValueChange={(v) => setEditing({ ...editing, company_kind: v as CompanyKind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABEL) as CompanyKind[]).map((k) => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status comercial</Label>
                <Select value={editing.status_commercial ?? "ativa"} onValueChange={(v) => setEditing({ ...editing, status_commercial: v as StatusCommercial })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["lead", "proposta", "contratada", "implantacao", "ativa", "pausada", "cancelada"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status financeiro</Label>
                <Select value={editing.status_financial ?? "adimplente"} onValueChange={(v) => setEditing({ ...editing, status_financial: v as StatusFinancial })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["adimplente", "a_vencer", "inadimplente", "suspensa"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status técnico</Label>
                <Select value={editing.status_technical ?? "operacional"} onValueChange={(v) => setEditing({ ...editing, status_technical: v as StatusTechnical })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["configuracao", "testes", "operacional", "atualizacao", "migracao"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-md border p-3">
                <div className="text-sm font-medium">Ativa</div>
                <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button disabled={update.isPending} onClick={() => update.mutate({
                id: editing.id,
                name: editing.name,
                legal_name: editing.legal_name,
                document: editing.document,
                email: editing.email,
                company_kind: editing.company_kind,
                status_commercial: editing.status_commercial,
                status_financial: editing.status_financial,
                status_technical: editing.status_technical,
                is_active: editing.is_active,
              })}>{update.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
