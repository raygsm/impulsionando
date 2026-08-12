import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

const TERMS_VERSION = "pega-agenda-v1";

type Offer = {
  offer_id: string;
  offer_status: string;
  wave: number;
  sent_at: string;
  offer_expires_at: string;
  slot_id: string;
  origin: string;
  starts_at: string;
  ends_at: string;
  primary_area: string | null;
  slot_status: string;
  slot_expires_at: string;
  reason: string | null;
};

type PegaAgendaState = {
  professional_found: boolean;
  professional_id?: string;
  professional_name?: string;
  enabled: boolean;
  terms_version?: string | null;
  accepted_at?: string | null;
  revoked_at?: string | null;
  min_notice_minutes?: number;
  max_response_minutes?: number;
  offers: Offer[];
};

export const Route = createFileRoute("/_authenticated/agenda/profissional")({
  component: AgendaProfissionalPage,
  head: () => ({ meta: [{ title: "CHRISMED — Pega Agenda" }] }),
});

async function loadState(): Promise<PegaAgendaState> {
  const { data, error } = await supabase.rpc("chrismed_get_my_pega_agenda_state");
  if (error) throw error;
  return (data ?? { professional_found: false, enabled: false, offers: [] }) as PegaAgendaState;
}

function AgendaProfissionalPage() {
  const qc = useQueryClient();
  const stateQuery = useQuery({ queryKey: ["chrismed-pega-agenda-state"], queryFn: loadState, refetchInterval: 15000 });
  const state = stateQuery.data;

  useEffect(() => {
    const channel = supabase.channel("chrismed-pega-agenda-self")
      .on("postgres_changes", { event: "*", schema: "public", table: "agenda_slot_offers" }, () => qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const preference = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.rpc("chrismed_set_pega_agenda_preference", {
        p_enabled: enabled,
        p_terms_version: TERMS_VERSION,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      toast.success(enabled ? "Pega Agenda ativado com sucesso." : "Participação no Pega Agenda desativada.");
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Não foi possível atualizar sua preferência."),
  });

  const claim = useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc("chrismed_claim_pega_agenda_offer", { p_offer_id: offerId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Horário assumido com sucesso e vinculado à sua agenda.");
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
    },
    onError: (e: { message?: string }) => {
      const message = e.message ?? "Não foi possível assumir o horário.";
      toast.error(message.includes("offer_not_available") ? "Esta oportunidade não está mais disponível." : message);
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
    },
  });

  const decline = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase.rpc("chrismed_decline_pega_agenda_offer", { p_offer_id: offerId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] }),
  });

  if (stateQuery.isLoading) return <div className="container mx-auto py-8">Carregando Pega Agenda…</div>;

  if (!state?.professional_found) {
    return <div className="container mx-auto py-8"><Card><CardContent className="py-10 text-center">Seu usuário ainda não está vinculado a um perfil profissional ativo da CHRISMED.</CardContent></Card></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight"><Bell className="h-7 w-7 text-primary" /> Pega Agenda</h1>
        <p className="text-muted-foreground">Oportunidades de horários liberados para profissionais elegíveis da CHRISMED.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Participação e consentimento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Ao ativar o Pega Agenda, você concorda em receber oportunidades compatíveis com seu perfil, especialidade e disponibilidade. Cada oportunidade tem prazo limitado e o primeiro aceite transacional válido garante o horário. Você pode desativar sua participação a qualquer momento.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={state.enabled ? "default" : "secondary"}>{state.enabled ? "ATIVO" : "INATIVO"}</Badge>
            {state.accepted_at && <span className="text-xs text-muted-foreground">Aceite: {new Date(state.accepted_at).toLocaleString("pt-BR")} · {state.terms_version}</span>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => preference.mutate(true)} disabled={preference.isPending || state.enabled}>SIM, participar</Button>
            <Button variant="outline" onClick={() => preference.mutate(false)} disabled={preference.isPending || !state.enabled}>NÃO participar</Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold">Oportunidades disponíveis</h2><p className="text-sm text-muted-foreground">Atualização automática a cada 15 segundos e por eventos em tempo real.</p></div>
        {!state.enabled && <Card><CardContent className="py-8 text-center text-muted-foreground">Ative sua participação para receber oportunidades.</CardContent></Card>}
        {state.enabled && state.offers.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma oportunidade compatível disponível neste momento.</CardContent></Card>}
        {state.enabled && <div className="grid gap-4 md:grid-cols-2">{state.offers.map((offer) => (
          <Card key={offer.offer_id} className="border-primary/30">
            <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-lg"><span>{offer.primary_area ?? "Atendimento CHRISMED"}</span><Badge>Onda {offer.wave}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{new Date(offer.starts_at).toLocaleString("pt-BR")} → {new Date(offer.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></div>
              {offer.reason && <p className="text-sm text-muted-foreground">Motivo: {offer.reason}</p>}
              <p className="text-xs text-muted-foreground">Disponível até {new Date(offer.offer_expires_at).toLocaleString("pt-BR")}.</p>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => claim.mutate(offer.offer_id)} disabled={claim.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Assumir horário</Button>
                <Button variant="outline" onClick={() => decline.mutate(offer.offer_id)} disabled={decline.isPending}><XCircle className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}</div>}
      </section>
    </div>
  );
}
