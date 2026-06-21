import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import {
  openSlot,
  cancelAppointment,
  registerNoShow,
  dashboardMetrics,
  createOncallShift,
} from "@/lib/agenda-core.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarClock, AlertOctagon, UserX, Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/gestor")({
  component: AgendaGestorPage,
});

function AgendaGestorPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const dashFn = useServerFn(dashboardMetrics);
  const openFn = useServerFn(openSlot);
  const cancelFn = useServerFn(cancelAppointment);
  const noShowFn = useServerFn(registerNoShow);
  const oncallFn = useServerFn(createOncallShift);

  const { data: metrics } = useQuery({
    queryKey: ["agenda-metrics", companyId],
    enabled: !!companyId,
    queryFn: () => dashFn({ data: { companyId: companyId!, days: 30 } }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["agenda-appointments-recent", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agenda_appointments")
        .select("id, starts_at, ends_at, status, customer_name, professional_id, service_id, price")
        .eq("company_id", companyId!)
        .gte("starts_at", new Date(Date.now() - 7 * 86400_000).toISOString())
        .order("starts_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: openSlots = [] } = useQuery({
    queryKey: ["agenda-open-slots", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agenda_open_slots")
        .select("id, origin, status, starts_at, ends_at, specialty, payout_amount, current_wave")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const cancel = useMutation({
    mutationFn: (appointmentId: string) =>
      cancelFn({ data: { appointmentId, reason: "Cancelamento pela gestão", reopenSlot: true } }),
    onSuccess: () => {
      toast.success("Atendimento cancelado e vaga reaberta (Pega-Horário disparado)");
      qc.invalidateQueries({ queryKey: ["agenda-appointments-recent", companyId] });
      qc.invalidateQueries({ queryKey: ["agenda-open-slots", companyId] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao cancelar"),
  });

  const markNoShow = useMutation({
    mutationFn: (vars: { appointmentId: string; kind: "customer" | "professional" }) =>
      noShowFn({ data: { ...vars, chargedAmount: 0 } }),
    onSuccess: () => {
      toast.success("No-show registrado");
      qc.invalidateQueries({ queryKey: ["agenda-appointments-recent", companyId] });
      qc.invalidateQueries({ queryKey: ["agenda-open-slots", companyId] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao registrar"),
  });

  if (!companyId) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Selecione uma empresa ativa para acessar a agenda.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" /> Painel do Gestor — Agenda
          </h1>
          <p className="text-muted-foreground">
            Operação em tempo real: ocupação, plantões, no-show e Pega-Horário.
          </p>
        </div>
        <div className="flex gap-2">
          <NewOncallDialog companyId={companyId} onCreate={(payload) => oncallFn({ data: payload }).then(() => {
            toast.success("Plantão criado");
            qc.invalidateQueries({ queryKey: ["agenda-open-slots", companyId] });
          })} />
          <Button
            variant="secondary"
            onClick={async () => {
              const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
              const endsAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
              await openFn({
                data: {
                  companyId,
                  origin: "manual",
                  startsAt,
                  endsAt,
                  expiresInSeconds: 900,
                },
              });
              toast.success("Vaga aberta — alertas Pega-Horário disparados");
              qc.invalidateQueries({ queryKey: ["agenda-open-slots", companyId] });
            }}
          >
            <Radio className="mr-2 h-4 w-4" /> Abrir vaga emergencial
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Agendados (30d)" value={metrics?.scheduled ?? 0} />
        <Metric label="Realizados" value={metrics?.completed ?? 0} />
        <Metric label="Cancelados" value={metrics?.cancelled ?? 0} />
        <Metric label="No-show" value={metrics?.noShows ?? 0} accent="warn" />
        <Metric label="Vagas abertas agora" value={metrics?.openSlots ?? 0} accent="info" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vagas em Pega-Horário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {openSlots.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma vaga aberta.</p>}
          {openSlots.map((s) => (
            <div key={s.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
              <div>
                <span className="font-medium capitalize">{s.origin.replace("_", " ")}</span>{" "}
                <span className="text-muted-foreground">
                  {new Date(s.starts_at).toLocaleString("pt-BR")}
                </span>
                {s.specialty && <span className="ml-2 text-xs text-muted-foreground">• {s.specialty}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Onda {s.current_wave}</Badge>
                <Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos recentes (7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {appointments.length === 0 && <p className="text-muted-foreground text-sm">Sem atendimentos.</p>}
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{a.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.starts_at).toLocaleString("pt-BR")} • {a.status}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={a.status === "cancelled" || cancel.isPending}
                  onClick={() => cancel.mutate(a.id)}
                  title="Cancelar (abre Pega-Horário)"
                >
                  <Radio className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={a.status === "no_show" || markNoShow.isPending}
                  onClick={() => markNoShow.mutate({ appointmentId: a.id, kind: "customer" })}
                  title="No-show do cliente"
                >
                  <UserX className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={a.status === "no_show" || markNoShow.isPending}
                  onClick={() => markNoShow.mutate({ appointmentId: a.id, kind: "professional" })}
                  title="No-show do profissional (abre substituição)"
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: "warn" | "info" }) {
  const color =
    accent === "warn"
      ? "text-amber-600"
      : accent === "info"
      ? "text-blue-600"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function NewOncallDialog({
  companyId,
  onCreate,
}: {
  companyId: string;
  onCreate: (payload: {
    companyId: string;
    startsAt: string;
    endsAt: string;
    specialty: string | null;
  }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarClock className="mr-2 h-4 w-4" /> Novo plantão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir plantão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Especialidade</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Cardiologia" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Início</Label>
              <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={async () => {
              if (!starts || !ends) return toast.error("Informe início e fim");
              await onCreate({
                companyId,
                startsAt: new Date(starts).toISOString(),
                endsAt: new Date(ends).toISOString(),
                specialty: specialty || null,
              });
              setOpen(false);
              setSpecialty("");
              setStarts("");
              setEnds("");
            }}
          >
            Criar plantão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
