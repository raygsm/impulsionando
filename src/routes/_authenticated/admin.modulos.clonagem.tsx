import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchCurrentUser } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  Boxes,
  Layers3,
  Building2,
  FileSearch,
  Copy,
  Eye,
  Plus,
  History,
  Settings,
  Archive,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  cloneStore,
  ensureSeedBases,
  PLANNED_MODULES,
  PRESET_DETAILS,
  NICHE_PRESETS,
  type ModuleBase,
  type CloneInstance,
  type CloneLog,
} from "@/lib/cloneCentral";
import { CloneWizard } from "@/components/admin/CloneWizard";
import { AgendaConfigWizard } from "@/components/admin/AgendaConfigWizard";

export const Route = createFileRoute("/_authenticated/admin/modulos/clonagem")({
  head: () => ({ meta: [{ title: "Clonagem de Módulos — Impulsionando" }] }),
  component: CloneCenterPage,
});

function CloneCenterPage() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-clone-center"],
    queryFn: fetchCurrentUser,
  });

  const [bases, setBases] = useState<ModuleBase[]>([]);
  const [instances, setInstances] = useState<CloneInstance[]>([]);
  const [logs, setLogs] = useState<CloneLog[]>([]);
  const [wizardBase, setWizardBase] = useState<ModuleBase | null>(null);
  const [detailBase, setDetailBase] = useState<ModuleBase | null>(null);
  const [logsBase, setLogsBase] = useState<ModuleBase | null>(null);
  const [configInstance, setConfigInstance] = useState<CloneInstance | null>(null);
  const [successInstanceId, setSuccessInstanceId] = useState<string | null>(null);

  // Filtros Clones Criados
  const [fModule, setFModule] = useState("all");
  const [fEnv, setFEnv] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fNiche, setFNiche] = useState("all");
  const [fSearch, setFSearch] = useState("");
  const [logsInstanceId, setLogsInstanceId] = useState<string | null>(null);

  const isAllowed = !!me?.isSuperAdmin;

  function refresh() {
    setBases(cloneStore.listBases());
    setInstances(cloneStore.listInstances());
    setLogs(cloneStore.listLogs());
  }

  function archiveInstance(i: CloneInstance) {
    const updated: CloneInstance = { ...i, archived: true, status: "Arquivado" };
    const all = cloneStore.listInstances().map((x) => (x.id === i.id ? updated : x));
    if (typeof window !== "undefined") {
      localStorage.setItem("imp.clone.instances.v1", JSON.stringify(all));
    }
    cloneStore.pushLog({
      actor: me?.user.email ?? "interno",
      action: "arquivou",
      detail: `Instância arquivada — ${i.targetName}`,
      instanceId: i.id,
    });
    toast.success("Clone arquivado.");
    refresh();
  }

  const filteredInstances = instances.filter((i) => {
    if (fModule !== "all" && i.baseId !== fModule) return false;
    if (fEnv !== "all" && i.environment !== fEnv) return false;
    if (fStatus !== "all" && i.status !== fStatus) return false;
    if (fNiche !== "all" && i.niche !== fNiche) return false;
    if (fSearch.trim() && !i.targetName.toLowerCase().includes(fSearch.trim().toLowerCase()))
      return false;
    return true;
  });

  useEffect(() => {
    if (isAllowed) {
      ensureSeedBases();
      refresh();
    }
  }, [isAllowed]);


  // Log tentativa negada (uma vez)
  useMemo(() => {
    if (!isLoading && me && !isAllowed) {
      cloneStore.pushLog({
        actor: me.user.email ?? "desconhecido",
        action: "tentativa-acesso-negado",
        detail: "Tentativa de acesso à Central Interna de Clonagem",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAllowed]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!isAllowed) {
    return (
      <div className="p-6 max-w-2xl">
        <Card className="p-8 text-center space-y-4 border-destructive/40">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Acesso restrito à gestão interna da Impulsionando.
          </p>
        </Card>
      </div>
    );
  }

  const demoCount = instances.filter((i) => i.layer === "demo").length;
  const realCount = instances.filter((i) => i.layer === "real").length;
  const actor = me?.user.email ?? "interno";

  function countClonesOf(baseId: string) {
    return instances.filter((i) => i.baseId === baseId).length;
  }
  function logsOf(baseId: string) {
    const base = bases.find((b) => b.id === baseId);
    if (!base) return [];
    return logs.filter((l) => l.detail.includes(base.name));
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Central Interna de Clonagem de Módulos"
        description="Estrutura administrativa interna da Impulsionando. Crie módulos-base e clone-os para demonstrações ou projetos reais sem refazer do zero."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Boxes} label="Módulos-Base" value={bases.length} />
        <StatCard icon={Layers3} label="Instâncias DEMO" value={demoCount} />
        <StatCard icon={Building2} label="Instâncias Reais" value={realCount} />
        <StatCard icon={FileSearch} label="Logs internos" value={logs.length} />
      </div>

      <Card className="p-4 border-amber-500/40 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Área de uso exclusivo Impulsionando.</p>
            <p className="text-muted-foreground">
              Visível apenas para Super Admin, Admin Master, Diretor Técnico e usuários internos
              autorizados. Não exibir a leads, clientes finais, White Label padrão ou usuários comuns.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="base" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="base">Módulos-Base</TabsTrigger>
          <TabsTrigger value="instances">Clones Criados</TabsTrigger>
          <TabsTrigger value="presets">Presets por nicho</TabsTrigger>
          <TabsTrigger value="planned">Próximos módulos</TabsTrigger>
          <TabsTrigger value="logs">Logs internos</TabsTrigger>
          <TabsTrigger value="layers">Camadas</TabsTrigger>
        </TabsList>


        <TabsContent value="base" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Recurso preparado para próxima fase técnica.")
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar novo módulo-base
            </Button>
          </div>

          {bases.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhum módulo-base cadastrado ainda.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {bases.map((b) => (
                <Card key={b.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Código: {b.slug} · Versão-base: v{b.version}
                      </div>
                    </div>
                    <Badge variant="secondary">Base inicial</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">DEMO</Badge>
                    <Badge variant="outline">TESTE</Badge>
                    <Badge variant="outline">REAL</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Presets: {b.structure.nichePresets.join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Última atualização: {new Date(b.updatedAt).toLocaleString("pt-BR")} ·
                    Clones criados: {countClonesOf(b.id)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setDetailBase(b)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver módulo-base
                    </Button>
                    <Button size="sm" onClick={() => setWizardBase(b)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Clonar módulo
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setLogsBase(b)}>
                      <History className="w-4 h-4 mr-1" />
                      Ver logs
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-3 pt-4">
          <Card className="p-3 grid md:grid-cols-5 gap-2">
            <Input
              placeholder="Buscar projeto/cliente"
              value={fSearch}
              onChange={(e) => setFSearch(e.target.value)}
            />
            <Select value={fModule} onValueChange={setFModule}>
              <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {bases.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fEnv} onValueChange={setFEnv}>
              <SelectTrigger><SelectValue placeholder="Ambiente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ambientes</SelectItem>
                <SelectItem value="DEMO">DEMO</SelectItem>
                <SelectItem value="TESTE">TESTE</SelectItem>
                <SelectItem value="REAL">REAL</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Criado">Criado</SelectItem>
                <SelectItem value="Aguardando configuração">Aguardando configuração</SelectItem>
                <SelectItem value="DEMO pronta">DEMO pronta</SelectItem>
                <SelectItem value="TESTE pronto">TESTE pronto</SelectItem>
                <SelectItem value="REAL aguardando configuração">REAL aguardando configuração</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fNiche} onValueChange={setFNiche}>
              <SelectTrigger><SelectValue placeholder="Nicho" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                {NICHE_PRESETS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </Card>

          {filteredInstances.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhum clone encontrado com os filtros aplicados.
            </Card>
          ) : (
            filteredInstances.map((i) => {
              const base = bases.find((b) => b.id === i.baseId);
              return (
                <Card key={i.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium">
                        {i.targetName} {i.fantasy ? <span className="text-muted-foreground">({i.fantasy})</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Base: {base?.name ?? i.baseId} · v{base?.version ?? "?"} ·{" "}
                        {i.niche ?? "—"} · Preset: {i.preset ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Responsável: {i.responsibleName ?? "—"} · Criado por: {i.createdBy ?? "—"} ·{" "}
                        {new Date(i.createdAt).toLocaleString("pt-BR")}
                      </div>
                      {i.integrations && i.integrations.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Integrações: {i.integrations.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={i.environment === "REAL" ? "default" : "secondary"}>
                        {i.environment ?? (i.layer === "real" ? "REAL" : "DEMO")}
                      </Badge>
                      <Badge variant="outline">{i.status}</Badge>
                      {i.archived && <Badge variant="destructive">Arquivado</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Acesso à instância — preparado para próxima fase técnica.")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> Acessar
                    </Button>
                    <Button size="sm" onClick={() => setConfigInstance(i)}>
                      <Settings className="w-4 h-4 mr-1" /> Configurar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setLogsInstanceId(i.id)}>
                      <History className="w-4 h-4 mr-1" /> Ver logs
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveInstance(i)}
                      disabled={i.archived}
                    >
                      <Archive className="w-4 h-4 mr-1" /> Arquivar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const b = bases.find((b) => b.id === i.baseId);
                        if (b) setWizardBase(b);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Duplicar
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="presets" className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Cada preset adapta labels, exemplos, serviços padrão, status, textos, comunicações,
            dashboards, permissões sugeridas e parametrizações padrão.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(PRESET_DETAILS).map(([name, d]) => (
              <Card key={name} className="p-4 space-y-2">
                <div className="font-semibold">{name}</div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Labels:</span> {d.labels.join(" · ")}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Recursos padrão:</span>{" "}
                  {d.features.join(", ")}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Serviços mock (DEMO):</span>{" "}
                  {d.mockServices.join(", ")}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>


        <TabsContent value="planned" className="pt-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Módulos preparados para receber estrutura-base nos próximos blocos:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLANNED_MODULES.map((m) => {
                const has = bases.some((b) => b.slug === m.slug || b.slug === m.slug.replace(/-/g, "_"));
                return (
                  <div
                    key={m.slug}
                    className="flex items-center justify-between p-2 rounded border text-sm"
                  >
                    <span>{m.name}</span>
                    <Badge variant={has ? "default" : "outline"}>
                      {has ? "Base criada" : "Aguardando"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-2 pt-4">
          {logs.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Sem logs ainda.</Card>
          ) : (
            logs.map((l) => (
              <Card key={l.id} className="p-3 text-sm">
                <div className="font-medium">{l.action}</div>
                <div className="text-xs text-muted-foreground">
                  {l.actor} · {new Date(l.at).toLocaleString("pt-BR")}
                </div>
                <div className="text-xs">{l.detail}</div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="layers" className="pt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <h3 className="font-medium">A) Módulo-Base</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Estrutura oficial Impulsionando. Telas, campos, fluxos, regras, modelos e recursos.
                <strong> Sem dados reais.</strong> Matriz técnica reaproveitável.
              </p>
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4" />
                <h3 className="font-medium">B) Instância DEMO</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Dados fictícios, PAGO — DEMO, mensagens TESTE, LeadDemoCapture, sandbox, logs demo, reset local.
              </p>
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <h3 className="font-medium">C) Instância Real do Cliente</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Dados, usuários, configurações, integrações, histórico, pagamentos e logs reais.
              </p>
            </Card>
          </div>
          <Card className="p-4 mt-4 border-destructive/40 bg-destructive/5">
            <p className="text-sm">
              <strong>Regra obrigatória:</strong> nunca misturar dados entre Módulo-Base, DEMO e Cliente Real.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wizard */}
      {wizardBase && (
        <CloneWizard
          open={!!wizardBase}
          onOpenChange={(v) => !v && setWizardBase(null)}
          base={wizardBase}
          actor={actor}
          canClone={isAllowed}
          onCreated={refresh}
        />
      )}

      {/* Detalhe do módulo-base */}
      <Dialog open={!!detailBase} onOpenChange={(v) => !v && setDetailBase(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailBase?.name} — v{detailBase?.version}</DialogTitle>
            <DialogDescription>{detailBase?.description}</DialogDescription>
          </DialogHeader>
          {detailBase && (
            <div className="space-y-3 text-sm">
              {Object.entries(detailBase.structure).map(([k, v]) => (
                <div key={k}>
                  <div className="font-medium capitalize">{k}</div>
                  <div className="text-xs text-muted-foreground">
                    {(v as string[]).join(", ") || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logs por módulo-base */}
      <Dialog open={!!logsBase} onOpenChange={(v) => !v && setLogsBase(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs — {logsBase?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {logsBase && logsOf(logsBase.id).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem logs para este módulo-base.</p>
            ) : (
              logsBase &&
              logsOf(logsBase.id).map((l) => (
                <Card key={l.id} className="p-2 text-sm">
                  <div className="font-medium">{l.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.actor} · {new Date(l.at).toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs">{l.detail}</div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
