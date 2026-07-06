import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import {
  validateTenantPublication,
  approveTenantPublication,
  rollbackTenantPublication,
  listTenantPublications,
  type ValidationDetail,
} from "@/lib/tenant-publication.functions";
import { PublicationStateBadge, derivePublicationState } from "@/components/core/PublicationStateBadge";
import { PublicationValidationCard } from "@/components/core/PublicationValidationCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, CheckCircle2, Undo2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/publicacao/$tenantId")({
  head: () => ({
    meta: [{ title: "Detalhe — Publicação — Core" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: PublicacaoDetail,
});

function PublicacaoDetail() {
  const { tenantId } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listTenantPublications);
  const validate = useServerFn(validateTenantPublication);
  const approve = useServerFn(approveTenantPublication);
  const rollback = useServerFn(rollbackTenantPublication);
  const [busy, setBusy] = useState<"validate" | "approve" | "rollback" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-publications"],
    queryFn: () => list(),
    staleTime: 30_000,
  });
  const row = (data ?? []).find((r: any) => r.company.id === tenantId);

  async function runValidate() {
    setBusy("validate");
    try {
      await validate({ data: { companyId: tenantId } });
      await qc.invalidateQueries({ queryKey: ["tenant-publications"] });
      toast.success("Validações executadas");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao validar");
    } finally {
      setBusy(null);
    }
  }
  async function runApprove() {
    setBusy("approve");
    try {
      const snapshotId = window.prompt(
        "ID do snapshot a promover (commit SHA, tag de build ou identificador manual):",
        `manual-${new Date().toISOString()}`,
      );
      if (!snapshotId) {
        setBusy(null);
        return;
      }
      await approve({ data: { companyId: tenantId, snapshotId } });
      await qc.invalidateQueries({ queryKey: ["tenant-publications"] });
      toast.success("Publicação aprovada. Rode Publish no Lovable para propagar o build.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao aprovar");
    } finally {
      setBusy(null);
    }
  }
  async function runRollback() {
    if (!window.confirm("Reverter para o snapshot anterior?")) return;
    setBusy("rollback");
    try {
      await rollback({ data: { companyId: tenantId } });
      await qc.invalidateQueries({ queryKey: ["tenant-publications"] });
      toast.success("Rollback registrado");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no rollback");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  if (!row) return <div className="p-6 text-sm text-rose-600">Tenant não encontrado</div>;

  const state = row.state;
  const detail = (state?.validation_detail ?? {}) as ValidationDetail;
  const stateName = derivePublicationState(state);
  const allOk = state?.domain_ok && state?.dns_ok && state?.ssl_ok && state?.supabase_ok && state?.env_ok;
  const canApprove = !!allOk;
  const canRollback = !!state?.previous_snapshot_id;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Link
        to={"/core/publicacao" as any}
        className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{row.company.name}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {row.company.domain ? (
              <a
                href={`https://${row.company.domain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {row.company.domain} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span>sem domínio custom</span>
            )}
            <span>·</span>
            <span>{row.company.environment}</span>
          </div>
        </div>
        <PublicationStateBadge state={stateName} />
      </header>

      <Card className="p-4 flex flex-wrap gap-2 items-center">
        <Button size="sm" onClick={runValidate} disabled={busy !== null}>
          <RefreshCw className={`h-4 w-4 mr-1 ${busy === "validate" ? "animate-spin" : ""}`} />
          Validar agora
        </Button>
        <Button size="sm" variant="secondary" onClick={runApprove} disabled={!canApprove || busy !== null}>
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Aprovar publicação
        </Button>
        <Button size="sm" variant="outline" onClick={runRollback} disabled={!canRollback || busy !== null}>
          <Undo2 className="h-4 w-4 mr-1" />
          Rollback
        </Button>
        <div className="text-xs text-muted-foreground ml-auto">
          {state?.validated_at
            ? `Validado em ${new Date(state.validated_at).toLocaleString("pt-BR")}`
            : "Ainda não validado"}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <PublicationValidationCard title="1. Domínio de destino" result={detail.domain} />
        <PublicationValidationCard title="2. DNS (A/CNAME + TXT _lovable)" result={detail.dns} />
        <PublicationValidationCard title="3. SSL / HTTPS" result={detail.ssl} />
        <PublicationValidationCard title="4. Supabase (resolve_tenant_by_host)" result={detail.supabase} />
        <PublicationValidationCard title="5. GitHub (status main)" result={detail.github} />
        <PublicationValidationCard title="6. Variáveis de ambiente" result={detail.env} />
      </div>

      {state && (
        <Card className="p-4 text-xs space-y-1 bg-muted/30">
          <div className="font-medium text-sm mb-2">Snapshot atual</div>
          <div>
            <span className="text-muted-foreground">ID: </span>
            <code>{state.snapshot_id ?? "—"}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Anterior (rollback): </span>
            <code>{state.previous_snapshot_id ?? "—"}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Aprovado em: </span>
            {state.approved_at ? new Date(state.approved_at).toLocaleString("pt-BR") : "—"}
          </div>
        </Card>
      )}

      <Card className="p-4 text-xs bg-amber-500/5 border-amber-500/30 space-y-1">
        <div className="font-medium text-sm">Sobre "Publicar"</div>
        <p className="text-muted-foreground">
          A aprovação registra o snapshot como promovido para este tenant e grava em <code>audit_logs</code>.
          O deploy físico ainda é disparado pelo botão <strong>Publish</strong> do Lovable (modelo B: um deploy
          serve todos os tenants). Rollback: reverte o snapshot para o anterior e limpa a aprovação.
        </p>
      </Card>
    </div>
  );
}
