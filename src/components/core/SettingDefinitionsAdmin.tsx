import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { upsertSettingDefinition, deleteSettingDefinition } from "@/lib/operations.functions";

type Def = {
  key: string;
  label: string;
  description: string | null;
  category: string | null;
  value_type: "boolean" | "text" | "number" | "json";
  default_value: unknown;
  is_company_editable: boolean;
  sort_order: number;
};

export function SettingDefinitionsAdmin({ defaultCategory }: { defaultCategory?: string }) {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertSettingDefinition);
  const remove = useServerFn(deleteSettingDefinition);
  const [editing, setEditing] = useState<Partial<Def> | null>(null);

  const { data: defs, isLoading } = useQuery({
    queryKey: ["setting-defs", defaultCategory ?? "all"],
    queryFn: async () => {
      let q = supabase.from("setting_definitions").select("*").order("sort_order").order("key");
      if (defaultCategory) q = q.eq("category", defaultCategory);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Def[];
    },
  });

  const saveMut = useMutation({
    mutationFn: (d: Partial<Def>) => upsert({ data: d as never }),
    onSuccess: () => {
      toast.success("Parâmetro salvo");
      qc.invalidateQueries({ queryKey: ["setting-defs"] });
      qc.invalidateQueries({ queryKey: ["company-settings"] });
      setEditing(null);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (key: string) => remove({ data: { key } }),
    onSuccess: () => {
      toast.success("Parâmetro removido");
      qc.invalidateQueries({ queryKey: ["setting-defs"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Erro"),
  });

  if (isLoading) return <Card className="p-4">Carregando definições…</Card>;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Definições de parâmetro</h3>
          <p className="text-xs text-muted-foreground">
            Criar aqui um parâmetro o expõe automaticamente em todos os clientes.
          </p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({ value_type: "boolean", is_company_editable: true, category: defaultCategory ?? "" })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing?.key ? "Editar parâmetro" : "Novo parâmetro"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <DefForm
                initial={editing}
                onSave={(d) => saveMut.mutate(d)}
                saving={saveMut.isPending}
                lockKey={!!(editing as Def).key && defs?.some((x) => x.key === editing.key)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="divide-y">
        {(defs ?? []).map((d) => (
          <div key={d.key} className="py-2 flex items-center gap-2 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{d.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                <code>{d.key}</code> · {d.value_type}
                {d.category && <> · {d.category}</>}
              </div>
            </div>
            <Badge variant="outline">{String(d.default_value ?? "—")}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Excluir parâmetro ${d.key}?`)) deleteMut.mutate(d.key);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        {(defs ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Sem parâmetros nesta categoria.</p>
        )}
      </div>
    </Card>
  );
}

function DefForm({
  initial, onSave, saving, lockKey,
}: {
  initial: Partial<Def>;
  onSave: (d: Partial<Def>) => void;
  saving: boolean;
  lockKey: boolean;
}) {
  const [d, setD] = useState<Partial<Def>>(initial);
  const set = <K extends keyof Def>(k: K, v: Def[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Chave</Label>
          <Input
            value={d.key ?? ""}
            onChange={(e) => set("key", e.target.value as never)}
            placeholder="agenda.exigir_pagamento"
            disabled={lockKey}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={d.value_type ?? "boolean"} onValueChange={(v) => set("value_type", v as never)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">Sim / Não</SelectItem>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Rótulo</Label>
        <Input value={d.label ?? ""} onChange={(e) => set("label", e.target.value as never)} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={d.description ?? ""} onChange={(e) => set("description", e.target.value as never)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Categoria</Label>
          <Input value={d.category ?? ""} onChange={(e) => set("category", e.target.value as never)} placeholder="agenda" />
        </div>
        <div>
          <Label>Valor padrão</Label>
          {d.value_type === "boolean" ? (
            <div className="flex items-center h-9">
              <Switch
                checked={Boolean(d.default_value)}
                onCheckedChange={(v) => set("default_value", v as never)}
              />
            </div>
          ) : (
            <Input
              value={d.default_value == null ? "" : String(d.default_value)}
              onChange={(e) =>
                set(
                  "default_value",
                  (d.value_type === "number" ? Number(e.target.value) : e.target.value) as never,
                )
              }
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={d.is_company_editable ?? true}
          onCheckedChange={(v) => set("is_company_editable", v as never)}
        />
        <Label className="text-sm">Editável por cliente</Label>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSave(d)}
          disabled={saving || !d.key || !d.label || !d.value_type}
        >
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
    </div>
  );
}
