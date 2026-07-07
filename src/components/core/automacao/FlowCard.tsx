import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlowStatusBadge, ModoBadge, ChannelChip } from "./StatusBadges";
import type { Workflow } from "@/data/automacao-catalog";
import { REGUA_LABEL, workflowDownloadUrl } from "@/data/automacao-catalog";
import { toast } from "sonner";
import { Download, ExternalLink, ShieldAlert } from "lucide-react";
import { useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { registerAutomationRequest } from "@/lib/automation-approvals.functions";

export function FlowCard({ wf }: { wf: Workflow }) {
  const url = workflowDownloadUrl(wf);
  const search = useSearch({ strict: false }) as { tenant?: string; mode?: "demo" | "producao" };
  const tenantSlug = search?.tenant ?? null;
  const mode = (search?.mode as "demo" | "producao" | undefined) ?? "demo";
  const register = useServerFn(registerAutomationRequest);

  const logDownload = async () => {
    try {
      await register({
        data: {
          tenantSlug,
          mode,
          regua: wf.regua,
          action: "download",
          files: [url],
          note: `Fluxo: ${wf.slug}`,
        },
      });
    } catch {
      // silencioso: download não deve ser bloqueado por falha de auditoria
    }
  };

  const blockedActivation = () =>
    toast.warning("Ação bloqueada — requer aprovação backend", {
      description: "Nenhum disparo real é feito no frontend. Acompanhe em /core/automacao/aprovacoes.",
      action: {
        label: "Ver aprovações",
        onClick: () => { window.location.href = "/core/automacao/aprovacoes"; },
      },
    });

  return (
    <Card className="p-4 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{wf.nome}</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{wf.slug}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1 shrink-0">
          <FlowStatusBadge status={wf.status} />
          <ModoBadge modo={wf.modo} />
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Régua</dt>
        <dd className="font-medium">{REGUA_LABEL[wf.regua]}</dd>
        <dt className="text-muted-foreground">Gatilho</dt>
        <dd className="font-mono text-[11px] truncate">{wf.gatilho}</dd>
        <dt className="text-muted-foreground">Plano mín.</dt>
        <dd className="uppercase">{wf.planoMin}</dd>
      </dl>

      <div className="flex flex-wrap gap-1">
        {wf.canais.map((c) => <ChannelChip key={c} canal={c} />)}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button asChild size="sm" variant="default">
          <a href={url} download onClick={logDownload}>
            <Download className="h-3.5 w-3.5 mr-1" /> Baixar JSON
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noreferrer" onClick={logDownload}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
          </a>
        </Button>
        <Button size="sm" variant="ghost" onClick={blockedActivation}>
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Ativar produção
        </Button>
      </div>
      <div className="text-[11px] text-muted-foreground">
        Downloads e ativações ficam registrados em{" "}
        <Link to="/core/automacao/aprovacoes" className="underline">Aprovações</Link>.
      </div>
    </Card>
  );
}
