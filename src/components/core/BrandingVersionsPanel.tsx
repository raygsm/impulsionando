import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBrandingVersions,
  saveBrandingDraft,
  publishBrandingVersion,
  restoreBrandingVersion,
  deleteBrandingVersion,
} from "@/lib/branding-versions.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GitBranch, Rocket, RotateCcw, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Props { companyId: string }

/**
 * w25 — Rascunho/Publicado de branding.
 *
 * A linha em `companies` é o "live/draft". Quando o usuário decide congelar
 * o estado atual, clica em "Salvar rascunho" — vira uma versão com status
 * "draft". "Publicar" promove uma versão a "published" (e arquiva a anterior).
 * "Restaurar" copia uma versão antiga de volta para companies.
 */
export function BrandingVersionsPanel({ companyId }: Props) {
  const listFn = useServerFn(listBrandingVersions);
  const saveFn = useServerFn(saveBrandingDraft);
  const publishFn = useServerFn(publishBrandingVersion);
  const restoreFn = useServerFn(restoreBrandingVersion);
  const deleteFn = useServerFn(deleteBrandingVersion);
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const versionsQ = useQuery({
    queryKey: ["branding-versions", companyId],
    queryFn: () => listFn({ data: { companyId } }),
    enabled: !!companyId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["branding-versions", companyId] });
    qc.invalidateQueries({ queryKey: ["my-branding-companies"] });
  };

  const saveDraft = useMutation({
    mutationFn: () => saveFn({ data: { companyId, notes: notes || undefined } }),
    onSuccess: () => {
      setNotes("");
      toast.success("Rascunho salvo.");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const publish = useMutation({
    mutationFn: (versionId: string) => publishFn({ data: { companyId, versionId } }),
    onSuccess: () => { toast.success("Versão publicada."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const restore = useMutation({
    mutationFn: (versionId: string) => restoreFn({ data: { companyId, versionId } }),
    onSuccess: () => { toast.success("Versão restaurada — agora é o branding ativo."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const remove = useMutation({
    mutationFn: (versionId: string) => deleteFn({ data: { companyId, versionId } }),
    onSuccess: () => { toast.success("Versão removida."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const versions = versionsQ.data?.versions ?? [];
  const live = versionsQ.data?.live;
  const published = versions.find((v) => v.status === "published");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4" /> Versões & publicação
          {published ? (
            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
              v{published.version_number} publicada
            </Badge>
          ) : (
            <Badge variant="outline">sem publicação</Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          O que você vê nas outras abas é o <strong>live/draft</strong>. Salve um snapshot quando estiver bom e publique pra travar a versão oficial. Restaure qualquer versão pra reverter.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground mb-2">Live (estado atual em edição)</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-block h-6 w-6 rounded border" style={{ background: live?.primary_color || "transparent" }} />
            <span className="inline-block h-6 w-6 rounded border" style={{ background: live?.secondary_color || "transparent" }} />
            {live?.logo_url ? <img src={live.logo_url} alt="" className="h-8 w-auto border rounded" /> : <Badge variant="outline">sem logo</Badge>}
            <span className="text-sm font-medium">{live?.trade_name || live?.name || "—"}</span>
          </div>
          <div className="mt-3 flex gap-2 flex-col sm:flex-row">
            <Input
              placeholder="Notas (opcional) — ex.: 'campanha Black Friday'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="gap-2">
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar como rascunho
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {versionsQ.isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-6">Carregando versões…</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6 border rounded-md">
              Nenhuma versão ainda. Salve um rascunho acima pra começar o histórico.
            </div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="rounded-md border p-3 flex items-center gap-3 flex-wrap">
                <Badge variant={v.status === "published" ? "default" : v.status === "draft" ? "secondary" : "outline"} className={v.status === "published" ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                  v{v.version_number} · {v.status === "published" ? "publicada" : v.status === "draft" ? "rascunho" : "arquivada"}
                </Badge>
                <span className="inline-block h-5 w-5 rounded border" style={{ background: v.primary_color || "transparent" }} />
                <span className="inline-block h-5 w-5 rounded border" style={{ background: v.secondary_color || "transparent" }} />
                {v.logo_url ? <img src={v.logo_url} alt="" className="h-6 w-auto border rounded" /> : null}
                <div className="text-sm flex-1 min-w-[180px]">
                  <div className="font-medium truncate">{v.trade_name || "(sem nome)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                    {v.notes ? ` · ${v.notes}` : ""}
                  </div>
                </div>
                <div className="flex gap-1 ml-auto">
                  {v.status !== "published" && (
                    <Button size="sm" variant="default" className="gap-1" disabled={publish.isPending} onClick={() => publish.mutate(v.id)}>
                      <Rocket className="h-3.5 w-3.5" /> Publicar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1" disabled={restore.isPending} onClick={() => {
                    if (confirm("Restaurar esta versão? Vai sobrescrever o estado atual da empresa.")) restore.mutate(v.id);
                  }}>
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                  </Button>
                  {v.status !== "published" && (
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={remove.isPending} onClick={() => {
                      if (confirm("Remover esta versão?")) remove.mutate(v.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
