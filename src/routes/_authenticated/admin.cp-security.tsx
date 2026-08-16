import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldAlert, LockKeyhole, Database, KeyRound, Server, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { getCpReadiness } from "@/lib/cp-security.functions";
import { CpMark } from "@/components/cp/CpBrand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/cp-security")({
  head: () => ({ meta: [{ title: "CP — Segurança & Prontidão" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CpSecurityCockpit,
});

const CHECK_LABELS: Record<string, string> = {
  e2ee_protocol_audit: "Protocolo E2EE implementado e auditado",
  dedicated_payload_store_no_backup: "Payload dedicado sem backup recuperável",
  client_side_key_management: "Chaves privadas somente nos dispositivos",
  double_acceptance_invites: "Convite com 2FA e duplo aceite",
  retention_hard_delete_e2e: "Exclusão definitiva comprovada E2E",
  legal_access_log_6m: "Registros legais segregados",
  external_security_audit: "Auditoria externa independente",
  mobile_device_hardening: "Hardening de dispositivo/mobile",
};

function CpSecurityCockpit() {
  const fetchReadiness = useServerFn(getCpReadiness);
  const { data, isLoading, error } = useQuery({ queryKey: ["cp-readiness"], queryFn: () => fetchReadiness(), refetchInterval: 30_000 });

  if (isLoading) return <Card className="p-6">Carregando prontidão do CP…</Card>;
  if (error || !data) return <Card className="border-destructive/30 p-6 text-destructive">Não foi possível carregar o cockpit: {(error as Error | undefined)?.message ?? "sem dados"}</Card>;

  const checks = Object.entries(data.checklist ?? {});
  const done = checks.filter(([, v]) => v).length;
  const ready = checks.length > 0 && done === checks.length && data.security_profile_status === "active" && data.dedicated_payload_rows >= 0 && data.legacy_payload_rows === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><CpMark /><h1 className="mt-4 text-2xl font-black">Segurança & Prontidão do CP</h1><p className="mt-1 text-sm text-muted-foreground">Fonte operacional de verdade. Nenhum selo comercial é liberado sem evidência.</p></div>
        <Badge variant={ready ? "default" : "outline"}>{ready ? "🟢 TESTADO E FUNCIONAL" : "🟠 PARCIAL"}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={ShieldCheck} title="Checklist" value={`${done}/${checks.length}`} detail="itens comprovados" />
        <Metric icon={LockKeyhole} title="Perfil" value={data.security_profile_status ?? "—"} detail={data.security_profile_version ?? "sem versão"} />
        <Metric icon={Database} title="Payload legado" value={String(data.legacy_payload_rows)} detail="deve chegar a zero" danger={data.legacy_payload_rows > 0} />
        <Metric icon={Server} title="Fail-closed" value={data.message_writes_fail_closed ? "Ativo" : "Inativo"} detail="gravação insegura bloqueada" danger={!data.message_writes_fail_closed} />
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600"/><div><h2 className="font-bold">Regra de liberação</h2><p className="mt-1 text-sm text-muted-foreground">O CP só pode liberar mensagens quando todos os controles criptográficos, retenção e auditoria estiverem comprovados. Página pública e convites podem existir antes; conteúdo de conversa, não.</p></div></div>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold">Controles obrigatórios</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checks.map(([key, value]) => <div key={key} className="flex items-center gap-3 rounded-lg border p-3 text-sm">{value ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600"/> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground"/>}<div><div className="font-medium">{CHECK_LABELS[key] ?? key}</div><div className="text-xs text-muted-foreground">{value ? "Evidência registrada" : "Não homologado"}</div></div></div>)}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5"><div className="flex items-center gap-2"><KeyRound className="h-5 w-5"/><h2 className="font-bold">Modelo criptográfico</h2></div><dl className="mt-4 space-y-2 text-sm"><Row label="Provedor possui chave de descriptografia?" value={data.provider_has_decryption_keys ? "SIM — BLOQUEADOR" : "Não (política)"}/><Row label="Backup de conteúdo permitido?" value={data.content_backups_allowed ? "SIM — BLOQUEADOR" : "Não (política)"}/><Row label="Payload dedicado registrado" value={String(data.dedicated_payload_rows)}/></dl></Card>
        <Card className="p-5"><h2 className="font-bold">Acessos úteis</h2><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/cp">Landing CP <ExternalLink className="ml-2 h-4 w-4"/></Link></Button><Button asChild variant="outline"><Link to="/cp-seguro">Área Segura <ExternalLink className="ml-2 h-4 w-4"/></Link></Button></div></Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, title, value, detail, danger = false }: { icon: typeof ShieldCheck; title: string; value: string; detail: string; danger?: boolean }) {
  return <Card className={danger ? "border-destructive/30 p-4" : "p-4"}><Icon className={danger ? "h-5 w-5 text-destructive" : "h-5 w-5 text-primary"}/><div className="mt-3 text-xs text-muted-foreground">{title}</div><div className="mt-1 text-xl font-black">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></Card>;
}
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b pb-2 last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium text-right">{value}</dd></div>; }
