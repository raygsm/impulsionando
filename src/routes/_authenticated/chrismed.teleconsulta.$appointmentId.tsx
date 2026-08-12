import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole, RefreshCw, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/chrismed/teleconsulta/$appointmentId")({
  component: ChrismedTeleconsultRoom,
  head: () => ({
    meta: [
      { title: "Sala de Teleconsulta — CHRISMED" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type RoomState = {
  room_id: string;
  room_key: string;
  provider: string;
  status: string;
  starts_at: string;
  ends_at: string;
  professional_id: string;
  professional_name: string;
  patient_name: string;
  professional_ready_at: string | null;
  patient_joined_at: string | null;
  replacement_deadline_at: string | null;
  can_enter: boolean;
  role: "professional" | "patient" | "admin";
};

type RecordingConsentState = {
  patient: "pending" | "accepted" | "declined";
  professional: "pending" | "accepted" | "declined";
  recording_status: "awaiting_consent" | "ready" | "recording" | "processing" | "available" | "failed" | "retention_hold" | "deleted";
};

const RECORDING_CONSENT_VERSION = "chrismed.teleconsult.recording.v1.2026-08-12";
const RECORDING_CONSENT_TEXT =
  "Estou ciente de que este atendimento remoto será gravado para segurança, rastreabilidade e governança assistencial da CHRISMED. A gravação é dado sensível de saúde, ficará em armazenamento privado e não será disponibilizada ao paciente nem ao profissional após a consulta. O acesso administrativo é excepcional, restrito a masters autorizados, autenticado e auditado. Autorizo a gravação deste atendimento remoto antes de seu início.";

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ChrismedTeleconsultRoom() {
  const { appointmentId } = Route.useParams();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [consent, setConsent] = useState<RecordingConsentState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [replacementRequested, setReplacementRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastReminderMinute, setLastReminderMinute] = useState<number | null>(null);

  async function loadRoom() {
    const [{ data, error }, consentResult] = await Promise.all([
      supabase.rpc("chrismed_get_teleconsult_room", { p_appointment_id: appointmentId }),
      supabase.rpc("chrismed_get_recording_consent_state", { p_appointment_id: appointmentId }),
    ]);
    if (error) {
      toast.error(error.message.includes("not_authorized") ? "Você não tem acesso a esta teleconsulta." : error.message);
      setLoading(false);
      return;
    }
    setRoom(data as unknown as RoomState);
    if (!consentResult.error) setConsent(consentResult.data as unknown as RecordingConsentState);
    setLoading(false);
  }

  useEffect(() => {
    void loadRoom();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => void loadRoom(), 10000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(poll);
    };
  }, [appointmentId]);

  const startsAt = room ? new Date(room.starts_at).getTime() : 0;
  const endsAt = room ? new Date(room.ends_at).getTime() : 0;
  const untilStart = startsAt - now;
  const sinceStart = now - startsAt;
  const professionalPrepareOpen = room?.role === "professional" && untilStart <= 3 * 60_000;
  const patientOpen = room?.role === "patient" && untilStart <= 0;
  const timeAllowsEntry = room?.role === "admin" || professionalPrepareOpen || patientOpen;
  const myConsentRole = room?.role === "patient" || room?.role === "professional" ? room.role : null;
  const myConsent = myConsentRole && consent ? consent[myConsentRole] : "accepted";
  const bothAccepted = consent?.patient === "accepted" && consent?.professional === "accepted";
  const recorderActive = consent?.recording_status === "recording";
  const recordingHealthy = recorderActive || consent?.recording_status === "processing" || consent?.recording_status === "available";
  const canShowPlayer = Boolean(timeAllowsEntry && bothAccepted && recorderActive);

  useEffect(() => {
    if (!room || room.role !== "professional" || room.professional_ready_at || joined) return;
    const minutes = Math.ceil(untilStart / 60_000);
    if (minutes <= 3 && minutes >= 1 && minutes !== lastReminderMinute) {
      setLastReminderMinute(minutes);
      toast.warning(`Sua teleconsulta começa em ${minutes} minuto${minutes === 1 ? "" : "s"}. Entre na sala com câmera e microfone prontos.`);
    }
    if (untilStart <= 0 && lastReminderMinute !== 0) {
      setLastReminderMinute(0);
      toast.error("A consulta já começou. Confirme imediatamente que você está na sala.");
    }
  }, [room, untilStart, joined, lastReminderMinute]);

  async function decideRecordingConsent(accept: boolean) {
    if (!myConsentRole) return;
    setBusy(true);
    try {
      const [textHash, userAgentHash] = await Promise.all([
        sha256(RECORDING_CONSENT_TEXT),
        sha256(navigator.userAgent),
      ]);
      const { error } = await supabase.rpc("chrismed_set_recording_consent", {
        p_appointment_id: appointmentId,
        p_party_role: myConsentRole,
        p_accept: accept,
        p_consent_version: RECORDING_CONSENT_VERSION,
        p_consent_text_hash: textHash,
        p_user_agent_hash: userAgentHash,
        p_ip_hash: null,
      });
      if (error) throw error;
      toast[accept ? "success" : "info"](
        accept
          ? "Autorização de gravação registrada com segurança."
          : "Sua decisão foi registrada. A teleconsulta não será iniciada sem autorização para a gravação.",
      );
      await loadRoom();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar sua decisão.");
    } finally {
      setBusy(false);
    }
  }

  async function markPresence() {
    if (!room || !recorderActive) return;
    setBusy(true);
    const { error } = await supabase.rpc("chrismed_mark_teleconsult_presence", {
      p_appointment_id: appointmentId,
      p_role: room.role === "patient" ? "patient" : "professional",
      p_user_agent: navigator.userAgent,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setJoined(true);
    toast.success(room.role === "patient" ? "Entrada registrada. Boa consulta." : "Presença confirmada. Você não receberá mais alertas de entrada.");
    await loadRoom();
  }

  async function confirmConversation() {
    setBusy(true);
    const { error } = await supabase.rpc("chrismed_patient_confirm_professional_present", {
      p_appointment_id: appointmentId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setJoined(true);
    toast.success("Perfeito. Registramos que a teleconsulta está em andamento e os alertas de ausência foram encerrados.");
    await loadRoom();
  }

  async function requestReplacement() {
    setBusy(true);
    const { data, error } = await supabase.rpc("chrismed_patient_request_live_replacement", {
      p_appointment_id: appointmentId,
      p_wait_minutes: 5,
      p_reason: "professional_not_in_room",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setReplacementRequested(true);
    const result = data as unknown as { offered_to?: number };
    toast.info(`Estamos buscando outro profissional agora. ${result?.offered_to ?? 0} profissional(is) elegível(is) foram acionados.`);
    await loadRoom();
  }

  async function requestReschedule(reason = "patient_prefers_reschedule") {
    setBusy(true);
    const { error } = await supabase.rpc("chrismed_patient_request_reschedule", {
      p_appointment_id: appointmentId,
      p_reason: reason,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação de remarcação registrada. A CHRISMED continuará o atendimento pela sua área e pelos canais cadastrados.");
    await loadRoom();
  }

  useEffect(() => {
    if (!room || room.role !== "patient" || room.status !== "replacement_search") return;
    const checker = window.setInterval(async () => {
      const { data } = await supabase.rpc("chrismed_check_live_replacement_timeout", {
        p_appointment_id: appointmentId,
      });
      const state = data as unknown as { status?: string };
      if (state?.status === "reschedule_required") {
        window.clearInterval(checker);
        toast.error("Não encontramos outro profissional dentro do tempo de espera. Pedimos desculpas. Vamos direcionar você para remarcação.");
        await requestReschedule("replacement_not_found_within_five_minutes");
      } else {
        await loadRoom();
      }
    }, 15000);
    return () => window.clearInterval(checker);
  }, [room?.status, room?.role, appointmentId]);

  const playerSrc = useMemo(() => {
    if (!room) return "";
    const params = [
      "config.prejoinConfig.enabled=false",
      "config.disableInviteFunctions=true",
      "config.defaultLanguage=ptBR",
      "config.disableThirdPartyRequests=true",
      "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    ].join("&");
    return `https://meet.jit.si/${encodeURIComponent(room.room_key)}#${params}`;
  }, [room]);

  if (loading) return <div className="mx-auto max-w-5xl p-8 text-center">Preparando sua sala CHRISMED…</div>;
  if (!room) return <div className="mx-auto max-w-5xl p-8 text-center">Não foi possível abrir esta teleconsulta.</div>;

  const waitingProfessional = room.role === "patient" && sinceStart >= 0 && !joined && !room.professional_ready_at && !["replacement_search", "in_progress", "reschedule_required"].includes(room.status);
  const searchRemaining = room.replacement_deadline_at ? Math.max(0, new Date(room.replacement_deadline_at).getTime() - now) : 0;

  return (
    <main className="min-h-screen bg-[#f3f8f8] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl bg-gradient-to-r from-[#071c18] to-[#0b4b43] p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70"><ShieldCheck className="h-4 w-4" /> Teleconsulta CHRISMED</div>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Sala de atendimento</h1>
              <p className="mt-1 text-sm text-white/75">{new Date(room.starts_at).toLocaleString("pt-BR")} · {room.professional_name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="w-fit bg-white/15 text-white hover:bg-white/15">{room.status.replaceAll("_", " ").toUpperCase()}</Badge>
              <Badge className={recordingHealthy ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                {recordingHealthy ? "GRAVAÇÃO PROTEGIDA" : "GRAVAÇÃO PENDENTE"}
              </Badge>
            </div>
          </div>
        </header>

        {myConsentRole && myConsent !== "accepted" && (
          <Card className="border-[#078f8b]/25 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-[#078f8b]" /> Autorização obrigatória para gravação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-700">Todos os atendimentos remotos da CHRISMED são gravados. A gravação integra a governança de segurança do atendimento e contém dados sensíveis de saúde.</p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{RECORDING_CONSENT_TEXT}</div>
              <p className="text-xs text-muted-foreground">Versão do consentimento: {RECORDING_CONSENT_VERSION}. Sua decisão, data e evidências técnicas de integridade ficam registradas para auditoria.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void decideRecordingConsent(true)} disabled={busy}>Li e autorizo a gravação</Button>
                <Button variant="outline" onClick={() => void decideRecordingConsent(false)} disabled={busy}>Não autorizo</Button>
              </div>
              {myConsent === "declined" && <p className="text-sm font-medium text-amber-700">Sem autorização, o atendimento remoto não será iniciado. Você poderá solicitar remarcação ou outra modalidade disponível.</p>}
            </CardContent>
          </Card>
        )}

        {myConsent === "accepted" && !bothAccepted && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-3 py-5 text-sm text-amber-950"><Clock3 className="h-5 w-5" /> Sua autorização está registrada. Aguardando a autorização da outra parte antes de preparar a gravação.</CardContent>
          </Card>
        )}

        {bothAccepted && !recorderActive && consent?.recording_status !== "failed" && (
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="flex items-start gap-3 py-5 text-sm text-sky-950"><RefreshCw className="mt-0.5 h-5 w-5 animate-spin" /><div><strong>Autorizações concluídas.</strong><br />A CHRISMED está aguardando a confirmação do gravador seguro. A câmera clínica só será liberada quando a gravação estiver efetivamente ativa.</div></CardContent>
          </Card>
        )}

        {consent?.recording_status === "failed" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="space-y-3 py-5 text-sm text-red-950"><p className="font-semibold">A gravação segura não pôde ser iniciada.</p><p>Por segurança, a teleconsulta não será realizada sem gravação. A ocorrência foi bloqueada para evitar atendimento remoto fora da política.</p>{room.role === "patient" && <Button onClick={() => void requestReschedule("secure_recording_unavailable")} disabled={busy}>Solicitar remarcação</Button>}</CardContent>
          </Card>
        )}

        {room.role === "professional" && !room.professional_ready_at && (
          <Card className="border-amber-300 bg-amber-50"><CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-950">Entre na sala pelo menos 3 minutos antes.</p><p className="text-sm text-amber-900/75">Mantenha câmera e microfone preparados. A entrada clínica só será liberada com os dois consentimentos e gravação segura ativa.</p></div><div className="text-right"><span className="block font-mono text-2xl font-bold text-amber-950">{untilStart > 0 ? formatCountdown(untilStart) : "EM ANDAMENTO"}</span></div></CardContent></Card>
        )}

        {room.role === "patient" && untilStart > 0 && (
          <Card><CardContent className="py-8 text-center"><Clock3 className="mx-auto mb-3 h-8 w-8 text-[#078f8b]" /><h2 className="text-xl font-semibold">Sua sala abre exatamente no horário da consulta.</h2><p className="mt-2 text-muted-foreground">Faltam <strong>{formatCountdown(untilStart)}</strong>. Você pode permanecer nesta página.</p></CardContent></Card>
        )}

        {waitingProfessional && bothAccepted && recorderActive && (
          <Card className="border-amber-300 bg-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-950"><AlertTriangle className="h-5 w-5" /> O profissional ainda não confirmou presença</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-amber-950/80">Algo pode ter acontecido com o profissional. Você já está conversando com ele nesta sala?</p><div className="flex flex-wrap gap-2"><Button onClick={() => void confirmConversation()} disabled={busy}><CheckCircle2 className="mr-2 h-4 w-4" /> Sim, já estamos conversando</Button><Button variant="outline" onClick={() => void requestReplacement()} disabled={busy || replacementRequested}>Não. Buscar outro profissional</Button><Button variant="ghost" onClick={() => void requestReschedule()} disabled={busy}>Prefiro remarcar</Button></div></CardContent></Card>
        )}

        {room.status === "replacement_search" && room.role === "patient" && (
          <Card className="border-[#078f8b]/30 bg-[#edf8f7]"><CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-[#075c59]"><RefreshCw className="h-4 w-4 animate-spin" /> Estamos procurando outro profissional agora.</div><p className="mt-1 text-sm text-slate-600">Você autorizou uma espera de até 5 minutos. Se ninguém puder assumir, pediremos desculpas e encaminharemos sua remarcação.</p></div><span className="font-mono text-2xl font-bold text-[#075c59]">{formatCountdown(searchRemaining)}</span></CardContent></Card>
        )}

        {room.status === "reschedule_required" && room.role === "patient" && (
          <Card className="border-red-200 bg-red-50"><CardContent className="space-y-3 py-6"><p className="font-semibold text-red-950">Pedimos desculpas. Não conseguimos localizar outro profissional no tempo de espera.</p><p className="text-sm text-red-900/75">A CHRISMED registrará a ocorrência e verificará o que aconteceu. Você pode solicitar a remarcação agora.</p><Button onClick={() => void requestReschedule("replacement_not_found_within_five_minutes")} disabled={busy}>Solicitar remarcação</Button></CardContent></Card>
        )}

        {canShowPlayer && room.status !== "reschedule_required" && (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="aspect-video min-h-[420px] bg-[#071c18]">
              <iframe title="Teleconsulta CHRISMED" src={playerSrc} allow="camera; microphone; fullscreen; autoplay" className="h-full min-h-[420px] w-full border-0" />
            </div>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Gravação protegida ativa. O vídeo permanece incorporado à CHRISMED.</p>
              {!joined && (room.role === "professional" || room.role === "patient") && <Button onClick={() => void markPresence()} disabled={busy}><Video className="mr-2 h-4 w-4" /> {room.role === "professional" ? "Estou na sala" : "Entrei na teleconsulta"}</Button>}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between text-sm"><Link to={room.role === "professional" ? "/agenda/profissional" : "/chrismed/minha-conta" as never}>Voltar ao dashboard</Link>{now > endsAt && <span className="text-muted-foreground">Horário previsto encerrado.</span>}</div>
      </div>
    </main>
  );
}
