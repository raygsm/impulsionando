import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getModuleDetail, releaseModuleVersion, READINESS_STATUS_LABELS } from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleCertificationPanel } from "@/components/core/ModuleCertificationPanel";
import { InstallModuleDialog } from "@/components/core/InstallModuleDialog";
import { SettingDefinitionsAdmin } from "@/components/core/SettingDefinitionsAdmin";
import { ApplyVersionScopeDialog } from "@/components/core/ApplyVersionScopeDialog";
import { ModuleCommercialPanel } from "@/components/core/ModuleCommercialPanel";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/modulos/$slug")({
  component: ModuleDetail,
});

function ModuleDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getModuleDetail);
  const release = useServerFn(releaseModuleVersion);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["module-detail", slug],
    queryFn: () => fetchDetail({ data: { slug } }),
  });

  const releaseMut = useMutation({
    mutationFn: () => release({ data: { slug, version, notes: notes || undefined } }),
    onSuccess: () => {
      toast.success("Nova versão publicada");
      setVersion("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["module-detail", slug] });
      qc.invalidateQueries({ queryKey: ["core-modules-lib"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha"),
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (!data?.module) return <Card className="p-6">Módulo não encontrado.</Card>;
  const m = data.module as never as {
    id: string;
    slug: string;
    name: string;
    description?: string;
    status?: string;
    owner?: string;
    current_version: string;
    dependencies?: string[];
    readiness_status?: string;
    readiness_checklist?: Record<string, boolean>;
    demo_url?: string;
    docs_url?: string;
    segments?: string[];
  };
  const isInstallable = m.readiness_status === "certificado" || m.readiness_status === "publicado";

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{m.name}</h1>
            <p className="text-sm text-muted-foreground">{m.description || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">slug: {m.slug}</Badge>
              <Badge>v{m.current_version}</Badge>
              <Badge variant={isInstallable ? "default" : "outline"}>
                {READINESS_STATUS_LABELS[m.readiness_status ?? "em_desenvolvimento"]}
              </Badge>
              {m.owner && <Badge variant="outline">Responsável: {m.owner}</Badge>}
            </div>
            {(m.dependencies ?? []).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">Depende de: {(m.dependencies as string[]).join(", ")}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
              <InstallModuleDialog moduleSlug={m.slug} moduleName={m.name} allowedSegments={m.segments ?? []} />
            )}
            <Link to="/core/modulos" className="text-sm text-muted-foreground hover:underline">
              ← Catálogo
            </Link>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="certificacao">Certificação</TabsTrigger>
          <TabsTrigger value="versoes">Versões</TabsTrigger>
          <TabsTrigger value="instalacoes">Instalações</TabsTrigger>
          <TabsTrigger value="definicoes">Definições</TabsTrigger>
        </TabsList>

        <TabsContent value="comercial">
          <ModuleCommercialPanel module={m as never} />
        </TabsContent>

        <TabsContent value="visao">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Publicar nova versão</h3>
            <div className="grid sm:grid-cols-[200px_1fr_auto] gap-2 items-start">
              <Input placeholder="ex: 1.1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
              <Textarea placeholder="Notas da versão (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              <Button onClick={() => releaseMut.mutate()} disabled={!version || releaseMut.isPending}>
                Publicar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ao publicar, todos os clientes verão um aviso de atualização. Nenhum código é duplicado.
            </p>
          </Card>
          {m.demo_url || m.docs_url ? (
            <Card className="p-4 mt-3 text-sm space-y-1.5">
              {m.demo_url && (
                <div>
                  <span className="text-muted-foreground">Demonstração: </span>
                  <a href={m.demo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {m.demo_url}
                  </a>
                </div>
              )}
              {m.docs_url && (
                <div>
                  <span className="text-muted-foreground">Documentação: </span>
                  <a href={m.docs_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {m.docs_url}
                  </a>
                </div>
              )}
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="certificacao">
          <ModuleCertificationPanel module={m} />
        </TabsContent>

        <TabsContent value="versoes">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Histórico de versões</h3>
              <ApplyVersionScopeDialog moduleId={m.id} moduleName={m.name} defaultVersion={m.current_version} />
            </div>
            <div className="space-y-1.5">
              {data.versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>}
              {data.versions.map((v: { id: string; version: string; released_at: string; notes?: string | null }) => (
                <div key={v.id} className="border-b last:border-0 py-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">v{v.version}</span>
                    <span className="text-xs text-muted-foreground">{new Date(v.released_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {v.notes && <div className="text-xs text-muted-foreground">{v.notes}</div>}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="instalacoes">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Clientes utilizando ({data.installs.length})</h3>
            <div className="space-y-1.5 max-h-96 overflow-auto">
              {data.installs.length === 0 && <p className="text-sm text-muted-foreground">Sem instalações ativas.</p>}
              {data.installs.map((i: { installed_version?: string | null; companies?: { id: string; name: string } | null }, idx: number) => {
                const outdated = i.installed_version && i.installed_version !== m.current_version;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                    <Link to="/core/cliente/$id" params={{ id: i.companies?.id ?? "" }} className="hover:underline truncate">
                      {i.companies?.name}
                    </Link>
                    <Badge variant={outdated ? "outline" : "secondary"} className={outdated ? "text-amber-600 border-amber-300" : ""}>
                      v{i.installed_version ?? "?"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="definicoes">
          <SettingDefinitionsAdmin defaultCategory={m.slug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
