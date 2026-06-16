import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { listCoreMenus, updateCoreMenu } from "@/lib/core-admin.functions";

export const Route = createFileRoute("/_authenticated/core/menus")({
  head: () => ({
    meta: [
      { title: "Menus dinâmicos — Core" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MenusPage,
});

type Menu = {
  id: string;
  label: string;
  icon: string | null;
  route: string | null;
  scope: string;
  sort_order: number;
  is_visible: boolean;
};

function MenusPage() {
  const list = useServerFn(listCoreMenus);
  const update = useServerFn(updateCoreMenu);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Menu[]>({
    queryKey: ["core-menus"],
    queryFn: () => list({ data: { scope: "core" } }) as any,
  });

  async function patch(id: string, patch: Record<string, unknown>) {
    try {
      await update({ data: { id, patch: patch as any } });
      toast.success("Menu atualizado");
      qc.invalidateQueries({ queryKey: ["core-menus"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Menus dinâmicos"
        description="Itens do menu /core. Editáveis sem deploy. Reordene pelo campo ordem."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <div className="col-span-1">Ord.</div>
          <div className="col-span-3">Rótulo</div>
          <div className="col-span-2">Ícone</div>
          <div className="col-span-4">Rota</div>
          <div className="col-span-2 text-right">Visível</div>
        </div>
        {(data ?? []).map((m) => (
          <div key={m.id} className="grid grid-cols-12 gap-2 items-center px-4 py-2 border-b last:border-0">
            <Input
              className="col-span-1 h-8"
              type="number"
              defaultValue={m.sort_order}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v !== m.sort_order) patch(m.id, { sort_order: v });
              }}
            />
            <Input
              className="col-span-3 h-8"
              defaultValue={m.label}
              onBlur={(e) => e.target.value !== m.label && patch(m.id, { label: e.target.value })}
            />
            <Input
              className="col-span-2 h-8"
              defaultValue={m.icon ?? ""}
              onBlur={(e) => e.target.value !== (m.icon ?? "") && patch(m.id, { icon: e.target.value || null })}
            />
            <Input
              className="col-span-4 h-8 font-mono text-xs"
              defaultValue={m.route ?? ""}
              onBlur={(e) => e.target.value !== (m.route ?? "") && patch(m.id, { route: e.target.value || null })}
            />
            <div className="col-span-2 flex justify-end">
              <Switch
                checked={m.is_visible}
                onCheckedChange={(v) => patch(m.id, { is_visible: v })}
              />
            </div>
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum menu cadastrado.</p>
        )}
      </Card>
    </div>
  );
}
