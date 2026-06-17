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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileSignature, ListChecks, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/contratos")({
  head: () => ({ meta: [{ title: "Contratos & Onboarding — Contabilidade" }] }),
  component: ContabContratos,
});

interface Contract {
  id: string; client_id: string | null; title: string; status: string;
  monthly_fee: number; start_date: string | null; end_date: string | null;
  signed_at: string | null; content: string | null;
}
interface Onb {
  id: string; client_id: string | null; step_name: string; step_order: number;
  status: string;
}
interface Client { id: string; legal_name: string; trade_name: string | null; }

const STATUS = [
  { v: "rascunho", l: "Rascunho", c: "bg-gray-500/15 text-gray-700" },
  { v: "enviado", l: "Enviado", c: "bg-blue-500/15 text-blue-700" },
  { v: "assinado", l: "Assinado", c: "bg-emerald-500/15 text-emerald-700" },
  { v: "cancelado", l: "Cancelado", c: "bg-red-500/15 text-red-700" },
];

const DEFAULT_ONB = [
  "Coleta de documentos da empresa",
  "Procuração e contrato social",
  "Acesso aos sistemas (eCAC, sefaz, prefeitura)",
  "Cadastro nas plataformas internas",
  "Reunião de kick-off",
  "Definição de calendário fiscal",
  "Treinamento do cliente no portal",
  "Primeira folha / primeira competência",
];

function ContabContratos() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [tab, setTab] = useState<"contratos" | "onboarding">("contratos");
  const [open, setOpen] = useState(false);
  const [onbOpen, setOnbOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", client_id: "", monthly_fee: 0,
    start_date: "", end_date: "", content: "",
  });
  const [onbForm, setOnbForm] = useState({ client_id: "", seed: true });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_clients")
        .select("id, legal_name, trade_name").eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["contab-contracts", companyId],
    enabled: !!companyId && tab === "contratos",
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_contracts")
        .select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  const { data: onbItems } = useQuery({
    queryKey: ["contab-onboarding", companyId],
    enabled: !!companyId && tab === "onboarding",
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_onboarding")
        .select("*").eq("company_id", companyId!).order("step_order");
      if (error) throw error;
      return data as Onb[];
    },
  });

  const saveContract = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contab_contracts").insert({
        company_id: companyId!,
        title: form.title,
        client_id: form.client_id || null,
        monthly_fee: form.monthly_fee,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        content: form.content || null,
        status: "rascunho",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contrato criado");
      qc.invalidateQueries({ queryKey: ["contab-contracts"] });
      setOpen(false);
      setForm({ title: "", client_id: "", monthly_fee: 0, start_date: "", end_date: "", content: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contab_contracts").update({
        status,
        signed_at: status === "assinado" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-contracts"] }),
  });

  const removeContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["contab-contracts"] }); },
  });

  const seedOnb = useMutation({
    mutationFn: async () => {
      if (!onbForm.client_id) throw new Error("Selecione um cliente");
      const rows = DEFAULT_ONB.map((step_name, i) => ({
        company_id: companyId!, client_id: onbForm.client_id,
        step_name, step_order: i + 1, status: "pendente",
      }));
      const { error } = await supabase.from("contab_onboarding").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checklist de onboarding criado (8 etapas)");
      qc.invalidateQueries({ queryKey: ["contab-onboarding"] });
      setOnbOpen(false);
      setOnbForm({ client_id: "", seed: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleOnb = useMutation({
    mutationFn: async (o: Onb) => {
      const done = o.status !== "concluida";
      const { error } = await supabase.from("contab_onboarding").update({
        status: done ? "concluida" : "pendente",
        completed_at: done ? new Date().toISOString() : null,
      }).eq("id", o.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-onboarding"] }),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Contratos & Onboarding"
        description="Contratos de prestação de serviço e checklist de entrada de novos clientes."
        action={<CompanyPicker />}
      />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === "contratos" ? "default" : "outline"} onClick={() => setTab("contratos")}>
          <FileSignature className="w-4 h-4 mr-1" /> Contratos
        </Button>
        <Button variant={tab === "onboarding" ? "default" : "outline"} onClick={() => setTab("onboarding")}>
          <ListChecks className="w-4 h-4 mr-1" /> Onboarding
        </Button>
        <div className="flex-1" />
        {tab === "contratos" ? (
          <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo contrato
          </Button>
        ) : (
          <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOnbOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Iniciar onboarding
          </Button>
        )}
      </div>

      {tab === "contratos" && (
        <div className="space-y-2">
          {!contracts?.length && <EmptyState title="Nenhum contrato" description="Crie o primeiro contrato." />}
          {contracts?.map((c) => {
            const st = STATUS.find((s) => s.v === c.status);
            const client = clients?.find((x) => x.id === c.client_id);
            return (
              <Card key={c.id} className="p-3 flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground flex gap-2 flex-wrap mt-0.5">
                    {client && <span>{client.trade_name || client.legal_name}</span>}
                    {c.monthly_fee > 0 && <span>· R$ {(+c.monthly_fee).toFixed(2)}/mês</span>}
                    {c.start_date && <span>· início {new Date(c.start_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                {st && <Badge className={st.c} variant="secondary">{st.l}</Badge>}
                <Select value={c.status} onValueChange={(v) => setStatus.mutate({ id: c.id, status: v })}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) removeContract.mutate(c.id); }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "onboarding" && (
        <div className="space-y-2">
          {!onbItems?.length && <EmptyState title="Nenhum onboarding" description="Inicie o checklist para um cliente." />}
          {onbItems && Object.entries(
            onbItems.reduce((acc, o) => {
              const k = o.client_id || "—";
              if (!acc[k]) acc[k] = [];
              acc[k].push(o);
              return acc;
            }, {} as Record<string, Onb[]>)
          ).map(([cid, list]) => {
            const client = clients?.find((c) => c.id === cid);
            const done = list.filter((o) => o.status === "concluida").length;
            return (
              <Card key={cid} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{client ? (client.trade_name || client.legal_name) : "Sem cliente"}</div>
                  <Badge variant="outline">{done}/{list.length}</Badge>
                </div>
                <div className="space-y-1">
                  {list.map((o) => (
                    <div key={o.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleOnb.mutate(o)}>
                      <input type="checkbox" readOnly checked={o.status === "concluida"} className="h-4 w-4" />
                      <span className={`text-sm flex-1 ${o.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                        {o.step_order}. {o.step_name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo contrato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem cliente —</SelectItem>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Honorário mensal</Label>
                <Input type="number" step="0.01" value={form.monthly_fee}
                  onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })} />
              </div>
              <div><Label>Início</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div><Label>Fim</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div><Label>Conteúdo / cláusulas</Label>
              <Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.title || saveContract.isPending}
              onClick={() => saveContract.mutate()}>
              Criar contrato
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={onbOpen} onOpenChange={setOnbOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Iniciar onboarding</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={onbForm.client_id} onValueChange={(v) => setOnbForm({ ...onbForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Serão criadas <strong>8 etapas padrão</strong>: documentos, procuração, acessos, cadastro, kick-off, calendário fiscal, treinamento e primeira competência.
            </p>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!onbForm.client_id || seedOnb.isPending}
              onClick={() => seedOnb.mutate()}>
              Criar checklist (8 etapas)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
