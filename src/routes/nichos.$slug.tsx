import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NichoPage } from "@/components/marketing/NichoPage";
import { findNicho, type NichoDetail } from "@/components/marketing/nichoDetails";
import { COMMERCIAL_NICHE_PLAYBOOK, type CommercialNichePlaybook } from "@/data/commercial-niche-playbook";
import { openImpulsionito } from "@/lib/impulsionito-tracking";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { ArrowRight, CheckCircle2, MessageCircle, PlayCircle } from "lucide-react";

const SLUG_ALIASES: Record<string, string> = {
  "clinicas-medicas": "clinicas",
  "clinica": "clinicas",
  "clinica-medica": "clinicas",
  "consultorio": "clinicas",
  "consultorios": "clinicas",
  "restaurantes": "bares-restaurantes",
  "bares": "bares-restaurantes",
  "bar": "bares-restaurantes",
  "restaurante": "bares-restaurantes",
  "cervejaria": "microcervejarias",
  "cervejarias": "microcervejarias",
  "imoveis": "imobiliaria",
  "imobiliarias": "imobiliaria",
  "advocacia": "juridico",
  "escritorio-advocacia": "juridico",
  "psicologos": "psicologia",
  "psicologo": "psicologia",
  "contador": "contabilidade",
  "contadores": "contabilidade",
  "academia": "fitness",
  "academias": "fitness",
  "escola": "educacao",
  "escolas": "educacao",
  "auto": "veiculos",
  "automotivo": "veiculos",
  "ecomerce": "ecommerce",
  "loja-virtual": "ecommerce",
  "material-construcao": "materiais-construcao",
  "material-de-construcao": "materiais-construcao",
  "farmacia": "farmacias",
  "drogaria": "farmacias",
  "mercado": "supermercados",
  "supermercado": "supermercados",
  "lavajato": "lava-jato",
  "pet-shop": "petshops",
  "petshop": "petshops",
  "salao": "saloes-estetica",
  "barbearia": "saloes-estetica",
  "estetica": "saloes-estetica",
};

type LoaderData =
  | { kind: "canonical"; nicho: NichoDetail }
  | { kind: "playbook"; playbook: CommercialNichePlaybook };

export const Route = createFileRoute("/nichos/$slug")({
  loader: ({ params }): LoaderData => {
    const canonical = SLUG_ALIASES[params.slug] ?? params.slug;
    const nicho = findNicho(canonical);
    if (nicho) return { kind: "canonical", nicho };
    const playbook = COMMERCIAL_NICHE_PLAYBOOK.find((item) => item.slug === canonical);
    if (playbook) return { kind: "playbook", playbook };
    throw notFound();
  },
  head: ({ loaderData }) => {
    const data = loaderData as LoaderData | undefined;
    const label = data?.kind === "canonical" ? data.nicho.shortLabel : data?.kind === "playbook" ? data.playbook.label : "Nicho";
    const description = data?.kind === "canonical"
      ? data.nicho.subtitle
      : data?.kind === "playbook"
        ? `${data.playbook.scenario} Veja como a Impulsionando conecta captação, operação, relacionamento e fidelização nesse segmento.`
        : "Soluções por nicho da Impulsionando.";
    return {
      meta: [
        { title: `${label} — Impulsionando Tecnologia` },
        { name: "description", content: description },
        { property: "og:title", content: `${label} — Impulsionando Tecnologia` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: NichoSlugPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Nicho ainda não publicado</h1>
          <p className="text-muted-foreground mb-6">Escolha um dos segmentos disponíveis ou peça ao Impulsionito uma configuração para o seu negócio.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild><Link to="/nichos">Ver todos os nichos</Link></Button>
            <Button variant="outline" onClick={() => openImpulsionito("nicho-nao-encontrado")}><MessageCircle className="w-4 h-4 mr-2" />Falar com o Impulsionito</Button>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  ),
});

function NichoSlugPage() {
  const data = Route.useLoaderData() as LoaderData;
  if (data.kind === "canonical") return <NichoPage nicho={data.nicho} />;
  return <PlaybookNichePage playbook={data.playbook} />;
}

function PlaybookNichePage({ playbook }: { playbook: CommercialNichePlaybook }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <Badge className="bg-white/15 text-primary-foreground border-0">{playbook.label}</Badge>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">{playbook.hiddenLoss}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">{playbook.scenario}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito(`nicho-${playbook.slug}`)}>
                {playbook.cta} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/demo/escolher-nicho"><PlayCircle className="h-4 w-4" /> Ver demonstrações disponíveis</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">O que muda com a Impulsionando</h2>
              <div className="mt-5 space-y-3">
                {playbook.transformation.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Perguntas que o Impulsionito vai fazer</h2>
              <div className="mt-4 space-y-3">
                {playbook.impulsionitoQuestions.map((question) => (
                  <div key={question} className="rounded-lg bg-muted/50 p-3 text-sm">{question}</div>
                ))}
              </div>
              <Button className="mt-5 w-full" onClick={() => openImpulsionito(`nicho-diagnostico-${playbook.slug}`)}>
                Fazer diagnóstico do meu negócio
              </Button>
            </Card>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold">Régua de relacionamento</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {playbook.relationship.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold">Fidelização e recorrência</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {playbook.loyalty.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
              </div>
            </Card>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
