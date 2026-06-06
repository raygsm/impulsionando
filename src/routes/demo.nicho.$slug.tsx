import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowRight, CalendarClock, Handshake, FileSignature, MessageCircle, TrendingUp, Music2,
  AlertTriangle, ShieldCheck, BadgeDollarSign, Sparkles,
} from "lucide-react";
import { getDemoEventos, formatBRL, NICHO_LABELS, type Nicho } from "@/lib/demoNicho";

const SUPORTADOS: Nicho[] = ["eventos"];

export const Route = createFileRoute("/demo/nicho/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Demo do nicho ${params.slug} — Impulsionando Tecnologia` },
      { name: "description", content: `Demonstração interativa dos recursos do nicho ${params.slug}: jornada completa de briefing, agenda, parceiros, contrato, comunicação e resultado.` },
      { property: "og:title", content: `Demo do nicho ${params.slug} — Impulsionando` },
    ],
  }),
  component: DemoNichoPage,
  notFoundComponent: NichoNotFound,
  errorComponent: ({ error, reset }) => (
    <div className="p-8 text-center">
      <p className="text-destructive">Erro ao carregar demo: {String(error)}</p>
      <Button onClick={reset} className="mt-4">Tentar novamente</Button>
    </div>
  ),
  loader: ({ params }) => {
    if (!SUPORTADOS.includes(params.slug as Nicho)) {
      throw notFound();
    }
    return { slug: params.slug as Nicho };
  },
});

function NichoNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-20 text-center">
        <Badge variant="outline" className="mb-3">Em breve</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Demo deste nicho ainda não está pronta</h1>
        <p className="mt-3 text-muted-foreground">
          A demo do nicho Eventos / WMP já está disponível. Outros nichos serão liberados em breve.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Button asChild className="bg-gradient-primary">
            <Link to="/demo/nicho/$slug" params={{ slug: "eventos" }}>
              Abrir demo Eventos / WMP <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/demo/modulos">Ver todos os módulos</Link>
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function DemoNichoPage() {
  const { slug } = Route.useLoaderData();
  if (slug !== "eventos") return <NichoNotFound />;
  return <DemoEventosNicho />;
}

function DemoEventosNicho() {
  const d = getDemoEventos();
  const labels = NICHO_LABELS.eventos;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <Badge className="bg-gradient-primary mb-3">Demonstração — nicho: {labels.nome}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Operação WMP de ponta a ponta
          </h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Veja como a Impulsionando organiza a jornada completa de um evento: briefing do
            contratante, conferência de agenda, seleção de parceiro/artista, contrato com sinal,
            comunicação automática e fechamento financeiro. Todos os dados são fictícios.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard icon={BadgeDollarSign} label="Receita do mês" value={formatBRL(d.kpis.receitaMes)} />
          <KpiCard icon={TrendingUp} label="Taxa WMP (20%)" value={formatBRL(d.kpis.taxaWMPmes)} />
          <KpiCard icon={CalendarClock} label="Eventos confirmados" value={String(d.kpis.eventosConfirmados)} />
          <KpiCard icon={ShieldCheck} label="Cancelamento < 72h" value={`${d.kpis.taxaCancelamento72h}%`} />
        </div>

        <Tabs defaultValue="briefing" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-start gap-1">
            <TabsTrigger value="briefing"><FileSignature className="w-4 h-4 mr-1.5" />Briefing & Contratantes</TabsTrigger>
            <TabsTrigger value="agenda"><CalendarClock className="w-4 h-4 mr-1.5" />Agenda</TabsTrigger>
            <TabsTrigger value="parceiros"><Handshake className="w-4 h-4 mr-1.5" />Parceiros / Artistas</TabsTrigger>
            <TabsTrigger value="contrato"><BadgeDollarSign className="w-4 h-4 mr-1.5" />Contrato & Sinal</TabsTrigger>
            <TabsTrigger value="comms"><MessageCircle className="w-4 h-4 mr-1.5" />Comunicação</TabsTrigger>
            <TabsTrigger value="resultado"><TrendingUp className="w-4 h-4 mr-1.5" />Resultado</TabsTrigger>
          </TabsList>

          {/* BRIEFING */}
          <TabsContent value="briefing" className="mt-6">
            <SectionHeader
              title="Briefing & Pipeline de contratantes"
              desc={labels.pipelineLabel}
              ctaTo="/demo/crm"
              ctaLabel="Abrir demo CRM completa"
            />
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              {d.pipeline.map((etapa) => (
                <Card key={etapa.etapa} className="p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{etapa.etapa}</div>
                  <div className="mt-1 text-2xl font-bold">{etapa.contagem}</div>
                  <div className="text-xs text-muted-foreground">{formatBRL(etapa.valor)} em pipeline</div>
                </Card>
              ))}
            </div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contratante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="text-right">Cachê médio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próx. evento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.contratantes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{c.cidade}</TableCell>
                      <TableCell className="text-right">{formatBRL(c.cacheMedio)}</TableCell>
                      <TableCell><Badge>{c.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{c.proximoEvento ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* AGENDA */}
          <TabsContent value="agenda" className="mt-6">
            <SectionHeader
              title="Agenda integrada por artista e evento"
              desc="Bloqueios automáticos, passagem de som, deslocamento e janela de cancelamento sem multa (72h)."
              ctaTo="/demo/agenda"
              ctaLabel="Abrir demo Agenda completa"
            />
            <div className="grid md:grid-cols-2 gap-4">
              {d.eventos.slice(0, 6).map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{e.contratante}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5" /> {e.artista}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{e.data} · {e.cidade}</div>
                    </div>
                    <Badge variant={e.status === "Cancelado < 72h" ? "destructive" : "outline"}>
                      {e.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Mini label="Cachê" value={formatBRL(e.cache)} />
                    <Mini label="Sinal" value={formatBRL(e.sinal)} />
                    <Mini label="Saldo" value={formatBRL(e.saldo)} />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* PARCEIROS */}
          <TabsContent value="parceiros" className="mt-6">
            <SectionHeader
              title="Rede de parceiros (artistas)"
              desc="Níveis Iniciante → Premium, bônus progressivo, reputação e janela de cancelamento."
              ctaTo="/demo/parceiros"
              ctaLabel="Abrir demo Parceiros completa"
            />

            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <Card className="p-4 border-primary/40">
                <div className="text-xs uppercase tracking-wider text-primary font-semibold">Regra 72h</div>
                <p className="text-sm mt-1">
                  Cancelamentos com <strong>{d.regras.horasSemMulta}h ou mais</strong> de antecedência são gratuitos.
                  Abaixo disso, multa de <strong>{d.regras.percentualMulta}%</strong> sobre o cachê.
                </p>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sinal & repasse</div>
                <p className="text-sm mt-1">
                  Sinal de <strong>{d.regras.percentualSinal}%</strong> na assinatura. Taxa WMP <strong>{d.regras.taxaWMP}%</strong>.
                  Repasse ao artista em até 48h após o evento.
                </p>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bônus progressivo</div>
                <ul className="text-sm mt-1 space-y-0.5">
                  {d.regras.bonusPorMarco.map((b) => (
                    <li key={b.marco}>• {b.marco}: <strong>+{b.bonusPercent}%</strong> no repasse</li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artista</TableHead>
                    <TableHead>Estilo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Cachê base</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                    <TableHead className="text-right">Reputação</TableHead>
                    <TableHead className="text-right">Sem multa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.artistas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{a.estilo}</TableCell>
                      <TableCell><Badge variant="outline">{a.nivel}</Badge></TableCell>
                      <TableCell className="text-right">{formatBRL(a.cache)}</TableCell>
                      <TableCell className="text-right">+{a.bonus}%</TableCell>
                      <TableCell className="text-right">{a.reputacao.toFixed(1)} ★</TableCell>
                      <TableCell className="text-right">{a.eventosSemMulta} eventos</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* CONTRATO */}
          <TabsContent value="contrato" className="mt-6">
            <SectionHeader
              title="Contrato, sinal e fluxo financeiro"
              desc={`50% no contrato · ${d.regras.taxaWMP}% taxa WMP · repasse em 48h após o evento.`}
              ctaTo="/demo/checkout"
              ctaLabel="Abrir demo Checkout completa"
            />
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Artista</TableHead>
                    <TableHead className="text-right">Cachê</TableHead>
                    <TableHead className="text-right">Taxa WMP</TableHead>
                    <TableHead className="text-right">Repasse</TableHead>
                    <TableHead className="text-right">Sinal</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.eventos.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.contratante}</TableCell>
                      <TableCell className="text-muted-foreground">{e.artista}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.cache)}</TableCell>
                      <TableCell className="text-right text-primary">{formatBRL(e.taxaWMP)}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.repasse)}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.sinal)}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.saldo)}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "Cancelado < 72h" ? "destructive" : "outline"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* COMMS */}
          <TabsContent value="comms" className="mt-6">
            <SectionHeader
              title="Comunicação automática (WhatsApp + E-mail)"
              desc="Toda mensagem é enviada SEMPRE pelos dois canais. Mensagens da demo são prefixadas com 'DEMONSTRAÇÃO — VERSÃO TESTE'."
              ctaTo="/demo/whatsapp"
              ctaLabel="Abrir demo WhatsApp completa"
            />
            <div className="grid md:grid-cols-2 gap-3">
              {d.templates.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">{t.titulo}</div>
                    <Badge variant="outline">{t.canal}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Disparo: {t.quando}</div>
                  <pre className="mt-2 text-xs bg-muted/50 rounded-md p-3 whitespace-pre-wrap font-mono leading-relaxed">{t.corpo}</pre>
                </Card>
              ))}
            </div>
            <Card className="mt-4 p-4 border-amber-500/40 bg-amber-500/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong>Importante:</strong> nenhuma mensagem é enviada por um único canal.
                  Toda confirmação, lembrete, aviso de multa e liberação de repasse é
                  obrigatoriamente disparada por WhatsApp <strong>e</strong> e-mail.
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* RESULTADO */}
          <TabsContent value="resultado" className="mt-6">
            <SectionHeader
              title="Resultado consolidado WMP"
              desc="Visão financeira da operação no mês corrente."
              ctaTo="/demo/simulador"
              ctaLabel="Simular ROI no seu cenário"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <BigKpi label="Receita bruta dos contratos" value={formatBRL(d.kpis.receitaMes)} />
              <BigKpi label="Taxa WMP capturada" value={formatBRL(d.kpis.taxaWMPmes)} highlight />
              <BigKpi label="Eventos realizados" value={String(d.kpis.eventosRealizados)} />
              <BigKpi label="Eventos confirmados" value={String(d.kpis.eventosConfirmados)} />
              <BigKpi label="Artistas ativos" value={String(d.kpis.artistasAtivos)} />
              <BigKpi label="Cancelamentos < 72h" value={`${d.kpis.taxaCancelamento72h}%`} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-gradient-primary shadow-elegant">
                <Link to="/orcamento">Quero esta operação na minha empresa <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contato">Falar com um especialista WMP</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-10 p-6 bg-gradient-primary text-primary-foreground">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Próximo passo</div>
              <p className="text-sm opacity-90 mt-1">
                Quer ver os mesmos recursos com seus dados? Solicite um orçamento personalizado
                para o nicho de Eventos / WMP.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/orcamento">Solicitar orçamento</Link>
            </Button>
          </div>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}

function BigKpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`p-5 ${highlight ? "border-primary/50 bg-primary/5" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function SectionHeader({ title, desc, ctaTo, ctaLabel }: { title: string; desc: string; ctaTo: string; ctaLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href={`${ctaTo}?nicho=eventos`}>{ctaLabel} <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></a>
      </Button>
    </div>
  );
}
