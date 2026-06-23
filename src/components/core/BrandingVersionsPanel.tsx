import { useMemo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GitBranch, Rocket, RotateCcw, Trash2, Loader2, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props { companyId: string }

interface VersionRow {
  id: string;
  version_number: number;
  status: string;
  trade_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  notes: string | null;
  created_at: string;
  published_at: string | null;
  created_by: string | null;
}

interface LiveBranding {
  trade_name: string | null;
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

type ConfirmKind =
  | { kind: "publish"; version: VersionRow; previousPublished: VersionRow | null }
  | { kind: "restore"; version: VersionRow; live: LiveBranding | null }
  | { kind: "delete"; version: VersionRow };

export function BrandingVersionsPanel({ companyId }: Props) {
  const listFn = useServerFn(listBrandingVersions);
  const saveFn = useServerFn(saveBrandingDraft);
  const publishFn = useServerFn(publishBrandingVersion);
  const restoreFn = useServerFn(restoreBrandingVersion);
  const deleteFn = useServerFn(deleteBrandingVersion);
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);

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
    onSuccess: () => { setNotes(""); toast.success("Rascunho salvo."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const publish = useMutation({
    mutationFn: (versionId: string) => publishFn({ data: { companyId, versionId } }),
    onSuccess: () => { setConfirm(null); toast.success("Versão publicada."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const restore = useMutation({
    mutationFn: (versionId: string) => restoreFn({ data: { companyId, versionId } }),
    onSuccess: () => { setConfirm(null); toast.success("Versão restaurada — agora é o branding ativo."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const remove = useMutation({
    mutationFn: (versionId: string) => deleteFn({ data: { companyId, versionId } }),
    onSuccess: () => { setConfirm(null); toast.success("Versão removida."); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const versions: VersionRow[] = (versionsQ.data?.versions ?? []) as VersionRow[];
  const live: LiveBranding | null = (versionsQ.data?.live ?? null) as LiveBranding | null;
  const published = versions.find((v) => v.status === "published") ?? null;

  // Diff live vs published
  const liveVsPublished = useMemo(() => diffBranding(toSnapshot(live), toSnapshot(published)), [live, published]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Versões & publicação
            {published ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">v{published.version_number} publicada</Badge>
            ) : (
              <Badge variant="outline">sem publicação</Badge>
            )}
            {liveVsPublished.length > 0 && published && (
              <Badge variant="secondary">{liveVsPublished.length} mudança(s) não publicada(s)</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            O que está nas outras abas é o <strong>live/draft</strong>. Salve um snapshot quando estiver bom, publique pra travar a versão oficial. Restaure qualquer versão pra reverter.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-2">Live (estado atual em edição)</div>
            <div className="flex items-center gap-3 flex-wrap">
              <Swatch color={live?.primary_color} />
              <Swatch color={live?.secondary_color} />
              {live?.logo_url ? <img src={live.logo_url} alt="" className="h-8 w-auto border rounded" /> : <Badge variant="outline">sem logo</Badge>}
              <span className="text-sm font-medium">{live?.trade_name || live?.name || "—"}</span>
            </div>
            <div className="mt-3 flex gap-2 flex-col sm:flex-row">
              <Input placeholder="Notas (opcional) — ex.: 'campanha Black Friday'" value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1" />
              <Button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="gap-2">
                {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar como rascunho
              </Button>
            </div>
          </div>

          {/* DIFF live vs published */}
          {published && (
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Diferenças: live ↔ v{published.version_number} (publicada)</div>
                {liveVsPublished.length === 0 && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600"><span className="text-[10px]">sincronizado</span></Badge>
                )}
              </div>
              {liveVsPublished.length === 0 ? (
                <p className="text-xs text-muted-foreground">O live está idêntico à versão publicada — nada pendente.</p>
              ) : (
                <ul className="space-y-1.5">
                  {liveVsPublished.map((d) => (
                    <DiffRow key={d.field} diff={d} fromLabel={`v${published.version_number}`} toLabel="live" />
                  ))}
                </ul>
              )}
            </div>
          )}

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
                  <Badge
                    variant={v.status === "published" ? "default" : v.status === "draft" ? "secondary" : "outline"}
                    className={v.status === "published" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                  >
                    v{v.version_number} · {v.status === "published" ? "publicada" : v.status === "draft" ? "rascunho" : "arquivada"}
                  </Badge>
                  <Swatch color={v.primary_color} small />
                  <Swatch color={v.secondary_color} small />
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
                      <Button size="sm" className="gap-1" onClick={() => setConfirm({ kind: "publish", version: v, previousPublished: published })}>
                        <Rocket className="h-3.5 w-3.5" /> Publicar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setConfirm({ kind: "restore", version: v, live })}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                    {v.status !== "published" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirm({ kind: "delete", version: v })}>
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

      <ConfirmDialog
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "publish") publish.mutate(confirm.version.id);
          if (confirm.kind === "restore") restore.mutate(confirm.version.id);
          if (confirm.kind === "delete") remove.mutate(confirm.version.id);
        }}
        pending={publish.isPending || restore.isPending || remove.isPending}
      />
    </>
  );
}

function ConfirmDialog({
  confirm,
  onCancel,
  onConfirm,
  pending,
}: {
  confirm: ConfirmKind | null;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  if (!confirm) return null;

  let title = "";
  let description: React.ReactNode = null;
  let actionLabel = "Confirmar";

  if (confirm.kind === "publish") {
    const v = confirm.version;
    const prev = confirm.previousPublished;
    title = `Publicar v${v.version_number}?`;
    actionLabel = "Publicar agora";
    description = (
      <div className="space-y-2 text-sm">
        <p>Esta versão passa a ser a <strong>oficial</strong>.</p>
        {prev ? (
          <p>A versão <strong>v{prev.version_number}</strong> (atualmente publicada) será <strong>arquivada</strong> automaticamente — fica no histórico, mas perde o selo "publicada".</p>
        ) : (
          <p>Será a primeira versão publicada desta empresa.</p>
        )}
        <p className="text-muted-foreground">Isto não muda o que aparece nas abas Identidade/E-mails/Domínio (esses leem o live). É um marco de versionamento.</p>
      </div>
    );
  } else if (confirm.kind === "restore") {
    const v = confirm.version;
    const diff = diffBranding(toSnapshot(v), toSnapshot(confirm.live));
    title = `Restaurar v${v.version_number}?`;
    actionLabel = "Sobrescrever live";
    description = (
      <div className="space-y-3 text-sm">
        <p>Os valores desta versão vão <strong>sobrescrever o live</strong> (a linha em <code>companies</code>). Logo, paleta e nome aparecem imediatamente nas outras abas.</p>
        {diff.length === 0 ? (
          <p className="text-muted-foreground">O live já é idêntico a esta versão — nada vai mudar.</p>
        ) : (
          <div className="rounded-md border bg-muted/30 p-2">
            <p className="text-xs text-muted-foreground mb-1">O que vai mudar:</p>
            <ul className="space-y-1">
              {diff.map((d) => <DiffRow key={d.field} diff={d} fromLabel="live" toLabel={`v${v.version_number}`} />)}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">O live ainda existe como rascunho; salve um snapshot antes se quiser preservá-lo.</p>
      </div>
    );
  } else {
    title = `Remover v${confirm.version.version_number}?`;
    actionLabel = "Remover";
    description = <p className="text-sm">Esta versão vai ser apagada do histórico. A operação não pode ser desfeita.</p>;
  }

  return (
    <AlertDialog open onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirm(); }} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- Diff helpers ----------

interface Snapshot {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}
interface FieldDiff {
  field: "name" | "logo_url" | "primary_color" | "secondary_color";
  label: string;
  from: string | null;
  to: string | null;
  kind: "text" | "color" | "image";
}

function toSnapshot(s: LiveBranding | VersionRow | null): Snapshot | null {
  if (!s) return null;
  return {
    name: (("trade_name" in s && s.trade_name) || ("name" in s && (s as LiveBranding).name) || "") as string,
    logo_url: s.logo_url ?? null,
    primary_color: s.primary_color ?? null,
    secondary_color: s.secondary_color ?? null,
  };
}

function diffBranding(a: Snapshot | null, b: Snapshot | null): FieldDiff[] {
  if (!a || !b) return [];
  const fields: { field: FieldDiff["field"]; label: string; kind: FieldDiff["kind"] }[] = [
    { field: "name", label: "Nome comercial", kind: "text" },
    { field: "logo_url", label: "Logo", kind: "image" },
    { field: "primary_color", label: "Cor primária", kind: "color" },
    { field: "secondary_color", label: "Cor secundária", kind: "color" },
  ];
  return fields
    .filter((f) => (a as any)[f.field] !== (b as any)[f.field])
    .map((f) => ({ ...f, from: (b as any)[f.field], to: (a as any)[f.field] })); // from = publicada/live anterior, to = live atual
}

function DiffRow({ diff, fromLabel, toLabel }: { diff: FieldDiff; fromLabel: string; toLabel: string }) {
  return (
    <li className="flex items-center gap-2 text-xs flex-wrap">
      <span className="font-medium min-w-[100px]">{diff.label}:</span>
      <DiffValue value={diff.from} kind={diff.kind} muted />
      <span className="text-muted-foreground">({fromLabel})</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <DiffValue value={diff.to} kind={diff.kind} />
      <span className="text-muted-foreground">({toLabel})</span>
    </li>
  );
}

function DiffValue({ value, kind, muted }: { value: string | null; kind: FieldDiff["kind"]; muted?: boolean }) {
  if (!value) return <span className={muted ? "text-muted-foreground italic" : "italic"}>(vazio)</span>;
  if (kind === "color") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded border" style={{ background: value }} />
        <code className="text-[10px]">{value}</code>
      </span>
    );
  }
  if (kind === "image") {
    return <img src={value} alt="" className="h-5 w-auto border rounded inline-block" />;
  }
  return <code className={`text-[10px] ${muted ? "text-muted-foreground" : ""}`}>{value}</code>;
}

function Swatch({ color, small }: { color: string | null | undefined; small?: boolean }) {
  return (
    <span
      className={`inline-block rounded border ${small ? "h-5 w-5" : "h-6 w-6"}`}
      style={{ background: color || "transparent" }}
      title={color || "—"}
    />
  );
}
