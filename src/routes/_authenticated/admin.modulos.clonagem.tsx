import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchCurrentUser } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Boxes, Layers3, Building2, FileSearch, Copy } from "lucide-react";
import {
  cloneStore,
  PLANNED_MODULES,
  type ModuleBase,
  type CloneInstance,
} from "@/lib/cloneCentral";

export const Route = createFileRoute("/_authenticated/admin/modulos/clonagem")({
  head: () => ({ meta: [{ title: "Clonagem de Módulos — Impulsionando" }] }),
  component: CloneCenterPage,
});

function CloneCenterPage() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-clone-center"],
    queryFn: fetchCurrentUser,
  });

  const [bases, setBases] = useState<ModuleBase[]>(() => cloneStore.listBases());
  const [instances, setInstances] = useState<CloneInstance[]>(() => cloneStore.listInstances());
  const [logs, setLogs] = useState(() => cloneStore.listLogs());

  const isAllowed = !!me?.isSuperAdmin;

  // Log tentativa de acesso negado (apenas uma vez, no carregamento)
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
        <TabsList>
          <TabsTrigger value="base">Módulos-Base</TabsTrigger>
          <TabsTrigger value="instances">Instâncias (DEMO / Real)</TabsTrigger>
          <TabsTrigger value="planned">Próximos módulos</TabsTrigger>
          <TabsTrigger value="logs">Logs internos</TabsTrigger>
          <TabsTrigger value="layers">Camadas do sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-3 pt-4">
          {bases.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhum módulo-base cadastrado ainda. O primeiro módulo-base —{" "}
              <strong>Agenda Online</strong> — será criado no Bloco 2/4.
            </Card>
          ) : (
            bases.map((b) => (
              <Card key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.slug} · v{b.version} · {b.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{b.status}</Badge>
                  <Button size="sm" variant="outline" disabled>
                    <Copy className="w-4 h-4 mr-2" />
                    Clonar (Bloco 2)
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-3 pt-4">
          {instances.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma instância clonada ainda. Clonagens aparecerão aqui após criar o primeiro
              módulo-base.
            </Card>
          ) : (
            instances.map((i) => {
              const base = bases.find((b) => b.id === i.baseId);
              return (
                <Card key={i.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{i.targetName}</div>
                    <div className="text-xs text-muted-foreground">
                      Base: {base?.name ?? i.baseId} · {i.niche ?? "—"}
                    </div>
                  </div>
                  <Badge variant={i.layer === "real" ? "default" : "secondary"}>
                    {i.layer === "real" ? "Cliente Real" : "DEMO"}
                  </Badge>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="planned" className="pt-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Módulos preparados para receber estrutura-base nos próximos blocos:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLANNED_MODULES.map((m) => {
                const has = bases.some((b) => b.slug === m.slug);
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
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Sem logs ainda.
            </Card>
          ) : (
            logs.map((l) => (
              <Card key={l.id} className="p-3 text-sm flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{l.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.actor} · {new Date(l.at).toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs">{l.detail}</div>
                </div>
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
                Versão demonstrativa clonada da base. Dados fictícios, PAGO — DEMO, mensagens TESTE,
                LeadDemoCapture, sandbox, logs demo, reset local.
              </p>
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <h3 className="font-medium">C) Instância Real do Cliente</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Versão real criada para cliente/projeto. Dados, usuários, configurações, integrações,
                histórico, pagamentos e logs reais.
              </p>
            </Card>
          </div>
          <Card className="p-4 mt-4 border-destructive/40 bg-destructive/5">
            <p className="text-sm">
              <strong>Regra obrigatória:</strong> nunca misturar dados entre Módulo-Base, DEMO e
              Cliente Real.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
