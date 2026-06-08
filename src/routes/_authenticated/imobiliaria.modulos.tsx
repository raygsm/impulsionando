import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getClientModules,
  installModule,
  uninstallModule,
  STATUS_COMERCIAL_LABELS,
  STATUS_TECNICO_LABELS,
} from "@/lib/modules.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Users, Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria/modulos")({
  head: () => ({ meta: [{ title: "Módulos Imobiliária" }] }),
  component: Page,
});

const ICON_BY_SLUG: Record<string, React.ComponentType<{ className?: string }>> = {
  imobiliaria_vitrine: Building2,
  imobiliaria_crm: Users,
  imobiliaria_erp: Wallet,
};

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const fetchModules = useServerFn(getClientModules);
  const doInstall = useServerFn(installModule);
  const doUninstall = useServerFn(uninstallModule);

  const { data, isLoading } = useQuery({
    queryKey: ["imobiliaria-modules", companyId],
    queryFn: () => fetchModules({ data: { companyId } }),
    enabled: !!companyId,
  });

  const installMut = useMutation({
    mutationFn: (slug: string) => doInstall({ data: { companyId, slug } }),
    onSuccess: () => {
      toast.success("Módulo ativado");
      qc.invalidateQueries({ queryKey: ["imobiliaria-modules", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uninstallMut = useMutation({
    mutationFn: (slug: string) => doUninstall({ data: { companyId, slug } }),
    onSuccess: () => {
      toast.success("Módulo desativado");
      qc.invalidateQueries({ queryKey: ["imobiliaria-modules", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const modules = (data?.modules ?? []).filter((m: any) => m.slug?.startsWith("imobiliaria_"));

  return (
    <>
      <PageHeader
        title="Módulos Imobiliária"
        description="Ative ou desative os módulos do nicho Imobiliária para esta empresa e acompanhe o status comercial de cada um."
      />

      {!companyId ? (
        <EmptyState title="Selecione uma empresa" description="Escolha a empresa que receberá os módulos." />
      ) : isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando módulos…</Card>
      ) : modules.length === 0 ? (
        <EmptyState
          title="Nenhum módulo Imobiliária encontrado"
          description="Os módulos comerciais do nicho ainda não foram cadastrados."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((m: any) => {
            const Icon = ICON_BY_SLUG[m.slug] ?? Building2;
            const contractable = m.status_comercial === "disponivel_contratacao";
            const enabled = !!m.is_installed;
            const price = Number(m.monthly_price ?? 0);
            return (
              <Card key={m.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{m.description}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={contractable ? "default" : "outline"} className="text-[10px]">
                    {STATUS_COMERCIAL_LABELS[m.status_comercial] ?? m.status_comercial ?? "—"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {STATUS_TECNICO_LABELS[m.status_tecnico] ?? m.status_tecnico ?? "—"}
                  </Badge>
                  {m.has_update && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Atualização disponível
                    </Badge>
                  )}
                  {enabled && (
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-auto">
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Mensalidade</div>
                    <div className="font-semibold">
                      {price > 0 ? `R$ ${price.toFixed(2).replace(".", ",")}` : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{enabled ? "Ativo" : "Inativo"}</span>
                    <Switch
                      checked={enabled}
                      disabled={
                        installMut.isPending ||
                        uninstallMut.isPending ||
                        (!enabled && !contractable)
                      }
                      onCheckedChange={(v) => (v ? installMut.mutate(m.slug) : uninstallMut.mutate(m.slug))}
                    />
                  </div>
                </div>

                {!contractable && !enabled && (
                  <div className="text-[11px] text-muted-foreground">
                    Indisponível para contratação no momento.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
