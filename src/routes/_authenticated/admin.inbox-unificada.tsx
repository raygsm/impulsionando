import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Inbox, Mail, Users, MessageCircle, Briefcase } from "lucide-react";
import { getUnifiedInbox } from "@/lib/unified-inbox.functions";

export const Route = createFileRoute("/_authenticated/admin/inbox-unificada")({
  component: InboxPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

const kindMeta: Record<string, { label: string; icon: any; cls: string }> = {
  email: { label: "E-mail", icon: Mail, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  lead: { label: "Lead", icon: Users, cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  crm: { label: "CRM", icon: Briefcase, cls: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
};

function InboxPage() {
  const fetchFn = useServerFn(getUnifiedInbox);
  const [days, setDays] = useState(14);
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["unified-inbox", days],
    queryFn: () => fetchFn({ data: { days } }),
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    const list = data?.items ?? [];
    return list.filter((i) => {
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (q) {
        const t = `${i.from} ${i.title} ${i.preview}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, kindFilter, q]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Inbox className="w-6 h-6 text-primary" /> Inbox Unificada Omnichannel
        </h1>
        <p className="text-sm text-muted-foreground">
          E-mails de suporte, leads, WhatsApp e CRM consolidados na mesma tela.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total ({days}d)</div>
          <div className="text-2xl font-bold mt-1">{data?.summary.total ?? 0}</div>
        </Card>
        {(["email", "lead", "whatsapp", "crm"] as const).map((k) => {
          const m = kindMeta[k];
          const Icon = m.icon;
          return (
            <Card key={k} className="p-4">
              <div className="text-xs flex items-center gap-1 text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {m.label}</div>
              <div className="text-2xl font-bold mt-1">{data?.summary.by_kind[k] ?? 0}</div>
            </Card>
          );
        })}
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          {["all", "email", "lead", "whatsapp", "crm"].map((k) => (
            <Button key={k} size="sm" variant={kindFilter === k ? "default" : "outline"} onClick={() => setKindFilter(k)}>
              {k === "all" ? "Todos" : kindMeta[k].label}
            </Button>
          ))}
          <div className="flex-1" />
          {[7, 14, 30].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>{d}d</Button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /> Carregando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma interação no período.</div>
        ) : (
          <ul className="divide-y">
            {items.map((i) => {
              const m = kindMeta[i.kind];
              return (
                <li key={`${i.kind}:${i.id}`} className="py-3 flex items-start gap-3 hover:bg-muted/30 px-2 -mx-2 rounded">
                  <Badge variant="secondary" className={m.cls + " shrink-0"}>{m.label}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium truncate">{i.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(i.when).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-mono">{i.from}</span>
                      {i.preview && <> · {i.preview}</>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
