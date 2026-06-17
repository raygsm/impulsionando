import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  Upload,
  Sparkles,
  Users,
  CalendarClock,
  ShieldCheck,
  GraduationCap,
  PartyPopper,
  ArrowRight,
  FileSpreadsheet,
  Database,
  Settings2,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/showroom/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding guiado por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Onboarding em até 7 dias: checklist, vídeos, importação de dados, treinamento e go-live — adaptado ao seu nicho.",
      },
      { property: "og:title", content: "Onboarding — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo navegável: trilhas guiadas por nicho, importadores prontos, treinamento da equipe e go-live em 7 dias.",
      },
    ],
  }),
  component: ShowroomOnboarding,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Task = {
  id: string;
  title: string;
  desc: string;
  step: number; // 1..5
  estimate: string;
  status: "done" | "current" | "todo";
  owner: "Você" | "Sua equipe" | "Time Impulsionando";
};

type Imp = { id: string; label: string; format: string; rows: string };
type Video = { id: string; title: string; minutes: number };
type Training = { id: string; role: string; lessons: number; duration: string };
type Milestone = { day: number; label: string; status: "done" | "current" | "todo" };

type Cfg = {
  brand: string;
  hero: string;
  daysToGoLive: number;
  successMetric: string;
  tasks: Task[];
  imports: Imp[];
  videos: Video[];
  training: Training[];
  milestones: Milestone[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Clínica Aurora",
    hero: "Da assinatura ao primeiro paciente atendido pela plataforma em até 7 dias.",
    daysToGoLive: 7,
    successMetric: "1ª consulta agendada e cobrada pela plataforma",
    tasks: [
      { id: "t1", title: "Criar conta da clínica", desc: "CNPJ, dados fiscais e responsável técnico.", step: 1, estimate: "5 min", status: "done", owner: "Você" },
      { id: "t2", title: "Cadastrar profissionais e salas", desc: "Médicos, terapeutas, salas e equipamentos.", step: 1, estimate: "20 min", status: "done", owner: "Você" },
      { id: "t3", title: "Importar agenda atual", desc: "Planilha ou integração com Google/Outlook.", step: 2, estimate: "10 min", status: "current", owner: "Você" },
      { id: "t4", title: "Importar base de pacientes", desc: "CSV com nome, CPF, contato e tags.", step: 2, estimate: "15 min", status: "todo", owner: "Você" },
      { id: "t5", title: "Configurar serviços e preços", desc: "Procedimentos, duração, sinal e cashback.", step: 3, estimate: "30 min", status: "todo", owner: "Sua equipe" },
      { id: "t6", title: "Conectar pagamentos (Pix/cartão)", desc: "KYC do estabelecimento e antecipação.", step: 3, estimate: "15 min", status: "todo", owner: "Você" },
      { id: "t7", title: "Personalizar site e portal do paciente", desc: "Cores, logo, fotos e textos.", step: 4, estimate: "45 min", status: "todo", owner: "Sua equipe" },
      { id: "t8", title: "Treinar recepção e profissionais", desc: "Trilha de 4 aulas + simulações.", step: 4, estimate: "2h", status: "todo", owner: "Sua equipe" },
      { id: "t9", title: "Migrar prontuários (opcional)", desc: "Anexar PDFs ou planilhas históricas.", step: 5, estimate: "Sob demanda", status: "todo", owner: "Time Impulsionando" },
      { id: "t10", title: "Go-live com acompanhamento ao vivo", desc: "Suporte dedicado nas primeiras 48h.", step: 5, estimate: "1 dia", status: "todo", owner: "Time Impulsionando" },
    ],
    imports: [
      { id: "i1", label: "Pacientes", format: "CSV / XLSX", rows: "até 50.000" },
      { id: "i2", label: "Agenda atual", format: "Google Calendar / iCal / XLSX", rows: "sincronização contínua" },
      { id: "i3", label: "Histórico financeiro", format: "CSV (modelo)", rows: "12 meses" },
      { id: "i4", label: "Procedimentos & preços", format: "XLSX (modelo)", rows: "ilimitado" },
    ],
    videos: [
      { id: "v1", title: "Tour da clínica em 5 minutos", minutes: 5 },
      { id: "v2", title: "Como montar agenda e bloqueios", minutes: 8 },
      { id: "v3", title: "Prontuário eletrônico + LGPD", minutes: 12 },
      { id: "v4", title: "Fechamento de caixa diário", minutes: 6 },
    ],
    training: [
      { id: "tr1", role: "Recepção", lessons: 6, duration: "1h20" },
      { id: "tr2", role: "Profissional clínico", lessons: 4, duration: "55min" },
      { id: "tr3", role: "Gerente / Administrador", lessons: 8, duration: "2h" },
    ],
    milestones: [
      { day: 1, label: "Kickoff + acessos", status: "done" },
      { day: 2, label: "Importações + serviços", status: "current" },
      { day: 4, label: "Treinamento da equipe", status: "todo" },
      { day: 6, label: "Ensaio (modo sandbox)", status: "todo" },
      { day: 7, label: "Go-live oficial", status: "todo" },
    ],
  },
  bares: {
    brand: "Bar Esquina 47",
    hero: "Da assinatura à primeira comanda fechada no PDV em até 5 dias.",
    daysToGoLive: 5,
    successMetric: "1ª comanda fechada e Pix recebido",
    tasks: [
      { id: "t1", title: "Criar conta da casa", desc: "CNPJ, salão, capacidade e endereço.", step: 1, estimate: "5 min", status: "done", owner: "Você" },
      { id: "t2", title: "Cadastrar mesas e setores", desc: "Mapa do salão, varanda, balcão.", step: 1, estimate: "15 min", status: "done", owner: "Você" },
      { id: "t3", title: "Importar cardápio", desc: "Planilha de itens, categorias e fotos.", step: 2, estimate: "20 min", status: "current", owner: "Sua equipe" },
      { id: "t4", title: "Configurar impressoras (bar/cozinha)", desc: "Roteamento automático por categoria.", step: 2, estimate: "20 min", status: "todo", owner: "Time Impulsionando" },
      { id: "t5", title: "Cadastrar garçons e PINs", desc: "Permissões e comissão por venda.", step: 3, estimate: "15 min", status: "todo", owner: "Você" },
      { id: "t6", title: "Habilitar maquininhas e Pix", desc: "Adquirência integrada ou própria.", step: 3, estimate: "15 min", status: "todo", owner: "Você" },
      { id: "t7", title: "Configurar reservas online", desc: "Página pública, horários e taxa de no-show.", step: 4, estimate: "30 min", status: "todo", owner: "Sua equipe" },
      { id: "t8", title: "Treinar equipe de salão", desc: "Comanda, mesa, fechamento, divisão.", step: 4, estimate: "1h30", status: "todo", owner: "Sua equipe" },
      { id: "t9", title: "Importar fornecedores e estoque", desc: "Cadastro de insumos e ficha técnica.", step: 5, estimate: "1h", status: "todo", owner: "Sua equipe" },
      { id: "t10", title: "Go-live em sexta movimentada", desc: "Suporte ao vivo das 17h às 23h.", step: 5, estimate: "1 noite", status: "todo", owner: "Time Impulsionando" },
    ],
    imports: [
      { id: "i1", label: "Cardápio", format: "XLSX (modelo) / Anota AI", rows: "até 5.000 itens" },
      { id: "i2", label: "Mapa de mesas", format: "Editor visual", rows: "—" },
      { id: "i3", label: "Reservas existentes", format: "Google Forms / CSV", rows: "—" },
      { id: "i4", label: "Fornecedores", format: "CSV", rows: "ilimitado" },
    ],
    videos: [
      { id: "v1", title: "Abrindo o PDV pela 1ª vez", minutes: 4 },
      { id: "v2", title: "Fluxo completo: mesa → comanda → Pix", minutes: 7 },
      { id: "v3", title: "Reservas online sem no-show", minutes: 6 },
      { id: "v4", title: "Fechamento e divisão de gorjeta", minutes: 5 },
    ],
    training: [
      { id: "tr1", role: "Garçom / Atendente", lessons: 5, duration: "1h" },
      { id: "tr2", role: "Bartender", lessons: 3, duration: "40min" },
      { id: "tr3", role: "Gerente de casa", lessons: 7, duration: "1h40" },
    ],
    milestones: [
      { day: 1, label: "Kickoff + acessos", status: "done" },
      { day: 2, label: "Cardápio + impressoras", status: "current" },
      { day: 3, label: "Treinamento de salão", status: "todo" },
      { day: 4, label: "Ensaio em horário fechado", status: "todo" },
      { day: 5, label: "Go-live noturno", status: "todo" },
    ],
  },
  cervejarias: {
    brand: "Lúpulo Norte",
    hero: "Da assinatura ao primeiro pedido B2B faturado em até 10 dias.",
    daysToGoLive: 10,
    successMetric: "1º pedido B2B emitido com NF-e e expedição",
    tasks: [
      { id: "t1", title: "Configurar empresa e CNPJs", desc: "Fábrica, taprooms e CDs.", step: 1, estimate: "10 min", status: "done", owner: "Você" },
      { id: "t2", title: "Mapear linhas de produção", desc: "SKUs, lotes e capacidade.", step: 1, estimate: "30 min", status: "current", owner: "Sua equipe" },
      { id: "t3", title: "Importar catálogo de produtos", desc: "Planilha de SKUs com EAN e tabela.", step: 2, estimate: "20 min", status: "todo", owner: "Sua equipe" },
      { id: "t4", title: "Cadastrar revendedores B2B", desc: "CNPJ, limite de crédito, tabela.", step: 2, estimate: "45 min", status: "todo", owner: "Você" },
      { id: "t5", title: "Conectar NF-e + transportadoras", desc: "Certificado A1 e contratos.", step: 3, estimate: "1h", status: "todo", owner: "Time Impulsionando" },
      { id: "t6", title: "Configurar taprooms (PDV)", desc: "Cardápio chopp, balança, impressoras.", step: 3, estimate: "1h", status: "todo", owner: "Sua equipe" },
      { id: "t7", title: "Treinar comercial e expedição", desc: "Trilhas específicas por papel.", step: 4, estimate: "3h", status: "todo", owner: "Sua equipe" },
      { id: "t8", title: "Integração com ERP (opcional)", desc: "Bling, Tiny, Omie ou customizado.", step: 4, estimate: "Sob demanda", status: "todo", owner: "Time Impulsionando" },
      { id: "t9", title: "Importar histórico de vendas B2B", desc: "Últimos 12 meses para análise.", step: 5, estimate: "1h", status: "todo", owner: "Time Impulsionando" },
      { id: "t10", title: "Go-live com primeiro lote real", desc: "Acompanhamento de 5 dias.", step: 5, estimate: "1 semana", status: "todo", owner: "Time Impulsionando" },
    ],
    imports: [
      { id: "i1", label: "Catálogo de produtos", format: "XLSX (modelo)", rows: "ilimitado" },
      { id: "i2", label: "Revendedores B2B", format: "CSV (modelo)", rows: "até 10.000" },
      { id: "i3", label: "Tabelas de preço", format: "XLSX por região/canal", rows: "ilimitado" },
      { id: "i4", label: "Histórico de pedidos", format: "ERP / CSV", rows: "24 meses" },
    ],
    videos: [
      { id: "v1", title: "Fluxo industrial → expedição", minutes: 9 },
      { id: "v2", title: "Pedido B2B + NF-e em 3 cliques", minutes: 7 },
      { id: "v3", title: "Operação completa de taproom", minutes: 8 },
      { id: "v4", title: "Painel de qualidade e lotes", minutes: 6 },
    ],
    training: [
      { id: "tr1", role: "Comercial B2B", lessons: 6, duration: "1h30" },
      { id: "tr2", role: "Expedição e logística", lessons: 5, duration: "1h10" },
      { id: "tr3", role: "Taproom / PDV", lessons: 4, duration: "55min" },
    ],
    milestones: [
      { day: 1, label: "Kickoff + acessos", status: "done" },
      { day: 3, label: "Catálogo + revendas", status: "current" },
      { day: 5, label: "NF-e + ERP", status: "todo" },
      { day: 8, label: "Ensaio com pedido teste", status: "todo" },
      { day: 10, label: "Go-live B2B", status: "todo" },
    ],
  },
  servicos: {
    brand: "Studio Forma",
    hero: "Da assinatura à primeira aula vendida pelo app em até 5 dias.",
    daysToGoLive: 5,
    successMetric: "1ª matrícula com cobrança recorrente ativa",
    tasks: [
      { id: "t1", title: "Criar o studio", desc: "CNPJ, endereço e modalidades.", step: 1, estimate: "5 min", status: "done", owner: "Você" },
      { id: "t2", title: "Cadastrar professores e salas", desc: "Especialidades, disponibilidade e comissão.", step: 1, estimate: "20 min", status: "done", owner: "Você" },
      { id: "t3", title: "Importar alunos atuais", desc: "Planilha com plano vigente.", step: 2, estimate: "15 min", status: "current", owner: "Você" },
      { id: "t4", title: "Configurar planos e mensalidades", desc: "Mensal, trimestral, pacotes.", step: 2, estimate: "30 min", status: "todo", owner: "Sua equipe" },
      { id: "t5", title: "Habilitar cobrança recorrente", desc: "Cartão + Pix + boleto.", step: 3, estimate: "15 min", status: "todo", owner: "Você" },
      { id: "t6", title: "Personalizar app do aluno", desc: "Logo, cores e treinos modelo.", step: 3, estimate: "1h", status: "todo", owner: "Sua equipe" },
      { id: "t7", title: "Importar agenda e turmas", desc: "Horários fixos e rotativos.", step: 4, estimate: "30 min", status: "todo", owner: "Sua equipe" },
      { id: "t8", title: "Treinar recepção e professores", desc: "Check-in, treinos, avaliações.", step: 4, estimate: "1h30", status: "todo", owner: "Sua equipe" },
      { id: "t9", title: "Campanha de lançamento (opcional)", desc: "WhatsApp + Instagram para base atual.", step: 5, estimate: "1h", status: "todo", owner: "Sua equipe" },
      { id: "t10", title: "Go-live com 1ª turma", desc: "Suporte síncrono no primeiro dia.", step: 5, estimate: "1 dia", status: "todo", owner: "Time Impulsionando" },
    ],
    imports: [
      { id: "i1", label: "Alunos", format: "CSV / XLSX", rows: "até 20.000" },
      { id: "i2", label: "Planos vigentes", format: "XLSX (modelo)", rows: "ilimitado" },
      { id: "i3", label: "Turmas e horários", format: "XLSX / iCal", rows: "ilimitado" },
      { id: "i4", label: "Avaliações físicas", format: "PDF (anexos)", rows: "por aluno" },
    ],
    videos: [
      { id: "v1", title: "Tour do studio digital", minutes: 5 },
      { id: "v2", title: "Cobrança recorrente sem dor", minutes: 6 },
      { id: "v3", title: "App do aluno: treinos e check-in", minutes: 7 },
      { id: "v4", title: "Indicações e bônus", minutes: 4 },
    ],
    training: [
      { id: "tr1", role: "Recepção", lessons: 5, duration: "1h" },
      { id: "tr2", role: "Professor / Personal", lessons: 4, duration: "50min" },
      { id: "tr3", role: "Gestor", lessons: 7, duration: "1h45" },
    ],
    milestones: [
      { day: 1, label: "Kickoff + acessos", status: "done" },
      { day: 2, label: "Alunos + planos", status: "current" },
      { day: 3, label: "Cobrança recorrente", status: "todo" },
      { day: 4, label: "Treinamento equipe", status: "todo" },
      { day: 5, label: "Go-live + 1ª turma", status: "todo" },
    ],
  },
  ecommerce: {
    brand: "Loja Origem",
    hero: "Da assinatura à primeira venda omnichannel em até 7 dias.",
    daysToGoLive: 7,
    successMetric: "1º pedido pago, faturado e expedido",
    tasks: [
      { id: "t1", title: "Criar a loja", desc: "Marca, domínio e CNPJ.", step: 1, estimate: "10 min", status: "done", owner: "Você" },
      { id: "t2", title: "Importar catálogo", desc: "Produtos, variações, fotos e SEO.", step: 2, estimate: "1h", status: "current", owner: "Sua equipe" },
      { id: "t3", title: "Conectar ERP / marketplace", desc: "Bling, Tiny, ML, Shopee, Amazon.", step: 2, estimate: "30 min", status: "todo", owner: "Time Impulsionando" },
      { id: "t4", title: "Configurar pagamentos", desc: "Pix, cartão, parcelamento, antifraude.", step: 3, estimate: "20 min", status: "todo", owner: "Você" },
      { id: "t5", title: "Conectar frete e correios", desc: "Tabelas, retirada e transportadoras.", step: 3, estimate: "30 min", status: "todo", owner: "Sua equipe" },
      { id: "t6", title: "Personalizar storefront", desc: "Tema, banners, coleções e blocos.", step: 3, estimate: "1h30", status: "todo", owner: "Sua equipe" },
      { id: "t7", title: "Configurar lojas físicas (omni)", desc: "Estoque por loja e retirada.", step: 4, estimate: "1h", status: "todo", owner: "Sua equipe" },
      { id: "t8", title: "Treinar SAC e vendedores", desc: "Atendimento, cupons, devoluções.", step: 4, estimate: "2h", status: "todo", owner: "Sua equipe" },
      { id: "t9", title: "Importar base de clientes/cupons", desc: "Histórico para fidelidade.", step: 5, estimate: "30 min", status: "todo", owner: "Time Impulsionando" },
      { id: "t10", title: "Go-live com campanha de lançamento", desc: "Mídia paga + e-mail + push.", step: 5, estimate: "1 dia", status: "todo", owner: "Time Impulsionando" },
    ],
    imports: [
      { id: "i1", label: "Catálogo de produtos", format: "XLSX / API marketplace", rows: "até 100.000 SKUs" },
      { id: "i2", label: "Estoque por loja", format: "CSV (modelo)", rows: "ilimitado" },
      { id: "i3", label: "Clientes e cupons", format: "CSV / Shopify export", rows: "ilimitado" },
      { id: "i4", label: "Pedidos históricos", format: "API / CSV", rows: "24 meses" },
    ],
    videos: [
      { id: "v1", title: "Loja online no ar em 1h", minutes: 8 },
      { id: "v2", title: "Omnichannel: estoque + retirada", minutes: 7 },
      { id: "v3", title: "Conversão: checkout, frete e Pix", minutes: 6 },
      { id: "v4", title: "Fidelidade, cupons e cashback", minutes: 5 },
    ],
    training: [
      { id: "tr1", role: "SAC / atendimento", lessons: 6, duration: "1h20" },
      { id: "tr2", role: "Vendedor de loja física", lessons: 4, duration: "55min" },
      { id: "tr3", role: "Marketing / e-commerce manager", lessons: 9, duration: "2h30" },
    ],
    milestones: [
      { day: 1, label: "Kickoff + acessos", status: "done" },
      { day: 2, label: "Catálogo + integrações", status: "current" },
      { day: 4, label: "Pagamentos + frete + tema", status: "todo" },
      { day: 6, label: "Ensaio com pedido interno", status: "todo" },
      { day: 7, label: "Go-live + campanha", status: "todo" },
    ],
  },
};

const NICHE_LABELS: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Estética",
  bares: "Bares & Restaurantes",
  cervejarias: "Cervejarias",
  servicos: "Serviços & Studios",
  ecommerce: "E-commerce",
};

const STEP_NAMES = ["Conta", "Dados", "Sistemas", "Equipe", "Go-live"];

function ShowroomOnboarding() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const tasks = useMemo(() => {
    return cfg.tasks.map((t) => {
      if (completed[t.id]) return { ...t, status: "done" as const };
      return t;
    });
  }, [cfg, completed]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = Math.round((done / total) * 100);

  const stepProgress = useMemo(() => {
    return [1, 2, 3, 4, 5].map((s) => {
      const list = tasks.filter((t) => t.step === s);
      const d = list.filter((t) => t.status === "done").length;
      return { step: s, total: list.length, done: d, pct: Math.round((d / list.length) * 100) };
    });
  }, [tasks]);

  const toggle = (id: string) => {
    setCompleted((c) => ({ ...c, [id]: !c[id] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Rocket className="h-3 w-3" /> Showroom · Onboarding guiado
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Do contrato ao go-live em até {cfg.daysToGoLive} dias
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Checklist guiado, importadores prontos, vídeos curtos, treinamento por função e
              acompanhamento ao vivo no go-live — tudo adaptado ao seu nicho.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={niche === slug ? "default" : "outline"}
                  onClick={() => {
                    setNiche(slug);
                    setCompleted({});
                  }}
                >
                  {NICHE_LABELS[slug]}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{cfg.brand}</strong> · {cfg.hero}
            </p>
          </div>
        </div>
      </section>

      {/* Progresso geral + stepper */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Progresso do onboarding
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight">{pct}%</span>
                  <span className="text-sm text-muted-foreground">
                    {done} de {total} tarefas
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <CalendarClock className="h-3 w-3" /> Go-live previsto: D+{cfg.daysToGoLive}
              </Badge>
            </div>
            <Progress value={pct} className="mt-4 h-2" />
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {stepProgress.map((s, i) => {
                const state = s.pct === 100 ? "done" : s.pct > 0 ? "current" : "todo";
                return (
                  <div
                    key={s.step}
                    className={`rounded-lg border p-3 ${
                      state === "done"
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : state === "current"
                          ? "border-primary/40 bg-primary/5"
                          : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                        Etapa {s.step}
                      </span>
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : state === "current" ? (
                        <Clock className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{STEP_NAMES[i]}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.done}/{s.total}
                    </div>
                    <Progress value={s.pct} className="mt-2 h-1" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Checklist */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Checklist guiado</h2>
            <p className="text-sm text-muted-foreground">
              Clique nos itens para marcar como concluídos — o progresso atualiza em tempo real.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" /> Meta de sucesso: {cfg.successMetric}
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((t) => {
            const isDone = t.status === "done";
            const isCurrent = t.status === "current";
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                className={`text-left rounded-lg border p-4 transition ${
                  isDone
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : isCurrent
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Etapa {t.step} · {STEP_NAMES[t.step - 1]}
                      </Badge>
                      <span className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t.estimate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {t.owner}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Importadores + vídeos */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Importadores prontos</h3>
            </div>
            <ul className="space-y-2">
              {cfg.imports.map((i) => (
                <li key={i.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      {i.id.includes("4") ? (
                        <Database className="h-4 w-4" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{i.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.format} · {i.rows}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Importar
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Validação automática, LGPD e
              rollback completo de qualquer importação em 1 clique.
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Vídeos curtos do nicho</h3>
            </div>
            <ul className="space-y-2">
              {cfg.videos.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{v.title}</div>
                      <div className="text-xs text-muted-foreground">{v.minutes} min</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Assistir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Treinamento + roadmap */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Trilhas por função</h3>
            </div>
            <ul className="space-y-2">
              {cfg.training.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">{t.role}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.lessons} aulas · {t.duration}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Iniciar
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <Settings2 className="h-3.5 w-3.5 text-primary" /> Certificados emitidos
              automaticamente e relatório de aderência por colaborador.
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Roadmap até o go-live</h3>
            </div>
            <ol className="relative border-l pl-6">
              {cfg.milestones.map((m) => (
                <li key={m.day} className="mb-5 last:mb-0">
                  <span
                    className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                      m.status === "done"
                        ? "bg-emerald-500 text-white"
                        : m.status === "current"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.status === "done" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : m.status === "current" ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </span>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dia {m.day}
                  </div>
                  <div className="text-sm font-medium">{m.label}</div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* Squad de implantação */}
      <section className="container mx-auto px-4 py-6 pb-4">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background p-5">
          <div className="grid items-center gap-4 md:grid-cols-[1fr_auto]">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <PartyPopper className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Sua squad de implantação está pronta</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer Success especialista no seu nicho, engenheiro de dados para migração e
                  suporte ao vivo no dia do go-live.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button>
                <MessageCircle className="mr-1 h-3.5 w-3.5" /> Falar com a squad
              </Button>
              <Button variant="outline">Agendar kickoff</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Pronto para começar com pé direito?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Time dedicado, importadores prontos, vídeos curtos e treinamento por função —
                  para você operar tranquilo já na primeira semana.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link to="/trial">Começar grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/showroom">Voltar ao showroom</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
