import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getClient360, completeChecklistItem } from "@/lib/onboarding.functions";
import { getClientModules, installModule, uninstallModule, updateClientModuleToLatest } from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingWizard } from "@/components/core/OnboardingWizard";
import { IdentityTab } from "@/components/core/IdentityTab";
import { ClientSettingsPanel } from "@/components/core/ClientSettingsPanel";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, Building2, Download, RefreshCw, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/cliente/$id")({
  component: ClientePage,
});

const CHECKLIST_LABELS: Record<string, string> = {
  payment_approved: "Pagamento aprovado",
  onboarding_done: "Onboarding concluído",
  subdomain_reserved: "Subdomínio reservado",
  domain_requested: "Registro de domínio solicitado",
  domain_migration_requested: "Migração de domínio solicitada",
  emails_requested: "E-mails corporativos solicitados",
  modules_activated: "Módulos ativados",
  client_released: "Cliente liberado",
};

function ClientePage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const fetch360 = useServerFn(getClient360);
  const completeItem = useServerFn(completeChecklistItem);

  const { data, isLoading } = useQuery({
    queryKey: ["client-360", id],
    queryFn: () => fetch360({ data: { companyId: id } }),
  });

  const toggleItem = useMutation({
    mutationFn: (vars: { itemKey: string; status: "done" | "pending" }) =>
      completeItem({ data: { companyId: id, itemKey: vars.itemKey, status: vars.status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-360", id] });
      toast.success("Checklist atualizado");
    },
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (!data?.company) return <Card className="p-6">Cliente não encontrado.</Card>;

  const c = data.company;

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{c.name}</h1>
          <div className="text-sm text-muted-foreground">{c.email ?? "—"} · {c.phone ?? "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "Ativo" : "Inativo"}</Badge>
          {c.is_active && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                startImpersonation({ companyId: id, companyName: c.name });
                navigate({ to: "/dashboard" });
              }}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Acessar como cliente
            </Button>
          )}
        </div>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="modulos">Módulos</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="dominio">Domínio</TabsTrigger>
          <TabsTrigger value="emails">E-mails</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Checklist de implantação</h3>
            <div className="space-y-2">
              {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                const item = data.checklist.find((x: any) => x.item_key === key);
                const done = item?.status === "done";
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => toggleItem.mutate({ itemKey: key, status: done ? "pending" : "done" })}
                      className="text-primary"
                    >
                      {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <span className={done ? "line-through text-muted-foreground" : ""}>{label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="identidade">
          <IdentityTab companyId={id} />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingWizard companyId={id} />

        </TabsContent>

        <TabsContent value="modulos">
          <ClientModulesPanel companyId={id} />
        </TabsContent>

        <TabsContent value="contratos">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold mb-2">Contratos</h3>
            {data.contracts.length === 0 && <p className="text-sm text-muted-foreground">Sem contratos.</p>}
            {data.contracts.map((ct: any) => (
              <div key={ct.id} className="text-sm border-b last:border-0 py-2">
                <div className="flex justify-between">
                  <span>R$ {Number(ct.monthly_amount).toFixed(2)} / mês</span>
                  <Badge variant={ct.status === "active" ? "default" : "outline"}>{ct.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Próx. vencimento: {ct.next_due_date ?? "—"}</div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="dominio">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold mb-2">Solicitações de domínio</h3>
            {data.domain.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>}
            {data.domain.map((d: any) => (
              <div key={d.id} className="text-sm border-b last:border-0 py-2">
                <div className="flex justify-between">
                  <span className="font-medium">{d.requested_value ?? "—"}</span>
                  <Badge variant="outline">{d.mode}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Status: {d.status}</div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold mb-2">Solicitações de e-mail corporativo</h3>
            {data.emails.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>}
            {data.emails.map((e: any) => (
              <div key={e.id} className="flex justify-between text-sm border-b last:border-0 py-1.5">
                <span>{e.full_address ?? e.address_prefix}</span>
                <Badge variant="outline">{e.status}</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold mb-2">Atividades recentes</h3>
            {data.activities.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>}
            {data.activities.map((a: any) => (
              <div key={a.id} className="text-sm border-b last:border-0 py-2">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.description}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientModulesPanel({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const fetchList = useServerFn(getClientModules);
  const install = useServerFn(installModule);
  const uninstall = useServerFn(uninstallModule);
  const update = useServerFn(updateClientModuleToLatest);

  const { data, isLoading } = useQuery({
    queryKey: ["client-modules", companyId],
    queryFn: () => fetchList({ data: { companyId } }),
  });

  const installMut = useMutation({
    mutationFn: (slug: string) => install({ data: { companyId, slug } }),
    onSuccess: () => { toast.success("Módulo instalado"); qc.invalidateQueries({ queryKey: ["client-modules", companyId] }); qc.invalidateQueries({ queryKey: ["client-360", companyId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const uninstallMut = useMutation({
    mutationFn: (slug: string) => uninstall({ data: { companyId, slug } }),
    onSuccess: () => { toast.success("Módulo desinstalado"); qc.invalidateQueries({ queryKey: ["client-modules", companyId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (slug: string) => update({ data: { companyId, slug } }),
    onSuccess: () => { toast.success("Módulo atualizado para a versão atual"); qc.invalidateQueries({ queryKey: ["client-modules", companyId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <Card className="p-4">Carregando módulos…</Card>;
  const installed = (data?.modules ?? []).filter((m: any) => m.is_installed);
  const available = (data?.modules ?? []).filter((m: any) => !m.is_installed);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Módulos instalados ({installed.length})</h3>
        {installed.length === 0 && <p className="text-sm text-muted-foreground">Nenhum módulo instalado ainda.</p>}
        <div className="space-y-1.5">
          {installed.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between gap-2 border-b last:border-0 py-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  Instalado v{m.installed_version ?? "?"} · Atual v{m.current_version}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {m.has_update && (
                  <Button size="sm" variant="default" onClick={() => updateMut.mutate(m.slug)} disabled={updateMut.isPending}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />Atualizar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => uninstallMut.mutate(m.slug)} disabled={uninstallMut.isPending}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Módulos disponíveis ({available.length})</h3>
        <div className="space-y-1.5">
          {available.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between gap-2 border-b last:border-0 py-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  v{m.current_version}
                  {(m.dependencies ?? []).length > 0 && <> · depende de: {(m.dependencies as string[]).join(", ")}</>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => installMut.mutate(m.slug)} disabled={installMut.isPending}>
                <Download className="w-3.5 h-3.5 mr-1" />Instalar
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Instalar = ativar permissões, menus, rotas e integrações do módulo no Core. Não duplica código nem tabelas.
        </p>
      </Card>
    </div>
  );
}
