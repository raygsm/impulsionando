import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchMessagingPanel,
  fetchMessagingThreads,
  fetchMessagingThread,
} from "@/lib/ops-cockpits.functions";
import { AlertTriangle, ArrowLeft, Mail, MessageCircle, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/mensageria")({
  head: () => ({
    meta: [
      { title: "Mensageria — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
  component: MensageriaPage,
});

function channelIcon(c: string) {
  if (c === "whatsapp") return <Smartphone className="h-3 w-3" />;
  if (c === "email") return <Mail className="h-3 w-3" />;
  return <MessageCircle className="h-3 w-3" />;
}

function MensageriaPage() {
  const [channel, setChannel] = useState<"all" | "whatsapp" | "email" | "in_app">("all");
  const [activeThread, setActiveThread] = useState<string | null>(null);

  const panelFn = useServerFn(fetchMessagingPanel);
  const threadsFn = useServerFn(fetchMessagingThreads);
  const threadFn = useServerFn(fetchMessagingThread);

  const { data: panel } = useQuery({
    queryKey: ["ops", "mensageria", "panel"],
    queryFn: () => panelFn({ data: { days: 30, scope: "company" } }),
  });

  const { data: threadsData, isLoading: loadingThreads } = useQuery({
    queryKey: ["ops", "mensageria", "threads", channel],
    queryFn: () => threadsFn({ data: { days: 60, channel } }),
  });

  const { data: threadData, isLoading: loadingThread } = useQuery({
    queryKey: ["ops", "mensageria", "thread", activeThread],
    queryFn: () => threadFn({ data: { threadKey: activeThread!, days: 60 } }),
    enabled: !!activeThread,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mensageria" description="Inbox de threads, histórico e falhas — últimos 60 dias" />

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Mensagens (30d)</p>
          <p className="mt-1 text-2xl font-semibold">{panel?.total ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Falhas recentes</p>
          <p className="mt-1 text-2xl font-semibold text-destructive">{panel?.failedRecent.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Threads ativas</p>
          <p className="mt-1 text-2xl font-semibold">{threadsData?.threads.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Canais ativos</p>
          <p className="mt-1 text-2xl font-semibold">{panel?.byChannel.length ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b p-3 flex items-center gap-2">
            <span className="text-xs font-semibold flex-1">Inbox</span>
            <Select value={channel} onValueChange={(v: any) => { setChannel(v); setActiveThread(null); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[520px]">
            {loadingThreads ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
            ) : threadsData?.threads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma thread no período.</p>
            ) : (
              <ul className="divide-y">
                {threadsData?.threads.map((t) => (
                  <li key={t.threadKey}>
                    <button
                      type="button"
                      onClick={() => setActiveThread(t.threadKey)}
                      className={`block w-full px-3 py-2 text-left hover:bg-muted/40 ${activeThread === t.threadKey ? "bg-muted/60" : ""}`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        {channelIcon(t.channel)}
                        <span className="font-medium truncate">{t.recipientName ?? t.recipient}</span>
                        <span className="ml-auto text-muted-foreground">{new Date(t.lastAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">{t.lastSubject ?? t.lastBody}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{t.count} msg</Badge>
                        {t.failed > 0 && <Badge variant="destructive" className="text-[10px]">{t.failed} falha</Badge>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </Card>

        <Card className="p-4">
          {!activeThread ? (
            <div className="flex h-[520px] items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa para ver o histórico.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActiveThread(null)}>
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <span className="text-sm font-semibold">{threadData?.recipient}</span>
                <Badge variant="outline">{threadData?.channel}</Badge>
              </div>
              <ScrollArea className="h-[460px]">
                {loadingThread ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : (
                  <ul className="space-y-3 pr-3">
                    {threadData?.messages.map((m: any) => (
                      <li key={m.id} className="rounded border p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{m.event_code}</Badge>
                          <Badge
                            variant={m.status === "failed" ? "destructive" : m.status === "sent" ? "default" : "outline"}
                            className="capitalize"
                          >
                            {m.status}
                          </Badge>
                          <span className="ml-auto text-muted-foreground">
                            {new Date(m.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {m.subject && <p className="mt-2 text-sm font-medium">{m.subject}</p>}
                        <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                        {m.last_error && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {m.last_error}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
