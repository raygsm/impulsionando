import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OMNI_CHANNELS, OMNI_CONVERSATIONS, type OmniChannel } from "@/data/omnichannel-mock";
import {
  MessageCircle,
  Instagram,
  MessageSquare,
  Send,
  Globe,
  Store,
  Filter,
  Search,
} from "lucide-react";

const CHANNEL_ICON: Record<OmniChannel, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  messenger: MessageSquare,
  telegram: Send,
  chat: Globe,
  "google-business": Store,
};

export function OmnichannelInbox() {
  const [active, setActive] = useState(OMNI_CONVERSATIONS[0].id);
  const [filter, setFilter] = useState<OmniChannel | "todos">("todos");

  const conversations = OMNI_CONVERSATIONS.filter(
    (c) => filter === "todos" || c.channel === filter,
  );
  const current = OMNI_CONVERSATIONS.find((c) => c.id === active) ?? OMNI_CONVERSATIONS[0];

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] min-h-[560px]">
        {/* Canais */}
        <aside className="border-b lg:border-b-0 lg:border-r bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3 w-3" /> Canais
          </div>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            <button
              onClick={() => setFilter("todos")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm text-left w-full transition",
                filter === "todos" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              Todos
            </button>
            {OMNI_CHANNELS.map((c) => {
              const Icon = CHANNEL_ICON[c.slug];
              return (
                <button
                  key={c.slug}
                  onClick={() => setFilter(c.slug)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition",
                    filter === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" /> {c.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Conversas */}
        <section className="border-b lg:border-b-0 lg:border-r">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversa" className="pl-8" />
            </div>
          </div>
          <ul className="divide-y">
            {conversations.map((c) => {
              const Icon = CHANNEL_ICON[c.channel];
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-left transition",
                      active === c.id ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{c.contact}</span>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.preview}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Thread */}
        <section className="flex flex-col">
          <div className="border-b p-3">
            <div className="text-sm font-semibold">{current.contact}</div>
            <div className="text-xs text-muted-foreground">
              {OMNI_CHANNELS.find((c) => c.slug === current.channel)?.label}
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {current.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  m.from === "cliente"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground",
                )}
              >
                <div>{m.text}</div>
                <div
                  className={cn(
                    "mt-1 text-[10px]",
                    m.from === "cliente" ? "text-muted-foreground" : "text-primary-foreground/80",
                  )}
                >
                  {m.time}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input placeholder="Escreva uma resposta" />
              <Button>Enviar</Button>
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
}
