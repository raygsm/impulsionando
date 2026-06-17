import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  PlayCircle,
  Award,
  BookOpen,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Trophy,
  Video,
  FileText,
  Headphones,
} from "lucide-react";

export const Route = createFileRoute("/showroom/academia")({
  head: () => ({
    meta: [
      {
        title: "Academia Impulsionando — Treinamentos e certificações oficiais",
      },
      {
        name: "description",
        content:
          "Trilhas de aprendizado, certificações por nicho e laboratórios práticos para times de operação, marketing, financeiro e desenvolvedores parceiros.",
      },
      {
        property: "og:title",
        content: "Academia Impulsionando — Aprenda, certifique e cresça",
      },
      {
        property: "og:description",
        content:
          "Mais de 80 cursos, 12 certificações oficiais e laboratórios hands-on para dominar a plataforma.",
      },
    ],
  }),
  component: Academia,
});

type Level = "Iniciante" | "Intermediário" | "Avançado";

interface Course {
  id: string;
  title: string;
  track: string;
  level: Level;
  duration: string;
  lessons: number;
  rating: number;
  enrolled: number;
  format: "Vídeo" | "Hands-on" | "Live" | "Podcast";
  cert?: boolean;
}

const TRACKS = [
  "Todas",
  "Operação",
  "Vendas & CRM",
  "Financeiro",
  "Marketing & IA",
  "Desenvolvedores",
  "Liderança",
];

const COURSES: Course[] = [
  {
    id: "c1",
    title: "Fundamentos da Impulsionando em 90 minutos",
    track: "Operação",
    level: "Iniciante",
    duration: "1h30",
    lessons: 12,
    rating: 4.9,
    enrolled: 12480,
    format: "Vídeo",
  },
  {
    id: "c2",
    title: "Agenda profissional: regras, bloqueios e overbooking",
    track: "Operação",
    level: "Intermediário",
    duration: "2h10",
    lessons: 18,
    rating: 4.8,
    enrolled: 6320,
    format: "Hands-on",
  },
  {
    id: "c3",
    title: "CRM 360°: do lead frio ao cliente recorrente",
    track: "Vendas & CRM",
    level: "Intermediário",
    duration: "3h40",
    lessons: 24,
    rating: 4.9,
    enrolled: 8120,
    format: "Vídeo",
    cert: true,
  },
  {
    id: "c4",
    title: "Automações no-code: 30 receitas prontas",
    track: "Marketing & IA",
    level: "Intermediário",
    duration: "2h45",
    lessons: 20,
    rating: 4.9,
    enrolled: 9540,
    format: "Hands-on",
    cert: true,
  },
  {
    id: "c5",
    title: "Copilot IA aplicado: prompts que vendem",
    track: "Marketing & IA",
    level: "Avançado",
    duration: "4h",
    lessons: 22,
    rating: 4.95,
    enrolled: 4210,
    format: "Live",
    cert: true,
  },
  {
    id: "c6",
    title: "DRE, fluxo de caixa e conciliação bancária",
    track: "Financeiro",
    level: "Intermediário",
    duration: "3h",
    lessons: 16,
    rating: 4.7,
    enrolled: 3980,
    format: "Vídeo",
  },
  {
    id: "c7",
    title: "API REST + Webhooks: integrando sistemas legados",
    track: "Desenvolvedores",
    level: "Avançado",
    duration: "5h",
    lessons: 28,
    rating: 4.9,
    enrolled: 1820,
    format: "Hands-on",
    cert: true,
  },
  {
    id: "c8",
    title: "Construindo apps no Marketplace",
    track: "Desenvolvedores",
    level: "Avançado",
    duration: "6h",
    lessons: 32,
    rating: 4.85,
    enrolled: 940,
    format: "Hands-on",
    cert: true,
  },
  {
    id: "c9",
    title: "Liderando operações multi-unidades",
    track: "Liderança",
    level: "Avançado",
    duration: "4h30",
    lessons: 18,
    rating: 4.9,
    enrolled: 1240,
    format: "Live",
    cert: true,
  },
  {
    id: "c10",
    title: "WhatsApp oficial: do template à conversão",
    track: "Marketing & IA",
    level: "Iniciante",
    duration: "1h50",
    lessons: 14,
    rating: 4.8,
    enrolled: 7610,
    format: "Vídeo",
  },
  {
    id: "c11",
    title: "Podcast: bastidores de quem cresceu 3x em 1 ano",
    track: "Liderança",
    level: "Iniciante",
    duration: "12 ep",
    lessons: 12,
    rating: 4.95,
    enrolled: 18230,
    format: "Podcast",
  },
  {
    id: "c12",
    title: "Anti no-show: playbook para clínicas e estética",
    track: "Operação",
    level: "Intermediário",
    duration: "2h",
    lessons: 16,
    rating: 4.9,
    enrolled: 5410,
    format: "Hands-on",
  },
];

const CERTIFICATIONS = [
  {
    id: "spec-ops",
    name: "Specialist em Operações",
    track: "Operação",
    hours: 18,
    exam: "60 questões + projeto",
    perks: ["Selo no LinkedIn", "Badge oficial", "Listagem no diretório"],
    color: "from-blue-500/15 to-blue-500/0",
  },
  {
    id: "spec-crm",
    name: "Specialist em CRM & Vendas",
    track: "Vendas & CRM",
    hours: 22,
    exam: "70 questões + estudo de caso",
    perks: ["Selo no LinkedIn", "Acesso ao grupo de Reps", "Mentorias mensais"],
    color: "from-emerald-500/15 to-emerald-500/0",
  },
  {
    id: "spec-ai",
    name: "Specialist em Automação & IA",
    track: "Marketing & IA",
    hours: 26,
    exam: "Projeto final avaliado",
    perks: ["Selo destaque", "Convite p/ beta de IA", "Co-marketing"],
    color: "from-purple-500/15 to-purple-500/0",
  },
  {
    id: "dev-partner",
    name: "Developer Partner Certificado",
    track: "Desenvolvedores",
    hours: 40,
    exam: "App publicado no Marketplace",
    perks: [
      "Revenue share 70/30",
      "Sandbox dedicado",
      "Selo Verified Developer",
    ],
    color: "from-amber-500/15 to-amber-500/0",
  },
];

const LEARNING_PATHS = [
  {
    name: "Onboard em 7 dias",
    audience: "Novos times operacionais",
    progress: 100,
    hours: 6,
    modules: 8,
    status: "Disponível",
  },
  {
    name: "Trilha do gestor de unidade",
    audience: "Gerentes de loja, clínica ou studio",
    progress: 78,
    hours: 14,
    modules: 12,
    status: "Em alta",
  },
  {
    name: "Trilha do marketing de retenção",
    audience: "CRM, growth e ops de marketing",
    progress: 64,
    hours: 18,
    modules: 16,
    status: "Disponível",
  },
  {
    name: "Trilha do desenvolvedor parceiro",
    audience: "Devs construindo apps no marketplace",
    progress: 42,
    hours: 40,
    modules: 22,
    status: "Beta",
  },
];

const FORMAT_ICONS = {
  Vídeo: Video,
  "Hands-on": BookOpen,
  Live: Users,
  Podcast: Headphones,
} as const;

const LEVEL_COLORS: Record<Level, string> = {
  Iniciante: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Intermediário: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Avançado: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

function Academia() {
  const [track, setTrack] = useState<string>("Todas");
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      track === "Todas" ? COURSES : COURSES.filter((c) => c.track === track),
    [track],
  );

  const toggleEnroll = (id: string) => {
    setEnrolled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" /> Academia oficial
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Domine a plataforma. Certifique seu time. Cresça mais rápido.
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Trilhas guiadas, mais de 80 cursos, certificações oficiais e
              laboratórios práticos para operação, marketing, financeiro e devs
              parceiros — gratuito para clientes ativos.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/showroom/onboarding">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Começar pelo Onboard 7 dias
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/marketplace-apps">
                  Trilha para devs parceiros
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Alunos ativos", value: "42.180" },
                { label: "Cursos publicados", value: "84" },
                { label: "Certificações", value: "12" },
                { label: "Avaliação média", value: "4.88 ★" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Learning paths */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Trilhas guiadas</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Sequência otimizada de cursos com checkpoints, exercícios e mentor
            atribuído.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {LEARNING_PATHS.map((p) => (
              <Card key={p.name} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.audience}
                    </div>
                  </div>
                  <Badge variant={p.status === "Beta" ? "outline" : "secondary"}>
                    {p.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {p.hours}h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {p.modules} módulos
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progresso médio da turma
                    </span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} />
                </div>
                <Button className="mt-4 w-full" variant="outline">
                  Acessar trilha
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Catálogo de cursos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} cursos disponíveis em {TRACKS.length - 1}{" "}
                trilhas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={t === track ? "default" : "outline"}
                  onClick={() => setTrack(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const Icon = FORMAT_ICONS[c.format];
              const isEnrolled = enrolled.has(c.id);
              return (
                <Card key={c.id} className="flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {c.track}
                    </Badge>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_COLORS[c.level]}`}
                    >
                      {c.level}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">
                    {c.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5" /> {c.format}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {c.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {c.lessons} aulas
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      ★ {c.rating} · {c.enrolled.toLocaleString("pt-BR")} alunos
                    </span>
                    {c.cert && (
                      <Badge className="gap-1">
                        <Award className="h-3 w-3" /> Certifica
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="mt-4"
                    variant={isEnrolled ? "secondary" : "default"}
                    onClick={() => toggleEnroll(c.id)}
                  >
                    {isEnrolled ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Matriculado
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" /> Matricular-se
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Certificações oficiais</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Validadas com selo verificável, listagem em diretório público e
            badge para LinkedIn.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {CERTIFICATIONS.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <div
                  className={`bg-gradient-to-br ${c.color} p-5 border-b`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {c.track}
                      </Badge>
                      <div className="mt-2 text-xl font-semibold">
                        {c.name}
                      </div>
                    </div>
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Carga horária
                      </div>
                      <div className="font-medium">{c.hours}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Avaliação
                      </div>
                      <div className="font-medium">{c.exam}</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {c.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-5 w-full" variant="outline">
                    <Lock className="mr-2 h-4 w-4" /> Iniciar certificação
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">
            Treinamento corporativo para seu time
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/85">
            Planos in-company com trilhas customizadas, mentor dedicado e
            relatórios de progresso. Ideal para redes, franquias e grupos com
            mais de 20 colaboradores.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/showroom/precificacao">Ver planos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/showroom">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
