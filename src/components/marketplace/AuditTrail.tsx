import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMarketplaceOrderEvents } from "@/lib/marketplace.functions";
import { History } from "lucide-react";

const EVENT_LABEL: Record<string, string> = {
  placed: "Pedido enviado",
  approved: "Aprovado",
  rejected: "Recusado",
  in_production: "Em produção",
  in_delivery: "Em entrega",
  invoiced: "Faturado",
  completed: "Concluído",
  canceled: "Cancelado",
};

export function AuditTrail({ orderId }: { orderId: string }) {
  const eventsFn = useServerFn(getMarketplaceOrderEvents);
  const { data: events } = useQuery({
    queryKey: ["mp-order-events", orderId],
    queryFn: () => eventsFn({ data: { order_id: orderId } }),
  });
  return (
    <div className="border-t pt-2 mt-2">
      <div className="text-xs font-semibold mb-2 flex items-center gap-1">
        <History className="w-3 h-3" /> Trilha de auditoria
      </div>
      {(!events || events.length === 0) && (
        <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
      )}
      <ol className="space-y-1.5 text-xs">
        {(events ?? []).map((e: any) => (
          <li key={e.id} className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <div className="flex-1">
              <div>
                <b>{EVENT_LABEL[e.event_type] ?? e.event_type}</b>
                {e.actor_display_name && (
                  <span className="text-muted-foreground">
                    {" "}· por {e.actor_display_name}
                    {e.actor_role && ` (${e.actor_role === "supplier" ? "fornecedor" : "comprador"})`}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {new Date(e.created_at).toLocaleString("pt-BR")}
              </div>
              {e.notes && <div className="text-muted-foreground italic">"{e.notes}"</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
