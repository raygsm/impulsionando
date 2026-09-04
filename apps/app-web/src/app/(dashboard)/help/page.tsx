import { readAccessToken } from "@/lib/auth/session";
import { nestClient } from "@/lib/api/server";
import { CreateTicketForm } from "./create-ticket-form";
import { ModuleStateView } from "@/components/states/module-state-view";
import { ApiClientError } from "@impulsionando/api-client";
import type { SupportTicketSummary } from "@impulsionando/contracts";

export default async function HelpPage() {
  const token = await readAccessToken();
  let tickets: SupportTicketSummary[] = [];
  let listState: "ACTIVE" | "ERROR" | "FORBIDDEN" | "EMPTY" | "LOADING" = "ACTIVE";
  let message = "";

  if (!token) {
    listState = "FORBIDDEN";
    message = "Sessão ausente";
  } else {
    try {
      const api = nestClient(token);
      const result = await api.support.list(undefined, token);
      tickets = result.data ?? [];
      if (tickets.length === 0) listState = "EMPTY";
    } catch (err) {
      if (err instanceof ApiClientError && err.forbidden) listState = "FORBIDDEN";
      else listState = "ERROR";
      message = err instanceof Error ? err.message : "Falha";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Ajuda</h1>
        <p className="text-sm text-muted-foreground">Tickets Nest (`support_tickets`). Não usamos `support_sessions`.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Abrir ticket</h2>
        <CreateTicketForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Meus tickets</h2>
        {listState !== "ACTIVE" ? (
          <ModuleStateView state={listState} title="Lista de tickets" />
        ) : (
          <ul className="divide-y rounded-lg border">
            {tickets.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{t.subject}</p>
                <p className="text-muted-foreground">
                  {t.protocol} · {t.status} · {t.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
        {message && listState !== "ACTIVE" ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </section>
    </div>
  );
}
