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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, Calendar, CheckCircle2, CreditCard, Dumbbell, LineChart, MapPin,
  MessageCircle, Users, Wallet, Clock, TrendingUp, AlertTriangle, PlayCircle,
  GraduationCap, ClipboardList, UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/showroom/fitness")({
  head: () => ({
    meta: [
      { title: "Showroom Fitness — Academias, CrossFit e Personal | Impulsionando Tecnologia" },
      { name: "description", content: "Veja o ecossistema Impulsionando funcionando para academias, boxes de CrossFit, estúdios funcionais e personal trainers. Demo navegável sem cadastro." },
      { property: "og:title", content: "Showroom Fitness — Impulsionando Tecnologia" },
      { property: "og:description", content: "Demo navegável da plataforma para academias, CrossFit, funcional e personal." },
    ],
  }),
  component: ShowroomFitness,
});

// ----- Dados mock em memória (não persistem além da aba) -----
type Aula = {
  id: string; nome: string; professor: string; horario: string;
  vagas: number; ocupadas: number; modalidade: string; sala: string;
};
type Aluno = {
  id: string; nome: string; plano: string; status: "ativo" | "atrasado" | "trial";
  frequencia: number; ultimoCheckin: string;
};

const AULAS_SEED: Aula[] = [
  { id: "a1", nome: "WOD CrossFit", professor: "Coach Bruno", horario: "06:00", vagas: 12, ocupadas: 11, modalidade: "CrossFit", sala: "Box 1" },
  { id: "a2", nome: "Funcional Avançado", professor: "Profa. Carla", horario: "07:00", vagas: 15, ocupadas: 9, modalidade: "Funcional", sala: "Sala 2" },
  { id: "a3", nome: "HIIT 45'", professor: "Coach Diego", horario: "18:00", vagas: 20, ocupadas: 20, modalidade: "HIIT", sala: "Sala 1" },
  { id: "a4", nome: "Mobilidade", professor: "Profa. Elaine", horario: "19:00", vagas: 12, ocupadas: 4, modalidade: "Mobilidade", sala: "Sala 3" },
  { id: "a5", nome: "Open Box", professor: "Coach Bruno", horario: "20:00", vagas: 18, ocupadas: 14, modalidade: "CrossFit", sala: "Box 1" },
];

const ALUNOS_SEED: Aluno[] = [
  { id: "u1", nome: "Ana Souza", plano: "Anual Premium", status: "ativo", frequencia: 92, ultimoCheckin: "hoje 06:02" },
  { id: "u2", nome: "Bruno Lima", plano: "Mensal CrossFit", status: "ativo", frequencia: 78, ultimoCheckin: "ontem 19:30" },
  { id: "u3", nome: "Carla Dias", plano: "Trimestral Funcional", status: "atrasado", frequencia: 41, ultimoCheckin: "há 9 dias" },
  { id: "u4", nome: "Daniel Reis", plano: "Trial 7 dias", status: "trial", frequencia: 100, ultimoCheckin: "hoje 07:10" },
  { id: "u5", nome: "Elisa Prado", plano: "Anual Premium", status: "ativo", frequencia: 85, ultimoCheckin: "hoje 18:05" },
];

function ShowroomFitness() {
  const [aulas, setAulas] = useState(AULAS_SEED);
  const [tab, setTab] = useState("dashboard");

  const kpi = useMemo(() => {
    const ocupacao = Math.round((aulas.reduce((a, x) => a + x.ocupadas, 0) / aulas.reduce((a, x) => a + x.vagas, 0)) * 100);
    return {
      alunos: 412, ativos: 358, atrasados: 27, mrr: 78420, ocupacao,
      checkinsHoje: 184, novosLeads: 12, retencao: 87,
    };
  }, [aulas]);

  function reservar(id: string) {
    setAulas((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      if (a.ocupadas >= a.vagas) {
        toast.error("Aula lotada — entrou para a fila de espera (demo)");
        return a;
      }
      toast.success("Reserva confirmada (demo). Pagamento aprovado garante a vaga.");
      return { ...a, ocupadas: a.ocupadas + 1 };
    }));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className="gap-1"><Dumbbell className="w-3 h-3" /> Vertical Fitness</Badge>
            <Badge className="bg-success text-success-foreground">Showroom navegável</Badge>
            <Badge variant="secondary">Dados demonstrativos</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-4xl">
            Sua academia, box ou estúdio rodando dentro da Impulsionando — em tempo real.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Navegue como se já fosse cliente. Veja agenda de aulas, check-in, mensalidades, CRM de alunos,
            avaliações físicas, relatórios e automações. Nenhum dado é real, nada é cobrado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 bg-gradient-primary">
              <Link to="/orcamento" search={{ origem: "showroom-fitness" } as never}>
                <CreditCard className="w-4 h-4" /> Quero esse sistema na minha unidade
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/como-funciona/fitness"><PlayCircle className="w-4 h-4" /> Ver mapa visual da operação</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="gap-2">
              <Link to="/trabalhe-conosco/fitness"><GraduationCap className="w-4 h-4" /> Trabalhe conosco (CREF, Coach, Personal)</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SHOWROOM */}
      <section className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-1"><LineChart className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
            <TabsTrigger value="agenda" className="gap-1"><Calendar className="w-3.5 h-3.5" /> Agenda</TabsTrigger>
            <TabsTrigger value="checkin" className="gap-1"><UserCheck className="w-3.5 h-3.5" /> Check-in</TabsTrigger>
            <TabsTrigger value="alunos" className="gap-1"><Users className="w-3.5 h-3.5" /> Alunos / CRM</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1"><Wallet className="w-3.5 h-3.5" /> Financeiro</TabsTrigger>
            <TabsTrigger value="avaliacao" className="gap-1"><Activity className="w-3.5 h-3.5" /> Avaliação física</TabsTrigger>
            <TabsTrigger value="automacoes" className="gap-1"><MessageCircle className="w-3.5 h-3.5" /> Automações</TabsTrigger>
            <TabsTrigger value="proprietario" className="gap-1"><TrendingUp className="w-3.5 h-3.5" /> Visão do dono</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Alunos ativos" value={kpi.ativos.toString()} sub={`de ${kpi.alunos} cadastrados`} icon={<Users className="w-4 h-4" />} />
              <Kpi label="MRR (receita recorrente)" value={`R$ ${kpi.mrr.toLocaleString("pt-BR")}`} sub="+8,4% mês a mês" icon={<TrendingUp className="w-4 h-4" />} tone="success" />
              <Kpi label="Ocupação média das aulas" value={`${kpi.ocupacao}%`} sub="hoje, todas modalidades" icon={<Calendar className="w-4 h-4" />} />
              <Kpi label="Inadimplência" value={`${kpi.atrasados}`} sub="alunos atrasados (cobrança automática ativa)" icon={<AlertTriangle className="w-4 h-4" />} tone="warning" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Check-ins de hoje</h3>
                <div className="text-3xl font-bold">{kpi.checkinsHoje}</div>
                <div className="text-sm text-muted-foreground mt-1">Pico: 06h (CrossFit) e 18h (HIIT). Catraca/QR ativa.</div>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Novos leads (CRM)</h3>
                <div className="text-3xl font-bold">{kpi.novosLeads}</div>
                <div className="text-sm text-muted-foreground mt-1">Origem: Instagram, Google Meu Negócio, indicação de aluno.</div>
              </Card>
            </div>
          </TabsContent>

          {/* AGENDA */}
          <TabsContent value="agenda" className="mt-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Aulas de hoje</h3>
                <Badge variant="outline">Clique em "Reservar" para simular</Badge>
              </div>
              <div className="grid gap-3">
                {aulas.map((a) => {
                  const lotada = a.ocupadas >= a.vagas;
                  return (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-md p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 text-center">
                          <div className="text-lg font-bold">{a.horario}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{a.modalidade}</div>
                        </div>
                        <div>
                          <div className="font-medium">{a.nome}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Users className="w-3 h-3" /> {a.professor} · <MapPin className="w-3 h-3" /> {a.sala}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={lotada ? "destructive" : a.ocupadas / a.vagas > 0.7 ? "default" : "secondary"}>
                          {a.ocupadas}/{a.vagas} vagas
                        </Badge>
                        <Button size="sm" variant={lotada ? "outline" : "default"} onClick={() => reservar(a.id)}>
                          {lotada ? "Entrar na fila" : "Reservar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Regra ativa: pagamento aprovado confirma a vaga. Sem pagamento aprovado, sem reserva.
                Remarcação e política de reembolso configuráveis pelo proprietário (1h, 2h, 4h, 8h, 12h, 24h ou personalizado).
              </p>
            </Card>
          </TabsContent>

          {/* CHECK-IN */}
          <TabsContent value="checkin" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Check-in rápido</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aluno faz check-in por QR, biometria, catraca ou recepção. Vincula presença, plano e aula.
                </p>
                <CheckinSim />
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Frequência da semana</h3>
                <ul className="space-y-2 text-sm">
                  {["Segunda 142", "Terça 156", "Quarta 178", "Quinta 161", "Sexta 184", "Sábado 92", "Domingo 38"].map((d) => (
                    <li key={d} className="flex items-center justify-between border-b border-border/60 pb-1">
                      <span>{d.split(" ")[0]}</span>
                      <span className="font-semibold">{d.split(" ")[1]} check-ins</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </TabsContent>

          {/* ALUNOS / CRM */}
          <TabsContent value="alunos" className="mt-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Alunos & CRM unificado</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <tr><th className="py-2">Aluno</th><th>Plano</th><th>Status</th><th>Frequência</th><th>Último check-in</th></tr>
                  </thead>
                  <tbody>
                    {ALUNOS_SEED.map((u) => (
                      <tr key={u.id} className="border-b border-border/40">
                        <td className="py-2 font-medium">{u.nome}</td>
                        <td>{u.plano}</td>
                        <td>
                          {u.status === "ativo" && <Badge className="bg-success text-success-foreground">Ativo</Badge>}
                          {u.status === "atrasado" && <Badge variant="destructive">Atrasado</Badge>}
                          {u.status === "trial" && <Badge variant="secondary">Trial</Badge>}
                        </td>
                        <td>{u.frequencia}%</td>
                        <td className="text-muted-foreground">{u.ultimoCheckin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Funil: Lead → Trial → Matrícula → Ativo → Em risco → Reativação. Tudo no mesmo CRM da plataforma.
              </p>
            </Card>
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Kpi label="Receita do mês" value="R$ 78.420" sub="planos + avulsas + venda de produtos" icon={<Wallet className="w-4 h-4" />} tone="success" />
              <Kpi label="A receber" value="R$ 12.180" sub="27 mensalidades em cobrança automática" icon={<CreditCard className="w-4 h-4" />} tone="warning" />
              <Kpi label="Despesas fixas" value="R$ 31.200" sub="folha, aluguel, energia" icon={<ClipboardList className="w-4 h-4" />} />
            </div>
            <Card className="mt-4 p-5">
              <h3 className="font-semibold mb-3">Métodos de pagamento ativos</h3>
              <div className="flex flex-wrap gap-2">
                {["Pix", "Cartão recorrente", "Cartão avulso", "Boleto", "Dinheiro (recepção)", "Crédito interno"].map((m) => (
                  <Badge key={m} variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> {m}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Reembolso configurável por cliente: sem reembolso, crédito interno (padrão recomendado), parcial ou integral.
              </p>
            </Card>
          </TabsContent>

          {/* AVALIAÇÃO FÍSICA */}
          <TabsContent value="avaliacao" className="mt-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Avaliação física do aluno</h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                {[
                  { l: "Peso", v: "78,4 kg", d: "-1,2 kg em 30d" },
                  { l: "% Gordura", v: "18,2%", d: "-0,8 p.p." },
                  { l: "Massa magra", v: "63,1 kg", d: "+0,4 kg" },
                  { l: "VO₂ estimado", v: "44 ml/kg·min", d: "+2 desde última" },
                ].map((m) => (
                  <div key={m.l} className="border border-border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">{m.l}</div>
                    <div className="text-xl font-bold">{m.v}</div>
                    <div className="text-xs text-success">{m.d}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Histórico, fotos comparativas, metas, prescrição de treino e PAR-Q digital.</p>
            </Card>
          </TabsContent>

          {/* AUTOMAÇÕES */}
          <TabsContent value="automacoes" className="mt-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Réguas configuráveis pelo proprietário</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {[
                  "Confirmação imediata da reserva",
                  "Lembrete 24h antes da aula",
                  "Lembrete 12h / 6h / 2h / 1h / 30 min antes",
                  "Pós-aula: pesquisa de satisfação",
                  "Renovação automática de plano (D-7)",
                  "Reativação de aluno inativo (15d, 30d, 60d)",
                  "Cobrança automática de mensalidade atrasada",
                  "Recuperação de matrícula abandonada",
                  "Aniversário do aluno",
                  "Aviso de avaliação física vencida",
                ].map((r) => (
                  <label key={r} className="flex items-center gap-2 border border-border rounded-md p-2">
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Cada régua envia por WhatsApp, e-mail ou push do app. Tudo SIM/NÃO no painel.</p>
            </Card>
          </TabsContent>

          {/* VISÃO DO PROPRIETÁRIO */}
          <TabsContent value="proprietario" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { p: "Como aumentar faturamento?", r: "Pacotes recorrentes, upgrade automático Trial→Plano, venda cruzada de avaliação física, loja interna de suplementos." },
                { p: "Como reduzir faltas?", r: "Lembretes escalonados, lista de espera automática, cobrança de no-show conforme política configurada." },
                { p: "Como melhorar ocupação?", r: "Mapa de calor por horário, sugestão de reagendamento e remanejamento de turmas com baixa procura." },
                { p: "Como melhorar retenção?", r: "Score de risco do aluno, gatilhos de reativação, programa de fidelidade e indicação." },
                { p: "Como controlar a operação?", r: "Painel multi-unidade, fechamento de caixa, conciliação financeira, auditoria de tudo que acontece." },
              ].map((x) => (
                <Card key={x.p} className="p-5">
                  <h4 className="font-semibold">{x.p}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{x.r}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA FINAL */}
        <Card className="mt-10 p-6 md:p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Gostou? A demo aqui é só a superfície.</h3>
              <p className="text-muted-foreground text-sm mt-1">Receba uma proposta com preço modular para sua unidade ou rede em até 1 dia útil.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-gradient-primary">
                <Link to="/orcamento" search={{ origem: "showroom-fitness", nicho: "fitness" } as never}>Pedir orçamento</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contato">Falar com consultor</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}

function Kpi({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; tone?: "success" | "warning" }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span><span>{icon}</span>
      </div>
      <div className={`text-2xl font-bold mt-1 ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

function CheckinSim() {
  const [aluno, setAluno] = useState("");
  const [modalidade, setModalidade] = useState("crossfit");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!aluno) return toast.error("Informe matrícula, CPF ou nome");
        toast.success(`Check-in registrado: ${aluno} (${modalidade}) — demo`);
        setAluno("");
      }}
    >
      <div>
        <Label htmlFor="aluno">Matrícula / CPF / nome</Label>
        <Input id="aluno" value={aluno} onChange={(e) => setAluno(e.target.value)} placeholder="Ex.: 1024 ou 123.456.789-00" />
      </div>
      <div>
        <Label>Modalidade</Label>
        <Select value={modalidade} onValueChange={setModalidade}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="crossfit">CrossFit</SelectItem>
            <SelectItem value="funcional">Funcional</SelectItem>
            <SelectItem value="hiit">HIIT</SelectItem>
            <SelectItem value="musculacao">Musculação livre</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">Registrar check-in</Button>
    </form>
  );
}
