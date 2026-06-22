import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFieldDefinitions, FIELD_TYPE_LABELS, FIELD_TYPES, type FieldType, type FieldDefinition } from "@/hooks/use-field-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, List } from "lucide-react";

const ENTITIES = [
  { key: "product", label: "Produtos" },
  { key: "customer", label: "Clientes" },
  { key: "supplier", label: "Fornecedores" },
  { key: "technician", label: "Técnicos" },
  { key: "candidate", label: "Candidatos (RH)" },
  { key: "hospital", label: "Hospitais / Clínicas" },
  { key: "service_order", label: "Ordens de serviço" },
];

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/configuracoes-campos")({
  head: () => ({ meta: [{ title: "Rio Med · Campos e Formulários" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='field-config' title='Configurações de Campos RioMed'><Page /></TenantModuleShell>),
});

function Page() {
  const [entity, setEntity] = useState("product");
  const { data: tenant } = useQuery({
    queryKey: ["tenant", "riomed-company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("core_tenant_identity")
        .select("company_id")
        .eq("subdomain", "riomed")
        .maybeSingle();
      return data;
    },
  });

  const companyId = tenant?.company_id ?? null;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Campos e Formulários</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre, edite, ative/desative, reordene e configure validações de qualquer formulário do Rio Med — sem programador.
        </p>
      </header>

      <Tabs value={entity} onValueChange={setEntity}>
        <TabsList className="flex flex-wrap h-auto">
          {ENTITIES.map((e) => (
            <TabsTrigger key={e.key} value={e.key}>{e.label}</TabsTrigger>
          ))}
        </TabsList>

        {ENTITIES.map((e) => (
          <TabsContent key={e.key} value={e.key}>
            <EntityFields companyId={companyId} entity={e.key} entityLabel={e.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EntityFields({ companyId, entity, entityLabel }: { companyId: string | null; entity: string; entityLabel: string }) {
  const qc = useQueryClient();
  const { data: fields = [], isLoading } = useFieldDefinitions(companyId, entity);
  const [editing, setEditing] = useState<FieldDefinition | null>(null);
  const [creating, setCreating] = useState(false);
  const [optionsFor, setOptionsFor] = useState<FieldDefinition | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["field-definitions", companyId, entity] });

  const toggle = useMutation({
    mutationFn: async (f: FieldDefinition) => {
      const { error } = await supabase
        .from("core_field_definitions")
        .update({ is_active: !f.is_active })
        .eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Campo atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (f: FieldDefinition) => {
      if (f.is_system) throw new Error("Campo do sistema não pode ser excluído — apenas desativado.");
      const { error } = await supabase.from("core_field_definitions").delete().eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Campo excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ f, dir }: { f: FieldDefinition; dir: "up" | "down" }) => {
      const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
      const idx = sorted.findIndex((x) => x.id === f.id);
      const target = dir === "up" ? sorted[idx - 1] : sorted[idx + 1];
      if (!target) return;
      const { error: e1 } = await supabase.from("core_field_definitions").update({ sort_order: target.sort_order }).eq("id", f.id);
      const { error: e2 } = await supabase.from("core_field_definitions").update({ sort_order: f.sort_order }).eq("id", target.id);
      if (e1 || e2) throw e1 ?? e2;
    },
    onSuccess: invalidate,
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{entityLabel}</CardTitle>
          <p className="text-sm text-muted-foreground">{fields.length} campos configurados</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={!companyId}>
          <Plus className="h-4 w-4 mr-2" /> Novo campo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : fields.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">Nenhum campo configurado ainda.</p>
        ) : (
          <div className="divide-y">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-3">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder.mutate({ f, dir: "up" })}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder.mutate({ f, dir: "down" })}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{f.label}</span>
                    <code className="text-xs text-muted-foreground">{f.key}</code>
                    <Badge variant="secondary">{FIELD_TYPE_LABELS[f.field_type]}</Badge>
                    {f.section && <Badge variant="outline">{f.section}</Badge>}
                    {f.is_required && <Badge variant="destructive">Obrigatório</Badge>}
                    {f.is_system && <Badge variant="outline">Sistema</Badge>}
                    {!f.is_active && <Badge variant="outline" className="opacity-60">Inativo</Badge>}
                    <Badge variant="outline" className="capitalize">{f.visibility}</Badge>
                  </div>
                  {f.help_text && <p className="text-xs text-muted-foreground mt-1">{f.help_text}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {(f.field_type === "select" || f.field_type === "multiselect") && (
                    <Button size="icon" variant="ghost" onClick={() => setOptionsFor(f)} title="Gerenciar opções">
                      <List className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch checked={f.is_active} onCheckedChange={() => toggle.mutate(f)} />
                  <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Excluir "${f.label}"?`)) remove.mutate(f);
                    }}
                    disabled={f.is_system}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <FieldDialog
        open={creating || editing !== null}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        companyId={companyId}
        entity={entity}
        field={editing}
        onSaved={invalidate}
        maxSortOrder={fields.reduce((m, f) => Math.max(m, f.sort_order), 0)}
      />

      {optionsFor && (
        <OptionsDialog
          field={optionsFor}
          open={true}
          onOpenChange={(o) => { if (!o) setOptionsFor(null); }}
          onSaved={invalidate}
        />
      )}
    </Card>
  );
}

function FieldDialog({
  open, onOpenChange, companyId, entity, field, onSaved, maxSortOrder,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string | null;
  entity: string;
  field: FieldDefinition | null;
  onSaved: () => void;
  maxSortOrder: number;
}) {
  const [form, setForm] = useState<Partial<FieldDefinition>>({});

  useEffect(() => {
    if (open) setForm(field ?? {});
  }, [open, field]);

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Empresa não identificada");
      if (!form.key || !form.label) throw new Error("Chave e rótulo são obrigatórios");
      const payload = {
        company_id: companyId,
        entity,
        key: form.key,
        label: form.label,
        field_type: form.field_type ?? "text",
        section: form.section ?? null,
        is_required: form.is_required ?? false,
        is_active: form.is_active ?? true,
        visibility: form.visibility ?? "team",
        help_text: form.help_text ?? null,
        placeholder: form.placeholder ?? null,
        example: form.example ?? null,
        sort_order: form.sort_order ?? maxSortOrder + 10,
      };
      if (field) {
        const { error } = await supabase.from("core_field_definitions").update(payload).eq("id", field.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("core_field_definitions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(field ? "Campo atualizado" : "Campo criado");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = <K extends keyof FieldDefinition>(k: K, v: FieldDefinition[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{field ? "Editar campo" : "Novo campo"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rótulo *</Label>
              <Input value={form.label ?? ""} onChange={(e) => upd("label", e.target.value)} placeholder="Ex.: Marca do produto" />
            </div>
            <div>
              <Label>Chave técnica *</Label>
              <Input value={form.key ?? ""} disabled={Boolean(field?.is_system)}
                onChange={(e) => upd("key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                placeholder="ex_marca" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.field_type ?? "text"} onValueChange={(v) => upd("field_type", v as FieldType)} disabled={Boolean(field?.is_system)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{FIELD_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Seção</Label>
              <Input value={form.section ?? ""} onChange={(e) => upd("section", e.target.value)} placeholder="Identificação, Estoque, Preço…" />
            </div>
            <div>
              <Label>Visibilidade</Label>
              <Select value={form.visibility ?? "team"} onValueChange={(v) => upd("visibility", v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (cliente vê)</SelectItem>
                  <SelectItem value="team">Equipe interna</SelectItem>
                  <SelectItem value="manager">Apenas gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.is_required ?? false} onCheckedChange={(v) => upd("is_required", v)} />
              <Label>Obrigatório</Label>
            </div>
          </div>

          <div>
            <Label>Placeholder</Label>
            <Input value={form.placeholder ?? ""} onChange={(e) => upd("placeholder", e.target.value)} />
          </div>
          <div>
            <Label>Exemplo de preenchimento</Label>
            <Input value={form.example ?? ""} onChange={(e) => upd("example", e.target.value)} />
          </div>
          <div>
            <Label>Ajuda explicativa</Label>
            <Textarea value={form.help_text ?? ""} onChange={(e) => upd("help_text", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OptionsDialog({
  field, open, onOpenChange, onSaved,
}: {
  field: FieldDefinition;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const { data: opts = [] } = useQuery({
    queryKey: ["field-options", field.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("core_field_options")
        .select("*")
        .eq("field_id", field.id)
        .order("sort_order");
      return data ?? [];
    },
  });

  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["field-options", field.id] });
    onSaved();
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!newVal || !newLabel) throw new Error("Preencha valor e rótulo");
      const sort = opts.reduce((m, o) => Math.max(m, o.sort_order), 0) + 10;
      const { error } = await supabase.from("core_field_options").insert({
        field_id: field.id, value: newVal, label: newLabel, sort_order: sort,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewVal(""); setNewLabel(""); refresh(); toast.success("Opção adicionada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("core_field_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Opção removida"); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Opções de “{field.label}”</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {opts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma opção cadastrada.</p>}
          {opts.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 border rounded px-3 py-2">
              <div>
                <p className="font-medium">{o.label}</p>
                <code className="text-xs text-muted-foreground">{o.value}</code>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Input placeholder="Valor (ex.: hospital)" value={newVal}
              onChange={(e) => setNewVal(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_"))} />
            <Input placeholder="Rótulo (ex.: Hospital)" value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar opção
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
