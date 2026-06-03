import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/modules")({
  head: () => ({ meta: [{ title: "Módulos — Impulsionando" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");

  const { data: companies } = useQuery({
    queryKey: ["companies-opt"],
    queryFn: async () => {
      const data = (await supabase.from("companies").select("id, name").order("name")).data ?? [];
      if (data.length && !companyId) setCompanyId(data[0].id);
      return data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => (await supabase.from("modules").select("*").order("sort_order")).data ?? [],
  });

  const { data: active } = useQuery({
    queryKey: ["company-modules", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("company_modules").select("module_id, is_enabled").eq("company_id", companyId)).data ?? [],
  });

  const activeMap = new Map(active?.map((a) => [a.module_id, a.is_enabled]) ?? []);

  const toggle = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      const { error } = await supabase.from("company_modules").upsert(
        { company_id: companyId, module_id: moduleId, is_enabled: enabled },
        { onConflict: "company_id,module_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Módulo atualizado"); qc.invalidateQueries({ queryKey: ["company-modules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Módulos"
        description="Ative ou desative módulos por empresa cliente."
        action={
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
            <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules?.map((m) => {
          const enabled = activeMap.get(m.id) ?? false;
          return (
            <Card key={m.id} className="p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2">{m.name} {m.is_core && <Badge variant="outline" className="text-[10px]">core</Badge>}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={!me?.isSuperAdmin || !companyId}
                  onCheckedChange={(v) => toggle.mutate({ moduleId: m.id, enabled: v })}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
