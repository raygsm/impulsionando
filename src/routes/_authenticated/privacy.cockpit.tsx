import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Trash2, Download, MailX, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/privacy/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit LGPD & Privacidade — Impulsionando" }] }),
  component: PrivacyCockpit,
});

function PrivacyCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["privacy-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const [consents, delPending, delAll, exportPending, exportAll, suppressed, recentDel, recentExp] = await Promise.all([
        supabase.from("lgpd_consents").select("id", { count: "exact", head: true }).eq("accepted", true).is("revoked_at", null),
        supabase.from("data_deletion_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("data_deletion_requests").select("id", { count: "exact", head: true }),
        supabase.from("data_export_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("data_export_requests").select("id", { count: "exact", head: true }),
        supabase.from("suppressed_emails").select("id", { count: "exact", head: true }),
        supabase.from("data_deletion_requests")
          .select("id, user_id, status, reason, scheduled_for, created_at")
          .order("created_at", { ascending: false }).limit(8),
        supabase.from("data_export_requests")
          .select("id, user_id, status, expires_at, created_at")
          .order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        consents: consents.count ?? 0,
        delPending: delPending.count ?? 0,
        delTotal: delAll.count ?? 0,
        expPending: exportPending.count ?? 0,
        expTotal: exportAll.count ?? 0,
        suppressed: suppressed.count ?? 0,
        recentDel: recentDel.data ?? [],
        recentExp: recentExp.data ?? [],
      };
    },
  });

  const kpis = [
    { label: "Consentimentos ativos", value: data?.consents ?? "—", icon: ShieldCheck, color: "text-emerald-600" },
    { label: "Exclusões pendentes",   value: data?.delPending ?? "—", sub: `${data?.delTotal ?? 0} no total`, icon: Trash2, color: "text-destructive" },
    { label: "Exports pendentes",     value: data?.expPending ?? "—", sub: `${data?.expTotal ?? 0} no total`, icon: Download, color: "text-amber-600" },
    { label: "E-mails suprimidos",    value: data?.suppressed ?? "—", icon: MailX, color: "text-sky-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit LGPD & Privacidade" description="Consentimentos, direitos do titular (exclusão e portabilidade) e supressão de comunicações." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
          </Card>
        ))}
      </div>

      {data && data.delPending > 0 && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">{data.delPending} solicitação(ões) de exclusão aguardando processamento</div>
              <div className="text-muted-foreground">LGPD: prazo legal de 15 dias após a confirmação do titular.</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Deletions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> Solicitações de exclusão
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/privacy">Privacidade <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {isLoading ? <Skeleton className="h-32 w-full" /> : data?.recentDel.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Nenhuma solicitação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agendada</TableHead>
                  <TableHead>Solicitada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentDel.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.user_id?.slice(0, 8)}…</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{d.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Exports */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-amber-600" /> Solicitações de exportação
            </h2>
          </div>
          {isLoading ? <Skeleton className="h-32 w-full" /> : data?.recentExp.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Nenhuma solicitação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Solicitada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentExp.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.user_id?.slice(0, 8)}…</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{d.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.expires_at ? new Date(d.expires_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-semibold mb-1">Base legal: LGPD (Lei 13.709/2018)</div>
            <p className="text-muted-foreground">
              Art. 18 garante ao titular: confirmação, acesso, correção, anonimização, portabilidade,
              eliminação e revogação de consentimento. Todas as solicitações são auditáveis em{" "}
              <Link to="/audit" className="underline">Auditoria</Link>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
