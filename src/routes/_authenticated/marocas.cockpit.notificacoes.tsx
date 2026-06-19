import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listMarocasServices,
  sendMarocasReportNow,
  listMarocasReportSchedules,
  upsertMarocasReportSchedule,
  MAROCAS_SLA_MINUTES,
} from "@/lib/marocas.functions";
import {
  loadNotifyConfig,
  saveNotifyConfig,
  defaultNotifyConfig,
  shouldNotify,
  type NotifyConfig,
  type NotifyChannel,
} from "@/lib/marocas-notifications-config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Bell, RotateCcw, Save, Send, Eye, History } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/marocas/cockpit/notificacoes")({
  head: () => ({ meta: [{ title: "Marocas — Notificações & Limiares" }] }),
  component: NotificationsConfigPage,
});

const CHANNELS: NotifyChannel[] = ["cockpit", "whatsapp", "email"];

function slaPctFor(s: { service_type: string; status: string; started_at?: string | null; scheduled_for: string }) {
  const sla = MAROCAS_SLA_MINUTES[s.service_type] ?? 60;
  const now = Date.now();
  if (s.status === "em_andamento" && s.started_at) {
    const e = (now - new Date(s.started_at).getTime()) / 60000;
    return { sla, elapsed: Math.round(e), pct: Math.min(100, (e / sla) * 100), late: e > sla };
  }
  if (s.status === "agendado") {
    return { sla, elapsed: 0, pct: 0, late: now > new Date(s.scheduled_for).getTime() };
  }
  return { sla, elapsed: 0, pct: 0, late: false };
}

function NotificationsConfigPage() {
  const [cfg, setCfg] = useState<NotifyConfig>(() => loadNotifyConfig());
  const services = useServerFn(listMarocasServices);
  const svcQ = useQuery({ queryKey: ["marocas", "services", "preview"], queryFn: () => services({ data: {} }) });
  const sendReport = useServerFn(sendMarocasReportNow);
  const listSchedules = useServerFn(listMarocasReportSchedules);
  const upsertSchedule = useServerFn(upsertMarocasReportSchedule);

  // Carrega schedules salvos no servidor e mescla na configuração local
  const schedQ = useQuery({ queryKey: ["marocas", "report-schedules"], queryFn: () => listSchedules() });
  useEffect(() => {
    if (!schedQ.data) return;
    const d = schedQ.data.find((s: any) => s.period === "dia");
    const w = schedQ.data.find((s: any) => s.period === "semana");
    setCfg((prev) => ({
      ...prev,
      reports: {
        daily: d ? { enabled: d.enabled, hour: d.hour, channels: d.channels, weekday: undefined } : prev.reports.daily,
        weekly: w ? { enabled: w.enabled, hour: w.hour, channels: w.channels, weekday: w.weekday ?? 1 } : prev.reports.weekly,
      },
    }));
  }, [schedQ.data]);

  const updateType = (key: string, patch: Partial<NotifyConfig["types"][string]>) => {
    setCfg({ ...cfg, types: { ...cfg.types, [key]: { ...cfg.types[key], ...patch } } });
  };
  const toggleTypeChannel = (key: string, ch: NotifyChannel) => {
    const cur = cfg.types[key];
    const has = cur.channels.includes(ch);
    updateType(key, { channels: has ? cur.channels.filter((c) => c !== ch) : [...cur.channels, ch] });
  };
  const updateReport = (k: "daily" | "weekly", patch: Partial<NotifyConfig["reports"]["daily"]>) => {
    setCfg({ ...cfg, reports: { ...cfg.reports, [k]: { ...cfg.reports[k], ...patch } } });
  };
  const toggleReportChannel = (k: "daily" | "weekly", ch: NotifyChannel) => {
    const cur = cfg.reports[k];
    const has = cur.channels.includes(ch);
    updateReport(k, { channels: has ? cur.channels.filter((c) => c !== ch) : [...cur.channels, ch] });
  };

  const preview = useMemo(() => {
    const items: Array<{ service: any; severity: "warning" | "late"; channels: NotifyChannel[] }> = [];
    (svcQ.data ?? []).forEach((s) => {
      if (s.status === "concluido" || s.status === "cancelado") return;
      const info = slaPctFor(s as any);
      const sev = shouldNotify(cfg, s.service_type, info.pct, info.late);
      if (sev) items.push({ service: s, severity: sev, channels: cfg.types[s.service_type]?.channels ?? ["cockpit"] });
    });
    return items.slice(0, 20);
  }, [svcQ.data, cfg]);

  const handleSave = async () => {
    saveNotifyConfig(cfg);
    // Persiste schedules diário/semanal no servidor (para o pg_cron disparar)
    try {
      await Promise.all([
        upsertSchedule({ data: { period: "dia", hour: cfg.reports.daily.hour, weekday: null, channels: cfg.reports.daily.channels, enabled: cfg.reports.daily.enabled } }),
        upsertSchedule({ data: { period: "semana", hour: cfg.reports.weekly.hour, weekday: cfg.reports.weekly.weekday ?? 1, channels: cfg.reports.weekly.channels, enabled: cfg.reports.weekly.enabled } }),
      ]);
      toast.success("Configuração salva (limiares locais + agendamento no servidor)");
    } catch (e: any) {
      toast.error(`Limiares salvos localmente, mas o agendamento falhou: ${e.message ?? e}`);
    }
  };
  const handleReset = () => { const d = defaultNotifyConfig(); setCfg(d); saveNotifyConfig(d); toast.success("Restaurado para padrão"); };

  const handleSendNow = async (period: "dia" | "semana") => {
    const channels = cfg.reports[period === "dia" ? "daily" : "weekly"].channels;
    if (channels.length === 0) { toast.error("Nenhum canal selecionado"); return; }
    const now = new Date();
    const from = new Date(now);
    if (period === "dia") from.setHours(0, 0, 0, 0); else from.setDate(now.getDate() - 7);
    try {
      const r = await sendReport({ data: { period, from: from.toISOString(), to: now.toISOString(), channels } });
      toast.success(`Relatório enviado: ${r.total} serviços (${r.done} concluídos, status ${r.status})`);
    } catch (e: any) { toast.error(`Falha: ${e.message ?? e}`); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/marocas/cockpit" className="inline-flex items-center gap-1 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar ao cockpit
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-amber-600" /> Notificações & limiares</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" /> Padrão</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-fuchsia-500"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </div>
        </div>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3">Limiares por tipo de etapa</h2>
          <p className="text-xs text-muted-foreground mb-4">Ajuste o aviso (em % do SLA) e o offset de atraso (minutos depois do SLA). Use os canais para definir por onde a notificação será enviada.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(cfg.types).map(([type, c]) => (
              <div key={type} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={c.enabled} onCheckedChange={(v) => updateType(type, { enabled: !!v })} />
                    <strong className="font-mono uppercase">{type}</strong>
                  </div>
                  <Badge variant="outline">SLA {MAROCAS_SLA_MINUTES[type] ?? 60}min</Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Aviso ao atingir <strong>{c.warningPct}%</strong> do SLA</span>
                  </div>
                  <Slider value={[c.warningPct]} min={10} max={100} step={5} onValueChange={(v) => updateType(type, { warningPct: v[0] })} />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label>Offset de atraso:</label>
                  <Input type="number" min={0} max={240} value={c.lateOffsetMin} onChange={(e) => updateType(type, { lateOffsetMin: Number(e.target.value) })} className="w-20 h-8" />
                  <span>min após SLA</span>
                </div>
                <div className="flex gap-2 text-xs flex-wrap">
                  {CHANNELS.map((ch) => (
                    <label key={ch} className="flex items-center gap-1">
                      <Checkbox checked={c.channels.includes(ch)} onCheckedChange={() => toggleTypeChannel(type, ch)} />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3">Envio automático de relatórios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["daily", "weekly"] as const).map((k) => {
              const r = cfg.reports[k];
              return (
                <div key={k} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={r.enabled} onCheckedChange={(v) => updateReport(k, { enabled: !!v })} />
                      <strong>{k === "daily" ? "Diário" : "Semanal"}</strong>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleSendNow(k === "daily" ? "dia" : "semana")}>
                      <Send className="h-3 w-3 mr-1" /> Enviar agora
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label>Hora:</label>
                    <Input type="number" min={0} max={23} value={r.hour} onChange={(e) => updateReport(k, { hour: Number(e.target.value) })} className="w-16 h-8" />
                    {k === "weekly" && (
                      <>
                        <label>Dia da semana (0=dom):</label>
                        <Input type="number" min={0} max={6} value={r.weekday ?? 1} onChange={(e) => updateReport(k, { weekday: Number(e.target.value) })} className="w-16 h-8" />
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs flex-wrap">
                    {CHANNELS.map((ch) => (
                      <label key={ch} className="flex items-center gap-1">
                        <Checkbox checked={r.channels.includes(ch)} onCheckedChange={() => toggleReportChannel(k, ch)} />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Dica: a entrega no cockpit é instantânea. Para disparar automaticamente por WhatsApp / email no horário escolhido, agende um cron chamando o endpoint <code className="font-mono">/api/public/hooks/marocas-report</code> (em desenvolvimento).
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Pré-visualização das notificações esperadas</h2>
            <span className="text-xs text-muted-foreground">com base nos serviços atuais</span>
          </div>
          {svcQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : preview.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma notificação seria disparada agora com esta configuração.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {preview.map(({ service, severity, channels }) => (
                <li key={service.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <Badge className={severity === "late" ? "bg-rose-500/15 text-rose-700 border-rose-500/30" : "bg-amber-500/15 text-amber-700 border-amber-500/30"}>
                    {severity}
                  </Badge>
                  <strong className="font-mono">{service.service_type}</strong>
                  <span>· {(service as any).marocas_apartments?.code ?? "—"}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-xs">{channels.join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
