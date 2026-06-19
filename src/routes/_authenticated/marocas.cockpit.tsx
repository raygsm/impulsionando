import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listMarocasApartments,
  listMarocasServices,
  listMarocasSupplies,
  listMarocasMaintenance,
  listMarocasOwnerStatements,
  updateMarocasServiceStatus,
  updateMarocasServiceChecklist,
  marcarRepasseMarocas,
  requestMarocasSupplyOrder,
  approveMarocasSupplyOrder,
  receiveMarocasSupplyOrder,
  createMarocasPhotoUploadUrl,
  getMarocasPhotoSignedUrl,
  logMarocasServiceAudit,
  listMarocasServiceAudit,
  createMarocasSlaAlert,
  listMarocasSlaAlerts,
  MAROCAS_SLA_MINUTES,
} from "@/lib/marocas.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2, Sparkles, Package, Wrench, Banknote, ExternalLink,
  Calendar, Clock, AlertTriangle, CheckCircle2, Camera, ListChecks,
  ShoppingCart, TrendingUp, Zap, History, Bell, Printer, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/marocas/cockpit")({
  head: () => ({ meta: [{ title: "Marocas — Cockpit de Temporada" }] }),
  component: MarocasCockpit,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const hhmm = (s: string) => new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const STATUS_TONE: Record<string, string> = {
  agendado: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  em_andamento: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  concluido: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  atrasado: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  cancelado: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

type SupplyOrder = { status: "pendente" | "aprovado" | "recebido"; qty: number; requested_at: string; approved_at?: string; received_at?: string } | null;
function readSupplyOrder(notes: string | null | undefined): SupplyOrder {
  if (!notes) return null;
  try { const p = JSON.parse(notes); return p?.order ?? null; } catch { return null; }
}

type ChecklistItem = { label: string; done: boolean };
function readChecklist(raw: unknown, serviceType: string): ChecklistItem[] {
  if (Array.isArray(raw)) return raw as ChecklistItem[];
  const def = DEFAULT_CHECKLIST[serviceType] ?? DEFAULT_CHECKLIST.limpeza;
  return def.map((label) => ({ label, done: false }));
}

const DEFAULT_CHECKLIST: Record<string, string[]> = {
  limpeza: ["Aspirar todos os ambientes", "Trocar enxoval (cama/banho)", "Higienizar banheiros", "Repor amenities", "Conferir cozinha", "Foto antes/depois"],
  enxoval: ["Conferir kit cama casal", "Conferir kit banho", "Embalar lavanderia", "Atualizar inventário"],
  manutencao: ["Diagnóstico", "Foto do problema", "Reparo executado", "Teste pós-reparo", "Foto final"],
  vistoria: ["Conferência geral", "Eletrodomésticos", "Hidráulica", "Inventário batido", "Fotos"],
  check_in: ["Recepção do hóspede", "Entrega de chaves", "Tour pelo imóvel", "Assinatura termo"],
  check_out: ["Vistoria saída", "Coleta chaves", "Conferência danos", "Liberação caução"],
  lavanderia: ["Retirar enxoval", "Lavar/secar", "Dobrar e embalar", "Devolver ao apto"],
  reposicao: ["Conferir lista", "Repor estoque", "Atualizar quantidades"],
};

function slaInfo(s: { status: string; scheduled_for: string; started_at: string | null; completed_at: string | null; service_type: string }) {
  const sla = MAROCAS_SLA_MINUTES[s.service_type] ?? 60;
  const now = Date.now();
  if (s.status === "concluido" && s.started_at && s.completed_at) {
    const elapsed = (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    return { sla, elapsed: Math.round(elapsed), pct: Math.min(100, (elapsed / sla) * 100), late: elapsed > sla };
  }
  if (s.status === "em_andamento" && s.started_at) {
    const elapsed = (now - new Date(s.started_at).getTime()) / 60000;
    return { sla, elapsed: Math.round(elapsed), pct: Math.min(100, (elapsed / sla) * 100), late: elapsed > sla };
  }
  if (s.status === "agendado") {
    const due = new Date(s.scheduled_for).getTime();
    const late = now > due;
    return { sla, elapsed: 0, pct: 0, late };
  }
  return { sla, elapsed: 0, pct: 0, late: false };
}

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
  const updateCk = useServerFn(updateMarocasServiceChecklist);
  const reqOrder = useServerFn(requestMarocasSupplyOrder);
  const approveOrder = useServerFn(approveMarocasSupplyOrder);
  const receiveOrder = useServerFn(receiveMarocasSupplyOrder);

  const inv = () => qc.invalidateQueries({ queryKey: ["marocas"] });

  const setStatusM = useMutation({
    mutationFn: (vars: { id: string; status: "agendado" | "em_andamento" | "concluido" | "cancelado" | "atrasado" }) => setStatus({ data: vars }),
    onSuccess: () => { toast.success("Serviço atualizado"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const repassarM = useMutation({
    mutationFn: (id: string) => repassar({ data: { id, pixTxid: `MAROCAS-${Date.now()}` } }),
    onSuccess: () => { toast.success("Repasse PIX marcado como pago"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const ckM = useMutation({
    mutationFn: (vars: Parameters<typeof updateCk>[0]["data"]) => updateCk({ data: vars }),
    onSuccess: () => { toast.success("Checklist salvo"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reqM = useMutation({
    mutationFn: (vars: { id: string; qty: number }) => reqOrder({ data: vars }),
    onSuccess: () => { toast.success("Pedido de reposição criado"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const apM = useMutation({
    mutationFn: (id: string) => approveOrder({ data: { id } }),
    onSuccess: () => { toast.success("Pedido aprovado"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rcM = useMutation({
    mutationFn: (id: string) => receiveOrder({ data: { id } }),
    onSuccess: () => { toast.success("Recebido — estoque atualizado"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const svcList = svcQ.data ?? [];
  const supList = supQ.data ?? [];

  // SLA alerts panel
  const alertsFn = useServerFn(listMarocasSlaAlerts);
  const alertsQ = useQuery({ queryKey: ["marocas", "alerts"], queryFn: () => alertsFn(), refetchInterval: 60_000 });
  const createAlert = useServerFn(createMarocasSlaAlert);
  const sentAlertsRef = useRef<Set<string>>(new Set());

  // Auto-trigger SLA alerts (warning at 80%, late when stourado) once per service/severity per session
  useEffect(() => {
    svcList.forEach((s) => {
      if (s.status === "concluido" || s.status === "cancelado") return;
      const info = slaInfo(s as any);
      let severity: "warning" | "late" | null = null;
      if (info.late) severity = "late";
      else if (info.pct >= 80) severity = "warning";
      if (!severity) return;
      const key = `${s.id}:${severity}`;
      if (sentAlertsRef.current.has(key)) return;
      sentAlertsRef.current.add(key);
      const msg = `${s.service_type} · ${s.marocas_apartments?.code ?? ""} — ${severity === "late" ? "SLA estourado" : "80% do SLA atingido"} (${info.elapsed}/${info.sla}min)`;
      createAlert({ data: { serviceId: s.id, severity, message: msg } }).then(() => {
        qc.invalidateQueries({ queryKey: ["marocas", "alerts"] });
        toast.warning(msg);
      }).catch(() => { /* silent */ });
    });
  }, [svcList, createAlert, qc]);

  const kpis = useMemo(() => {
    const apts = aptsQ.data ?? [];
    const stm = stmQ.data ?? [];
    const ocupados = apts.filter((a) => a.status === "ocupado").length;
    const previstoMes = stm.filter((s) => s.status === "previsto").reduce((acc, s) => acc + Number(s.net_payout ?? 0), 0);
    const today = new Date().toDateString();
    const servicosHoje = svcList.filter((s) => new Date(s.scheduled_for).toDateString() === today).length;
    const atrasados = svcList.filter((s) => s.status !== "concluido" && s.status !== "cancelado" && slaInfo(s as any).late).length;
    const baixoEstoque = supList.filter((s) => s.current_qty <= s.min_qty).length;
    return { apts: apts.length, ocupados, previstoMes, servicosHoje, baixoEstoque, atrasados };
  }, [aptsQ.data, svcList, stmQ.data, supList]);

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/15 via-fuchsia-500/10 to-amber-400/15 p-8">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-primary">
            <Zap className="h-4 w-4" /> Operação 360º
          </div>
          <h1 className="text-4xl md:text-5xl font-black mt-2 bg-gradient-to-r from-primary via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
            Marocas — Cockpit de Temporada
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-3xl">
            Operação completa de imóveis de temporada integrada ao CORE Impulsionando — agenda, checklists, SLA, estoque e repasses em um único painel vivo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KpiCard icon={<Building2 />} label="Apartamentos" value={String(kpis.apts)} hint={`${kpis.ocupados} ocupados`} tone="sky" />
        <KpiCard icon={<Calendar />} label="Serviços hoje" value={String(kpis.servicosHoje)} tone="violet" />
        <KpiCard icon={<AlertTriangle />} label="Atrasados" value={String(kpis.atrasados)} hint="fora do SLA" tone="rose" pulse={kpis.atrasados > 0} />
        <KpiCard icon={<Package />} label="Baixo estoque" value={String(kpis.baixoEstoque)} hint="abaixo do mínimo" tone="amber" />
        <KpiCard icon={<Wrench />} label="Manutenções" value={String((mntQ.data ?? []).filter((m) => m.status === "aberto").length)} hint="abertas" tone="orange" />
        <KpiCard icon={<Banknote />} label="Repasse" value={BRL.format(kpis.previstoMes)} hint="previsto no mês" tone="emerald" />
      </div>

      <Tabs defaultValue="agenda">
        <TabsList className="bg-card/60 backdrop-blur p-1 h-auto flex-wrap">
          <TabsTrigger value="agenda" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">📅 Agenda</TabsTrigger>
          <TabsTrigger value="operacao" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">⚡ Operação 360º</TabsTrigger>
          <TabsTrigger value="apartamentos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">🏠 Apartamentos</TabsTrigger>
          <TabsTrigger value="suprimentos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">📦 Suprimentos</TabsTrigger>
          <TabsTrigger value="manutencao" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">🔧 Manutenção</TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-fuchsia-500 data-[state=active]:text-primary-foreground px-4 py-2 text-base font-semibold transition-all hover:scale-105">💸 Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          <AgendaPanel services={svcList} />
        </TabsContent>

        <TabsContent value="operacao" className="space-y-3">
          {svcList.map((s) => (
            <ServiceCard
              key={s.id}
              svc={s}
              onStatus={(status) => setStatusM.mutate({ id: s.id, status })}
              onSaveChecklist={(payload) => ckM.mutate({ id: s.id, ...payload })}
            />
          ))}
        </TabsContent>

        <TabsContent value="apartamentos" className="space-y-3">
          {(aptsQ.data ?? []).map((a) => (
            <Card key={a.id} className="p-4 flex gap-4 items-start hover:shadow-xl hover:-translate-y-0.5 transition-all border-l-4 border-l-primary/60">
              {a.cover_photo_url && (
                <img src={a.cover_photo_url} alt={a.title} className="w-32 h-24 rounded object-cover" loading="lazy" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <Badge className={STATUS_TONE[a.status === "ocupado" ? "em_andamento" : a.status === "disponivel" ? "concluido" : "agendado"]}>{a.status}</Badge>
                  <Badge variant="outline" className="font-mono">{a.code}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.address} — {a.city}/{a.state}</p>
                <p className="text-sm">{a.bedrooms} quarto(s) · {a.bathrooms} banheiro(s) · até {a.capacity} hóspedes · diária {a.daily_rate ? BRL.format(Number(a.daily_rate)) : "—"}</p>
                {a.marocas_owners && (
                  <p className="text-xs text-muted-foreground mt-1">Proprietário: {a.marocas_owners.full_name} · PIX {a.marocas_owners.pix_key ?? "—"}</p>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="suprimentos" className="space-y-2">
          {supList.map((s) => {
            const low = s.current_qty <= s.min_qty;
            const order = readSupplyOrder(s.notes);
            const suggestedQty = Math.max(s.min_qty * 2 - s.current_qty, s.min_qty);
            return (
              <Card key={s.id} className={cn("p-4 hover:shadow-lg transition-all", low && !order && "border-rose-500/60 bg-rose-500/5 animate-pulse")}>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={low ? STATUS_TONE.atrasado : STATUS_TONE.concluido}>{s.category}</Badge>
                  <span className="font-bold text-base">{s.item_name}</span>
                  <span className="text-sm text-muted-foreground">{s.marocas_apartments?.code}</span>
                  <span className="text-sm ml-auto font-mono">
                    <span className={low ? "text-rose-600 font-bold" : ""}>{s.current_qty}</span> {s.unit} <span className="text-muted-foreground">(mín {s.min_qty})</span>
                  </span>
                </div>
                {order ? (
                  <div className="mt-3 p-3 rounded-lg bg-muted/40 flex items-center gap-3 flex-wrap">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <Badge className={STATUS_TONE[order.status === "recebido" ? "concluido" : order.status === "aprovado" ? "em_andamento" : "agendado"]}>{order.status}</Badge>
                    <span className="text-sm">Qtd. <strong>{order.qty} {s.unit}</strong> — solicitado {dt(order.requested_at)}</span>
                    <div className="ml-auto flex gap-2">
                      {order.status === "pendente" && (
                        <Button size="sm" variant="outline" onClick={() => apM.mutate(s.id)} disabled={apM.isPending} className="hover:scale-105 transition-transform">Aprovar</Button>
                      )}
                      {order.status === "aprovado" && (
                        <Button size="sm" onClick={() => rcM.mutate(s.id)} disabled={rcM.isPending} className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Dar entrada
                        </Button>
                      )}
                    </div>
                  </div>
                ) : low ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-semibold">⚠ Estoque crítico — sugestão automática: {suggestedQty} {s.unit}</span>
                    <Button size="sm" className="ml-auto bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 hover:scale-105 transition-all" onClick={() => reqM.mutate({ id: s.id, qty: suggestedQty })} disabled={reqM.isPending}>
                      <ShoppingCart className="h-4 w-4 mr-1" /> Pedir reposição
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="manutencao" className="space-y-3">
          {(mntQ.data ?? []).map((m) => (
            <Card key={m.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={m.priority === "urgente" || m.priority === "alta" ? STATUS_TONE.atrasado : STATUS_TONE.agendado}>{m.priority}</Badge>
                <Badge variant="outline">{m.status}</Badge>
                <h3 className="font-bold">{m.title}</h3>
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
            <Card key={s.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={STATUS_TONE[s.status === "pago" ? "concluido" : "agendado"]}>{s.status}</Badge>
                <span className="font-bold">{s.marocas_apartments?.code} — {s.marocas_apartments?.title}</span>
                <span className="text-sm text-muted-foreground">{new Date(s.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                <span className="ml-auto text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{BRL.format(Number(s.net_payout))}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div><div className="text-muted-foreground">Receita bruta</div><div className="font-bold">{BRL.format(Number(s.gross_revenue))}</div></div>
                <div><div className="text-muted-foreground">Taxa Marocas</div><div className="font-bold">{BRL.format(Number(s.marocas_fee))}</div></div>
                <div><div className="text-muted-foreground">Despesas</div><div className="font-bold">{BRL.format(Number(s.expenses))}</div></div>
                <div><div className="text-muted-foreground">PIX</div><div className="font-bold">{s.marocas_owners?.pix_key ?? "—"}</div></div>
              </div>
              {s.status === "previsto" && (
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => repassarM.mutate(s.id)} disabled={repassarM.isPending} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-105 transition-all">
                    <Banknote className="h-4 w-4 mr-1" /> Marcar repasse PIX como pago
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-gradient-to-r from-primary/10 to-fuchsia-500/10 border-primary/30">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          <span className="text-sm">Site comercial público:</span>
          <Link to="/marocas" className="text-sm font-bold underline hover:text-primary transition-colors">/marocas</Link>
        </div>
      </Card>
    </div>
  );
}

const TONE_MAP: Record<string, string> = {
  sky: "from-sky-500/20 to-cyan-500/10 text-sky-600 dark:text-sky-300",
  violet: "from-violet-500/20 to-fuchsia-500/10 text-violet-600 dark:text-violet-300",
  rose: "from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-300",
  amber: "from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-300",
  orange: "from-orange-500/20 to-red-500/10 text-orange-600 dark:text-orange-300",
  emerald: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300",
};

function KpiCard({ icon, label, value, hint, tone = "sky", pulse }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: keyof typeof TONE_MAP; pulse?: boolean }) {
  return (
    <Card className={cn(
      "p-4 bg-gradient-to-br hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default border-0",
      TONE_MAP[tone],
      pulse && "animate-pulse ring-2 ring-rose-500/40"
    )}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-80">
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>{label}
      </div>
      <div className="text-3xl font-black mt-2 tabular-nums">{value}</div>
      {hint && <div className="text-xs mt-1 opacity-70">{hint}</div>}
    </Card>
  );
}

function AgendaPanel({ services }: { services: any[] }) {
  const [mode, setMode] = useState<"dia" | "semana">("dia");
  const [cursor, setCursor] = useState(() => new Date());

  const { days, items } = useMemo(() => {
    const ds: Date[] = [];
    if (mode === "dia") {
      ds.push(new Date(cursor));
    } else {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay()); // domingo
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i); ds.push(d);
      }
    }
    const byDay = ds.map((d) => {
      const key = d.toDateString();
      const list = services
        .filter((s) => new Date(s.scheduled_for).toDateString() === key)
        .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
      return { date: d, list };
    });
    return { days: ds, items: byDay };
  }, [mode, cursor, services]);

  const shift = (delta: number) => {
    const d = new Date(cursor);
    d.setDate(d.getDate() + (mode === "dia" ? delta : delta * 7));
    setCursor(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border bg-card p-1">
          <Button size="sm" variant={mode === "dia" ? "default" : "ghost"} onClick={() => setMode("dia")} className="hover:scale-105 transition-transform">Dia</Button>
          <Button size="sm" variant={mode === "semana" ? "default" : "ghost"} onClick={() => setMode("semana")} className="hover:scale-105 transition-transform">Semana</Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => shift(-1)}>←</Button>
        <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
        <Button size="sm" variant="outline" onClick={() => shift(1)}>→</Button>
        <span className="text-sm text-muted-foreground ml-2">
          {mode === "dia" ? cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }) : `Semana de ${days[0]?.toLocaleDateString("pt-BR")}`}
        </span>
      </div>

      <div className={cn("grid gap-3", mode === "semana" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-1")}>
        {items.map(({ date, list }) => (
          <Card key={date.toISOString()} className="p-3 min-h-32">
            <div className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
              {date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
            </div>
            {list.length === 0 && <div className="text-xs text-muted-foreground italic">Sem serviços</div>}
            <div className="space-y-2">
              {list.map((s: any) => {
                const sla = slaInfo(s);
                return (
                  <div key={s.id} className={cn("p-2 rounded-lg border text-xs transition-all hover:scale-[1.02] hover:shadow-md", STATUS_TONE[s.status])}>
                    <div className="flex items-center gap-1 font-bold">
                      <Clock className="h-3 w-3" /> {hhmm(s.scheduled_for)}
                      {sla.late && s.status !== "concluido" && <Badge variant="destructive" className="ml-auto text-[10px] px-1">SLA</Badge>}
                    </div>
                    <div className="font-semibold mt-1">{s.service_type} · {s.marocas_apartments?.code}</div>
                    <div className="opacity-70">{s.marocas_professionals?.full_name ?? "—"}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ svc, onStatus, onSaveChecklist }: {
  svc: any;
  onStatus: (s: "em_andamento" | "concluido" | "cancelado") => void;
  onSaveChecklist: (p: { checklist: ChecklistItem[]; photos_before: string[]; photos_after: string[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ck, setCk] = useState<ChecklistItem[]>(() => readChecklist(svc.checklist, svc.service_type));
  const [pb, setPb] = useState<string[]>(() => (Array.isArray(svc.photos_before) ? svc.photos_before : []));
  const [pa, setPa] = useState<string[]>(() => (Array.isArray(svc.photos_after) ? svc.photos_after : []));
  const [photoInput, setPhotoInput] = useState("");
  const [photoTarget, setPhotoTarget] = useState<"before" | "after">("after");

  const sla = slaInfo(svc);
  const done = ck.filter((c) => c.done).length;
  const total = ck.length;

  const addPhoto = () => {
    if (!photoInput.trim()) return;
    if (photoTarget === "before") setPb([...pb, photoInput.trim()]);
    else setPa([...pa, photoInput.trim()]);
    setPhotoInput("");
  };

  return (
    <Card className={cn(
      "p-4 hover:shadow-xl transition-all border-l-4",
      sla.late && svc.status !== "concluido" ? "border-l-rose-500 bg-rose-500/5" : "border-l-primary/40"
    )}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={STATUS_TONE[svc.status] ?? STATUS_TONE.agendado}>{svc.status}</Badge>
        <Badge variant="outline" className="font-mono">{svc.service_type}</Badge>
        <span className="text-base font-bold">{svc.marocas_apartments?.code}</span>
        <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{dt(svc.scheduled_for)}</span>
        <span className="text-sm">{svc.marocas_professionals?.full_name ?? "Sem prestador"}</span>
        <span className="text-sm font-bold ml-auto">{BRL.format(Number(svc.cost ?? 0))}</span>
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 font-semibold">
              <TrendingUp className="h-3 w-3" /> SLA {sla.elapsed}/{sla.sla}min
            </span>
            <span className={sla.late ? "text-rose-600 font-bold" : "text-muted-foreground"}>
              {sla.late ? "⚠ Atrasado" : "no prazo"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full transition-all", sla.late ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500")} style={{ width: `${Math.max(4, sla.pct)}%` }} />
          </div>
        </div>
        <Badge variant="outline" className="gap-1"><ListChecks className="h-3 w-3" />{done}/{total}</Badge>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="hover:scale-105 transition-transform">
          {open ? "Fechar" : "Checklist & fotos"}
        </Button>
        {svc.status !== "concluido" && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onStatus("em_andamento")} className="hover:scale-105 transition-transform">Iniciar</Button>
            <Button size="sm" onClick={() => onStatus("concluido")} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-105 transition-all">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
            </Button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-1"><ListChecks className="h-4 w-4" /> Checklist operacional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ck.map((item, i) => (
                <label key={i} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox checked={item.done} onCheckedChange={(v) => {
                    const next = [...ck]; next[i] = { ...item, done: !!v }; setCk(next);
                  }} />
                  <span className={cn("text-sm", item.done && "line-through text-muted-foreground")}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-1"><Camera className="h-4 w-4" /> Fotos</h4>
            <div className="flex gap-2 mb-2">
              <select value={photoTarget} onChange={(e) => setPhotoTarget(e.target.value as any)} className="rounded border bg-background px-2 text-sm">
                <option value="before">Antes</option>
                <option value="after">Depois</option>
              </select>
              <Input placeholder="https://url-da-foto.jpg" value={photoInput} onChange={(e) => setPhotoInput(e.target.value)} />
              <Button size="sm" variant="outline" onClick={addPhoto}>Adicionar</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PhotoStrip title="Antes" urls={pb} onRemove={(i) => setPb(pb.filter((_, idx) => idx !== i))} />
              <PhotoStrip title="Depois" urls={pa} onRemove={(i) => setPa(pa.filter((_, idx) => idx !== i))} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onSaveChecklist({ checklist: ck, photos_before: pb, photos_after: pa })} className="bg-gradient-to-r from-primary to-fuchsia-500 hover:scale-105 transition-all">
              Salvar checklist & fotos
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PhotoStrip({ title, urls, onRemove }: { title: string; urls: string[]; onRemove: (i: number) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase mb-1 opacity-70">{title}</div>
      {urls.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">Sem fotos</div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {urls.map((u, i) => (
            <div key={i} className="relative group">
              <img src={u} alt="" className="w-20 h-20 object-cover rounded border" loading="lazy" />
              <button onClick={() => onRemove(i)} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
