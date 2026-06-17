import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  Stethoscope,
  Users,
  Wallet,
  Clock,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/showroom/clinicas")({
  head: () => ({
    meta: [
      {
        title:
          "Showroom Clínicas — Agenda, pagamento e WhatsApp | Impulsionando Tecnologia",
      },
      {
        name: "description",
        content:
          "Demonstração navegável da plataforma para clínicas médicas, consultórios e centros de especialidades. Agenda, pagamento antecipado, WhatsApp e CRM em um lugar.",
      },
      { property: "og:title", content: "Showroom Clínicas — Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo completa para clínicas: agenda inteligente, pagamento online, lembretes e dashboard.",
      },
    ],
  }),
  component: ShowroomClinicas,
});

type Consulta = {
  id: string;
  paciente: string;
  medico: string;
  especialidade: string;
  horario: string;
  status: "confirmada" | "aguardando" | "no-show";
  valor: number;
  pago: boolean;
};

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
  ultimaConsulta: string;
  retornoEm?: string;
  tag: "ativo" | "retorno" | "novo";
};

const CONSULTAS_SEED: Consulta[] = [
  { id: "c1", paciente: "Ana Souza", medico: "Dra. Marta Lima", especialidade: "Cardiologia", horario: "08:00", status: "confirmada", valor: 350, pago: true },
  { id: "c2", paciente: "Bruno Reis", medico: "Dr. Felipe Castro", especialidade: "Ortopedia", horario: "08:30", status: "confirmada", valor: 280, pago: true },
  { id: "c3", paciente: "Carla Mendes", medico: "Dra. Marta Lima", especialidade: "Cardiologia", horario: "09:00", status: "aguardando", valor: 350, pago: false },
  { id: "c4", paciente: "Daniel Prado", medico: "Dra. Júlia Tavares", especialidade: "Dermatologia", horario: "09:30", status: "confirmada", valor: 300, pago: true },
  { id: "c5", paciente: "Elisa Faria", medico: "Dr. Felipe Castro", especialidade: "Ortopedia", horario: "10:00", status: "no-show", valor: 280, pago: false },
  { id: "c6", paciente: "Fábio Lopes", medico: "Dra. Júlia Tavares", especialidade: "Dermatologia", horario: "10:30", status: "confirmada", valor: 300, pago: true },
];

const PACIENTES_SEED: Paciente[] = [
  { id: "p1", nome: "Ana Souza", telefone: "(21) 9****-1101", ultimaConsulta: "hoje", retornoEm: "30 dias", tag: "ativo" },
  { id: "p2", nome: "Bruno Reis", telefone: "(21) 9****-2202", ultimaConsulta: "hoje", retornoEm: "15 dias", tag: "ativo" },
  { id: "p3", nome: "Carla Mendes", telefone: "(21) 9****-3303", ultimaConsulta: "há 60 dias", retornoEm: "vencido", tag: "retorno" },
  { id: "p4", nome: "Daniel Prado", telefone: "(21) 9****-4404", ultimaConsulta: "primeira vez", tag: "novo" },
  { id: "p5", nome: "Elisa Faria", telefone: "(21) 9****-5505", ultimaConsulta: "há 7 dias", tag: "ativo" },
];

function ShowroomClinicas() {
  const [consultas, setConsultas] = useState(CONSULTAS_SEED);
  const [tab, setTab] = useState("dashboard");

  // Form de novo agendamento
  const [nome, setNome] = useState("");
  const [medico, setMedico] = useState("Dra. Marta Lima");
  const [horario, setHorario] = useState("11:00");
  const [pagar, setPagar] = useState("sim");

  const kpis = useMemo(() => {
    const total = consultas.length;
    const confirmadas = consultas.filter((c) => c.status === "confirmada").length;
    const noShow = consultas.filter((c) => c.status === "no-show").length;
    const receita = consultas
      .filter((c) => c.pago)
      .reduce((s, c) => s + c.valor, 0);
    const taxa = total === 0 ? 0 : Math.round((confirmadas / total) * 100);
    return { total, confirmadas, noShow, receita, taxa };
  }, [consultas]);

  const agendar = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    const nova: Consulta = {
      id: "c" + (consultas.length + 1),
      paciente: nome.trim(),
      medico,
      especialidade:
        medico === "Dra. Marta Lima"
          ? "Cardiologia"
          : medico === "Dr. Felipe Castro"
          ? "Ortopedia"
          : "Dermatologia",
      horario,
      status: "confirmada",
      valor: 300,
      pago: pagar === "sim",
    };
    setConsultas((c) => [...c, nova]);
    setNome("");
    toast.success(
      pagar === "sim"
        ? "Consulta agendada e paga — lembrete por WhatsApp enviado"
        : "Consulta agendada — link de pagamento enviado por WhatsApp",
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1">
                <Stethoscope className="h-3 w-3" /> Showroom Clínicas Médicas
              </Badge>
              <h1 className="text-balance text-3xl font-bold md:text-4xl">
                Clínica Vita — operação de hoje
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Demo navegável com dados realistas. Agende, confirme, receba e veja o
                impacto nos indicadores em tempo real.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/showroom">← Todos os showrooms</Link>
              </Button>
              <Button asChild>
                <Link to="/contato">Quero para minha clínica</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="agenda">Agenda do dia</TabsTrigger>
            <TabsTrigger value="agendar">Novo agendamento</TabsTrigger>
            <TabsTrigger value="crm">Pacientes (CRM)</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Kpi
                icon={CalendarCheck}
                label="Consultas hoje"
                value={kpis.total.toString()}
                hint={`${kpis.confirmadas} confirmadas`}
              />
              <Kpi
                icon={TrendingUp}
                label="Taxa de confirmação"
                value={`${kpis.taxa}%`}
                hint="Meta interna 85%"
              />
              <Kpi
                icon={Wallet}
                label="Receita do dia"
                value={`R$ ${kpis.receita.toLocaleString("pt-BR")}`}
                hint="Pagamentos antecipados"
              />
              <Kpi
                icon={AlertTriangle}
                label="No-show"
                value={kpis.noShow.toString()}
                hint="Reativação automática"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Especialidades de hoje</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {["Cardiologia", "Ortopedia", "Dermatologia"].map((esp) => {
                    const count = consultas.filter(
                      (c) => c.especialidade === esp,
                    ).length;
                    return (
                      <li
                        key={esp}
                        className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                      >
                        <span>{esp}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Automação WhatsApp ativa</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Lembrete 24h
                    antes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Confirmação
                    com 1 clique
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cobrança de
                    pagamento pendente
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reativação
                    de pacientes em atraso
                  </li>
                </ul>
              </Card>
            </div>
          </TabsContent>

          {/* AGENDA */}
          <TabsContent value="agenda" className="mt-6">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-5 py-3">
                <h3 className="font-semibold">Consultas de hoje</h3>
              </div>
              <div className="divide-y">
                {consultas.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                  >
                    <div className="flex w-16 items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {c.horario}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{c.paciente}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.medico} · {c.especialidade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        R$ {c.valor.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.pago ? "Pago" : "Pendente"}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* AGENDAR */}
          <TabsContent value="agendar" className="mt-6">
            <Card className="mx-auto max-w-xl p-6">
              <h3 className="mb-1 font-semibold">Novo agendamento</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Em produção, o paciente faz isso sozinho pelo link público da clínica.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome do paciente</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Fernanda Lima"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Médico</Label>
                    <Select value={medico} onValueChange={setMedico}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dra. Marta Lima">
                          Dra. Marta Lima — Cardiologia
                        </SelectItem>
                        <SelectItem value="Dr. Felipe Castro">
                          Dr. Felipe Castro — Ortopedia
                        </SelectItem>
                        <SelectItem value="Dra. Júlia Tavares">
                          Dra. Júlia Tavares — Dermatologia
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horário</Label>
                    <Select value={horario} onValueChange={setHorario}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["11:00", "11:30", "14:00", "14:30", "15:00", "15:30"].map(
                          (h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Pagamento antecipado?</Label>
                  <Select value={pagar} onValueChange={setPagar}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim — pagar agora</SelectItem>
                      <SelectItem value="nao">Não — enviar link depois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={agendar} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" /> Confirmar agendamento
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* CRM */}
          <TabsContent value="crm" className="mt-6">
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-5 py-3">
                <h3 className="font-semibold">Pacientes</h3>
              </div>
              <div className="divide-y">
                {PACIENTES_SEED.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">{p.telefone}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Última: {p.ultimaConsulta}</div>
                      {p.retornoEm && <div>Retorno: {p.retornoEm}</div>}
                    </div>
                    <TagBadge tag={p.tag} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <PublicFooter />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-bold leading-none">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Consulta["status"] }) {
  if (status === "confirmada")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
        <UserCheck className="mr-1 h-3 w-3" /> Confirmada
      </Badge>
    );
  if (status === "aguardando")
    return (
      <Badge variant="outline" className="text-amber-600 dark:text-amber-300">
        Aguardando
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-destructive">
      No-show
    </Badge>
  );
}

function TagBadge({ tag }: { tag: Paciente["tag"] }) {
  if (tag === "ativo") return <Badge variant="secondary">Ativo</Badge>;
  if (tag === "retorno") return <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">Retorno</Badge>;
  return <Badge>Novo</Badge>;
}
