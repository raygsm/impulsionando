"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AgentSummary } from "@impulsionando/contracts";

export function InternalAgentDock({
  agent,
  onSend,
}: {
  agent: AgentSummary;
  onSend?: (message: string) => Promise<{ text: string; riskClass?: string; refused?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<Array<{ role: "user" | "agent"; text: string; meta?: string }>>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = message.trim();
    if (!text || !onSend) return;
    setBusy(true);
    setLog((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    try {
      const reply = await onSend(text);
      setLog((prev) => [
        ...prev,
        {
          role: "agent",
          text: reply.text,
          meta: [reply.riskClass, reply.refused ? "recusado" : null].filter(Boolean).join(" · ") || undefined,
        },
      ]);
    } catch (err) {
      setLog((prev) => [
        ...prev,
        { role: "agent", text: err instanceof Error ? err.message : "Falha no agente", meta: "erro" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed right-4 bottom-4 z-40 shadow-lg" size="lg">
          <Bot />
          {agent.name}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{agent.name}</SheetTitle>
          <SheetDescription>Agente interno de negócio. Nest governa ferramentas e policy.</SheetDescription>
        </SheetHeader>
        {!agent.available ? (
          <Alert data-state="agent-unavailable">
            <AlertTitle>Indisponível</AlertTitle>
            <AlertDescription>{agent.degradedReason ?? "O agente não está ativo neste tenant."}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
            <p className="text-xs text-muted-foreground">Teto de risco: {agent.riskCeiling ?? "READ"}</p>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto text-sm">
              {log.length === 0 ? <p className="text-muted-foreground">Pergunte sobre tickets, tenant ou capacidades.</p> : null}
              {log.map((row, i) => (
                <div key={`${row.role}-${i}`} className={row.role === "user" ? "text-right" : "text-left"}>
                  <p className="rounded-lg bg-muted px-3 py-2">{row.text}</p>
                  {row.meta ? <p className="mt-1 text-xs text-muted-foreground">{row.meta}</p> : null}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem"
                rows={2}
                disabled={busy || !onSend}
              />
              <Button onClick={() => void submit()} disabled={busy || !onSend} aria-label="Enviar">
                <Send />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
