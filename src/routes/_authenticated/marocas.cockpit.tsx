import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listMarocasApartments,
  listMarocasServices,
  listMarocasSupplies,
  listMarocasMaintenance,
  listMarocasOwnerStatements,
  updateMarocasServiceStatus,
  marcarRepasseMarocas,
} from "@/lib/marocas.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Sparkles, Package, Wrench, Banknote, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marocas/cockpit")({
  head: () => ({ meta: [{ title: "Marocas — Cockpit de Temporada" }] }),
  component: MarocasCockpit,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  agendado: "secondary",
  em_andamento: "outline",
  concluido: "default",
  atrasado: "destructive",
  cancelado: "destructive",
};

function MarocasCockpit() {
  const qc = useQueryClient();
  const apartments = useServerFn(listMarocasApartments);
  const services = useServerFn(listMarocasServices);
  const supplies = useServerFn(listMarocasSupplies);
  const maintenance = useServerFn(listMarocasMaintenance);
  const statements = useServerFn(listMarocasOwnerStatements);

  const aptsQ = useQuery({ queryKey: ["marocas", "apartments"], queryFn: () => apartments() });
  const svcQ = useQuery({ queryKey: ["marocas", "services"], queryFn: () => services({ data: {} }) });
  const supQ = useQuery({ queryKey: ["marocas", "supplies"], queryFn: () => supplies({ data: {} }) });
  const mntQ = useQuery({ queryKey: ["marocas", "maintenance"], queryFn: () => maintenance() });
  const stmQ = useQuery({ queryKey: ["marocas", "statements"], queryFn: () => statements() });

  const setStatus = useServerFn(updateMarocasServiceStatus);
  const repassar = useServerFn(marcarRepasseMarocas);

  const setStatusM = useMutation({
    mutationFn: (vars: { id: string; status: "agendado" | "em_andamento" | "concluido" | "cancelado" | "atrasado" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Serviço atualizado");
      qc.invalidateQueries({ queryKey: ["marocas", "services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const repassarM = useMutation({
    mutationFn: (id: string) => repassar({ data: { id, pixTxid: `MAROCAS-${Date.now()}` } }),
    onSuccess: () => {
      toast.success("Repasse PIX marcado como pago");
      qc.invalidateQueries({ queryKey: ["marocas", "statements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpis = useMemo(() => {
    const apts = aptsQ.data ?? [];
    const svc = svcQ.data ?? [];
    const stm = stmQ.data ?? [];
    const ocupados = apts.filter((a) => a.status === "ocupado").length;
    const previstoMes = stm
      .filter((s) => s.status === "previsto")
      .reduce((acc, s) => acc + Number(s.net_payout ?? 0), 0);
    const servicosHoje = svc.filter((s) => {
      const d = new Date(s.scheduled_for);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    const baixoEstoque = (supQ.data ?? []).filter((s) => s.current_qty <= s.min_qty).length;
    return { apts: apts.length, ocupados, previstoMes, servicosHoje, baixoEstoque };
  }, [aptsQ.data, svcQ.data, stmQ.data, supQ.data]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Marocas — Cockpit de Temporada"
        description="Operação completa de imóveis de temporada integrada ao CORE Impulsionando."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={<Building2 className="h-4 w-4" />} label="Apartamentos" value={String(kpis.apts)} hint={`${kpis.ocupados} ocupados`} />
        <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Serviços hoje" value={String(kpis.servicosHoje)} />
        <KpiCard icon={<Package className="h-4 w-4" />} label="Baixo estoque" value={String(kpis.baixoEstoque)} hint="itens abaixo do mínimo" />
        <KpiCard icon={<Wrench className="h-4 w-4" />} label="Manutenções abertas" value={String((mntQ.data ?? []).filter((m) => m.status === "aberto").length)} />
        <KpiCard icon={<Banknote className="h-4 w-4" />} label="Repasse previsto" value={BRL.format(kpis.previstoMes)} hint="mês corrente" />
      </div>

      <Tabs defaultValue="apartamentos">
        <TabsList>
          <TabsTrigger value="apartamentos">Apartamentos</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="suprimentos">Suprimentos</TabsTrigger>
          <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="apartamentos" className="space-y-3">
          {(aptsQ.data ?? []).map((a) => (
            <Card key={a.id} className="p-4 flex gap-4 items-start">
              {a.cover_photo_url && (
                <img src={a.cover_photo_url} alt={a.title} className="w-32 h-24 rounded object-cover" loading="lazy" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge variant={a.status === "disponivel" ? "default" : a.status === "ocupado" ? "secondary" : "outline"}>{a.status}</Badge>
                  <Badge variant="outline">{a.code}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.address} — {a.city}/{a.state}</p>
                <p className="text-sm">
                  {a.bedrooms} quarto(s) · {a.bathrooms} banheiro(s) · até {a.capacity} hóspedes · diária {a.daily_rate ? BRL.format(Number(a.daily_rate)) : "—"}
                </p>
                {a.marocas_owners && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Proprietário: {a.marocas_owners.full_name} · PIX {a.marocas_owners.pix_key ?? "—"}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="operacao" className="space-y-2">
          {(svcQ.data ?? []).map((s) => (
            <Card key={s.id} className="p-3 flex flex-wrap items-center gap-3">
              <Badge variant={STATUS_VARIANT[s.status] ?? "secondary"}>{s.status}</Badge>
              <Badge variant="outline">{s.service_type}</Badge>
              <span className="text-sm font-medium">{s.marocas_apartments?.code}</span>
              <span className="text-sm text-muted-foreground">{dt(s.scheduled_for)}</span>
              <span className="text-sm">{s.marocas_professionals?.full_name ?? "Sem prestador"}</span>
              <span className="text-sm font-semibold ml-auto">{BRL.format(Number(s.cost ?? 0))}</span>
              {s.status !== "concluido" && (
                <StatusActions id={s.id} onChange={(status) => setStatusM.mutate({ id: s.id, status })} />
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="suprimentos" className="space-y-2">
          {(supQ.data ?? []).map((s) => {
            const low = s.current_qty <= s.min_qty;
            return (
              <Card key={s.id} className={`p-3 flex flex-wrap items-center gap-3 ${low ? "border-destructive" : ""}`}>
                <Badge variant={low ? "destructive" : "outline"}>{s.category}</Badge>
                <span className="font-medium">{s.item_name}</span>
                <span className="text-sm text-muted-foreground">{s.marocas_apartments?.code}</span>
                <span className="text-sm ml-auto">
                  {s.current_qty} {s.unit} <span className="text-muted-foreground">(mín {s.min_qty})</span>
                </span>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="manutencao" className="space-y-3">
          {(mntQ.data ?? []).map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant={m.priority === "urgente" || m.priority === "alta" ? "destructive" : "secondary"}>{m.priority}</Badge>
                <Badge variant="outline">{m.status}</Badge>
                <h3 className="font-semibold">{m.title}</h3>
                <span className="text-sm text-muted-foreground ml-auto">{m.marocas_apartments?.code}</span>
              </div>
              {m.description && <p className="text-sm mt-2 text-muted-foreground">{m.description}</p>}
              {(m.marocas_maintenance_quotes ?? []).length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cotações</p>
                  {m.marocas_maintenance_quotes.map((q) => (
                    <div key={q.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{q.status}</Badge>
                      <span>{q.marocas_professionals?.full_name}</span>
                      <span className="ml-auto font-semibold">{BRL.format(Number(q.amount))}</span>
                      <span className="text-muted-foreground">{q.estimated_hours}h</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-3">
          {(stmQ.data ?? []).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={s.status === "pago" ? "default" : s.status === "previsto" ? "secondary" : "outline"}>{s.status}</Badge>
                <span className="font-semibold">{s.marocas_apartments?.code} — {s.marocas_apartments?.title}</span>
                <span className="text-sm text-muted-foreground">{new Date(s.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                <span className="ml-auto text-lg font-bold">{BRL.format(Number(s.net_payout))}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div><div className="text-muted-foreground">Receita bruta</div><div className="font-medium">{BRL.format(Number(s.gross_revenue))}</div></div>
                <div><div className="text-muted-foreground">Taxa Marocas</div><div className="font-medium">{BRL.format(Number(s.marocas_fee))}</div></div>
                <div><div className="text-muted-foreground">Despesas</div><div className="font-medium">{BRL.format(Number(s.expenses))}</div></div>
                <div><div className="text-muted-foreground">PIX</div><div className="font-medium">{s.marocas_owners?.pix_key ?? "—"}</div></div>
              </div>
              {s.status === "previsto" && (
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => repassarM.mutate(s.id)} disabled={repassarM.isPending}>
                    Marcar repasse PIX como pago
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-muted/40">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm">Site comercial público:</span>
          <Link to="/marocas" className="text-sm font-semibold underline">/marocas</Link>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function StatusActions({ id, onChange }: { id: string; onChange: (s: "em_andamento" | "concluido" | "cancelado") => void }) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => onChange("em_andamento")}>Iniciar</Button>
      <Button size="sm" onClick={() => onChange("concluido")}>Concluir</Button>
    </div>
  );
}
