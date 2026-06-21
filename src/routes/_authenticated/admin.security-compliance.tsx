import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSecurityCompliance } from "@/lib/security-compliance.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, KeyRound, FileSearch, Globe, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/security-compliance")({
  head: () => ({
    meta: [
      { title: "Security & Compliance — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SecurityCompliancePage,
});

const severityClass: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  warn: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

function SecurityCompliancePage() {
  const fn = useServerFn(getSecurityCompliance);
  const { data, isLoading } = useQuery({
    queryKey: ["security-compliance"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );

  const k = data.kpis;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Security &amp; Compliance
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada de LGPD, credenciais, SSL, audit logs e privilégios.
        </p>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${severityClass[a.severity]}`}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <Section icon={<FileSearch className="h-4 w-4" />} title="LGPD">
        <Kpi label="Exclusão — pendentes" value={k.lgpdDelPending.toString()} sub={`${k.lgpdDelOverdue} vencidas`} alert={k.lgpdDelOverdue > 0} />
        <Kpi label="Exportação — pendentes" value={k.lgpdExpPending.toString()} sub={`${k.lgpdExpOverdue} vencidas`} alert={k.lgpdExpOverdue > 0} />
        <Kpi label="Taxa de consentimento (30d)" value={k.consentRate === null ? "—" : `${k.consentRate}%`} />
      </Section>

      <Section icon={<KeyRound className="h-4 w-4" />} title="Credenciais & Integrações">
        <Kpi label="Integrações ativas" value={(k.integTotal - k.integInactive).toString()} sub={`${k.integTotal} total`} />
        <Kpi label="Sem check 24h+" value={k.integStale.toString()} alert={k.integStale > 0} />
        <Kpi label="Com erro" value={k.integErrors.toString()} alert={k.integErrors > 0} />
        <Kpi label="WhatsApp inativas" value={k.waInactive.toString()} sub={`${k.waStale} sem validar 7d`} alert={k.waInactive > 0} />
      </Section>

      <Section icon={<Globe className="h-4 w-4" />} title="Domínios & SSL">
        <Kpi label="SSL expirados" value={k.sslExpired.toString()} alert={k.sslExpired > 0} />
        <Kpi label="SSL expirando em 30d" value={k.sslExpSoon.toString()} alert={k.sslExpSoon > 0} />
        <Kpi label="Suspensões abertas" value={k.suspensionsOpen.toString()} />
      </Section>

      {data.expiringDomains.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Próximos vencimentos SSL</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Domínio</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Vence em</th>
                <th className="text-right p-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.expiringDomains.map((d) => (
                <tr key={d.domain} className="border-b last:border-0">
                  <td className="p-2 font-medium">{d.domain}</td>
                  <td className="p-2"><Badge variant="outline" className="text-xs">{d.status}</Badge></td>
                  <td className={`p-2 text-right tabular-nums ${d.days < 0 ? "text-destructive font-medium" : d.days <= 30 ? "text-amber-600" : ""}`}>
                    {d.days < 0 ? `${Math.abs(d.days)}d atrás` : `${d.days}d`}
                  </td>
                  <td className="p-2 text-right text-xs text-muted-foreground">{new Date(d.ssl_expires_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileSearch className="h-4 w-4" /> Audit Logs</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <MiniStat label="7d" value={k.auditVolume7.toLocaleString("pt-BR")} />
            <MiniStat label="30d" value={k.auditVolume30.toLocaleString("pt-BR")} />
            <MiniStat label="vs anterior" value={k.auditTrend === null ? "—" : `${k.auditTrend > 0 ? "+" : ""}${k.auditTrend}%`} valueClass={k.auditTrend !== null && k.auditTrend >= 100 ? "text-amber-600" : ""} />
          </div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Top ações destrutivas (30d)</h3>
          <div className="space-y-1">
            {data.topDestructive.map((d) => (
              <div key={d.action} className="flex items-center justify-between text-xs">
                <span className="font-mono truncate">{d.action}</span>
                <Badge variant="outline" className="text-xs">{d.count}</Badge>
              </div>
            ))}
            {data.topDestructive.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ação destrutiva.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Privilégios</h2>
          <table className="w-full text-sm mb-4">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left p-2">Role</th>
                <th className="text-right p-2">Usuários</th>
              </tr>
            </thead>
            <tbody>
              {data.rolesBreakdown.map((r) => (
                <tr key={r.role} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs">{r.role}</td>
                  <td className="p-2 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Top atores (7d)</h3>
          <div className="space-y-1">
            {data.topActors.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between text-xs">
                <span className="font-mono truncate max-w-[240px]">{a.user_id}</span>
                <Badge variant="outline" className="text-xs">{a.count}</Badge>
              </div>
            ))}
            {data.topActors.length === 0 && <p className="text-xs text-muted-foreground">Sem atividade.</p>}
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. LGPD vencida = pendente
        há &gt;15 dias. Audit anomalia = +100% vs período anterior. SSL crítico = expira em 30d ou
        já expirado.
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wide">
        {icon} {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function Kpi({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${alert ? "text-destructive" : ""}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="text-center p-2 rounded bg-muted/50">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}
