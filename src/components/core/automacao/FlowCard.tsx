import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlowStatusBadge, ModoBadge, ChannelChip } from "./StatusBadges";
import type { Workflow } from "@/data/automacao-catalog";
import { REGUA_LABEL, workflowDownloadUrl } from "@/data/automacao-catalog";
import { toast } from "sonner";
import { Download, ExternalLink, ShieldAlert } from "lucide-react";
import { useSearch, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { registerAutomationRequest } from "@/lib/automation-approvals.functions";

export interface ApprovalCounts {
  pending: number;
  approved: number;
  rejected: number;
  registered: number;
  total: number;
}

export function FlowCard({ wf, counts }: { wf: Workflow; counts?: ApprovalCounts }) {
  const url = workflowDownloadUrl(wf);
  const search = useSearch({ strict: false }) as { tenant?: string; mode?: "demo" | "producao" };
  const tenantSlug = search?.tenant ?? null;
  const mode = (search?.mode as "demo" | "producao" | undefined) ?? "demo";
  const register = useServerFn(registerAutomationRequest);
  const navigate = useNavigate();

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

  const blockedActivation = async () => {
    let id: string | undefined;
    try {
      const res = await register({
        data: {
          tenantSlug,
          mode,
          regua: wf.regua,
          action: "activate",
          files: [url],
          note: `Solicitação de ativação em produção — fluxo ${wf.slug}`,
        },
      });
      id = res?.id;
    } catch {
      // segue com o toast mesmo sem persistir
    }
    const summary = counts
      ? `Pendentes: ${counts.pending} · Aprovadas: ${counts.approved} · Recusadas: ${counts.rejected}`
      : "Acompanhe o status em Aprovações.";
    toast.warning("Ativação em produção exige aprovação backend", {
      description: `Sua solicitação${id ? ` (#${id.slice(0, 8)})` : ""} ficou registrada em modo ${mode}. ${summary}`,
      duration: 8000,
      action: {
        label: "Ver aprovações",
        onClick: () =>
          navigate({
            to: "/core/automacao/aprovacoes",
            search: tenantSlug ? { tenant: tenantSlug, mode } : { mode },
          }),
      },
    });
  };


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
