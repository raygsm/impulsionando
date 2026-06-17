import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2, Sparkles, Cpu, Megaphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  fetchImpulsionandoBrasilPages,
  submitImpulsionandoBrasilLead,
} from "@/lib/marketing-site.functions";

type ServicePage = {
  slug: string;
  name: string;
  status: string;
  content: {
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      cta: string;
      tag: string;
    };
    benefits: string[];
    process: string[];
    priceRange: string;
    leadSource: string;
  };
};

const ORDER = ["agente-virtual", "social-media", "google-ads", "assessoria-marketing"];

const pagesQuery = queryOptions({
  queryKey: ["marketing-site", "impulsionando-brasil"],
  queryFn: () => fetchImpulsionandoBrasilPages(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Impulsionando Brasil — Marketing e Tecnologia que entregam resultado em 90 dias" },
      { name: "description", content: "Agente Virtual, Social Media, Google Ads e Assessoria de Marketing 360 com plano comercial claro, métricas semanais e resultado em até 90 dias." },
      { property: "og:title", content: "Impulsionando Brasil — Marketing e Tecnologia" },
      { property: "og:description", content: "Agente Virtual, Social Media, Google Ads e Assessoria 360. Resultado em 90 dias, com painel transparente." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pagesQuery),
  component: MarketingPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-12 text-center">
      <p className="text-destructive">Erro: {String(error)}</p>
      <Button onClick={reset} className="mt-4">Tentar novamente</Button>
    </div>
  ),
});

function MarketingPage() {
  const { data } = useSuspenseQuery(pagesQuery);
  const services = useMemo(() => {
    const map = new Map((data.pages as ServicePage[]).map((p) => [p.slug, p]));
    return ORDER.map((s) => map.get(s)).filter(Boolean) as ServicePage[];
  }, [data]);

  const [openService, setOpenService] = useState<ServicePage | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" /> Resultado em 90 dias
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Marketing e Tecnologia que entregam venda, não promessa.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Agente Virtual, Social Media, Google Ads e Assessoria de Marketing 360 com plano
              comercial claro, leitura semanal de funil e painel transparente. 90 dias para você
              ver resultado — ou ajustamos o plano sem custo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-gradient-primary" asChild>
                <a href="#servicos">Ver serviços <ArrowRight className="ml-2 w-4 h-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#por-que-90-dias">Por que 90 dias?</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Por que 90 dias */}
        <section id="por-que-90-dias" className="py-20 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center">Por que 90 dias?</h2>
            <p className="mt-3 text-center text-muted-foreground max-w-3xl mx-auto">
              90 dias é o ciclo mínimo para uma régua comercial mostrar resultado consistente:
              tempo de aprender com seus dados, ajustar oferta e medir custo por venda real.
              Em 30 dias subimos a operação, em 60 entregamos primeiros números, em 90 fechamos
              o ciclo de leitura e ajuste.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-10">
              {[
                { d: "Dia 1-30", t: "Subir a operação", txt: "Briefing, integração, campanhas no ar, agente virtual treinado." },
                { d: "Dia 31-60", t: "Primeiros resultados", txt: "Leads qualificados entrando, leitura semanal de funil, ajustes de oferta." },
                { d: "Dia 61-90", t: "Ciclo de aprendizado", txt: "Custo por venda mensurado, plano do próximo trimestre baseado em dados reais." },
              ].map((b) => (
                <Card key={b.d} className="p-6">
                  <Badge variant="secondary" className="mb-2">{b.d}</Badge>
                  <h3 className="font-semibold">{b.t}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{b.txt}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Serviços */}
        <section id="servicos" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center">Nossos serviços</h2>
            <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
              Quatro frentes pensadas para escalar venda com previsibilidade.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              {services.map((s) => (
                <Card key={s.slug} className="p-7 hover:shadow-lg transition-shadow">
                  <Badge variant="outline" className="mb-2">{s.content.hero.eyebrow}</Badge>
                  <h3 className="text-xl font-semibold">{s.content.hero.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.content.hero.subtitle}</p>
                  <ul className="mt-5 space-y-1.5">
                    {s.content.benefits.slice(0, 3).map((b) => (
                      <li key={b} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm font-medium">{s.content.priceRange}</span>
                    <Button onClick={() => setOpenService(s)} className="bg-gradient-primary">
                      {s.content.hero.cta} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tecnologia × Brasil — duas marcas, um time */}
        <section id="tecnologia-brasil" className="py-20 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-3">Duas marcas, um time</Badge>
              <h2 className="text-3xl font-bold">Impulsionando Tecnologia × Impulsionando Brasil</h2>
              <p className="mt-3 text-muted-foreground max-w-3xl mx-auto">
                Separamos o que é <strong>produto</strong> do que é <strong>serviço</strong> pra você entender o que está contratando — e poder usar um, outro ou os dois.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-7 border-primary/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-md bg-primary/10 p-2"><Cpu className="h-5 w-5 text-primary" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">PRODUTO · SaaS</div>
                    <h3 className="text-xl font-semibold">Impulsionando Tecnologia</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  A plataforma. CRM, agenda, financeiro, vendas, estoque, BI e módulos por nicho rodando no nosso Core multiempresa.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {["Assinatura mensal, sem fidelidade", "Trial de 7 dias", "Módulos por nicho ativáveis", "API e webhooks abertos"].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <a href="/empresas">Ver o produto <ArrowRight className="ml-2 w-4 h-4" /></a>
                </Button>
              </Card>
              <Card className="p-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-md bg-primary/10 p-2"><Megaphone className="h-5 w-5 text-primary" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">SERVIÇO · Agência</div>
                    <h3 className="text-xl font-semibold">Impulsionando Brasil</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  A operação. Marketing, mídia, conteúdo, agente virtual e assessoria 360 — feito por gente, medido com a Tecnologia.
                </p>
                <ul className="space-y-1.5 text-sm">
                  {["Contratos de 90 dias", "Painel transparente de funil", "Time dedicado por cliente", "Integra direto no Core"].map((b) => (
                    <li key={b} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild className="mt-5 w-full bg-gradient-primary">
                  <a href="#servicos">Ver os serviços <ArrowRight className="ml-2 w-4 h-4" /></a>
                </Button>
              </Card>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
              Pode contratar só o produto, só o serviço, ou os dois juntos. Quando vêm juntos, o cliente acompanha em tempo real cada lead virar venda dentro do mesmo painel.
            </p>
          </div>
        </section>

        {/* Marca · INPI */}
        <section id="marca-inpi" className="py-16 border-t">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="p-7 md:p-9 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="rounded-md bg-primary/10 p-3 shrink-0">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">Marca registrada · INPI</Badge>
                <h3 className="text-xl font-semibold">"Impulsionando" é marca depositada no INPI</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  As marcas <strong>Impulsionando Tecnologia</strong> e <strong>Impulsionando Brasil</strong> foram depositadas no Instituto Nacional da Propriedade Industrial (INPI) nas classes de software e serviços de marketing. Uso comercial sem autorização sujeita o infrator às penalidades da Lei 9.279/96.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Para licenciamento, parceria white-label ou autorização de uso, fale com nosso jurídico em <a href="mailto:juridico@impulsionando.com.br" className="underline">juridico@impulsionando.com.br</a>.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <PublicFooter />

      {openService && (
        <LeadFormDialog
          service={openService}
          open={!!openService}
          onClose={() => setOpenService(null)}
        />
      )}
    </div>
  );
}

function LeadFormDialog({
  service, open, onClose,
}: { service: ServicePage; open: boolean; onClose: () => void }) {
  const submit = useServerFn(submitImpulsionandoBrasilLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });

  const mut = useMutation({
    mutationFn: (payload: typeof form) =>
      submit({
        data: {
          ...payload,
          serviceSlug: service.slug,
          serviceTag: service.content.hero.tag,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Recebemos seu pedido! Em até 1 dia útil entraremos em contato.");
      onClose();
    },
    onError: (e) => toast.error(String((e as Error).message)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service.content.hero.cta}</DialogTitle>
          <DialogDescription>{service.name} — respondemos em até 1 dia útil.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
        >
          <div>
            <Label htmlFor="n">Nome*</Label>
            <Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="e">E-mail*</Label>
            <Input id="e" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p">WhatsApp</Label>
              <Input id="p" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c">Empresa</Label>
              <Input id="c" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="m">Conte um pouco</Label>
            <Textarea id="m" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary" disabled={mut.isPending}>
            {mut.isPending ? "Enviando…" : "Quero falar com a Impulsionando"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
