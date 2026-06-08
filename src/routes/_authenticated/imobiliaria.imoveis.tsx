import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProperties, upsertProperty, deleteProperty } from "@/lib/realestate.functions";
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
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria/imoveis")({
  head: () => ({ meta: [{ title: "Imóveis — Imobiliária" }] }),
  component: Page,
});

const OPERATIONS = [
  { value: "venda", label: "Venda" },
  { value: "locacao", label: "Locação" },
  { value: "venda_ou_locacao", label: "Venda ou Locação" },
];

const TYPES = [
  "apartamento", "casa", "casa_condominio", "terreno", "sala_comercial",
  "loja", "galpao", "sitio", "chacara", "cobertura", "kitnet", "studio", "outro",
];

const STATUS = ["rascunho", "ativo", "reservado", "vendido", "locado", "inativo"];

type Property = {
  id: string; company_id: string; reference_code: string | null;
  title: string; description: string | null;
  operation: string; property_type: string; status: string;
  sale_price: number | null; rent_price: number | null;
  area_total: number | null; area_useful: number | null;
  bedrooms: number; suites: number; bathrooms: number; parking_spots: number;
  neighborhood: string | null; city: string | null; state: string | null;
  is_published: boolean;
};

const emptyForm = {
  id: "" as string | undefined,
  reference_code: "", title: "", description: "",
  operation: "venda" as "venda" | "locacao" | "venda_ou_locacao",
  property_type: "apartamento",
  status: "ativo" as "rascunho" | "ativo" | "reservado" | "vendido" | "locado" | "inativo",
  sale_price: "", rent_price: "", condo_fee: "", iptu: "",
  area_total: "", area_useful: "",
  bedrooms: 0, suites: 0, bathrooms: 0, parking_spots: 0,
  address_line: "", neighborhood: "", city: "", state: "", zip: "",
  features: "", photos: "",
  is_published: true,
};

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const fetchList = useServerFn(listProperties);
  const fetchUpsert = useServerFn(upsertProperty);
  const fetchDelete = useServerFn(deleteProperty);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-props", companyId],
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
          reference_code: form.reference_code || null,
          title: form.title,
          description: form.description || null,
          operation: form.operation,
          property_type: form.property_type as any,
          status: form.status,
          sale_price: num(form.sale_price),
          rent_price: num(form.rent_price),
          condo_fee: num(form.condo_fee),
          iptu: num(form.iptu),
          area_total: num(form.area_total),
          area_useful: num(form.area_useful),
          bedrooms: Number(form.bedrooms) || 0,
          suites: Number(form.suites) || 0,
          bathrooms: Number(form.bathrooms) || 0,
          parking_spots: Number(form.parking_spots) || 0,
          address_line: form.address_line || null,
          neighborhood: form.neighborhood || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          features: form.features.split(",").map(s => s.trim()).filter(Boolean),
          photos: form.photos.split(/\s|,/).map(s => s.trim()).filter(Boolean),
          is_published: form.is_published,
        },
      });
    },
    onSuccess: () => {
      toast.success("Imóvel salvo. Buscando matches…");
      qc.invalidateQueries({ queryKey: ["realestate-props", companyId] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetchDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Imóvel excluído");
      qc.invalidateQueries({ queryKey: ["realestate-props", companyId] });
    },
  });

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Property) => {
    setForm({
      ...emptyForm,
      id: p.id,
      reference_code: p.reference_code ?? "",
      title: p.title,
      description: p.description ?? "",
      operation: p.operation as any,
      property_type: p.property_type,
      status: p.status as any,
      sale_price: p.sale_price?.toString() ?? "",
      rent_price: p.rent_price?.toString() ?? "",
      area_total: p.area_total?.toString() ?? "",
      area_useful: p.area_useful?.toString() ?? "",
      bedrooms: p.bedrooms,
      suites: p.suites,
      bathrooms: p.bathrooms,
      parking_spots: p.parking_spots,
      neighborhood: p.neighborhood ?? "",
      city: p.city ?? "",
      state: p.state ?? "",
      is_published: p.is_published,
    });
    setOpen(true);
  };

  const properties = (data?.properties ?? []) as Property[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Imóveis"
        description="Cadastro de imóveis disponíveis. Imóveis com status ‘ativo’ disparam matching com intenções de busca."
        
        action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo imóvel</Button>}
      />

      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : isLoading ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
      ) : properties.length === 0 ? (
        <EmptyState title="Nenhum imóvel" description="Comece cadastrando o primeiro imóvel." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.reference_code ? `Ref ${p.reference_code} · ` : ""}{p.neighborhood ?? "-"}, {p.city ?? "-"}
                  </div>
                </div>
                <Badge variant={p.status === "ativo" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
              <div className="text-sm flex flex-wrap gap-2">
                <Badge variant="outline">{p.operation}</Badge>
                <Badge variant="outline">{p.property_type}</Badge>
                <Badge variant="outline">{p.bedrooms}q · {p.bathrooms}b · {p.parking_spots}v</Badge>
              </div>
              <div className="text-sm font-medium">
                {p.operation === "locacao"
                  ? p.rent_price ? `R$ ${p.rent_price.toLocaleString("pt-BR")}/mês` : "—"
                  : p.sale_price ? `R$ ${p.sale_price.toLocaleString("pt-BR")}` : "—"}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar imóvel" : "Novo imóvel"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Código de referência</Label>
              <Input value={form.reference_code} onChange={(e) => setForm({ ...form, reference_code: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operação</Label>
              <Select value={form.operation} onValueChange={(v) => setForm({ ...form, operation: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OPERATIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de imóvel</Label>
              <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preço venda (R$)</Label>
              <Input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
            </div>
            <div>
              <Label>Preço locação (R$)</Label>
              <Input type="number" value={form.rent_price} onChange={(e) => setForm({ ...form, rent_price: e.target.value })} />
            </div>
            <div>
              <Label>Condomínio (R$)</Label>
              <Input type="number" value={form.condo_fee} onChange={(e) => setForm({ ...form, condo_fee: e.target.value })} />
            </div>
            <div>
              <Label>IPTU (R$)</Label>
              <Input type="number" value={form.iptu} onChange={(e) => setForm({ ...form, iptu: e.target.value })} />
            </div>
            <div>
              <Label>Área total (m²)</Label>
              <Input type="number" value={form.area_total} onChange={(e) => setForm({ ...form, area_total: e.target.value })} />
            </div>
            <div>
              <Label>Área útil (m²)</Label>
              <Input type="number" value={form.area_useful} onChange={(e) => setForm({ ...form, area_useful: e.target.value })} />
            </div>
            <div>
              <Label>Quartos</Label>
              <Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Suítes</Label>
              <Input type="number" value={form.suites} onChange={(e) => setForm({ ...form, suites: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Banheiros</Label>
              <Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Vagas</Label>
              <Input type="number" value={form.parking_spots} onChange={(e) => setForm({ ...form, parking_spots: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>UF</Label>
              <Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Características (separadas por vírgula)</Label>
              <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="piscina, churrasqueira, academia" />
            </div>
            <div className="md:col-span-2">
              <Label>Fotos (URLs separadas por espaço ou vírgula)</Label>
              <Textarea value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate()} disabled={!form.title || upsert.isPending}>
              {upsert.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
