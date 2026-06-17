import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications, type NotificationRow } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications/")({
  head: () => ({ meta: [{ title: "Notificações — Impulsionando" }] }),
  component: NotificationsCenter,
});

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
            <div className="font-medium">Nenhuma notificação</div>
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
          <div className="font-medium">{n.title}</div>
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRead} title="Marcar como lida">
                <Check className="size-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} title="Remover">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
