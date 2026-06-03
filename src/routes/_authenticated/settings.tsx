import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — Impulsionando" }] }),
  component: SettingsPage,
});

interface Definition {
  id: string; key: string; label: string; description: string | null;
  category: string; value_type: "text" | "number" | "boolean" | "json";
  default_value: unknown; is_company_editable: boolean; sort_order: number;
}

interface SettingRow {
  id: string; key: string; value: unknown; value_type: string; category: string;
}

function SettingsPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");
  const [dirty, setDirty] = useState<Record<string, unknown>>({});

  const { data: companies } = useQuery({
    queryKey: ["companies-opt-settings"],
    queryFn: async () => {
      const data = (await supabase.from("companies").select("id, name").order("name")).data ?? [];
      if (data.length && !companyId) setCompanyId(data[0].id);
      return data;
    },
  });

  const { data: defs } = useQuery({
    queryKey: ["setting-definitions"],
    queryFn: async () => (await supabase.from("setting_definitions").select("*").order("category").order("sort_order")).data as Definition[] ?? [],
  });

  const { data: settings } = useQuery({
    queryKey: ["company-settings", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("company_settings").select("id, key, value, value_type, category").eq("company_id", companyId)).data as SettingRow[] ?? [],
  });

  const settingMap = useMemo(() => new Map(settings?.map((s) => [s.key, s.value])), [settings]);
  const categories = useMemo(() => [...new Set(defs?.map((d) => d.category) ?? [])], [defs]);

  const upsert = useMutation({
    mutationFn: async (changes: { key: string; value: unknown; value_type: string; category: string }[]) => {
      if (!changes.length) return;
      const rows = changes.map((c) => ({
        company_id: companyId, key: c.key, value: c.value as never,
        value_type: c.value_type, category: c.category,
      }));
      const { error } = await supabase.from("company_settings").upsert(rows, { onConflict: "company_id,key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      setDirty({});
      qc.invalidateQueries({ queryKey: ["company-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function valueOf(def: Definition): unknown {
    if (def.key in dirty) return dirty[def.key];
    if (settingMap.has(def.key)) return settingMap.get(def.key);
    return def.default_value;
  }

  function setVal(key: string, v: unknown) { setDirty((d) => ({ ...d, [key]: v })); }

  function save() {
    if (!defs) return;
    const changes = Object.entries(dirty).map(([key, value]) => {
      const def = defs.find((d) => d.key === key)!;
      return { key, value, value_type: def.value_type, category: def.category };
    });
    upsert.mutate(changes);
  }

  const dirtyCount = Object.keys(dirty).length;

  if (!companies?.length) return <EmptyState title="Nenhuma empresa" description="Crie uma empresa antes de parametrizar." />;

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Central de parametrização por empresa."
        action={
          <div className="flex gap-2 items-center">
            {dirtyCount > 0 && <Badge variant="outline">{dirtyCount} alteração(ões)</Badge>}
            <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setDirty({}); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" disabled={!dirtyCount} onClick={() => setDirty({})}><RotateCcw className="w-4 h-4 mr-1" />Descartar</Button>
            <Button className="bg-gradient-primary shadow-elegant" disabled={!dirtyCount || upsert.isPending} onClick={save}>
              <Save className="w-4 h-4 mr-2" />Salvar
            </Button>
          </div>
        }
      />

      <Tabs defaultValue={categories[0] ?? "geral"} className="space-y-4">
        <TabsList>{categories.map((c) => <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>)}</TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <Card className="shadow-card divide-y">
              {defs?.filter((d) => d.category === cat).map((def) => {
                const v = valueOf(def);
                const editable = me?.isSuperAdmin || def.is_company_editable;
                return (
                  <div key={def.id} className="p-4 grid md:grid-cols-[1fr_320px] gap-4 items-center">
                    <div>
                      <Label className="text-sm font-medium">{def.label}</Label>
                      <div className="font-mono text-[10px] text-muted-foreground">{def.key}</div>
                      {def.description && <p className="text-xs text-muted-foreground mt-1">{def.description}</p>}
                    </div>
                    <div>
                      {def.value_type === "boolean" ? (
                        <div className="flex items-center gap-3 border rounded-md px-3 py-2">
                          <Switch checked={!!v} disabled={!editable} onCheckedChange={(b) => setVal(def.key, b)} />
                          <span className="text-sm">{v ? "Ativo" : "Inativo"}</span>
                        </div>
                      ) : def.value_type === "number" ? (
                        <Input type="number" disabled={!editable} value={typeof v === "number" ? v : Number(v) || 0}
                          onChange={(e) => setVal(def.key, Number(e.target.value))} />
                      ) : (
                        <Input disabled={!editable} value={typeof v === "string" ? v : JSON.stringify(v) ?? ""}
                          onChange={(e) => setVal(def.key, e.target.value)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
