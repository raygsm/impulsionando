import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { getIntegrationsAutomationHealth } from "@/lib/integrations-automation-health.functions";
import {
  Workflow, Bot, Activity, AlertTriangle, CheckCircle2, MessageSquare, Webhook, Plug,
  Send, ScrollText, Users, FileCode, Server, Boxes, Building2, CreditCard, ArrowRight,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/hub-automacoes")({
  head: () => ({ meta: [{ title: "Automações & n8n — Hub" }, { name: "robots", content: "noindex" }] }),
  component: HubAutomacoes,
});

function Stat({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "bad" ? "text-red-600" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function ShortcutLink({ to, label, desc, icon: Icon }: { to: string; label: string; desc: string; icon: LucideIcon }) {
  return (
    <Link to={to as never} className="group flex items-start gap-3 rounded-md border p-3 hover:bg-muted transition-colors">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-1">
          {label}
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function HubAutomacoes() {
  const health = useServerFn(getIntegrationsAutomationHealth);
  const h = useQuery({
    queryKey: ["hub-automacoes", "health"],
    queryFn: () => health({ data: { days: 30 } }),
    refetchInterval: 30_000,
  });

  const n8n = h.data?.n8n;
  const wh = h.data?.webhooks;
  const wa = h.data?.whatsapp;
  const mp = h.data?.mercadoPago;
  const rt = h.data?.runtime;
  const intOverview = h.data?.integrations;
  const pending = intOverview?.pending ?? [];
  const successRate = n8n && n8n.runs > 0 ? Math.round((n8n.success / n8n.runs) * 100) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Automações & n8n — Hub"
        description="Visão consolidada do registry, execuções, canais, webhooks e dependências reais da infraestrutura Impulsionando."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Workflows ativos" value={n8n?.activeRegistry ?? 0} icon={Workflow} tone={(n8n?.activeRegistry ?? 0) > 0 ? "ok" : "warn"} />
        <Stat label="Execuções (30d)" value={n8n?.runs ?? 0} icon={Activity} />
        <Stat label="Sucesso" value={successRate !== null ? `${successRate}%` : "—"} icon={CheckCircle2} tone={successRate !== null && successRate >= 95 ? "ok" : successRate !== null && successRate < 80 ? "bad" : "warn"} />
        <Stat label="Falhas" value={n8n?.failed ?? 0} icon={AlertTriangle} tone={(n8n?.failed ?? 0) > 0 ? "bad" : "ok"} />
        <Stat label="Endpoints pendentes" value={pending.length} icon={Plug} tone={pending.length > 0 ? "warn" : "ok"} />
      </div>

      <Section
        title="Dependências de canal pendentes"
        right={<span className="text-xs text-muted-foreground">{pending.length} endpoint(s) ainda não homologado(s)</span>}
      >
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todos os endpoints do Core estão ativos.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {pending.map((item) => (
              <Link
                key={item.id}
                to="/core/integracoes/diagnostico"
                className="flex items-center justify-between rounded-md border p-2 hover:bg-muted"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Plug className="w-4 h-4 text-amber-600" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.slug}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.environment} · {item.status}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">pendente</Badge>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-3">
        <Section title="Execuções n8n por categoria (30d)">
          {n8n?.topReguas?.length ? (
            <div className="space-y-1.5">
              {n8n.topReguas.map((r) => {
                const failRate = r.total > 0 ? Math.round((r.failed / r.total) * 100) : 0;
                return (
                  <div key={r.regua} className="flex items-center justify-between text-sm">
                    <span className="truncate">{r.regua}</span>
                    <span className="flex items-center gap-2 font-mono text-xs">
                      <span>{r.total}</span>
                      {r.failed > 0 && <Badge variant="destructive" className="text-[10px]">{failRate}% falha</Badge>}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma execução sincronizada com o ledger na janela.</p>
          )}
        </Section>

        <Section title="Canais cadastrados">
          {n8n?.channels?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {n8n.channels.map((c) => (
                <Badge key={c.channel} variant="outline" className="text-[10px]">{c.channel} · {c.count}</Badge>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sem endpoints cadastrados.</p>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="WhatsApp — eventos" value={wa?.events ?? 0} icon={MessageSquare} />
            <Stat label="WhatsApp — erros" value={wa?.errors ?? 0} icon={AlertTriangle} tone={(wa?.errors ?? 0) > 0 ? "warn" : undefined} />
            <Stat label="MP webhooks" value={mp?.total ?? 0} icon={CreditCard} />
          </div>
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section title="Webhooks e callbacks (30d)">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Eventos" value={wh?.events ?? 0} icon={Webhook} />
            <Stat label="Processados" value={wh?.eventsProcessed ?? 0} icon={CheckCircle2} tone="ok" />
            <Stat label="Falhas" value={wh?.failed ?? 0} icon={AlertTriangle} tone={(wh?.failed ?? 0) > 0 ? "bad" : undefined} />
            <Stat label="Runs n8n" value={wh?.runs ?? 0} icon={Activity} />
          </div>
          {wh?.topWorkflows?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {wh.topWorkflows.slice(0, 10).map((w) => (
                <Badge key={w.workflow} variant={w.failed > 0 ? "destructive" : "outline"} className="text-[10px]">
                  {w.workflow} · {w.total}
                </Badge>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Estado do runtime">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Estados monitorados" value={rt?.events ?? 0} icon={Server} />
            <Stat label="Erros" value={rt?.errors ?? 0} icon={AlertTriangle} tone={(rt?.errors ?? 0) > 0 ? "bad" : "ok"} />
          </div>
          <div className="mt-3 space-y-1.5">
            {rt?.levels?.map((l) => (
              <div key={l.level} className="flex items-center justify-between text-sm">
                <span className="capitalize">{l.level}</span>
                <span className="font-mono text-xs">{l.count}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Ações & operação">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          <ShortcutLink to="/core/integracoes/n8n" label="n8n — Operação real" desc="Runtime, registry e execuções" icon={Plug} />
          <ShortcutLink to="/core/automacao" label="Automação — Hub técnico" desc="Visão geral, réguas e catálogos" icon={Workflow} />
          <ShortcutLink to="/core/automacao/fluxos" label="Fluxos" desc="Workflows e gatilhos" icon={Workflow} />
          <ShortcutLink to="/core/automacao/templates" label="Templates" desc="Blueprints reutilizáveis" icon={FileCode} />
          <ShortcutLink to="/core/automacao/modelos-nicho" label="Modelos por nicho" desc="Réguas prontas por vertical" icon={Boxes} />
          <ShortcutLink to="/core/automacao/modelos-tenant" label="Modelos por cliente" desc="Sobrescritas específicas" icon={Building2} />
          <ShortcutLink to="/core/automacao/canais" label="Canais" desc="WhatsApp, e-mail, SMS e in-app" icon={MessageSquare} />
          <ShortcutLink to="/core/automacao/webhooks" label="Webhooks" desc="Entradas, assinaturas e callbacks" icon={Webhook} />
          <ShortcutLink to="/core/automacao/aprovacoes" label="Aprovações" desc="Ações sensíveis com dupla checagem" icon={CheckCircle2} />
          <ShortcutLink to="/core/automacao/monitoramento" label="Monitoramento" desc="Execuções, latência e falhas" icon={Activity} />
          <ShortcutLink to="/core/automacao/erros" label="Erros" desc="Falhas por workflow" icon={AlertTriangle} />
          <ShortcutLink to="/core/automacao/historico" label="Histórico" desc="Auditoria de execuções" icon={ScrollText} />
          <ShortcutLink to="/core/automacao/fallback-humano" label="Fallback humano" desc="Encaminhamento para atendentes" icon={Users} />
          <ShortcutLink to="/core/automacao/demonstracoes" label="Demonstrações" desc="Cenários controlados de demonstração" icon={Send} />
          <ShortcutLink to="/core/automacao/producao" label="Produção" desc="Governança e rollout" icon={Server} />
          <ShortcutLink to="/admin/n8n-console" label="Console n8n" desc="Execuções e diagnóstico" icon={Bot} />
          <ShortcutLink to="/admin/n8n-niches" label="n8n por nicho" desc="Modelos por vertical" icon={Boxes} />
          <ShortcutLink to="/admin/status-webhooks" label="Status de webhooks" desc="Estado dos callbacks" icon={Webhook} />
        </div>
      </Section>

      <p className="text-[11px] text-muted-foreground">
        Este hub lê somente fontes reais do Core. Ativações e alterações que exigem mudança no runtime só são oferecidas quando existe operação de backend verificável.
      </p>
    </div>
  );
}
