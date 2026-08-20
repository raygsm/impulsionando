import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LockKeyhole,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfessionalCombobox } from "@/components/chrismed/ProfessionalCombobox";
import {
  CHRISMED_ONBOARDING_PATH,
  DEFAULT_HEALTH_PROFESSIONS,
  type HealthProfession,
  validateProfessionalRegistration,
} from "@/lib/chrismed-professionals";

type AuthMode = "login" | "signup";
type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  council_acronym: string | null;
  council_required: boolean;
};
type SpecialtyRow = { id: string; profession_id: string; name: string; parent_id: string | null };

function authError(message?: string) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("already registered")) return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password should be"))
    return "A senha precisa ter pelo menos 12 caracteres.";
  return "Não foi possível concluir o acesso. Confira os dados informados e tente novamente. Se continuar, fale com o atendimento CHRISMED.";
}

export function ChrismedProfessionalAuth({ initialMode = "login", initialEmail = "", nextPath = null }: { initialMode?: AuthMode; initialEmail?: string; nextPath?: string | null }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [catalog, setCatalog] = useState<HealthProfession[]>(DEFAULT_HEALTH_PROFESSIONS);
  const [professionId, setProfessionId] = useState("");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilRegion, setCouncilRegion] = useState("");
  const [primaryArea, setPrimaryArea] = useState("");
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const [otherSpecialtyDetails, setOtherSpecialtyDetails] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(initialEmail.trim());
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [technicalSupportEmail, setTechnicalSupportEmail] = useState("ti@chrismed.com.br");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.rpc("get_chrismed_contact_emails" as never);
      const row = (data as unknown as { technical_support_email?: string }[] | null)?.[0];
      if (active && !error && row?.technical_support_email) {
        setTechnicalSupportEmail(row.technical_support_email);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (
              column: string,
              value: boolean,
            ) => {
              order: (
                column: string,
              ) => Promise<{ data: CatalogRow[] | SpecialtyRow[] | null; error: unknown }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from("health_professions")
        .select("id,slug,name,council_acronym,council_required")
        .eq("is_active", true)
        .order("sort_order");
      if (!active || error || !data?.length) return;
      setCatalog(
        (data as CatalogRow[]).map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          councilAcronym: row.council_acronym,
          councilRequired: row.council_required,
        })),
      );
      const specialtyResult = await client
        .from("health_specialties")
        .select("id,profession_id,name,parent_id")
        .eq("is_active", true)
        .order("sort_order");
      if (active && !specialtyResult.error && specialtyResult.data)
        setSpecialties(specialtyResult.data as SpecialtyRow[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const profession = useMemo(
    () => catalog.find((item) => item.id === professionId) ?? null,
    [catalog, professionId],
  );
  const availableSpecialties = useMemo(
    () =>
      specialties.filter(
        (item) =>
          item.profession_id === professionId &&
          item.name.toLocaleLowerCase("pt-BR").includes(specialtySearch.toLocaleLowerCase("pt-BR")),
      ),
    [professionId, specialties, specialtySearch],
  );
  const selectedSpecialties = useMemo(
    () => specialties.filter((item) => selectedSpecialtyIds.includes(item.id)),
    [specialties, selectedSpecialtyIds],
  );

  function saveDraft() {
    sessionStorage.setItem(
      "chrismed-professional-signup",
      JSON.stringify({
        professionId,
        professionSlug: profession?.slug,
        councilNumber,
        councilRegion,
        primaryArea,
        primarySpecialtyId: selectedSpecialtyIds[0] ?? null,
        specialtyIds: selectedSpecialtyIds,
        secondaryAreas: selectedSpecialties.slice(1).map((item) => item.name),
        otherSpecialty: otherSpecialty.trim() || null,
        otherSpecialtyDetails: otherSpecialtyDetails.trim() || null,
      }),
    );
  }

  async function sendOtherSpecialtyRequest() {
    if (!otherSpecialty.trim()) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch("/api/chrismed/specialty-request", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        requestedName: otherSpecialty.trim(),
        details: otherSpecialtyDetails.trim(),
      }),
    });
    if (!response.ok) throw new Error("specialty_request_failed");
    sessionStorage.setItem("chrismed-specialty-request-sent", otherSpecialty.trim());
  }

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(authError(error.message));
    const metadata = data.user?.app_metadata ?? {};
    const isMaster =
      metadata.is_super_admin === true ||
      metadata.is_impulsionando_staff === true ||
      metadata.platform_role === "super_admin";
    if (isMaster) {
      window.location.assign(nextPath || "/chrismed/admin");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function resetPassword() {
    if (!email.trim()) return toast.error("Informe seu e-mail antes de solicitar a nova senha.");
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?mode=signin`,
    });
    setResetLoading(false);
    if (error) return toast.error(authError(error.message));
    toast.success("Enviamos as instruções de redefinição para o seu e-mail.");
  }

  async function signup(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateProfessionalRegistration({ profession, councilNumber, primaryArea });
    if (validation) return toast.error(validation);
    if (!acceptedTerms)
      return toast.error("Aceite os termos e a política de privacidade para continuar.");
    saveDraft();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${CHRISMED_ONBOARDING_PATH}`,
        data: {
          display_name: displayName.trim(),
          chrismed_professional_signup: true,
          health_profession_id: professionId,
          health_profession_slug: profession?.slug,
          council_number: councilNumber.trim() || null,
          council_region: councilRegion.trim().toUpperCase() || null,
          primary_area: primaryArea,
          primary_specialty_id: selectedSpecialtyIds[0] ?? null,
          specialty_ids: selectedSpecialtyIds,
          secondary_areas: selectedSpecialties.slice(1).map((item) => item.name),
          chrismed_terms_accepted: true,
          chrismed_terms_version: "2026-08-08",
          chrismed_privacy_version: "2026-08-08",
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(authError(error.message));
    if (data.session) {
      try {
        await sendOtherSpecialtyRequest();
      } catch {
        toast.warning(
          "Sua conta foi criada, mas a solicitação de especialidade será reenviada ao abrir o assistente.",
        );
      }
      navigate({ to: CHRISMED_ONBOARDING_PATH });
      return;
    }
    toast.success("Conta criada. Confirme seu e-mail para configurar sua agenda.");
  }

  async function google() {
    if (mode === "signup") {
      const validation = validateProfessionalRegistration({
        profession,
        councilNumber,
        primaryArea,
      });
      if (validation) return toast.error(validation);
      saveDraft();
    }
    setLoading(true);
    const redirect = mode === "signup" ? CHRISMED_ONBOARDING_PATH : "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}${redirect}`,
  },
});
if (error) {
  setLoading(false);
  toast.error("Não foi possível continuar com o Google.");
}
  }

  function advance() {
    if (step === 0 && !profession) return toast.error("Selecione sua profissão.");
    if (step === 1) {
      const validation = validateProfessionalRegistration({
        profession,
        councilNumber,
        primaryArea,
      });
      if (validation) return toast.error(validation);
    }
    setStep((current) => Math.min(current + 1, 2));
  }

  return (
    <main className="min-h-screen bg-[#f3f1ed] lg:grid lg:grid-cols-[1.04fr_0.96fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#071c18] lg:flex lg:flex-col">
        <img
          src="/brand/chrismed/dra-christiane-alencar.png"
          alt="Dra. Christiane Alencar, diretora técnica da CHRISMED"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071c18]/96 via-[#071c18]/72 to-[#071c18]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071c18] via-transparent to-[#071c18]/45" />
        <div className="relative z-10 flex items-center justify-between p-10 xl:p-12">
          <img
            src="/brand/chrismed/logo-horizontal.webp"
            alt="CHRISMED"
            className="h-16 w-auto brightness-0 invert xl:h-20"
          />
          <a
            href="/chrismed"
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur transition hover:border-[#e4b54a] hover:bg-[#e4b54a] hover:text-[#071c18]"
          >
            Voltar ao site
          </a>
        </div>
        <div className="relative z-10 mt-auto max-w-2xl p-10 pb-12 xl:p-12 xl:pb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e4b54a]/45 bg-[#071c18]/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6e8be] backdrop-blur">
            <ShieldCheck className="h-4 w-4" /> Ambiente seguro CHRISMED
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl 2xl:text-6xl">
            <span className="text-[#e4b54a]">A saúde conecta.</span>
            <br />A CHRISMED organiza.
            <br />
            Você transforma vidas.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/78">
            Uma plataforma completa para profissionais da saúde gerenciarem agendas, atendimentos e
            pacientes com segurança e praticidade.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {[
              [CalendarDays, "Agenda inteligente", "Disponibilidade, pausas e múltiplos locais."],
              [
                Users,
                "Mais pacientes, mais cuidado",
                "Uma jornada integrada do cadastro ao atendimento.",
              ],
              [Video, "Teleconsulta integrada", "Atendimento presencial, remoto ou híbrido."],
              [
                ShieldCheck,
                "Segurança e privacidade",
                "Dados protegidos e práticas alinhadas à LGPD.",
              ],
            ].map(([Icon, title, description]) => (
              <div
                key={String(title)}
                className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/[0.07] p-3 backdrop-blur-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e4b54a] text-[#071c18]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-white">{String(title)}</strong>
                  <span className="text-xs leading-snug text-white/60">{String(description)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#fdfcfb] px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#e7edeb] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-[#f6e8be]/50 blur-3xl" />
        <div className="flex items-center justify-between lg:justify-end">
          <img
            src="/brand/chrismed/logo-horizontal.webp"
            alt="CHRISMED"
            className="h-12 w-auto object-contain lg:hidden"
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("chrismed:oliver:open"))}
            className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#d9d3cb] bg-white/80 px-4 py-2 text-sm font-medium text-[#0b2a24] shadow-sm transition hover:border-[#e4b54a] hover:bg-[#f6e8be]/45"
          >
            <HelpCircle className="h-4 w-4" />
            Impulsionito a postos · pedir ajuda
          </button>
        </div>

        <div className="relative z-10 mx-auto my-auto w-full max-w-xl rounded-3xl border border-[#d9d3cb]/80 bg-white/85 p-6 shadow-[0_24px_70px_rgba(7,28,24,0.10)] backdrop-blur sm:p-9">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b8892b]">
            <LockKeyhole className="h-4 w-4" /> Área protegida
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0b2a24]">
            {mode === "login" ? "Acesse sua conta" : "Área dos Profissionais da Saúde"}
          </h2>
          <p className="mt-2 text-[#52605c]">
            {mode === "login"
              ? "Use seu e-mail para continuar."
              : "Você é um profissional da saúde? Crie sua conta para acessar sua área exclusiva e configurar sua agenda de atendimento."}
          </p>
          <p className="mt-3 rounded-xl border border-[#d9d3cb] bg-[#f7f5f1] px-4 py-3 text-xs leading-relaxed text-[#52605c]"><strong>Orientação em todas as etapas:</strong> se algum dado estiver incorreto ou o acesso não for permitido, o sistema explicará em português o que aconteceu e como corrigir. O Impulsionito, por meio do Oliver, permanece disponível nesta tela.</p>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as AuthMode);
              setStep(0);
            }}
            className="mt-7"
          >
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-[#e7edeb] p-1">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full"
                onClick={google}
                disabled={loading}
              >
                Continuar com Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cm-email">E-mail</Label>
                  <Input
                    id="cm-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="cm-password">Senha</Label>
                    <button
                      type="button"
                      onClick={resetPassword}
                      disabled={resetLoading}
                      className="text-xs text-[#087f7b] underline-offset-4 hover:underline disabled:opacity-60"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <Input
                    id="cm-password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-[#0b2a24] font-semibold text-white shadow-lg shadow-[#0b2a24]/15 transition hover:-translate-y-0.5 hover:bg-[#12403a]"
                >
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <div className="mb-6 flex items-center gap-2" aria-label={`Etapa ${step + 1} de 3`}>
                {[0, 1, 2].map((item) => (
                  <span
                    key={item}
                    className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-[#078f8b]" : "bg-[#dce7e7]"}`}
                  />
                ))}
              </div>

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#203037]">Qual é a sua profissão?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A escolha personaliza conselho, especialidades e agenda.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Profissão *</Label>
                    <ProfessionalCombobox
                      options={catalog.map((item) => ({
                        value: item.id,
                        label: item.name,
                        description: item.councilAcronym ?? "Sem conselho obrigatório",
                      }))}
                      value={professionId}
                      onChange={(value) => {
                        setProfessionId(value);
                        setCouncilNumber("");
                        setPrimaryArea("");
                        setSelectedSpecialtyIds([]);
                        setOtherSpecialty("");
                      }}
                      placeholder="Pesquise sua profissão"
                      searchPlaceholder="Digite o nome da profissão…"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#203037]">
                      Identificação e área de atuação
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Essas informações formarão seu perfil profissional.
                    </p>
                  </div>
                  {profession?.councilAcronym && (
                    <div className="grid grid-cols-[1fr_110px] gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="cm-council">
                          Registro {profession.councilAcronym}
                          {profession.councilRequired ? " *" : ""}
                        </Label>
                        <Input
                          id="cm-council"
                          value={councilNumber}
                          onChange={(event) => setCouncilNumber(event.target.value)}
                          placeholder="Número do registro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cm-region">UF</Label>
                        <Input
                          id="cm-region"
                          maxLength={2}
                          value={councilRegion}
                          onChange={(event) => setCouncilRegion(event.target.value.toUpperCase())}
                          placeholder="RJ"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="cm-specialty-search">
                      Especialidades e subespecialidades *
                    </Label>
                    <Input
                      id="cm-specialty-search"
                      value={specialtySearch}
                      onChange={(event) => setSpecialtySearch(event.target.value)}
                      placeholder="Pesquisar na lista…"
                    />
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
                      {availableSpecialties.map((item) => {
                        const active = selectedSpecialtyIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? selectedSpecialtyIds.filter((id) => id !== item.id)
                                : [...selectedSpecialtyIds, item.id];
                              setSelectedSpecialtyIds(next);
                              const primary = specialties.find(
                                (specialty) => specialty.id === next[0],
                              );
                              setPrimaryArea(
                                primary?.name ??
                                  (otherSpecialty.trim() ? otherSpecialty.trim() : ""),
                              );
                            }}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${active ? "bg-[#dff3f1] text-[#067b78]" : "hover:bg-muted"}`}
                          >
                            <span
                              className={`grid h-4 w-4 place-items-center rounded border ${active ? "border-[#078f8b] bg-[#078f8b] text-white" : ""}`}
                            >
                              {active && <CheckCircle2 className="h-3 w-3" />}
                            </span>
                            {item.name}
                          </button>
                        );
                      })}
                      {!availableSpecialties.length && (
                        <p className="p-2 text-sm text-muted-foreground">
                          Nenhuma opção encontrada. Use “Outro” abaixo.
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Você pode selecionar duas ou mais opções. A primeira será considerada sua área
                      principal.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-dashed border-[#078f8b]/40 bg-[#f4fbfa] p-4">
                    <Label htmlFor="cm-other">
                      Outro — habilidade ou experiência ainda não listada
                    </Label>
                    <Input
                      id="cm-other"
                      value={otherSpecialty}
                      onChange={(event) => {
                        setOtherSpecialty(event.target.value);
                        if (!selectedSpecialtyIds.length) setPrimaryArea(event.target.value);
                      }}
                      placeholder="Digite a especialidade ou subespecialidade"
                    />
                    {otherSpecialty && (
                      <>
                        <Label htmlFor="cm-other-details">Detalhamento para avaliação</Label>
                        <Input
                          id="cm-other-details"
                          value={otherSpecialtyDetails}
                          onChange={(event) => setOtherSpecialtyDetails(event.target.value)}
                          placeholder="Experiência, formação ou contexto"
                        />
                        <p className="text-xs font-medium text-[#087f7b]">
                          Sua solicitação será avaliada pela gestão CHRISMED. Você receberá o
                          resultado automaticamente por e-mail.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <form id="chrismed-signup" onSubmit={signup} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#203037]">Crie seu acesso</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Depois, abriremos o assistente de configuração da agenda.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cm-name">Nome completo *</Label>
                    <Input
                      id="cm-name"
                      required
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cm-signup-email">E-mail *</Label>
                    <Input
                      id="cm-signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cm-signup-password">Senha *</Label>
                    <Input
                      id="cm-signup-password"
                      type="password"
                      minLength={12}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <p className="text-xs text-[#59656b]">Use ao menos 12 caracteres.</p>
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border border-[#d8e6e5] p-3 text-sm text-[#425158]">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#087f7b]"
                      required
                    />
                    <span>
                      Li e aceito os{" "}
                      <a
                        className="font-semibold text-[#087f7b] underline"
                        href="/chrismed/termos"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Termos CHRISMED
                      </a>{" "}
                      e a{" "}
                      <a
                        className="font-semibold text-[#087f7b] underline"
                        href="/chrismed/privacidade"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Política de Privacidade
                      </a>
                      .
                    </span>
                  </label>
                </form>
              )}

              <div className="mt-6 flex gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((current) => current - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Voltar
                  </Button>
                )}
                {step < 2 ? (
                  <Button
                    type="button"
                    className="ml-auto bg-[#078f8b] hover:bg-[#067b78]"
                    onClick={advance}
                  >
                    Continuar
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    form="chrismed-signup"
                    type="submit"
                    disabled={loading}
                    className="ml-auto bg-[#078f8b] hover:bg-[#067b78]"
                  >
                    {loading ? "Criando…" : "Criar conta"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-7 flex items-start gap-3 rounded-xl bg-[#eff8f8] p-4 text-sm">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#078f8b]" />
            <span>
              <strong className="block text-[#203037]">Ambiente seguro e confiável</strong>
              <span className="text-[#5b696f]">
                Seus dados são protegidos com criptografia e controles de acesso.
              </span>
            </span>
          </div>
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          © 2020 - 2026 | CHRISMED Saúde Integrada ·{" "}
          <a href="/chrismed/privacidade" className="text-[#087f7b]">
            Política de Privacidade
          </a>{" "}
          · LGPD
        </footer>
      </section>
    </main>
  );
}
