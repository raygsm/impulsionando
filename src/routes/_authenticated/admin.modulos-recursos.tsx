import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listModulesClassification, updateModuleClassification } from "@/lib/modules-classification.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin/modulos-recursos")({
  component: ModulosRecursosPage,
});

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  kind: "module" | "resource";
  parent_module_id: string | null;
  is_active: boolean;
};

function ModulosRecursosPage() {
  const fetchFn = useServerFn(listModulesClassification);
  const updateFn = useServerFn(updateModuleClassification);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["modules-classification"],
    queryFn: () => fetchFn(),
  });

  const items = (data?.items ?? []) as Row[];
  const modules = useMemo(() => items.filter((i) => i.kind === "module"), [items]);

  const mutation = useMutation({
    mutationFn: (v: { id: string; kind: "module" | "resource"; parent_module_id?: string | null }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Classificação atualizada");
      qc.invalidateQueries({ queryKey: ["modules-classification"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const counts = {
    modules: items.filter((i) => i.kind === "module").length,
    resources: items.filter((i) => i.kind === "resource").length,
    orphans: items.filter((i) => i.kind === "resource" && !i.parent_module_id).length,
  };

  return (
    <>
      <PageHeader
        title="Módulos vs Recursos"
        description="Diferencie unidades comerciais (Módulos) de sub-funcionalidades (Recursos). Recursos podem ser vinculados a um módulo pai."
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Módulos</div>
          <div className="text-2xl font-bold mt-1">{counts.modules}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Recursos</div>
          <div className="text-2xl font-bold mt-1">{counts.resources}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Recursos sem pai</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{counts.orphans}</div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-2.5">Nome</th>
              <th className="p-2.5">Categoria</th>
              <th className="p-2.5 w-40">Tipo</th>
              <th className="p-2.5 w-64">Módulo pai (se Recurso)</th>
              <th className="p-2.5 w-20">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2.5">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.slug}</div>
                </td>
                <td className="p-2.5 text-muted-foreground">{row.category ?? "—"}</td>
                <td className="p-2.5">
                  <Select
                    value={row.kind}
                    onValueChange={(v) =>
                      mutation.mutate({ id: row.id, kind: v as "module" | "resource", parent_module_id: row.parent_module_id })
                    }
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="module">Módulo</SelectItem>
                      <SelectItem value="resource">Recurso</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2.5">
                  {row.kind === "resource" ? (
                    <Select
                      value={row.parent_module_id ?? "none"}
                      onValueChange={(v) =>
                        mutation.mutate({ id: row.id, kind: "resource", parent_module_id: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger className="h-8"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— sem pai —</SelectItem>
                        {modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">n/a</span>
                  )}
                </td>
                <td className="p-2.5">
                  <Badge variant={row.is_active ? "default" : "outline"}>{row.is_active ? "sim" : "não"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
