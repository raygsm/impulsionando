import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/clientes")({
  component: CoreClientes,
});

function CoreClientes() {
  const { data, isLoading } = useQuery({
    queryKey: ["core-clientes"],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, is_active, created_at")
        .eq("is_master", false)
        .order("created_at", { ascending: false });

      const ids = (companies ?? []).map((c) => c.id);
      const [modulesAgg, checklistAgg] = await Promise.all([
        ids.length
          ? supabase.from("company_modules").select("company_id, is_enabled").in("company_id", ids).eq("is_enabled", true)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase.from("onboarding_checklist").select("company_id, status").in("company_id", ids)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const modulesByCompany = new Map<string, number>();
      (modulesAgg.data ?? []).forEach((r: any) => modulesByCompany.set(r.company_id, (modulesByCompany.get(r.company_id) ?? 0) + 1));

      const checklistByCompany = new Map<string, { done: number; total: number }>();
      (checklistAgg.data ?? []).forEach((r: any) => {
        const cur = checklistByCompany.get(r.company_id) ?? { done: 0, total: 0 };
        cur.total += 1;
        if (r.status === "done") cur.done += 1;
        checklistByCompany.set(r.company_id, cur);
      });

      return (companies ?? []).map((c) => ({
        ...c,
        modulesCount: modulesByCompany.get(c.id) ?? 0,
        checklist: checklistByCompany.get(c.id) ?? { done: 0, total: 0 },
      }));
    },
  });

  return (
    <>
      <PageHeader title="Clientes" description="Visão consolidada de todos os clientes (instâncias) do Impulsionando Core." />
      <div className="grid gap-3">
        {isLoading && <Card className="p-4 text-sm text-muted-foreground">Carregando…</Card>}
        {(data ?? []).map((c) => (
          <Link
            key={c.id}
            to="/core/cliente/$id"
            params={{ id: c.id }}
            className="block"
          >
            <Card className="p-4 hover:border-primary/40 transition flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.id.slice(0, 8)}</div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "Ativo" : "Inativo"}</Badge>
                <Badge variant="outline">{c.modulesCount} módulos</Badge>
                {c.checklist.total > 0 && (
                  <Badge variant="outline">
                    Checklist {c.checklist.done}/{c.checklist.total}
                  </Badge>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground text-center">Nenhum cliente cadastrado ainda.</Card>
        )}
      </div>
    </>
  );
}
