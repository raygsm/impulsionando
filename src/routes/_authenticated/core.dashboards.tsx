import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { listCoreWidgets, updateCoreWidget } from "@/lib/core-admin.functions";

export const Route = createFileRoute("/_authenticated/core/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards editáveis — Core" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardsPage,
});

type Widget = {
  id: string;
  dashboard_key: string;
  widget_key: string;
  title: string;
  description: string | null;
  widget_type: string;
  data_source: string | null;
  sort_order: number;
  is_visible: boolean;
};

function DashboardsPage() {
  const list = useServerFn(listCoreWidgets);
  const update = useServerFn(updateCoreWidget);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Widget[]>({
    queryKey: ["core-widgets"],
    queryFn: () => list() as any,
  });

  async function patch(id: string, patch: Record<string, unknown>) {
    try {
      await update({ data: { id, patch: patch as any } });
      toast.success("Widget atualizado");
      qc.invalidateQueries({ queryKey: ["core-widgets"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  const grouped = (data ?? []).reduce<Record<string, Widget[]>>((acc, w) => {
    (acc[w.dashboard_key] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Dashboards editáveis"
        description="Widgets exibidos em cada dashboard. Edite título, fonte de dados, ordem e visibilidade."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {Object.entries(grouped).map(([dash, widgets]) => (
        <Card key={dash} className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Dashboard: {dash}</h2>
          </div>
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-1">Ord.</div>
            <div className="col-span-3">Título</div>
            <div className="col-span-4">Descrição</div>
            <div className="col-span-3">Fonte de dados</div>
            <div className="col-span-1 text-right">Visível</div>
          </div>
          {widgets.map((w) => (
            <div key={w.id} className="grid grid-cols-12 gap-2 items-center px-4 py-2 border-b last:border-0">
              <Input
                className="col-span-1 h-8"
                type="number"
                defaultValue={w.sort_order}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== w.sort_order) patch(w.id, { sort_order: v });
                }}
              />
              <Input
                className="col-span-3 h-8"
                defaultValue={w.title}
                onBlur={(e) => e.target.value !== w.title && patch(w.id, { title: e.target.value })}
              />
              <Input
                className="col-span-4 h-8 text-xs"
                defaultValue={w.description ?? ""}
                onBlur={(e) =>
                  e.target.value !== (w.description ?? "") &&
                  patch(w.id, { description: e.target.value || null })
                }
              />
              <Input
                className="col-span-3 h-8 font-mono text-xs"
                defaultValue={w.data_source ?? ""}
                onBlur={(e) =>
                  e.target.value !== (w.data_source ?? "") &&
                  patch(w.id, { data_source: e.target.value || null })
                }
              />
              <div className="col-span-1 flex justify-end">
                <Switch
                  checked={w.is_visible}
                  onCheckedChange={(v) => patch(w.id, { is_visible: v })}
                />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
