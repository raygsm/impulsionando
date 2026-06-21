import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMyAppointments,
  confirmAttendance,
  cancelAppointment,
} from "@/lib/agenda-core.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/cliente")({
  component: AgendaClientePage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  scheduled: "outline",
  confirmed: "default",
  checked_in: "secondary",
  in_progress: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

function AgendaClientePage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyAppointments);
  const confirmFn = useServerFn(confirmAttendance);
  const cancelFn = useServerFn(cancelAppointment);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => listFn(),
    refetchInterval: 30000,
  });

  const confirm = useMutation({
    mutationFn: (appointmentId: string) => confirmFn({ data: { appointmentId } }),
    onSuccess: () => {
      toast.success("Presença confirmada!");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Falha ao confirmar"),
  });

  const cancel = useMutation({
    mutationFn: (appointmentId: string) =>
      cancelFn({ data: { appointmentId, reason: "Cancelado pelo cliente", reopenSlot: true } }),
    onSuccess: () => {
      toast.success("Agendamento cancelado. O horário foi liberado.");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Falha ao cancelar"),
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" /> Meus Agendamentos
        </h1>
        <p className="text-muted-foreground">
          Confirme presença, remarque ou cancele seus horários.
        </p>
      </header>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}

      {!isLoading && appointments.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Você não tem agendamentos próximos.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {appointments.map((a) => {
          const past = new Date(a.ends_at).getTime() < Date.now();
          const canConfirm = !past && (a.status === "scheduled");
          const canCancel = !past && ["scheduled", "confirmed"].includes(a.status);
          return (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Agendamento</span>
                  <Badge variant={STATUS_VARIANT[a.status] ?? "outline"} className="capitalize">
                    {a.status.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(a.starts_at).toLocaleString("pt-BR")} →{" "}
                    {new Date(a.ends_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    disabled={!canConfirm || confirm.isPending}
                    onClick={() => confirm.mutate(a.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar presença
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canCancel || cancel.isPending}
                    onClick={() => cancel.mutate(a.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
