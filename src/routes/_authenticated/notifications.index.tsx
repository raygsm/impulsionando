import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications, type NotificationRow } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2,
  RefreshCw, ExternalLink, LifeBuoy, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications/")({
  head: () => ({ meta: [{ title: "Notificações — Impulsionando" }] }),
  component: NotificationsCenter,
  errorComponent: NotificationsErrorBoundary,
  pendingComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Carregando notificações…</div>
  ),
});

/**
 * Boundary com retry exponencial + verificação de status da API
 * (ping em `notifications` HEAD com `select=id&limit=1`) e link para
 * abrir um ticket de suporte pré-preenchido com o erro e o contexto.
 */
function NotificationsErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "checking" | "ok" | "down">("unknown");
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const traceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

  async function pingApi() {
    setApiStatus("checking");
    const started = performance.now();
    try {
      const { error: e } = await supabase.from("notifications").select("id", { head: true, count: "exact" }).limit(1);
      const dt = Math.round(performance.now() - started);
      setApiLatency(dt);
      setApiStatus(e ? "down" : "ok");
    } catch {
      setApiStatus("down");
    }
  }

  async function retryWithBackoff() {
    const delay = Math.min(500 * 2 ** attempt, 8000);
    setRetrying(true);
    await pingApi();
    await new Promise((r) => setTimeout(r, delay));
    setAttempt((n) => n + 1);
    setRetrying(false);
    reset();
  }

  useEffect(() => {
    pingApi();
  }, []);

  const reportUrl = useMemo(() => {
    const subject = encodeURIComponent(`[Notifications] Erro ao carregar — trace ${traceId}`);
    const body = encodeURIComponent(
      [
        "Contexto:",
        `- Rota: /notifications`,
        `- Trace ID: ${traceId}`,
        `- User-Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
        `- Data: ${new Date().toISOString()}`,
        `- API status: ${apiStatus}${apiLatency != null ? ` (${apiLatency}ms)` : ""}`,
        `- Tentativas: ${attempt}`,
        "",
        "Mensagem:",
        error?.message ?? "sem mensagem",
        "",
        "Stack:",
        (error?.stack ?? "").slice(0, 2000),
      ].join("\n"),
    );
    return `mailto:sac@impulsionando.com.br?subject=${subject}&body=${body}`;
  }, [error, apiStatus, apiLatency, attempt, traceId]);

  const statusLabel =
    apiStatus === "checking" ? "verificando…" :
    apiStatus === "ok" ? `online${apiLatency != null ? ` · ${apiLatency}ms` : ""}` :
    apiStatus === "down" ? "instável ou fora do ar" :
    "desconhecido";
  const statusTone =
    apiStatus === "ok" ? "text-emerald-600 dark:text-emerald-400" :
    apiStatus === "down" ? "text-destructive" :
    "text-muted-foreground";

  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-4">
      <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Não foi possível carregar as notificações</h1>
      <p className="text-sm text-muted-foreground">
        Vamos tentar novamente com backoff. Se persistir, confira o status abaixo ou reporte com um clique.
      </p>

      <div className="rounded-md border bg-card p-3 text-left text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status da API</span>
          <span className={cn("font-medium", statusTone)}>{statusLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tentativas</span>
          <span className="font-medium text-foreground">{attempt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trace ID</span>
          <span className="font-mono text-foreground">{traceId.slice(0, 8)}</span>
        </div>
      </div>

      <pre className="text-xs text-left bg-muted text-foreground p-3 rounded overflow-auto max-h-40">
        {error?.message ?? "Erro desconhecido"}
      </pre>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={retryWithBackoff} disabled={retrying}>
          {retrying ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
          Tentar novamente
        </Button>
        <Button variant="outline" onClick={pingApi} disabled={apiStatus === "checking"}>
          Testar status da API
        </Button>
        <Button asChild variant="ghost">
          <a href={reportUrl}>
            <LifeBuoy className="size-4 mr-2" /> Reportar erro
          </a>
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <Link to="/" className="hover:underline inline-flex items-center gap-1">
          Ir para o início <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}

const SEVERITY_ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: AlertCircle } as const;
const SEVERITY_COLOR = {
  info: "text-primary", success: "text-emerald-500", warning: "text-amber-500", error: "text-destructive",
} as const;

function NotificationsCenter() {
  const { data: cu } = useCurrentUser();
  const { data, unreadCount, markRead, markAllRead, remove, isLoading } = useNotifications(cu?.user.id);
  const [filter, setFilter] = useState<"all" | "unread" | "info" | "success" | "warning" | "error">("all");

  const items = useMemo(() => {
    const arr = data ?? [];
    if (filter === "all") return arr;
    if (filter === "unread") return arr.filter((n) => !n.is_read);
    return arr.filter((n) => n.severity === filter);
  }, [data, filter]);

  const counts = useMemo(() => {
    const arr = data ?? [];
    return {
      all: arr.length,
      unread: arr.filter((n) => !n.is_read).length,
      info: arr.filter((n) => n.severity === "info").length,
      success: arr.filter((n) => n.severity === "success").length,
      warning: arr.filter((n) => n.severity === "warning").length,
      error: arr.filter((n) => n.severity === "error").length,
    };
  }, [data]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Central de Notificações"
        description={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
        action={
          unreadCount > 0 ? (
            <Button onClick={() => markAllRead.mutate()} size="sm">
              <CheckCheck className="size-4 mr-2" /> Marcar todas como lidas
            </Button>
          ) : null
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Todas <Badge variant="secondary" className="ml-2">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="unread">Não lidas <Badge variant="secondary" className="ml-2">{counts.unread}</Badge></TabsTrigger>
          <TabsTrigger value="info">Info <Badge variant="secondary" className="ml-2">{counts.info}</Badge></TabsTrigger>
          <TabsTrigger value="success">Sucesso <Badge variant="secondary" className="ml-2">{counts.success}</Badge></TabsTrigger>
          <TabsTrigger value="warning">Alertas <Badge variant="secondary" className="ml-2">{counts.warning}</Badge></TabsTrigger>
          <TabsTrigger value="error">Erros <Badge variant="secondary" className="ml-2">{counts.error}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-medium text-foreground">Nenhuma notificação</div>
            <div className="text-sm text-muted-foreground mt-1">Você será avisado por aqui.</div>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <Row key={n.id} n={n} onRead={() => markRead.mutate(n.id)} onRemove={() => remove.mutate(n.id)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ n, onRead, onRemove }: { n: NotificationRow; onRead: () => void; onRemove: () => void }) {
  const Icon = SEVERITY_ICON[n.severity] ?? Info;
  const color = SEVERITY_COLOR[n.severity] ?? "text-muted-foreground";
  const time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR });
  return (
    <li className={cn("p-4 flex gap-3 group hover:bg-muted/30 transition-colors", !n.is_read && "bg-primary/[0.03]")}>
      <Icon className={cn("size-5 mt-0.5 shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-foreground">{n.title}</div>
          {!n.is_read && <Badge variant="secondary" className="text-[10px]">novo</Badge>}
        </div>
        {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{time} · {n.category}</span>
          <div className="flex items-center gap-1">
            {n.action_url && (
              <a href={n.action_url} className="text-xs text-primary hover:underline mr-2" onClick={() => !n.is_read && onRead()}>
                {n.action_label ?? "Ver detalhes"} →
              </a>
            )}
            {!n.is_read && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRead} title="Marcar como lida" aria-label="Marcar como lida">
                <Check className="size-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} title="Remover" aria-label="Remover notificação">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
