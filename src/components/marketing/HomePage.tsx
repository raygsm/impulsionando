import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MessageCircle, ArrowRight, Sparkles, PlayCircle, Calculator, Search,
  Settings, Eye, CheckCircle2, Rocket, AlertTriangle, TrendingDown, Mail, MessageSquare, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20Impulsionito.";

// ============== DIAGNÓSTICO ==============
const NICHOS = [
  { slug: "imobiliaria", label: "Imobiliária" },
  { slug: "saude", label: "Clínica/consultório" },
  { slug: "contabilidade", label: "Contabilidade" },
  { slug: "bares", label: "Bar/restaurante" },
  { slug: "eventos", label: "Eventos" },
  { slug: "ecommerce", label: "E-commerce" },
  { slug: "comercio", label: "Loja física" },
  { slug: "servicos", label: "Serviços" },
  { slug: "fitness", label: "Fitness" },
  { slug: "educacao", label: "Educação" },
  { slug: "white-label", label: "White Label" },
  { slug: "outro", label: "Outro" },
];

const DORES = [
  "Perco leads", "Demoro para responder", "Não tenho CRM",
  "Atendimento perdido no WhatsApp", "Equipe esquece follow-up",
  "Agenda confusa", "Pagamentos manuais", "Falta dashboard",
  "Falta área do cliente", "Quero automatizar comunicação",
  "Quero vender mais", "Quero organizar operação",
];

const FOCOS = ["Captação", "Atendimento", "Vendas", "Agenda", "Pagamentos", "Gestão", "Comunicação", "Fidelização", "Tudo junto"];

const RECOMENDACOES: Record<string, { modulos: string[]; correlatos: string[]; plano: string; demo: string }> = {
  imobiliaria: {
    modulos: ["CRM de imóveis", "Automação & Comunicação", "BI & Dashboards", "Área do Cliente", "Documentos & Propostas", "Gestão de Corretores"],
    correlatos: ["WhatsApp para corretores", "Portal do proprietário", "Funil comercial", "Relatórios por gerente"],
    plano: "Integrado",
    demo: "/nichos/imobiliaria",
  },
  saude: {
    modulos: ["Agenda online", "Prontuário eletrônico", "Cobrança recorrente", "Área do paciente", "WhatsApp confirmação"],
    correlatos: ["Lista de espera", "Telemedicina", "Faturamento TISS", "BI clínico"],
    plano: "Integrado",
    demo: "/nichos/saude",
  },
  contabilidade: {
    modulos: ["Portal do cliente contábil", "Calendário fiscal", "Documentos", "IRPF jornada", "BI gerencial"],
    correlatos: ["WhatsApp por departamento", "Contratos e onboarding", "Tarefas e obrigações"],
    plano: "Avançado",
    demo: "/contabilidade/cockpit",
  },
  bares: {
    modulos: ["PDV", "Mesas e comandas", "QR Code menu", "Estoque", "Cozinha integrada"],
    correlatos: ["Delivery", "Fidelidade", "Pagamento na mesa", "Ficha técnica"],
    plano: "Integrado",
    demo: "/demo/beer-house",
  },
  eventos: {
    modulos: ["Ingressos", "Check-in QR", "CRM público", "BI evento"],
    correlatos: ["Transferência de ingresso", "Pesquisa pós-evento", "Pagamento parcelado"],
    plano: "Essencial",
    demo: "/demo/eventos",
  },
  ecommerce: {
    modulos: ["Catálogo", "Pedidos", "Pagamentos", "Estoque", "Área do consumidor"],
    correlatos: ["WhatsApp de carrinho", "Fidelidade", "Fulfillment", "BI vendas"],
    plano: "Integrado",
    demo: "/demo",
  },
  comercio: {
    modulos: ["PDV", "Estoque", "Vendas", "Financeiro", "Clientes"],
    correlatos: ["Cashback", "WhatsApp pós-venda", "Cupons"],
    plano: "Essencial",
    demo: "/demo",
  },
  servicos: {
    modulos: ["CRM", "Propostas", "Contratos", "Cobrança", "Agenda"],
    correlatos: ["Assinaturas", "WhatsApp", "BI comercial"],
    plano: "Integrado",
    demo: "/demo",
  },
  fitness: {
    modulos: ["Agenda de aulas", "Mensalidade recorrente", "App aluno", "Avaliações físicas"],
    correlatos: ["Check-in QR", "WhatsApp", "Comissão de professor"],
    plano: "Integrado",
    demo: "/showroom/fitness",
  },
  educacao: {
    modulos: ["Matrículas", "Pagamento recorrente", "Portal do aluno", "Comunicados"],
    correlatos: ["WhatsApp turma", "BI evasão", "Boletos"],
    plano: "Integrado",
    demo: "/demo",
  },
  "white-label": {
    modulos: ["Plataforma multiempresa", "Marca própria", "BI agregado", "Faturamento por cliente"],
    correlatos: ["Setup assistido", "Treinamento", "Suporte dedicado"],
    plano: "Sob Medida",
    demo: "/demo/white-label",
  },
  outro: {
    modulos: ["CRM", "Comunicação", "Pagamentos", "Dashboard"],
    correlatos: ["Atendimento consultivo", "Customização"],
    plano: "Sob Medida",
    demo: "/demo",
  },
};

function Diagnostico() {
  const [nicho, setNicho] = useState<string>("");
  const [dores, setDores] = useState<string[]>([]);
  const [foco, setFoco] = useState<string>("");

  const result = useMemo(() => nicho ? RECOMENDACOES[nicho] : null, [nicho]);
  const showResult = nicho && foco && dores.length > 0;

  return (
    <section className="bg-card/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3"><Search className="w-3 h-3 mr-1" /> Diagnóstico rápido</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Em 30 segundos você sabe quais módulos resolvem sua dor</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Responda 3 perguntas e veja recomendação, demo e plano provável.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="p-5 sm:p-6 space-y-5">
            <div>
              <Label className="text-sm font-semibold mb-2 block">1. Qual é o seu segmento?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NICHOS.map((n) => (
                  <button
                    key={n.slug}
                    type="button"
                    onClick={() => setNicho(n.slug)}
                    className={`text-xs px-3 py-2 rounded-lg border transition ${
                      nicho === n.slug ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">2. O que mais dói hoje? (múltipla)</Label>
              <div className="flex flex-wrap gap-1.5">
                {DORES.map((d) => {
                  const on = dores.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDores((prev) => on ? prev.filter((x) => x !== d) : [...prev, d])}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">3. Resolver primeiro o quê?</Label>
              <div className="flex flex-wrap gap-1.5">
                {FOCOS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFoco(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      foco === f ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className={`p-5 sm:p-6 transition ${showResult ? "border-primary/40 bg-primary/[0.02]" : "border-dashed opacity-70"}`}>
            {!showResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <Sparkles className="w-10 h-10 mb-3 text-primary/40" />
                <p className="text-sm">Responda as 3 perguntas ao lado para ver seu diagnóstico personalizado.</p>
              </div>
            ) : result && (
              <div className="space-y-4">
                <div>
                  <Badge className="bg-primary text-primary-foreground mb-2">Diagnóstico</Badge>
                  <h3 className="text-lg font-bold">Para {NICHOS.find(n => n.slug === nicho)?.label}, focando em {foco}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{dores.length} dor(es) identificada(s)</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Módulos recomendados</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.modulos.map((m) => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Produtos correlatos</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.correlatos.map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Plano provável</div>
                    <div className="font-bold text-primary">{result.plano}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild size="sm" className="bg-gradient-primary">
                      <Link to={result.demo as any}><PlayCircle className="w-4 h-4 mr-1" /> Ver demo</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/orcamento">Orçamento <ArrowRight className="w-4 h-4 ml-1" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

// ============== SIMULADOR DE PERDA ==============
function SimuladorPerda() {
  const [leads, setLeads] = useState(100);
  const [perda, setPerda] = useState(30);
  const [ticket, setTicket] = useState(500);

  const perdaMes = useMemo(() => (leads * (perda / 100) * ticket), [leads, perda, ticket]);
  const perdaAno = perdaMes * 12;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-3">
          <TrendingDown className="w-3 h-3 mr-1" /> O custo de não ter sistema
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Quanto você perde por mês sem CRM, agenda e automação?</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="leads" className="text-sm">Leads recebidos por mês</Label>
            <Input id="leads" type="number" value={leads} onChange={(e) => setLeads(Math.max(0, +e.target.value || 0))} min={0} />
          </div>
          <div>
            <Label htmlFor="perda" className="text-sm">% que você acredita que perde</Label>
            <Input id="perda" type="number" value={perda} onChange={(e) => setPerda(Math.min(100, Math.max(0, +e.target.value || 0)))} min={0} max={100} />
          </div>
          <div>
            <Label htmlFor="ticket" className="text-sm">Ticket médio (R$)</Label>
            <Input id="ticket" type="number" value={ticket} onChange={(e) => setTicket(Math.max(0, +e.target.value || 0))} min={0} />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Não responder rápido = lead esfria.</li>
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Sem follow-up = oportunidade esquecida.</li>
            <li className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> Sem dashboard = gestor não enxerga onde agir.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-destructive/5 to-primary/5 border-destructive/20">
          <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Estimativa mensal</div>
          <div className="text-4xl sm:text-5xl font-bold text-destructive">
            R$ {perdaMes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">em oportunidades mal atendidas</div>

          <div className="mt-6 pt-6 border-t border-destructive/20">
            <div className="text-xs uppercase text-muted-foreground tracking-wide mb-1">No ano isso vira</div>
            <div className="text-2xl sm:text-3xl font-bold">R$ {perdaAno.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
          </div>

          <p className="text-sm mt-6 leading-relaxed">
            <strong>O sistema não aumenta resultado por mágica.</strong> Ele reduz perda, organiza jornada, aumenta velocidade e dá visibilidade para o gestor agir.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Button asChild className="bg-gradient-primary flex-1">
              <Link to="/orcamento">Quero parar de perder dinheiro <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/demo"><PlayCircle className="w-4 h-4 mr-1" /> Ver demo</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ============== 5 FASES ==============
const FASES = [
  { n: 1, t: "Diagnóstico", icon: Search, d: "Entende nicho, dor, equipe, canais e módulos necessários." },
  { n: 2, t: "Configuração", icon: Settings, d: "Ativa módulos, usuários, permissões, funis, mensagens e dashboards." },
  { n: 3, t: "Demonstração", icon: Eye, d: "Você testa com dados fictícios e entende como o sistema opera no seu nicho." },
  { n: 4, t: "Contratação", icon: CheckCircle2, d: "Escolha plano, módulos, usuários e canais adicionais." },
  { n: 5, t: "Operação", icon: Rocket, d: "Sistema registra leads, clientes, pagamentos, documentos e indicadores em tempo real." },
];

function CincoFases() {
  return (
    <section className="bg-card/30 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="bg-accent/15 text-accent border-accent/20 mb-3">Como funciona</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">5 fases para sua operação rodar com a Impulsionando</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FASES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.n} className="p-5 relative hover:shadow-lg transition">
                <div className="absolute top-3 right-3 text-3xl font-bold text-muted/30">{f.n}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm mb-1.5">{f.t}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.d}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============== CANAIS ==============
function CanaisComunicacao() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-3xl mb-8">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Comunicação</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">E-mail é nativo. WhatsApp, SMS e Voz são adicionais.</h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Você não paga a mais por comunicação básica. Se precisar de mais velocidade e proximidade, contrata o canal certo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-primary/30 bg-primary/5">
          <Mail className="w-6 h-6 text-primary mb-2" />
          <div className="font-bold text-sm mb-1">E-mail transacional</div>
          <Badge className="bg-primary text-primary-foreground text-[10px] mb-2">Nativo padrão</Badge>
          <p className="text-xs text-muted-foreground">Templates, logs, histórico no CRM. Já incluso na estrutura base.</p>
        </Card>
        <Card className="p-5">
          <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
          <div className="font-bold text-sm mb-1">WhatsApp Business</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Disparos, atendimento, automação por departamento.</p>
        </Card>
        <Card className="p-5">
          <Phone className="w-6 h-6 text-muted-foreground mb-2" />
          <div className="font-bold text-sm mb-1">SMS</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Confirmações, OTP, alertas críticos com alta taxa de entrega.</p>
        </Card>
        <Card className="p-5">
          <Phone className="w-6 h-6 text-muted-foreground mb-2" />
          <div className="font-bold text-sm mb-1">Voz / VoIP / URA</div>
          <Badge variant="outline" className="text-[10px] mb-2">Canal adicional</Badge>
          <p className="text-xs text-muted-foreground">Ligação ativa, URA, integração telefônica para operação de volume.</p>
        </Card>
      </div>
    </section>
  );
}

// ============== HOMEPAGE ==============
export function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO VENDEDOR */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge className="bg-white/10 backdrop-blur text-white border-white/20 mb-5">
              <Sparkles className="w-3 h-3 mr-1" /> Tecnologia + Estratégia + Comunicação
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-4xl mx-auto">
              Tecnologia que conecta atendimento, vendas e operação em um só ecossistema.
            </h1>
            <p className="mt-5 text-base sm:text-xl text-white/85 leading-relaxed max-w-3xl mx-auto">
              CRM, automação, agenda, pagamentos, área do cliente, dashboards e comunicação —
              modular, por nicho, com White Label pronto para revender com a sua marca.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 h-auto py-4 flex-col">
                <Link to="/orcamento">
                  <span className="flex items-center gap-2 font-semibold"><Sparkles className="w-4 h-4" /> Sou empresa</span>
                  <span className="text-xs font-normal opacity-75">Quero usar na minha operação</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-gradient-primary gap-2 h-auto py-4 flex-col">
                <Link to="/nichos/white-label">
                  <span className="flex items-center gap-2 font-semibold"><Rocket className="w-4 h-4" /> White Label</span>
                  <span className="text-xs font-normal opacity-90">Revender com a minha marca</span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 gap-2 h-auto py-4 flex-col">
                <Link to="/demo">
                  <span className="flex items-center gap-2 font-semibold"><PlayCircle className="w-4 h-4" /> Ver demos</span>
                  <span className="text-xs font-normal opacity-75">Testar antes de contratar</span>
                </Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/75">
              <a href="#diagnostico" className="inline-flex items-center gap-1.5 hover:text-white underline-offset-4 hover:underline">
                <Search className="w-4 h-4" /> Diagnóstico em 30s
              </a>
              <span className="opacity-40">•</span>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white underline-offset-4 hover:underline">
                <MessageCircle className="w-4 h-4" /> Falar com Impulsionito
              </a>
            </div>

          </div>
        </section>

        {/* DIAGNÓSTICO */}
        <div id="diagnostico"><Diagnostico /></div>

        {/* SIMULADOR */}
        <SimuladorPerda />

        {/* 5 FASES */}
        <CincoFases />

        {/* CANAIS */}
        <CanaisComunicacao />

        {/* CTA FINAL */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Card className="p-8 sm:p-12 text-center bg-gradient-hero text-primary-foreground border-0">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3">Pronto para parar de perder oportunidade?</h2>
            <p className="text-white/85 max-w-2xl mx-auto mb-6">Veja a plataforma funcionando no seu nicho. Sem cartão, sem compromisso.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                <Link to="/demo/feira"><PlayCircle className="w-4 h-4" /> Liberar demo agora</Link>
              </Button>
              <Button asChild size="lg" className="btn-whatsapp gap-2">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </a>
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
