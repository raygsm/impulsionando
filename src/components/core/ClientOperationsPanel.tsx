import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, FileText } from "lucide-react";
import {
  manualMarkInvoicePaid,
  resendOutboxMessage,
  requestInvoiceReprocess,
} from "@/lib/operations.functions";

export function ClientOperationsPanel({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const markPaid = useServerFn(manualMarkInvoicePaid);
  const resend = useServerFn(resendOutboxMessage);
  const reprocess = useServerFn(requestInvoiceReprocess);

  const { data: invoices } = useQuery({
    queryKey: ["ops-invoices", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("billing_invoices")
        .select("id, due_date, amount, status, paid_at")
        .eq("company_id", companyId)
        .order("due_date", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: failed } = useQuery({
    queryKey: ["ops-failed", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("message_outbox")
        .select("id, event_code, channel, recipient_email, recipient_phone, status, last_error, created_at")
        .eq("company_id", companyId)
        .in("status", ["failed", "queued"])
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const paidMut = useMutation({
    mutationFn: (invoiceId: string) => markPaid({ data: { invoiceId } }),
    onSuccess: () => {
      toast.success("Fatura baixada manualmente");
      qc.invalidateQueries({ queryKey: ["ops-invoices", companyId] });
      qc.invalidateQueries({ queryKey: ["client-360", companyId] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Erro"),
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => resend({ data: { messageId: id } }),
    onSuccess: () => {
      toast.success("Mensagem reenfileirada");
      qc.invalidateQueries({ queryKey: ["ops-failed", companyId] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Erro"),
  });

  const reprocessMut = useMutation({
    mutationFn: (invoiceId: string) =>
      reprocess({ data: { companyId, referenceId: invoiceId, notes: "Reprocessamento manual via Core" } }),
    onSuccess: () => toast.success("Pedido de reprocessamento registrado"),
    onError: (e: { message?: string }) => toast.error(e.message ?? "Erro"),
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Faturas — baixa manual & reprocesso fiscal</h3>
        {(invoices ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sem faturas registradas.</p>
        )}
        <div className="divide-y">
          {(invoices ?? []).map((i) => (
            <div key={i.id} className="py-2 flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  R$ {Number(i.amount).toFixed(2)} ·{" "}
                  <span className="text-muted-foreground">venc {new Date(i.due_date).toLocaleDateString("pt-BR")}</span>
                </div>
                <Badge
                  variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "outline"}
                  className="mt-1"
                >
                  {i.status}
                </Badge>
              </div>
              {i.status !== "paid" && (
                <Button size="sm" variant="outline" onClick={() => paidMut.mutate(i.id)} disabled={paidMut.isPending}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Baixa manual
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => reprocessMut.mutate(i.id)} disabled={reprocessMut.isPending}>
                <FileText className="w-3.5 h-3.5 mr-1" />
                Reprocessar NF
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Baixa manual confirma o pagamento, reativa módulos suspensos e gera log auditável.
          Reprocessar NF registra solicitação na auditoria — a emissão real depende do conector fiscal.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Comunicações com erro / pendentes</h3>
        {(failed ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem com erro.</p>
        )}
        <div className="divide-y">
          {(failed ?? []).map((m) => (
            <div key={m.id} className="py-2 flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.event_code} · {m.channel}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {m.recipient_email || m.recipient_phone || "—"}
                </div>
                {m.last_error && (
                  <div className="text-[11px] text-destructive truncate">{m.last_error}</div>
                )}
              </div>
              <Badge variant={m.status === "failed" ? "destructive" : "outline"}>{m.status}</Badge>
              <Button size="sm" variant="outline" onClick={() => resendMut.mutate(m.id)} disabled={resendMut.isPending}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reenviar
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
