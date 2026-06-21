import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProperties, upsertProperty, deleteProperty, submitPropertyForReview, seedRealestateDemo, removeRealestateDemo } from "@/lib/realestate.functions";
import { Link } from "@tanstack/react-router";
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
import { Plus, Trash2, Pencil, Radio } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeAvailability } from "@/hooks/use-realtime-availability";

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
  approval_status?: "pending" | "approved" | "changes_requested" | "rejected" | null;
  review_notes?: string | null;
};

const APPROVAL_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Aprovado", variant: "default" },
  pending: { label: "Aguardando aprovação", variant: "secondary" },
  changes_requested: { label: "Ajustes solicitados", variant: "outline" },
  rejected: { label: "Rejeitado", variant: "destructive" },
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
  const fetchSubmit = useServerFn(submitPropertyForReview);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-props", companyId],
    enabled: !!companyId,
    queryFn: () => fetchList({ data: { companyId } }),
  });

  const { liveOn } = useRealtimeAvailability({
    table: "realestate_properties",
    filter: { column: "company_id", value: companyId },
    queryKey: ["realestate-props", companyId],
    enabled: !!companyId,
  });

  const submitReview = useMutation({
    mutationFn: (id: string) => fetchSubmit({ data: { propertyId: id } }),
    onSuccess: () => {
      toast.success("Enviado para aprovação");
      qc.invalidateQueries({ queryKey: ["realestate-props", companyId] });
      qc.invalidateQueries({ queryKey: ["realestate-approvals", companyId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
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
        description="Cadastro de imóveis disponíveis. Imóveis aprovados ficam públicos e disparam matching."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/imobiliaria/aprovacoes">Fila de aprovação</Link>
            </Button>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo imóvel</Button>
          </div>
        }
      />

      {!companyId ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Selecione uma empresa.</p></Card>
      ) : isLoading ? (
        <Card className="p-6"><p className="text-sm text-muted-foreground">Carregando…</p></Card>
      ) : properties.length === 0 ? (
        <DemoSeedCard companyId={companyId} onSeeded={() => qc.invalidateQueries({ queryKey: ["realestate-properties"] })} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const ap = APPROVAL_LABEL[p.approval_status ?? "approved"] ?? APPROVAL_LABEL.approved;
            const canSubmit = !p.approval_status || p.approval_status === "changes_requested" || p.approval_status === "rejected";
            return (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.reference_code ? `Ref ${p.reference_code} · ` : ""}{p.neighborhood ?? "-"}, {p.city ?? "-"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={p.status === "ativo" ? "default" : "secondary"}>{p.status}</Badge>
                  <Badge variant={ap.variant}>{ap.label}</Badge>
                </div>
              </div>
              {p.review_notes && (p.approval_status === "changes_requested" || p.approval_status === "rejected") && (
                <div className="text-xs rounded border border-amber-200 bg-amber-50 p-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900">
                  <span className="font-medium">Revisor:</span> {p.review_notes}
                </div>
              )}
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
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
                {canSubmit && (
                  <Button size="sm" onClick={() => submitReview.mutate(p.id)} disabled={submitReview.isPending}>
                    Enviar p/ aprovação
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          );})}
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

function DemoSeedCard({ companyId, onSeeded }: { companyId: string; onSeeded: () => void }) {
  const seedFn = useServerFn(seedRealestateDemo);
  const removeFn = useServerFn(removeRealestateDemo);
  const seed = useMutation({
    mutationFn: () => seedFn({ data: { companyId } }),
    onSuccess: (r) => { toast.success(`Dados demo criados: ${r.properties} imóveis, ${r.intents} intenções, ${r.brokers} parceiros`); onSeeded(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const remove = useMutation({
    mutationFn: () => removeFn({ data: { companyId } }),
    onSuccess: () => { toast.success("Dados demo removidos"); onSeeded(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  return (
    <Card className="p-8 text-center space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Comece com dados demo</h3>
        <p className="text-sm text-muted-foreground">Crie 6 imóveis, 4 intenções de busca e 2 corretores parceiros para explorar todas as funcionalidades.</p>
      </div>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => seed.mutate()} disabled={seed.isPending}>{seed.isPending ? "Criando…" : "Criar dados demo"}</Button>
        <Button variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending}>Remover demo</Button>
        <Button variant="ghost" onClick={() => document.querySelector<HTMLButtonElement>('button[data-new-property]')?.click()}>
          <Plus className="w-4 h-4 mr-1" />Cadastrar do zero
        </Button>
      </div>
    </Card>
  );
}

