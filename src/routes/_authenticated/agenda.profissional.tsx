import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyOpenOffers,
  claimSlot,
  declineSlotOffer,
} from "@/lib/agenda-core.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Clock, MapPin, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/profissional")({
  component: AgendaProfissionalPage,
});

function AgendaProfissionalPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyOpenOffers);
  const claimFn = useServerFn(claimSlot);
  const declineFn = useServerFn(declineSlotOffer);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["my-open-offers"],
    queryFn: () => listFn(),
    refetchInterval: 15000,
  });

  // Realtime: novas ofertas chegando
  useEffect(() => {
    const channel = supabase
      .channel("agenda-slot-offers-self")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_slot_offers" },
        () => qc.invalidateQueries({ queryKey: ["my-open-offers"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const claim = useMutation({
    mutationFn: async (vars: { slotId: string; professionalId: string }) => {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      return claimFn({ data: { ...vars, ip: null, userAgent: ua } });
    },
    onSuccess: () => {
      toast.success("Horário garantido! Adicionado à sua agenda.");
      qc.invalidateQueries({ queryKey: ["my-open-offers"] });
    },
    onError: (e: { message?: string }) => {
      const msg = e?.message ?? "Falha ao pegar o horário";
      toast.error(msg.includes("already taken") ? "Esse horário já foi pego por outro profissional." : msg);
      qc.invalidateQueries({ queryKey: ["my-open-offers"] });
    },
  });

  const decline = useMutation({
    mutationFn: (offerId: string) => declineFn({ data: { offerId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-open-offers"] }),
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-7 w-7 text-primary" /> Pega Horário
        </h1>
        <p className="text-muted-foreground">
          Vagas, plantões e encaixes disponíveis agora. O primeiro que clicar leva.
        </p>
      </header>

      {isLoading && <p className="text-muted-foreground">Carregando ofertas…</p>}

      {!isLoading && offers.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Sem ofertas no momento. Você será notificado em tempo real assim que surgir uma vaga compatível.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((o) => {
          const slot = (o as unknown as { slot: { id: string; starts_at: string; ends_at: string; origin: string; specialty: string | null; payout_amount: number | null; status: string } | null }).slot;
          const prof = (o as unknown as { professional: { id: string } }).professional;
          if (!slot) return null;
          const taken = slot.status !== "open";
          return (
            <Card key={o.id} className={taken ? "opacity-60" : "border-primary/40"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="capitalize">{slot.origin.replace("_", " ")}</span>
                  <Badge variant={taken ? "outline" : "default"}>
                    {taken ? "Indisponível" : `Onda ${o.wave}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(slot.starts_at).toLocaleString("pt-BR")} →{" "}
                    {new Date(slot.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {slot.specialty && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{slot.specialty}</span>
                  </div>
                )}
                {slot.payout_amount != null && (
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Repasse: R$ {Number(slot.payout_amount).toFixed(2)}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    disabled={taken || claim.isPending}
                    onClick={() => claim.mutate({ slotId: slot.id, professionalId: prof.id })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    PEGAR HORÁRIO
                  </Button>
                  <Button
                    variant="outline"
                    disabled={taken || decline.isPending}
                    onClick={() => decline.mutate(o.id)}
                  >
                    <XCircle className="h-4 w-4" />
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
