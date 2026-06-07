import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SettingDef {
  id: string;
  key: string;
  label: string;
  description: string | null;
  category: string;
  value_type: "text" | "number" | "boolean" | "json";
  default_value: unknown;
  sort_order: number;
}

interface CompanySetting {
  key: string;
  value: unknown;
}

const CATEGORY_LABELS: Record<string, string> = {
  agenda: "Agenda",
  comunicacao: "Comunicação",
  financeiro: "Financeiro",
  portal: "Portal do Cliente",
  relatorios: "Relatórios",
  operacao: "Operação",
  notificacoes: "Notificações",
  seguranca: "Segurança",
  aparencia: "Aparência",
  geral: "Geral",
};

function jsonValue(v: unknown): unknown {
  return v;
}

export function ClientSettingsPanel({ companyId }: { companyId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["company-settings", companyId],
    queryFn: async () => {
      const [defs, vals] = await Promise.all([
        supabase.from("setting_definitions").select("*").order("category").order("sort_order"),
        supabase.from("company_settings").select("key, value").eq("company_id", companyId),
      ]);
      if (defs.error) throw defs.error;
      if (vals.error) throw vals.error;
      return {
        definitions: (defs.data ?? []) as SettingDef[],
        values: new Map((vals.data ?? []).map((r: CompanySetting) => [r.key, r.value])),
      };
    },
  });

  const upsert = useMutation({
    mutationFn: async ({ def, value }: { def: SettingDef; value: unknown }) => {
      const { error } = await supabase.from("company_settings").upsert(
        {
          company_id: companyId,
          key: def.key,
          value: jsonValue(value) as never,
          value_type: def.value_type,
          category: def.category,
        },
        { onConflict: "company_id,key" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-settings", companyId] });
      toast.success("Parâmetro atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Card className="p-4">Carregando parâmetros…</Card>;

  const defs = data?.definitions ?? [];
  const values = data?.values ?? new Map();

  const grouped = defs.reduce<Record<string, SettingDef[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{CATEGORY_LABELS[cat] ?? cat}</h3>
            <Badge variant="outline">{items.length}</Badge>
          </div>
          <div className="space-y-3">
            {items.map((d) => {
              const current = values.has(d.key) ? values.get(d.key) : d.default_value;
              return (
                <div key={d.key} className="flex items-start justify-between gap-4 border-b last:border-0 pb-3 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Label className="font-medium">{d.label}</Label>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">{d.key}</p>
                  </div>
                  <div className="shrink-0">
                    {d.value_type === "boolean" && (
                      <Switch
                        checked={current === true || current === "true"}
                        onCheckedChange={(v) => upsert.mutate({ def: d, value: v })}
                      />
                    )}
                    {d.value_type === "number" && (
                      <Input
                        type="number"
                        defaultValue={String(current ?? "")}
                        className="w-28"
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) upsert.mutate({ def: d, value: n });
                        }}
                      />
                    )}
                    {d.value_type === "text" && (
                      <Input
                        defaultValue={String(current ?? "")}
                        className="w-56"
                        onBlur={(e) => upsert.mutate({ def: d, value: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {defs.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground text-center">
          Nenhum parâmetro definido ainda.
        </Card>
      )}
    </div>
  );
}
