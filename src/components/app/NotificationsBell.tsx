import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, type NotificationRow } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const SEVERITY_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
} as const;

const SEVERITY_COLOR = {
  info: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-destructive",
} as const;

export function NotificationsBell({ userId }: { userId: string | undefined }) {
  const { data, unreadCount, markRead, markAllRead, remove, isLoading } = useNotifications(userId);
  const items = data ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold grid place-content-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <div className="font-semibold text-sm">Notificações</div>
            <div className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} className="text-xs">
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <div className="text-sm font-medium">Sem notificações</div>
              <div className="text-xs text-muted-foreground mt-1">Você será avisado por aqui.</div>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onRead={() => markRead.mutate(n.id)}
                  onRemove={() => remove.mutate(n.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Link
            to="/privacy"
            className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Preferências de notificação
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  n, onRead, onRemove,
}: { n: NotificationRow; onRead: () => void; onRemove: () => void }) {
  const Icon = SEVERITY_ICON[n.severity] ?? Info;
  const color = SEVERITY_COLOR[n.severity] ?? "text-muted-foreground";
  const time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR });

  return (
    <li className={cn("p-3 flex gap-3 group hover:bg-muted/40 transition-colors", !n.is_read && "bg-primary/[0.03]")}>
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-medium leading-tight">{n.title}</div>
          {!n.is_read && <Badge variant="secondary" className="h-4 text-[9px] px-1.5">novo</Badge>}
        </div>
        {n.message && <div className="text-xs text-muted-foreground mt-1 leading-snug">{n.message}</div>}
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-[10px] text-muted-foreground">{time}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!n.is_read && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRead} title="Marcar como lida">
                <Check className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} title="Remover">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {n.action_url && (
          <a
            href={n.action_url}
            className="text-xs text-primary hover:underline mt-2 inline-block"
            onClick={() => !n.is_read && onRead()}
          >
            {n.action_label ?? "Ver detalhes"} →
          </a>
        )}
      </div>
    </li>
  );
}
