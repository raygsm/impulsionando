import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listIntents, upsertIntent, deleteIntent } from "@/lib/realestate.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria/intencoes")({
  head: () => ({ meta: [{ title: "Intenções de busca — Imobiliária" }] }),
  component: Page,
});

const OPERATIONS = [
  { value: "venda", label: "Quer comprar" },
  { value: "locacao", label: "Quer alugar" },
  { value: "venda_ou_locacao", label: "Tanto faz" },
];

const STATUS = ["ativo", "pausado", "atendido", "arquivado"];

type Intent = {
  id: string; company_id: string;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  operation: string; status: string;
  price_min: number | null; price_max: number | null;
  bedrooms_min: number; bathrooms_min: number; parking_min: number;
  cities: string[]; neighborhoods: string[];
};

const emptyForm = {
  id: "" as string | undefined,
  contact_name: "", contact_email: "", contact_phone: "",
  operation: "venda" as "venda" | "locacao" | "venda_ou_locacao",
  status: "ativo" as "ativo" | "pausado" | "atendido" | "arquivado",
  price_min: "", price_max: "", area_min: "",
  bedrooms_min: 0, bathrooms_min: 0, parking_min: 0,
  cities: "", neighborhoods: "",
  notes: "",
};

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const fetchList = useServerFn(listIntents);
  const fetchUpsert = useServerFn(upsertIntent);
  const fetchDelete = useServerFn(deleteIntent);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-intents", companyId],
    enabled: !!companyId,
    queryFn: () => fetchList({ data: { companyId } }),
  });

  const upsert = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v === "" || v == null ? null : Number(v));
      return fetchUpsert({
        data: {
          id: form.id || undefined,
          company_id: companyId,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          operation: form.operation,
          status: form.status,
          property_types: [],
          price_min: num(form.price_min),
          price_max: num(form.price_max),
          area_min: num(form.area_min),
          bedrooms_min: Number(form.bedrooms_min) || 0,
          bathrooms_min: Number(form.bathrooms_min) || 0,
          parking_min: Number(form.parking_min) || 0,
          cities: form.cities.split(",").map(s => s.trim()).filter(Boolean),
          neighborhoods: form.neighborhoods.split(",").map(s => s.trim()).filter(Boolean),
          notes: form.notes || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Intenção salva. Cruzando com imóveis…");
      qc.invalidateQueries({ queryKey: ["realestate-intents", companyId] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetchDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Intenção removida");
      qc.invalidateQueries({ queryKey: ["realestate-intents", companyId] });
    },
  });

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (i: Intent) => {
    setForm({
      ...emptyForm,
      id: i.id,
      contact_name: i.contact_name ?? "",
      contact_email: i.contact_email ?? "",
      contact_phone: i.contact_phone ?? "",
      operation: i.operation as any,
      status: i.status as any,
      price_min: i.price_min?.toString() ?? "",
      price_max: i.price_max?.toString() ?? "",
      bedrooms_min: i.bedrooms_min,
      bathrooms_min: i.bathrooms_min,
      parking_min: i.parking_min,
      cities: (i.cities ?? []).join(", "),
      neighborhoods: (i.neighborhoods ?? []).join(", "),
    });
    setOpen(true);
  };

  const intents = (data?.intents ?? []) as Intent[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Intenções de busca"
        description="Cada intenção é um perfil de busca. Sempre que um imóvel ativo combinar, o lead recebe WhatsApp + e-mail automaticamente."
        icon={Search}
        actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova intenção</Button>}
      />

      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : isLoading ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
      ) : intents.length === 0 ? (
        <EmptyState title="Nenhuma intenção cadastrada" description="Cadastre o perfil de busca de um lead." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {intents.map((i) => (
            <Card key={i.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{i.contact_name ?? "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.contact_email ?? "—"} · {i.contact_phone ?? "—"}
                  </div>
                </div>
                <Badge variant={i.status === "ativo" ? "default" : "secondary"}>{i.status}</Badge>
              </div>
              <div className="text-sm flex flex-wrap gap-2">
                <Badge variant="outline">{i.operation}</Badge>
                <Badge variant="outline">{i.bedrooms_min}+ q</Badge>
                <Badge variant="outline">{i.parking_min}+ vagas</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Faixa: {i.price_min ? `R$ ${i.price_min.toLocaleString("pt-BR")}` : "—"} a {i.price_max ? `R$ ${i.price_max.toLocaleString("pt-BR")}` : "—"}
              </div>
              <div className="text-xs">
                {i.cities.length > 0 && <>Cidades: {i.cities.join(", ")}<br /></>}
                {i.neighborhoods.length > 0 && <>Bairros: {i.neighborhoods.join(", ")}</>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(i)}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(i.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar intenção" : "Nova intenção de busca"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nome do lead *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+5511..." />
            </div>
            <div>
              <Label>Operação</Label>
              <Select value={form.operation} onValueChange={(v) => setForm({ ...form, operation: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OPERATIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Área mínima (m²)</Label>
              <Input type="number" value={form.area_min} onChange={(e) => setForm({ ...form, area_min: e.target.value })} />
            </div>
            <div>
              <Label>Preço mínimo (R$)</Label>
              <Input type="number" value={form.price_min} onChange={(e) => setForm({ ...form, price_min: e.target.value })} />
            </div>
            <div>
              <Label>Preço máximo (R$)</Label>
              <Input type="number" value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value })} />
            </div>
            <div>
              <Label>Quartos mín.</Label>
              <Input type="number" value={form.bedrooms_min} onChange={(e) => setForm({ ...form, bedrooms_min: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Banheiros mín.</Label>
              <Input type="number" value={form.bathrooms_min} onChange={(e) => setForm({ ...form, bathrooms_min: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Vagas mín.</Label>
              <Input type="number" value={form.parking_min} onChange={(e) => setForm({ ...form, parking_min: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Label>Cidades desejadas (vírgula)</Label>
              <Input value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })} placeholder="São Paulo, Guarulhos" />
            </div>
            <div className="md:col-span-2">
              <Label>Bairros desejados (vírgula)</Label>
              <Input value={form.neighborhoods} onChange={(e) => setForm({ ...form, neighborhoods: e.target.value })} placeholder="Moema, Vila Mariana" />
            </div>
            <div className="md:col-span-2">
              <Label>Notas internas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate()} disabled={!form.contact_name || upsert.isPending}>
              {upsert.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
