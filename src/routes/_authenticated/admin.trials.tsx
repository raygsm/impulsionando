import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTrials, getTrialStats, convertTrial, regularizeTrial, extendTrial, cancelTrial } from "@/lib/trial.functions";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, AlertTriangle, Clock, TrendingUp, XCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/trials")({
  head: () => ({ meta: [{ title: "Trials — Impulsionando Tecnologia" }] }),
  component: AdminTrialsPage,
});

const STATUS_LABELS: Record<string, string> = {
  solicitado: "Solicitado",
  ativo: "Ativo",
  vence_3d: "Vence em 3 dias",
  vence_1d: "Vence amanhã",
  vence_hoje: "Vence hoje",
  encerrado: "Encerrado",
  cobranca_gerada: "Cobrança gerada",
  pagamento_pendente: "Pagamento pendente",
  convertido: "Convertido",
  suspenso: "Suspenso",
  regularizado: "Regularizado",
  cancelado: "Cancelado",
  expirado_sem_conversao: "Expirado sem conversão",
};

function AdminTrialsPage() {
  const { data: me } = useCurrentUser();
  const isSuper = !!me?.isSuperAdmin;
  const qc = useQueryClient();
  const listFn = useServerFn(listTrials);
  const statsFn = useServerFn(getTrialStats);
  const convertFn = useServerFn(convertTrial);
  const regFn = useServerFn(regularizeTrial);
  const extFn = useServerFn(extendTrial);
  const cancFn = useServerFn(cancelTrial);

  const [filter, setFilter] = useState<string>("");

  const { data: list } = useQuery({ queryKey: ["trials", filter], queryFn: () => listFn({ data: { status: filter || undefined } }) });
  const { data: stats } = useQuery({ queryKey: ["trial-stats"], queryFn: () => statsFn() });

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["trials"] });
    qc.invalidateQueries({ queryKey: ["trial-stats"] });
  };

  const mConvert = useMutation({ mutationFn: (id: string) => convertFn({ data: { trialId: id } }), onSuccess: () => { toast.success("Convertido"); refetch(); }, onError: (e: Error) => toast.error(e.message) });
  const mReg = useMutation({ mutationFn: (id: string) => regFn({ data: { trialId: id } }), onSuccess: () => { toast.success("Regularizado"); refetch(); }, onError: (e: Error) => toast.error(e.message) });
  const mCancel = useMutation({ mutationFn: (id: string) => cancFn({ data: { trialId: id } }), onSuccess: () => { toast.success("Cancelado"); refetch(); }, onError: (e: Error) => toast.error(e.message) });

  const counts = stats?.counts ?? {};

  return (
    <div>
      <PageHeader title="Trials — 7 dias" description="Acompanhamento de todos os Trials da Impulsionando Tecnologia." />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total" value={stats?.total ?? 0} icon={Sparkles} accent />
        <StatCard label="Ativos" value={counts.ativo ?? 0} icon={Clock} />
        <StatCard label="Próximos do fim" value={(counts.vence_3d ?? 0) + (counts.vence_1d ?? 0) + (counts.vence_hoje ?? 0)} icon={AlertTriangle} />
        <StatCard label="Convertidos" value={counts.convertido ?? 0} icon={CheckCircle2} />
        <StatCard label="Suspensos" value={counts.suspenso ?? 0} icon={Ban} />
        <StatCard label="Conversão" value={`${stats?.conversionRate ?? 0}%`} icon={TrendingUp} />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button size="sm" variant={filter === "" ? "default" : "outline"} onClick={() => setFilter("")}>Todos</Button>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{v}</Button>
        ))}
      </div>

      <Card className="shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-3 py-2 font-medium">Cliente</th>
                <th className="text-left px-3 py-2 font-medium">Empresa</th>
                <th className="text-left px-3 py-2 font-medium">Plano</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Termina em</th>
                <th className="text-right px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(list?.trials ?? []).length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-10">Nenhum Trial encontrado.</td></tr>
              )}
              {list?.trials?.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium">{t.contact_name}</div>
                    <div className="text-xs text-muted-foreground">{t.contact_email}</div>
                  </td>
                  <td className="px-3 py-2">{t.contact_company}</td>
                  <td className="px-3 py-2 capitalize">{t.chosen_plan?.replace("_", " ")}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{STATUS_LABELS[t.status] ?? t.status}</Badge></td>
                  <td className="px-3 py-2 text-xs">{t.ends_at ? new Date(t.ends_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {isSuper && (
                      <div className="flex gap-1 justify-end flex-wrap">
                        <ExtendDialog onSubmit={(d, r) => extFn({ data: { trialId: t.id, days: d, reason: r } }).then(refetch).catch((e: Error) => toast.error(e.message))} />
                        <Button size="sm" variant="outline" onClick={() => mConvert.mutate(t.id)}>Converter</Button>
                        <Button size="sm" variant="outline" onClick={() => mReg.mutate(t.id)}>Regularizar</Button>
                        <Button size="sm" variant="ghost" onClick={() => mCancel.mutate(t.id)}><XCircle className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ExtendDialog({ onSubmit }: { onSubmit: (days: number, reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Estender</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Estender Trial</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Dias adicionais</Label>
            <Input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
          <div>
            <Label>Motivo (obrigatório)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <Button className="w-full" onClick={() => { onSubmit(days, reason); setOpen(false); }}>Confirmar extensão</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
