import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDemoCompanies, impersonateDemo, runWizardSmokeTest } from "@/lib/demos.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { ExternalLink, FlaskConical, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const fmtBRL = (v: number) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/_authenticated/core/demos")({
  component: CoreDemosPage,
});

type DemoRow = {
  id: string;
  name: string;
  trade_name: string | null;
  email: string | null;
  environment: string | null;
  status: string | null;
  primary_color: string | null;
  niche: { id: string; slug: string; name: string } | null;
  contracts: Array<{
    id: string;
    status: string;
    recurring_amount: number;
    setup_amount: number;
    next_due_date: string;
    invoices: Array<{ id: string; status: string; amount: number; due_date: string }>;
  }>;
};

function CoreDemosPage() {
  const qc = useQueryClient();
  const fetchDemos = useServerFn(listDemoCompanies);
  const impersonate = useServerFn(impersonateDemo);
  const smoke = useServerFn(runWizardSmokeTest);

  const { data, isLoading } = useQuery({
    queryKey: ["core-demos"],
    queryFn: () => fetchDemos(),
  });

  const impersonateMut = useMutation({
    mutationFn: (companyId: string) => impersonate({ data: { companyId } }),
    onSuccess: (r) => {
      if (r.inviteLink) {
        window.open(r.inviteLink, "_blank");
        toast.success("Magic link aberto em nova aba.");
      } else {
        toast.error("Não foi possível gerar o link.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [smokeReport, setSmokeReport] = useState<Awaited<ReturnType<typeof smoke>> | null>(null);
  const smokeMut = useMutation({
    mutationFn: () => smoke(),
    onSuccess: (r) => {
      setSmokeReport(r);
      qc.invalidateQueries({ queryKey: ["core-demos"] });
      if (r.success) toast.success("Smoke test do wizard: ✅ todos os passos OK");
      else toast.error("Smoke test do wizard: ❌ houve falhas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const demos = (data?.demos ?? []) as unknown as DemoRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demos por nicho"
        description="Empresas demonstração geradas pelo CORE com contrato e 1ª fatura prontos."
        action={
          <Button
            onClick={() => smokeMut.mutate()}
            disabled={smokeMut.isPending}
            variant="outline"
          >
            {smokeMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="mr-2 h-4 w-4" />
            )}
            Rodar smoke test do wizard
          </Button>
        }
      />

      {smokeReport && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Smoke test {smokeReport.success ? "✅" : "❌"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSmokeReport(null)}>
              fechar
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {smokeReport.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                {s.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                )}
                <span className="font-mono">{s.key}</span>
                {s.detail && <span className="text-muted-foreground">— {s.detail}</span>}
              </li>
            ))}
          </ul>
          <pre className="mt-3 text-xs bg-muted/40 rounded p-2 overflow-x-auto">
            {JSON.stringify(smokeReport.ids, null, 2)}
          </pre>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando demos…</Card>
      ) : demos.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Nenhuma empresa demo encontrada. A migration de seed cria uma por nicho ativo.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demos.map((d) => {
            const contract = d.contracts?.[0];
            const invoice = contract?.invoices?.[0];
            return (
              <Card key={d.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{d.trade_name || d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.niche?.name ?? "—"}</div>
                  </div>
                  <Badge variant="secondary">{d.environment ?? "demo"}</Badge>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>e-mail: <span className="font-mono">{d.email}</span></div>
                  {contract && (
                    <div>
                      contrato: {fmtBRL(Number(contract.recurring_amount))}/mês ·{" "}
                      próx. {contract.next_due_date}
                    </div>
                  )}
                  {invoice && (
                    <div>
                      1ª fatura: <Badge variant="outline">{invoice.status}</Badge>{" "}
                      {fmtBRL(Number(invoice.amount))} · venc. {invoice.due_date}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => impersonateMut.mutate(d.id)}
                  disabled={impersonateMut.isPending}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Entrar como admin demo
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
