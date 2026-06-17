import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runClientHealthCheck, listClientsForGovernance } from "@/lib/governance.functions";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { CheckCircle2, XCircle, AlertCircle, FlaskConical, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/testes")({
  head: () => ({ meta: [{ title: "Central de Testes — Core" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: TestesPage,
});

function TestesPage() {
  const runFn = useServerFn(runClientHealthCheck);
  const listClients = useServerFn(listClientsForGovernance);
  const { data: clients } = useQuery({ queryKey: ["gov-clients"], queryFn: () => listClients() });
  const [companyId, setCompanyId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  async function execute() {
    if (!companyId) return;
    setRunning(true);
    try {
      const res = await runFn({ data: { company_id: companyId } });
      setResult(res);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Central de Testes</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Antes de entregar o cliente, execute o teste completo: login, WhatsApp, e-mail, agenda, cobrança, Pix, NF e dashboard.
        </p>
        <div className="flex gap-2">
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecionar cliente…" /></SelectTrigger>
            <SelectContent>
              {(clients?.companies ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={execute} disabled={!companyId || running}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Executar teste completo
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-5">
          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="bg-emerald-500">Aprovado: {result.summary.pass}</Badge>
            <Badge variant="destructive">Falhou: {result.summary.fail}</Badge>
            <Badge variant="outline">Pendente: {result.summary.pending}</Badge>
          </div>
          <ul className="divide-y">
            {result.checks.map((c: any) => (
              <li key={c.key} className="flex items-center justify-between py-2">
                <span className="text-sm">{c.label}</span>
                {c.status === "pass" && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4" /> Aprovado</span>}
                {c.status === "fail" && <span className="flex items-center gap-1 text-destructive text-sm"><XCircle className="w-4 h-4" /> Falhou</span>}
                {c.status === "pending" && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertCircle className="w-4 h-4" /> Pendente</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
