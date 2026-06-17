/**
 * /clube/notificacoes — Central de notificações do membro.
 * Lista jornada (system) e alertas de comprovante (billing) com marcar como lido.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications, type NotificationRow } from "@/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Inbox, Receipt, CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clube/notificacoes")({
  component: ClubeNotificationsPage,
});

type FilterKind = "all" | "unread" | "journey" | "receipts";

function ClubeNotificationsPage() {
  const { data: user } = useCurrentUser();
  const { data, isLoading, refetch, isRefetching, unreadCount, markRead, markAllRead, remove } = useNotifications(user?.user.id);
  const [tab, setTab] = useState<FilterKind>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const all = (data ?? []) as NotificationRow[];
    const byTab = all.filter((n) => {
      if (tab === "unread") return !n.is_read;
      if (tab === "journey") return n.category === "system" || (n.action_url ?? "").includes("/clube");
      if (tab === "receipts") return n.category === "billing" || /comprovante/i.test(n.title);
      return true;
    });
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter((n) =>
      n.title.toLowerCase().includes(q) || (n.message ?? "").toLowerCase().includes(q),
    );
  }, [data, tab, search]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Badge className="mb-2"><Bell className="w-3 h-3 mr-1" /> Clube · Notificações</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Central de notificações</h1>
          <p className="text-sm text-muted-foreground">
            Avisos da sua jornada no Clube e disponibilidade de comprovantes.
            {unreadCount > 0 && <> · <strong>{unreadCount}</strong> não lida(s)</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/clube">← Voltar ao Clube</Link></Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <Button
            size="sm" disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("Tudo marcado como lido"),
              onError: (e: any) => toast.error(e.message),
            })}
          >
            <CheckCheck className="w-3 h-3 mr-1" /> Marcar todas como lidas
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterKind)}>
            <TabsList>
              <TabsTrigger value="all"><Inbox className="w-3.5 h-3.5 mr-1" /> Todas</TabsTrigger>
              <TabsTrigger value="unread">Não lidas{unreadCount ? ` (${unreadCount})` : ""}</TabsTrigger>
              <TabsTrigger value="journey"><CalendarDays className="w-3.5 h-3.5 mr-1" /> Jornada</TabsTrigger>
              <TabsTrigger value="receipts"><Receipt className="w-3.5 h-3.5 mr-1" /> Comprovantes</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            className="max-w-xs" placeholder="Buscar título ou mensagem…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <ul className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}</ul>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhuma notificação nesta visão.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((n) => (
              <li key={n.id} className={`py-3 flex items-start gap-3 ${n.is_read ? "opacity-70" : ""}`}>
                <SeverityDot severity={n.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{n.title}</span>
                    {!n.is_read && <Badge variant="default" className="text-[10px]">Nova</Badge>}
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                  </div>
                  {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                    {n.action_url && (
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs"
                        onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}>
                        <Link to={n.action_url as any}>
                          {n.action_label ?? "Abrir"} <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)} title="Marcar como lida">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(n.id)} title="Remover">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SeverityDot({ severity }: { severity: NotificationRow["severity"] }) {
  const cls =
    severity === "error" ? "bg-destructive" :
    severity === "warning" ? "bg-amber-500" :
    severity === "success" ? "bg-emerald-500" : "bg-primary";
  return <span className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${cls}`} />;
}
