import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import {
  listTenantsForFlags,
  listFlagsForTenant,
  upsertFlagOverride,
  clearFlagOverride,
} from "@/lib/flag-overrides.functions";

export const Route = createFileRoute("/_authenticated/admin/flags-tenants")({
  head: () => ({
    meta: [
      { title: "Flags por Tenant — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FlagsTenantsPage,
});

type Tenant = { id: string; name: string; public_slug: string | null; logo_url: string | null };
type FlagRow = {
  id: string;
  module_slug: string | null;
  key: string;
  label: string;
  description: string | null;
  default_value: boolean;
  category: string;
  override_id: string | null;
  override_value: boolean | null;
  override_reason: string | null;
  effective_value: boolean;
};

function FlagsTenantsPage() {
  const listTenants = useServerFn(listTenantsForFlags);
  const listFlags = useServerFn(listFlagsForTenant);
  const upsert = useServerFn(upsertFlagOverride);
  const clear = useServerFn(clearFlagOverride);
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const tenantsQ = useQuery<Tenant[]>({
    queryKey: ["flag-overrides-tenants"],
    queryFn: () => listTenants() as any,
  });

  const flagsQ = useQuery<FlagRow[]>({
    queryKey: ["flag-overrides", selected],
    queryFn: () => listFlags({ data: { companyId: selected! } }) as any,
    enabled: !!selected,
  });

  const filteredTenants = useMemo(() => {
    const list = tenantsQ.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((t) => t.name.toLowerCase().includes(q) || (t.public_slug ?? "").includes(q));
  }, [tenantsQ.data, search]);

  const grouped = useMemo(() => {
    return (flagsQ.data ?? []).reduce<Record<string, FlagRow[]>>((acc, f) => {
      const k = f.module_slug ?? "global";
      (acc[k] ??= []).push(f);
      return acc;
    }, {});
  }, [flagsQ.data]);

  async function toggleFlag(f: FlagRow, value: boolean) {
    if (!selected) return;
    try {
      await upsert({ data: { companyId: selected, flagId: f.id, value, reason: null } });
      toast.success(`Override aplicado: ${f.label} = ${value ? "ON" : "OFF"}`);
      qc.invalidateQueries({ queryKey: ["flag-overrides", selected] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  async function resetFlag(f: FlagRow) {
    if (!selected) return;
    try {
      await clear({ data: { companyId: selected, flagId: f.id } });
      toast.success(`Override removido: ${f.label}`);
      qc.invalidateQueries({ queryKey: ["flag-overrides", selected] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  const activeTenant = (tenantsQ.data ?? []).find((t) => t.id === selected);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Flags por Tenant"
        description="Override de feature flags por cliente. Quando não há override, vale o valor padrão do catálogo."
      />
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4 lg:col-span-3 p-0 overflow-hidden flex flex-col max-h-[75vh]">
          <div className="p-3 border-b">
            <Input
              placeholder="Buscar tenant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {tenantsQ.isLoading && (
              <p className="p-3 text-xs text-muted-foreground">Carregando…</p>
            )}
            {filteredTenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`w-full text-left px-3 py-2 border-b last:border-0 text-sm hover:bg-muted/50 ${
                  selected === t.id ? "bg-muted font-medium" : ""
                }`}
              >
                <div>{t.name}</div>
                {t.public_slug && (
                  <div className="text-[10px] text-muted-foreground font-mono">{t.public_slug}</div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="col-span-8 lg:col-span-9 p-0 overflow-hidden">
          {!selected && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Selecione um tenant à esquerda para gerenciar overrides.
            </div>
          )}
          {selected && (
            <>
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{activeTenant?.name}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Toggle aplica override; clicar em "Reset" volta ao padrão.
                  </p>
                </div>
                {flagsQ.data && (
                  <Badge variant="outline" className="text-xs">
                    {flagsQ.data.filter((f) => f.override_id).length} overrides ativos
                  </Badge>
                )}
              </div>
              <div className="max-h-[68vh] overflow-y-auto">
                {flagsQ.isLoading && <p className="p-4 text-xs text-muted-foreground">Carregando flags…</p>}
                {Object.entries(grouped).map(([mod, flags]) => (
                  <div key={mod}>
                    <div className="px-4 py-2 bg-muted/20 border-b text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {mod}
                    </div>
                    {flags.map((f) => {
                      const isOverridden = !!f.override_id;
                      return (
                        <div
                          key={f.id}
                          className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b last:border-0"
                        >
                          <div className="col-span-6">
                            <div className="text-sm font-medium">{f.label}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{f.key}</div>
                            {f.description && (
                              <div className="text-[11px] text-muted-foreground mt-1">{f.description}</div>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="text-[10px] text-muted-foreground">Padrão</div>
                            <Badge variant={f.default_value ? "default" : "secondary"} className="text-xs">
                              {f.default_value ? "ON" : "OFF"}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="text-[10px] text-muted-foreground">Efetivo</div>
                            <Badge
                              variant={f.effective_value ? "default" : "secondary"}
                              className={`text-xs ${isOverridden ? "ring-2 ring-amber-400" : ""}`}
                            >
                              {f.effective_value ? "ON" : "OFF"}
                            </Badge>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <Switch
                              checked={f.effective_value}
                              onCheckedChange={(v) => toggleFlag(f, v)}
                            />
                            {isOverridden && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetFlag(f)}
                                title="Voltar ao padrão"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
