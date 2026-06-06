import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Info, MessageCircle, Sparkles,
  Target, TrendingUp, Zap, ShieldCheck, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { MODULE_DETAILS } from "@/components/marketing/moduleDetails";
import type { ModuleDetail } from "@/components/marketing/ModuleDetailDialog";
import { MOTHER_MODULES, type MotherModule } from "@/data/motherModules";

const WHATSAPP_BASE =
  "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20contratar%20o%20m%C3%B3dulo%20";

/** Aliases entre slug do catálogo principal e id do MODULE_DETAILS. */
const DETAIL_ALIASES: Record<string, string> = {
  crm: "crm",
  agenda: "agenda",
  fidelizacao: "afiliados",
  saude: "prontuario",
  bi: "bi",
  white_label: "custom",
  commerce: "pagamentos",
};

function resolve(slug: string): { mother?: MotherModule; detail?: ModuleDetail } {
  const mother = MOTHER_MODULES.find((m) => m.slug === slug);
  const detailId = DETAIL_ALIASES[slug] ?? slug;
  const detail = MODULE_DETAILS.find((d) => d.id === detailId);
  if (!mother && !detail) return {};
  return { mother, detail };
}

export const Route = createFileRoute("/modulos/$slug")({
  loader: ({ params }) => {
    const r = resolve(params.slug);
    if (!r.mother && !r.detail) throw notFound();
    return r;
  },
  head: ({ loaderData }) => {
    const title =
      loaderData?.mother?.fullName ??
      loaderData?.detail?.title ??
      "Módulo";
    const description =
      loaderData?.detail?.hook ??
      loaderData?.mother?.pitch ??
      "Módulo Impulsionando.";
    return {
      meta: [
        { title: `${title} — Impulsionando Tecnologia` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ModulePage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Módulo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O módulo que você procura não existe ou foi renomeado.
          </p>
          <Button asChild>
            <Link to="/modulos">Ver todos os módulos</Link>
          </Button>
        </div>
      </div>
      <PublicFooter />
    </div>
  ),
});

function ModulePage() {
  const { mother, detail } = Route.useLoaderData();
  const slugParam = Route.useParams().slug;

  const Icon = (mother?.icon ?? detail?.icon) as React.ComponentType<{ className?: string }>;
  const title = mother?.fullName ?? detail?.title ?? "Módulo";
  const hook = detail?.hook ?? mother?.tagline ?? "";
  const pitch = detail?.forWho ?? mother?.pitch ?? "";
  const benefits: string[] = detail?.benefits ?? mother?.submodules.slice(0, 8) ?? [];
  const features: string[] = detail?.features ?? mother?.submodules ?? [];
  const examples: string[] = detail?.examples ?? [];
  const howItWorks: { step: string; detail: string }[] = detail?.howItWorks ?? [];
  const integrations: string[] = detail?.integrations ?? [];
  const impact: string[] = detail?.impact ?? [];

  const waUrl =
    WHATSAPP_BASE + encodeURIComponent(title) + "%20da%20Impulsionando.";

  const orcamentoOrigin = `modulos:${slugParam}`;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <Link
              to="/modulos"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a vitrine
            </Link>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                {Icon ? <Icon className="w-7 h-7" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                {detail?.badge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/30 text-white bg-white/10 mb-2"
                  >
                    {detail.badge.label}
                  </Badge>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  {title}
                </h1>
                {hook && (
                  <p className="text-lg text-white/85 max-w-3xl leading-relaxed mt-4">
                    {hook}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-6">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Link to="/orcamento" search={{ origem: orcamentoOrigin }}>
                  Contratar este módulo <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/demo/modulos">
                  Testar este módulo <Sparkles className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="gap-2 text-white hover:bg-white/10 hover:text-white"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com consultor
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12 pb-32">
          {/* Para quem */}
          {pitch && (
            <Card className="p-6 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Target className="w-4 h-4 text-primary" /> Para que serve / para quem
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {pitch}
              </p>
            </Card>
          )}

          {/* Benefícios */}
          {benefits.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-primary" /> O que você ganha
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 p-4 rounded-lg border bg-card"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Jornada */}
          {howItWorks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-primary" /> Como funciona na prática
              </h2>
              <ol className="space-y-4">
                {howItWorks.map((s, i) => (
                  <li
                    key={s.step}
                    className="flex gap-4 p-5 rounded-lg border bg-card"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{s.step}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {s.detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* CRM — funis por nicho */}
          {slugParam === "crm" && <CRMFunnelSection />}

          {/* WhatsApp — comparativo de conexão */}
          {(slugParam === "crm" || slugParam === "automacao") && <WhatsAppConnectionSection />}

          {/* Exemplos */}
          {examples.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-5">
                <Info className="w-5 h-5 text-primary" /> Exemplos reais
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {examples.map((e) => (
                  <div
                    key={e}
                    className="text-sm leading-relaxed p-4 rounded-lg bg-muted/40 border"
                  >
                    {e}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recursos + Integrações */}
          {(features.length > 0 || integrations.length > 0) && (
            <section className="grid md:grid-cols-2 gap-6">
              {features.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Recursos / submódulos incluídos
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[11px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
              {integrations.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Integrações</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {integrations.join(" · ")}
                  </p>
                </Card>
              )}
            </section>
          )}

          {/* Regras / dependências */}
          <Card className="p-6 border-amber-300/40 bg-amber-50/40 dark:bg-amber-500/5">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Regras, limites e dependências
            </h3>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside">
              <li>Na demonstração, os recursos rodam com <strong>dados fictícios</strong> — nenhuma cobrança ou comunicação real é disparada.</li>
              <li>Em ambiente real, o módulo só fica ativo após contratação e aprovação do pagamento.</li>
              <li>Recursos que dependem de WhatsApp, gateway de pagamento, e-mail transacional ou domínio próprio exigem credenciais externas.</li>
              <li>Limites de uso (usuários, mensagens, transações) seguem o plano contratado.</li>
            </ul>
          </Card>

          {/* Impacto */}
          {impact.length > 0 && (
            <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" /> Impacto esperado
              </h2>
              <ul className="space-y-2.5">
                {impact.map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span className="text-sm leading-relaxed">{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Combinações recomendadas */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">
              Combine com outros módulos
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOTHER_MODULES.filter((m) => m.slug !== slugParam)
                .slice(0, 6)
                .map((m) => {
                  const MIcon = m.icon;
                  return (
                    <Link
                      key={m.slug}
                      to="/modulos/$slug"
                      params={{ slug: m.slug }}
                      className="p-4 rounded-lg border bg-card hover:shadow-elegant transition-shadow flex items-start gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                        <MIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{m.shortName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {m.tagline}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
            </div>
          </section>
        </div>

        {/* STICKY CTA */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
            <div className="hidden sm:block flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{title}</div>
              <div className="text-xs text-muted-foreground truncate">
                Teste agora na demo ou contrate em minutos.
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/demo/modulos">Testar na demo</Link>
            </Button>
            <Button asChild size="lg" className="gap-2 flex-1 sm:flex-initial bg-gradient-primary">
              <Link to="/orcamento" search={{ origem: orcamentoOrigin }}>
                <ArrowRight className="w-4 h-4" />
                <span className="truncate">Contratar este módulo</span>
              </Link>
            </Button>
          </div>
        </div>

        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/* CRM — funis por nicho                                              */
/* ------------------------------------------------------------------ */

const CRM_FUNNELS: { nicho: string; steps: string[] }[] = [
  { nicho: "Clínica", steps: ["Lead", "Dúvida recebida", "Agendamento iniciado", "Pagamento pendente", "Consulta confirmada", "Atendimento realizado", "Retorno", "Reativação"] },
  { nicho: "Restaurante", steps: ["Contato", "Reserva iniciada", "Pagamento pendente", "Reserva confirmada", "Compareceu", "Pesquisa enviada", "Cliente recorrente"] },
  { nicho: "Eventos", steps: ["Interessado", "Ingresso escolhido", "Pagamento pendente", "Ingresso confirmado", "Check-in realizado", "Pesquisa respondida", "Próximo evento"] },
  { nicho: "Afiliados e Produtos", steps: ["Checkout iniciado", "Pix pendente", "Boleto pendente", "Cartão recusado", "Compra aprovada", "Recompra prevista", "Cliente recorrente"] },
  { nicho: "Viagens", steps: ["Lead", "Briefing iniciado", "Proposta enviada", "Follow-up", "Pagamento de sinal", "Viagem confirmada", "Pós-viagem", "Reativação"] },
];

function CRMFunnelSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-5">Funis por nicho — exemplos prontos</h2>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        O CRM já vem com modelos de funil por nicho. Você pode adaptar etapas, tags
        e automações sem precisar montar tudo do zero.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {CRM_FUNNELS.map((f) => (
          <Card key={f.nicho} className="p-5">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
              {f.nicho}
            </div>
            <ol className="text-sm space-y-1.5">
              {f.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* WhatsApp — comparativo de tipos de conexão                         */
/* ------------------------------------------------------------------ */

const WPP_OPTIONS = [
  {
    nome: "QR Code sem API Oficial",
    estabilidade: "Média",
    escala: "Pequena / Média",
    biz_app: "Pode coexistir, dependendo da estrutura",
    templates: "Não aplica",
    custo: "Menor custo inicial",
    indicacao: "Testes, demo, operações menores",
    limitacoes: "Risco de desconexão, sensível a bloqueios, menos governança",
  },
  {
    nome: "QR Code com API Oficial / conexão assistida",
    estabilidade: "Alta",
    escala: "Média / Alta",
    biz_app: "Depende do provedor e da conta Meta Business",
    templates: "Sim, quando aprovados",
    custo: "Pode envolver custo por conversa",
    indicacao: "Operações estruturadas que querem implantação guiada",
    limitacoes: "Depende de aprovação Meta e configuração do Business Manager",
  },
  {
    nome: "API Oficial direta sem QR Code",
    estabilidade: "Muito alta",
    escala: "Alta / Empresarial",
    biz_app: "Geralmente o número passa a operar pelo CRM",
    templates: "Sim, templates aprovados",
    custo: "Custo por conversa/mensagem conforme Meta/provedor",
    indicacao: "Alto volume, múltiplos atendentes, governança total",
    limitacoes: "Pode impedir uso simultâneo no WhatsApp Business App tradicional",
  },
];

function WhatsAppConnectionSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-3 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" /> WhatsApp — tipos de conexão
      </h2>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        O WhatsApp Inteligente pode ser conectado de três formas. A escolha
        depende do volume de atendimento, da exigência de estabilidade, do
        orçamento e do uso (ou não) de automações ativas com templates.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2 px-3">Tipo de conexão</th>
              <th className="py-2 px-3">Estabilidade</th>
              <th className="py-2 px-3">Escala</th>
              <th className="py-2 px-3">WhatsApp Business App</th>
              <th className="py-2 px-3">Templates</th>
              <th className="py-2 px-3">Custo operacional</th>
              <th className="py-2 px-3">Melhor indicação</th>
              <th className="py-2 px-3">Limitações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {WPP_OPTIONS.map((o) => (
              <tr key={o.nome} className="align-top">
                <td className="py-2 px-3 font-medium">{o.nome}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.estabilidade}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.escala}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.biz_app}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.templates}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.custo}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.indicacao}</td>
                <td className="py-2 px-3 text-muted-foreground">{o.limitacoes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="p-5 mt-5 border-amber-300/40 bg-amber-50/40 dark:bg-amber-500/5">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            Na <strong>API Oficial direta</strong>, o número normalmente passa
            a ser operado pelo CRM. Em muitos casos não é possível continuar
            usando o mesmo número no WhatsApp Business App tradicional. A
            disponibilidade, custos e regras dependem do provedor e da Meta.
          </div>
        </div>
      </Card>
    </section>
  );
}
