import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/showroom/agenda")({
  head: () => ({
    meta: [
      { title: "Showroom Agenda — Calendário por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Agenda multi-profissional com horários, bloqueios, lista de espera e lembretes automáticos para clínicas, serviços, fitness e mais.",
      },
      { property: "og:title", content: "Agenda — Impulsionando" },
      {
        property: "og:description",
        content: "Calendário cheio com profissionais e SLA por nicho.",
      },
    ],
  }),
  component: ShowroomAgenda,
});

type NicheSlug = "clinicas" | "servicos" | "fitness" | "bares" | "microcervejarias";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  servicos: "Serviços (Oficinas, Estética)",
  fitness: "Fitness & Estúdios",
  bares: "Bares & Restaurantes (Reservas)",
  microcervejarias: "Microcervejarias (Visitação)",
};

type Status = "confirmed" | "pending" | "done" | "noshow";

const STATUS: Record<
  Status,
  { label: string; cls: string; dot: string }
> = {
  confirmed: { label: "confirmado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  pending: { label: "aguardando", cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  done: { label: "concluído", cls: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  noshow: { label: "no-show", cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

type Slot = {
  pro: string;
  start: number; // hour float, e.g. 9.5 = 09:30
  duration: number; // hours
  client: string;
  service: string;
  status: Status;
};

type NicheConfig = {
  pros: { id: string; name: string; role: string }[];
  slots: Slot[];
  dayLabel: string;
};

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08..18

const DATA: Record<NicheSlug, NicheConfig> = {
  clinicas: {
    dayLabel: "Quarta · 18/06",
    pros: [
      { id: "p1", name: "Dra. Helena", role: "Dermato" },
      { id: "p2", name: "Dr. Felipe", role: "Clínico" },
      { id: "p3", name: "Dra. Júlia", role: "Pediatra" },
    ],
    slots: [
      { pro: "p1", start: 8.5, duration: 0.5, client: "Marina S.", service: "Avaliação", status: "confirmed" },
      { pro: "p1", start: 9.5, duration: 1, client: "Renata L.", service: "Retorno", status: "confirmed" },
      { pro: "p1", start: 11, duration: 0.5, client: "Bloqueio", service: "Almoço", status: "pending" },
      { pro: "p1", start: 14, duration: 1, client: "Marina S.", service: "Procedimento", status: "confirmed" },
      { pro: "p1", start: 16, duration: 0.5, client: "Lucas P.", service: "Consulta", status: "pending" },
      { pro: "p2", start: 8, duration: 1, client: "José C.", service: "Check-up", status: "done" },
      { pro: "p2", start: 10, duration: 0.5, client: "Ana B.", service: "Resultado", status: "done" },
      { pro: "p2", start: 13, duration: 1.5, client: "Roberto M.", service: "Avaliação", status: "confirmed" },
      { pro: "p2", start: 15.5, duration: 0.5, client: "Carla N.", service: "Retorno", status: "noshow" },
      { pro: "p3", start: 9, duration: 0.5, client: "João P.", service: "Puericultura", status: "confirmed" },
      { pro: "p3", start: 10, duration: 1, client: "Sofia R.", service: "Consulta", status: "confirmed" },
      { pro: "p3", start: 14.5, duration: 0.5, client: "Pedro F.", service: "Vacina", status: "pending" },
      { pro: "p3", start: 16.5, duration: 1, client: "Lara T.", service: "Retorno", status: "confirmed" },
    ],
  },
  servicos: {
    dayLabel: "Quinta · 19/06",
    pros: [
      { id: "p1", name: "Box 1 — Carlos", role: "Mecânico" },
      { id: "p2", name: "Box 2 — André", role: "Mecânico" },
      { id: "p3", name: "Estética — Bia", role: "Detalhamento" },
    ],
    slots: [
      { pro: "p1", start: 8, duration: 2, client: "Pedro G.", service: "Revisão 30k", status: "done" },
      { pro: "p1", start: 10.5, duration: 1.5, client: "Aline S.", service: "Pastilhas", status: "confirmed" },
      { pro: "p1", start: 13, duration: 2, client: "HB20 prata", service: "Troca correia", status: "confirmed" },
      { pro: "p1", start: 16, duration: 1, client: "Bloqueio", service: "Diagnóstico", status: "pending" },
      { pro: "p2", start: 8.5, duration: 1, client: "Rodrigo F.", service: "Alinhamento", status: "done" },
      { pro: "p2", start: 10, duration: 2.5, client: "Civic 2019", service: "Suspensão", status: "confirmed" },
      { pro: "p2", start: 14, duration: 1.5, client: "Onix", service: "Óleo + filtros", status: "pending" },
      { pro: "p3", start: 9, duration: 2, client: "Strada", service: "Lavagem premium", status: "done" },
      { pro: "p3", start: 13, duration: 3, client: "T-Cross", service: "Polimento", status: "confirmed" },
    ],
  },
  fitness: {
    dayLabel: "Segunda · 16/06",
    pros: [
      { id: "p1", name: "Sala 1 — Funcional", role: "Aula coletiva" },
      { id: "p2", name: "Sala 2 — Pilates", role: "Aula coletiva" },
      { id: "p3", name: "Personal — Bruno", role: "1:1" },
    ],
    slots: [
      { pro: "p1", start: 8, duration: 1, client: "Turma 8h (12/15)", service: "Funcional", status: "done" },
      { pro: "p1", start: 12, duration: 1, client: "Turma 12h (14/15)", service: "HIIT", status: "confirmed" },
      { pro: "p1", start: 18, duration: 1, client: "Turma 18h (15/15)", service: "Funcional", status: "confirmed" },
      { pro: "p2", start: 9, duration: 1, client: "Turma 9h (6/8)", service: "Pilates solo", status: "done" },
      { pro: "p2", start: 11, duration: 1, client: "Turma 11h (5/8)", service: "Pilates aparelhos", status: "confirmed" },
      { pro: "p2", start: 17, duration: 1, client: "Turma 17h (8/8)", service: "Pilates solo", status: "confirmed" },
      { pro: "p3", start: 9, duration: 1, client: "Renan A.", service: "Personal", status: "done" },
      { pro: "p3", start: 14, duration: 1, client: "Mariah B.", service: "Avaliação", status: "confirmed" },
      { pro: "p3", start: 16, duration: 1, client: "Felipe N.", service: "Personal", status: "pending" },
    ],
  },
  bares: {
    dayLabel: "Sábado · 21/06",
    pros: [
      { id: "p1", name: "Salão térreo", role: "Mesas 1–14" },
      { id: "p2", name: "Rooftop", role: "Mesas 15–26" },
      { id: "p3", name: "Área privê", role: "Eventos" },
    ],
    slots: [
      { pro: "p1", start: 12, duration: 2, client: "Família Souza", service: "Almoço · 6 pax", status: "done" },
      { pro: "p1", start: 19, duration: 2, client: "Bruno T.", service: "Jantar · 4 pax", status: "confirmed" },
      { pro: "p1", start: 21.5 - 1, duration: 2, client: "Casal Rocha", service: "Aniversário", status: "confirmed" },
      { pro: "p2", start: 18, duration: 2, client: "Rafa A.", service: "Mesa 12 · 4 pax", status: "confirmed" },
      { pro: "p2", start: 20, duration: 2, client: "Time Acme", service: "Confra · 12 pax", status: "pending" },
      { pro: "p3", start: 19, duration: 3, client: "Boda Mendes", service: "Privê · 30 pax", status: "confirmed" },
    ],
  },
  microcervejarias: {
    dayLabel: "Sábado · 21/06",
    pros: [
      { id: "p1", name: "Tour guiado", role: "Visitação" },
      { id: "p2", name: "Degustação", role: "Experiência" },
      { id: "p3", name: "Retirada Clube", role: "Loja" },
    ],
    slots: [
      { pro: "p1", start: 11, duration: 1, client: "Grupo 11h (12/15)", service: "Tour completo", status: "confirmed" },
      { pro: "p1", start: 14, duration: 1, client: "Grupo 14h (15/15)", service: "Tour completo", status: "confirmed" },
      { pro: "p1", start: 16, duration: 1, client: "Grupo 16h (9/15)", service: "Tour completo", status: "pending" },
      { pro: "p2", start: 13, duration: 2, client: "Aniv. João V.", service: "Degust. 5 rótulos", status: "confirmed" },
      { pro: "p2", start: 17, duration: 2, client: "Casal Lima", service: "Harmonização", status: "pending" },
      { pro: "p3", start: 12, duration: 6, client: "Sócios Clube", service: "Retirada kit junho", status: "done" },
    ],
  },
};

function ShowroomAgenda() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const cfg = DATA[nicho];

  const stats = useMemo(() => {
    const total = cfg.slots.length;
    const conf = cfg.slots.filter((s) => s.status === "confirmed").length;
    const pend = cfg.slots.filter((s) => s.status === "pending").length;
    const ns = cfg.slots.filter((s) => s.status === "noshow").length;
    const ocupBlocks = cfg.slots.reduce((a, s) => a + s.duration, 0);
    const capacity = cfg.pros.length * (HOURS.length);
    const ocup = Math.round((ocupBlocks / capacity) * 100);
    return { total, conf, pend, ns, ocup };
  }, [cfg]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <CalendarDays className="h-3 w-3" /> Showroom Agenda
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Agenda cheia, sem stress de planilha
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Calendário multi-profissional com bloqueios, lista de espera, lembretes automáticos e
              recuperação de no-show — pronto por nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Calendário do dia</h2>
            <p className="mt-1 text-muted-foreground">{cfg.dayLabel}</p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {NICHO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Atendimentos
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" /> Confirmados
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.conf}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" /> Pendentes / no-show
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {stats.pend} <span className="text-base text-rose-600">· {stats.ns}</span>
            </p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Ocupação
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{stats.ocup}%</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[820px]"
              style={{ gridTemplateColumns: `64px repeat(${cfg.pros.length}, minmax(220px, 1fr))` }}
            >
              {/* Header */}
              <div className="border-b border-r bg-muted/40 px-2 py-3 text-xs font-semibold text-muted-foreground">
                Hora
              </div>
              {cfg.pros.map((p) => (
                <div key={p.id} className="border-b bg-muted/40 px-3 py-3">
                  <p className="text-sm font-semibold leading-tight">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              ))}

              {/* Rows: one row per hour */}
              {HOURS.map((h, hi) => (
                <div key={h} className="contents">
                  <div
                    className={`border-r px-2 py-1 text-right text-[11px] text-muted-foreground ${
                      hi < HOURS.length - 1 ? "border-b" : ""
                    }`}
                    style={{ height: 64 }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                  {cfg.pros.map((p) => (
                    <div
                      key={p.id + h}
                      className={`relative ${hi < HOURS.length - 1 ? "border-b" : ""} ${
                        p.id !== cfg.pros[cfg.pros.length - 1].id ? "border-r" : ""
                      }`}
                      style={{ height: 64 }}
                    />
                  ))}
                </div>
              ))}

              {/* Absolute overlay grid for slots */}
              <div
                className="pointer-events-none col-span-full -mt-[704px] grid"
                style={{ gridTemplateColumns: `64px repeat(${cfg.pros.length}, minmax(220px, 1fr))` }}
              >
                <div />
                {cfg.pros.map((p) => {
                  const proSlots = cfg.slots.filter((s) => s.pro === p.id);
                  return (
                    <div key={p.id + "-overlay"} className="relative">
                      {proSlots.map((s, i) => {
                        const top = (s.start - HOURS[0]) * 64;
                        const height = s.duration * 64 - 4;
                        const st = STATUS[s.status];
                        return (
                          <div
                            key={i}
                            className={`pointer-events-auto absolute left-1.5 right-1.5 rounded-md border p-2 text-[11px] shadow-sm ${st.cls}`}
                            style={{ top: top + 2, height }}
                          >
                            <div className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              <span className="font-semibold truncate">{s.client}</span>
                            </div>
                            <div className="truncate opacity-80">{s.service}</div>
                            <div className="mt-0.5 text-[10px] opacity-70">
                              {fmt(s.start)} – {fmt(s.start + s.duration)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t bg-muted/30 px-4 py-3 text-xs">
            {(Object.keys(STATUS) as Status[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${STATUS[k].dot}`} />
                {STATUS[k].label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Lembretes WhatsApp + Google Agenda sincronizados
            </span>
          </div>
        </Card>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Pronto para encher a agenda?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Configuramos profissionais, serviços, horários e lembretes em poucos cliques — com
            integração nativa com WhatsApp, Google Agenda e pagamentos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/whatsapp">Ver lembretes WhatsApp</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function fmt(h: number) {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
