import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { listCoreFlags, updateCoreFlag } from "@/lib/core-admin.functions";

export const Route = createFileRoute("/_authenticated/core/flags")({
  head: () => ({
    meta: [
      { title: "Flags SIM/NÃO — Core" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FlagsPage,
});

type Flag = {
  id: string;
  module_slug: string | null;
  key: string;
  label: string;
  description: string | null;
  default_value: boolean;
  category: string;
  is_active: boolean;
};

function FlagsPage() {
  const list = useServerFn(listCoreFlags);
  const update = useServerFn(updateCoreFlag);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Flag[]>({
    queryKey: ["core-flags"],
    queryFn: () => list() as any,
  });

  async function patch(id: string, patch: Record<string, unknown>) {
    try {
      await update({ data: { id, patch: patch as any } });
      toast.success("Flag atualizada");
      qc.invalidateQueries({ queryKey: ["core-flags"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  const grouped = (data ?? []).reduce<Record<string, Flag[]>>((acc, f) => {
    const key = f.module_slug ?? "global";
    (acc[key] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Flags SIM/NÃO"
        description="Catálogo de parâmetros booleanos por módulo. O valor padrão pode ser sobrescrito por empresa."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {Object.entries(grouped).map(([mod, flags]) => (
        <Card key={mod} className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Módulo: {mod}</h2>
          </div>
          {flags.map((f) => (
            <div key={f.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b last:border-0">
              <div className="col-span-5">
                <Input
                  className="h-8"
                  defaultValue={f.label}
                  onBlur={(e) =>
                    e.target.value !== f.label && patch(f.id, { label: e.target.value })
                  }
                />
                <p className="text-[10px] text-muted-foreground font-mono mt-1">{f.key}</p>
              </div>
              <Input
                className="col-span-4 h-8 text-xs"
                defaultValue={f.description ?? ""}
                placeholder="Descrição"
                onBlur={(e) =>
                  e.target.value !== (f.description ?? "") &&
                  patch(f.id, { description: e.target.value || null })
                }
              />
              <Input
                className="col-span-1 h-8 text-xs"
                defaultValue={f.category}
                onBlur={(e) => e.target.value !== f.category && patch(f.id, { category: e.target.value })}
              />
              <div className="col-span-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Padrão</span>
                <Switch
                  checked={f.default_value}
                  onCheckedChange={(v) => patch(f.id, { default_value: v })}
                />
              </div>
              <div className="col-span-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Ativa</span>
                <Switch
                  checked={f.is_active}
                  onCheckedChange={(v) => patch(f.id, { is_active: v })}
                />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
