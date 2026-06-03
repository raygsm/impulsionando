import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  KeyRound,
  Settings2,
  ShieldCheck,
  MessageCircle,
  Database,
  ArrowRight,
  Building2,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/demo/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist de prontidão — DEMO Impulsionando" },
      {
        name: "description",
        content:
          "Status em tempo real dos módulos da demonstração: acessos, configurações, segurança, comunicações e dados. Alertas para itens incompletos.",
      },
    ],
  }),
  component: ChecklistPage,
});

type Status = "ok" | "warn" | "missing";
interface Item {
  id: string;
  label: string;
  detail: string;
  status: Status;
  fix?: string;
}
interface Group {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Item[];
}

const CF = "imp.demo.cf";
const WL = "imp.demo.wl";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lenOf(key: string): number {
  const v = readJSON<unknown[]>(key, []);
  return Array.isArray(v) ? v.length : 0;
}

function statusFrom(count: number, min = 1): Status {
  if (count === 0) return "missing";
  if (count < min) return "warn";
  return "ok";
}

function buildGroups(track: "cf" | "wl"): Group[] {
  const k = track === "cf" ? CF : WL;
  if (track === "cf") {
    const users = lenOf(`${k}.users`);
    const sectors = lenOf(`${k}.sectors`);
    const products = lenOf(`${k}.products`);
    const sales = lenOf(`${k}.sales`);
    const fin = lenOf(`${k}.fin`);
    const apps = lenOf(`${k}.agenda`);
    const leads = lenOf(`${k}.crm`);

    return [
      {
        id: "access",
        title: "Acessos & permissões",
        icon: KeyRound,
        items: [
          { id: "u", label: "Usuários cadastrados", detail: `${users} usuário(s)`, status: statusFrom(users, 2), fix: "Cadastre ao menos 2 usuários em Usuários & Perfis." },
          { id: "s", label: "Setores configurados", detail: `${sectors} setor(es)`, status: statusFrom(sectors, 2), fix: "Crie setores em Setores para rotear permissões." },
        ],
      },
      {
        id: "config",
        title: "Configurações operacionais",
        icon: Settings2,
        items: [
          { id: "p", label: "Produtos no estoque", detail: `${products} produto(s)`, status: statusFrom(products, 3), fix: "Adicione produtos em Estoque." },
          { id: "ag", label: "Agenda populada", detail: `${apps} agendamento(s)`, status: statusFrom(apps, 1), fix: "Crie agendamentos na Agenda." },
          { id: "cr", label: "Pipeline de CRM", detail: `${leads} lead(s)`, status: statusFrom(leads, 1), fix: "Cadastre leads no CRM." },
        ],
      },
      {
        id: "security",
        title: "Segurança",
        icon: ShieldCheck,
        items: [
          { id: "rls", label: "Multi-tenant + RLS", detail: "Isolamento por empresa ativo no produto real", status: "ok" },
          { id: "audit", label: "Auditoria", detail: "Trilha de alterações registrada", status: "ok" },
          { id: "lgpd", label: "LGPD", detail: "Consentimento e anonimização disponíveis", status: "ok" },
        ],
      },
      {
        id: "comms",
        title: "Comunicações",
        icon: MessageCircle,
        items: [
          { id: "wa", label: "WhatsApp (demo)", detail: "Simulação de confirmação de agendamentos", status: "ok" },
          { id: "mail", label: "E-mails transacionais", detail: "Modelos configurados no produto real", status: "ok" },
          { id: "in", label: "Notificações in-app", detail: "Categorias ativas (agenda, vendas, estoque)", status: "ok" },
        ],
      },
      {
        id: "data",
        title: "Dados & operação",
        icon: Database,
        items: [
          { id: "sl", label: "Vendas confirmadas", detail: `${sales} venda(s)`, status: statusFrom(sales, 1), fix: "Registre uma venda em Vendas/PDV." },
          { id: "fn", label: "Lançamentos financeiros", detail: `${fin} lançamento(s)`, status: statusFrom(fin, 1), fix: "Inclua receitas/despesas em Financeiro." },
        ],
      },
    ];
  }

  // White-label
  const clients = lenOf(`${k}.clients`);
  const niches = lenOf(`${k}.niches`);
  const profiles = lenOf(`${k}.profiles`);
  const team = lenOf(`${k}.team`);
  const audit = lenOf(`${k}.audit`);
  const modules = lenOf(`${k}.modules`);

  return [
    {
      id: "access",
      title: "Acessos & permissões",
      icon: KeyRound,
      items: [
        { id: "t", label: "Equipe interna", detail: `${team} membro(s)`, status: statusFrom(team, 2), fix: "Adicione membros em Equipe interna." },
        { id: "pr", label: "Perfis & permissões", detail: `${profiles} perfil(is)`, status: statusFrom(profiles, 2), fix: "Crie perfis reutilizáveis." },
      ],
    },
    {
      id: "config",
      title: "Configurações operacionais",
      icon: Settings2,
      items: [
        { id: "cl", label: "Clientes (empresas)", detail: `${clients} cliente(s)`, status: statusFrom(clients, 2), fix: "Adicione empresas-cliente." },
        { id: "ni", label: "Nichos cadastrados", detail: `${niches} nicho(s)`, status: statusFrom(niches, 2), fix: "Cadastre nichos para templates." },
        { id: "mo", label: "Módulos liberados", detail: `${modules} liberação(ões)`, status: statusFrom(modules, 1), fix: "Libere módulos por cliente em Módulos." },
      ],
    },
    {
      id: "security",
      title: "Segurança",
      icon: ShieldCheck,
      items: [
        { id: "mfa", label: "MFA recomendado", detail: "Painel master deve ter 2FA habilitado", status: "ok" },
        { id: "iso", label: "Isolamento por tenant", detail: "Cada cliente em ambiente isolado", status: "ok" },
        { id: "au", label: "Auditoria registrada", detail: `${audit} evento(s) de auditoria`, status: statusFrom(audit, 1), fix: "Execute ações no DEMO para gerar trilha." },
      ],
    },
    {
      id: "comms",
      title: "Comunicações",
      icon: MessageCircle,
      items: [
        { id: "br", label: "Marca personalizada", detail: "Logo, cores e domínio próprios", status: "ok" },
        { id: "em", label: "E-mails transacionais", detail: "Remetente da sua marca", status: "ok" },
      ],
    },
    {
      id: "data",
      title: "Dados & operação",
      icon: Database,
      items: [
        { id: "bi", label: "BI consolidado", detail: "Comparativos entre clientes e nichos", status: "ok" },
        { id: "wh", label: "Webhooks & API", detail: "Integrações externas disponíveis", status: "ok" },
      ],
    },
  ];
}

function ChecklistPage() {
  const [tick, setTick] = useState(0);
  const [track, setTrack] = useState<"cf" | "wl">("cf");

  useEffect(() => {
    // hydrate on mount
    setTick((t) => t + 1);
  }, []);

  const groups = useMemo(() => (tick >= 0 ? buildGroups(track) : []), [tick, track]);

  const flat = groups.flatMap((g) => g.items);
  const total = flat.length;
  const okCount = flat.filter((i) => i.status === "ok").length;
  const warnCount = flat.filter((i) => i.status === "warn").length;
  const missingCount = flat.filter((i) => i.status === "missing").length;
  const score = total ? Math.round((okCount / total) * 100) : 0;
  const incomplete = flat.filter((i) => i.status !== "ok");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <Badge variant="outline" className="mb-2">DEMO • Checklist</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Checklist de prontidão
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Status em tempo real dos módulos da demonstração. Use para validar se
              tudo está configurado antes de apresentar para um cliente ou tomar decisão.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Track switcher */}
        <div className="inline-flex rounded-lg border bg-card p-1 mb-6">
          <button
            onClick={() => setTrack("cf")}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-colors ${track === "cf" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Store className="w-3.5 h-3.5" /> Cliente Final
          </button>
          <button
            onClick={() => setTrack("wl")}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-colors ${track === "wl" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Building2 className="w-3.5 h-3.5" /> White-label
          </button>
        </div>

        {/* Score */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Prontidão geral</div>
              <div className="text-4xl font-bold mt-1">{score}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {okCount} OK · {warnCount} atenção · {missingCount} pendente
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-md">
              <Progress value={score} className="h-3" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>0%</span><span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        {incomplete.length > 0 && (
          <Alert className="mb-6 border-warning/40 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle>{incomplete.length} item(ns) precisam de atenção</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-xs">
                {incomplete.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-start gap-2">
                    {i.status === "missing" ? (
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                    )}
                    <span><strong>{i.label}:</strong> {i.fix ?? i.detail}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Grupos */}
        <div className="space-y-4">
          {groups.map((g) => {
            const Icon = g.icon;
            const gOk = g.items.filter((i) => i.status === "ok").length;
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{g.title}</div>
                      <div className="text-[11px] text-muted-foreground">{gOk}/{g.items.length} concluídos</div>
                    </div>
                  </div>
                  <Badge variant={gOk === g.items.length ? "default" : "outline"} className={gOk === g.items.length ? "bg-success text-success-foreground" : ""}>
                    {gOk === g.items.length ? "Completo" : "Em progresso"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {g.items.map((it) => (
                    <div key={it.id} className="flex items-start gap-3 text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <StatusIcon status={it.status} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{it.label}</div>
                        <div className="text-xs text-muted-foreground">{it.detail}</div>
                        {it.status !== "ok" && it.fix && (
                          <div className="text-xs text-warning mt-0.5">→ {it.fix}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild className="bg-gradient-primary shadow-elegant">
            <Link to={track === "cf" ? "/demo/cliente-final" : "/demo/white-label"}>
              Ir para o DEMO {track === "cf" ? "Cliente Final" : "White-label"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/demo">Trocar trilha</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/orcamento">Solicitar orçamento</Link>
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />;
  return <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />;
}
