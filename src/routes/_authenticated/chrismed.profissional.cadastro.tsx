import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, MailCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chrismed/profissional/cadastro")({
  component: ChrismedProfessionalRegistrationStatus,
  head: () => ({
    meta: [
      { title: "Cadastro em análise — Profissional da Saúde | CHRISMED" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Profile = {
  id: string;
  name: string;
  email: string | null;
  profile_status: string;
  reviewed_at: string | null;
};

function ChrismedProfessionalRegistrationStatus() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function prepareAndLoad() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate({ to: "/auth?mode=signup" as never });
        return;
      }

      const raw = sessionStorage.getItem("chrismed-professional-signup");
      if (raw) {
        try {
          const registration = JSON.parse(raw) as Record<string, unknown>;
          const { error } = await (supabase as any).rpc("ensure_chrismed_professional_profile", {
            p_registration: registration,
          });
          if (error) throw error;

          const otherSpecialty =
            typeof registration.otherSpecialty === "string" ? registration.otherSpecialty.trim() : "";
          if (
            otherSpecialty &&
            sessionStorage.getItem("chrismed-specialty-request-sent") !== otherSpecialty
          ) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              const response = await fetch("/api/chrismed/specialty-request", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  authorization: `Bearer ${sessionData.session.access_token}`,
                },
                body: JSON.stringify({
                  requestedName: otherSpecialty,
                  details: registration.otherSpecialtyDetails,
                }),
              });
              if (response.ok) {
                sessionStorage.setItem("chrismed-specialty-request-sent", otherSpecialty);
              }
            }
          }
          sessionStorage.removeItem("chrismed-professional-signup");
        } catch {
          toast.error("Não foi possível concluir o envio do cadastro para análise.");
        }
      }

      const { data, error } = await (supabase as any)
        .from("agenda_professionals")
        .select("id,name,email,profile_status,reviewed_at")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      setProfile(data as Profile);
      setLoading(false);
    }

    void prepareAndLoad();
    timer = window.setInterval(() => void prepareAndLoad(), 15000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-[#f3f8f8] p-8 text-center">Enviando seu cadastro à CHRISMED…</div>;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f3f8f8] px-4 py-12">
        <Card className="mx-auto max-w-xl"><CardContent className="space-y-4 py-10 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-[#078f8b]" />
          <h1 className="text-2xl font-bold">Complete seu cadastro profissional</h1>
          <p className="text-muted-foreground">Não encontramos um cadastro profissional vinculado à sua conta.</p>
          <Button onClick={() => navigate({ to: "/auth?mode=signup" as never })}>Voltar ao cadastro</Button>
        </CardContent></Card>
      </main>
    );
  }

  if (profile.profile_status === "approved" || profile.profile_status === "active") {
    return (
      <main className="min-h-screen bg-[#f3f8f8] px-4 py-12">
        <Card className="mx-auto max-w-2xl border-[#078f8b]/30"><CardContent className="space-y-5 py-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
          <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#078f8b]">Comitê CHRISMED</p><h1 className="mt-1 text-3xl font-bold">Cadastro aprovado</h1></div>
          <p className="text-muted-foreground">Bem-vindo(a), {profile.name}. Agora configure seu consultório, locais de atendimento e abra sua agenda.</p>
          <Link to="/chrismed/profissional/onboarding"><Button size="lg">Criar consultório e abrir agenda</Button></Link>
        </CardContent></Card>
      </main>
    );
  }

  if (profile.profile_status === "rejected" || profile.profile_status === "suspended") {
    return (
      <main className="min-h-screen bg-[#f3f8f8] px-4 py-12">
        <Card className="mx-auto max-w-2xl"><CardContent className="space-y-5 py-10 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-slate-600" />
          <h1 className="text-3xl font-bold">Cadastro indisponível para ativação</h1>
          <p className="text-muted-foreground">A gestão CHRISMED precisa concluir uma tratativa antes da ativação. Verifique seu e-mail ou fale com o atendimento.</p>
          <a href="mailto:sac@chrismed.com.br"><Button variant="outline">Falar com a CHRISMED</Button></a>
        </CardContent></Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f8f8] px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-[#057c79] to-[#09a19c] p-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-white/75">Profissional da Saúde</p>
          <h1 className="mt-2 text-3xl font-bold">Seu cadastro está com o Comitê CHRISMED</h1>
          <p className="mt-3 max-w-2xl text-white/85">Recebemos seus dados profissionais. A agenda e o consultório só serão liberados após a aprovação.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-6"><CheckCircle2 className="mb-3 h-6 w-6 text-emerald-700"/><strong>1. Cadastro recebido</strong><p className="mt-1 text-sm text-muted-foreground">Seus dados foram registrados com segurança.</p></CardContent></Card>
          <Card className="border-amber-300"><CardContent className="pt-6"><Clock3 className="mb-3 h-6 w-6 text-amber-700"/><strong>2. Análise do Comitê</strong><p className="mt-1 text-sm text-muted-foreground">Validação profissional e aprovação CHRISMED.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><MailCheck className="mb-3 h-6 w-6 text-[#078f8b]"/><strong>3. Liberação</strong><p className="mt-1 text-sm text-muted-foreground">Após aprovado, você recebe o acesso para criar o consultório e abrir a agenda.</p></CardContent></Card>
        </div>
        <Card><CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"><div><strong>{profile.name}</strong><p className="text-sm text-muted-foreground">Status: em análise pelo Comitê CHRISMED.</p></div><div className="text-sm text-muted-foreground">A página atualiza automaticamente.</div></CardContent></Card>
      </div>
    </main>
  );
}
