import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getModuleDetail, releaseModuleVersion } from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (!data?.module) return <Card className="p-6">Módulo não encontrado.</Card>;
  const m = data.module;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{m.name}</h1>
            <p className="text-sm text-muted-foreground">{m.description || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">slug: {m.slug}</Badge>
              <Badge>v{m.current_version}</Badge>
              <Badge variant="secondary">{m.status}</Badge>
              {m.owner && <Badge variant="outline">Responsável: {m.owner}</Badge>}
            </div>
            {(m.dependencies ?? []).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Depende de: {(m.dependencies as string[]).join(", ")}
              </div>
            )}
          </div>
          <Link to="/core/modulos" className="text-sm text-muted-foreground hover:underline">← Catálogo</Link>
        </div>
      </Card>

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
          Ao publicar, todos os clientes verão um aviso de atualização disponível. Nenhum código é duplicado — todos consomem a mesma versão do Core.
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Histórico de versões</h3>
          <div className="space-y-1.5">
            {data.versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>}
            {data.versions.map((v: any) => (
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

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Clientes utilizando ({data.installs.length})</h3>
          <div className="space-y-1.5 max-h-80 overflow-auto">
            {data.installs.length === 0 && <p className="text-sm text-muted-foreground">Sem instalações ativas.</p>}
            {data.installs.map((i: any, idx: number) => {
              const outdated = i.installed_version && i.installed_version !== m.current_version;
              return (
                <div key={idx} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                  <Link
                    to="/core/cliente/$id"
                    params={{ id: i.companies?.id }}
                    className="hover:underline truncate"
                  >
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
      </div>
    </div>
  );
}
