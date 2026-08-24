import { Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Instagram, MapPin, Sparkles } from "lucide-react";

export type FullClientSlug = "ontap" | "raoni" | "riobeer" | "spartacus" | "peroladavila";

type Profile = {
  name: string;
  eyebrow: string;
  headline: string;
  description: string;
  location?: string;
  instagram?: string;
  accent: string;
  gradient: string;
  features: string[];
};

const profiles: Record<FullClientSlug, Profile> = {
  ontap: {
    name: "On Tap Pub",
    eyebrow: "Tijuca • pub • cerveja • gastronomia",
    headline: "Seu pub na Tijuca, agora com uma experiência digital completa.",
    description: "Front público, reservas, relacionamento, Clube Impulsionando, CRM, ERP, PDV, estoque e jornadas automatizadas conectados em uma única operação.",
    location: "Tijuca • Rio de Janeiro",
    instagram: "ontappub",
    accent: "text-amber-300",
    gradient: "from-zinc-950 via-amber-950 to-zinc-950",
    features: ["PDV + estoque", "CRM de frequência", "ERP integrado", "Reservas e eventos", "Clube Impulsionando", "BI e automações"],
  },
  raoni: {
    name: "Boteco do Raoni",
    eyebrow: "Grajaú • boteco • cervejas especiais",
    headline: "Boteco de verdade, cerveja levada a sério e tecnologia trabalhando sem aparecer.",
    description: "Torneiras conectadas ao estoque, dosometria por mililitro, controle de barris, CRM, ERP, Clube e jornadas automáticas em uma operação Full.",
    location: "Grajaú • Rio de Janeiro",
    instagram: "botecodoraoni",
    accent: "text-emerald-300",
    gradient: "from-emerald-950 via-stone-950 to-amber-950",
    features: ["Torneiras em tempo real", "Dosometria por ml", "Barris 30/40/50L", "CRM", "ERP", "Clube Impulsionando"],
  },
  riobeer: {
    name: "Rio Beer",
    eyebrow: "Rio de Janeiro • cerveja • experiência",
    headline: "Cerveja, descoberta e relacionamento em uma experiência digital viva.",
    description: "Catálogo, estoque, CRM, ERP, campanhas, Clube e inteligência operacional reunidos em uma experiência pública preparada para vender e relacionar.",
    accent: "text-sky-300",
    gradient: "from-sky-950 via-blue-950 to-zinc-950",
    features: ["Catálogo dinâmico", "Estoque conectado", "CRM", "ERP", "Campanhas", "Clube Impulsionando"],
  },
  spartacus: {
    name: "Spartacus Brewing",
    eyebrow: "cervejaria • criatividade • rótulos",
    headline: "Uma cervejaria com presença digital à altura da própria personalidade.",
    description: "Marca, rótulos, descoberta e comunidade no front; estoque, vendas, CRM, ERP, campanhas e inteligência por trás.",
    instagram: "spartacusbrewing",
    accent: "text-orange-300",
    gradient: "from-red-950 via-zinc-950 to-orange-950",
    features: ["Rótulos protagonistas", "Storytelling", "Estoque", "CRM", "ERP", "Clube Impulsionando"],
  },
  peroladavila: {
    name: "Salão Pérola da Vila",
    eyebrow: "Vila Isabel • beleza • cuidado",
    headline: "Beleza com acolhimento, agenda simples e relacionamento contínuo.",
    description: "Serviços, agenda, CRM, estoque, financeiro, campanhas, fidelidade e automações em uma experiência Full pensada para conversão e recorrência.",
    location: "Vila Isabel • Rio de Janeiro",
    instagram: "salaoperolada",
    accent: "text-rose-200",
    gradient: "from-rose-950 via-fuchsia-950 to-zinc-950",
    features: ["Agenda inteligente", "CRM", "ERP", "Estoque", "Financeiro", "Clube Impulsionando"],
  },
};

export function FullClientLanding({ slug }: { slug: FullClientSlug }) {
  const p = profiles[slug];
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <strong className="tracking-tight">{p.name}</strong>
          <Link to="/clube" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950">Clube Impulsionando</Link>
        </div>
      </header>
      <main>
        <section className={`bg-gradient-to-br ${p.gradient}`}>
          <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <div className={`mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] ${p.accent}`}><Sparkles className="h-3.5 w-3.5" />{p.eyebrow}</div>
              <h1 className="text-4xl font-black leading-tight sm:text-6xl">{p.headline}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{p.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#full" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-zinc-950">Conhecer a experiência <ArrowRight className="h-4 w-4" /></a>
                <Link to="/clube" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold"><Crown className="h-4 w-4" />Entrar no Clube</Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-4 text-sm text-white/60">
                {p.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{p.location}</span> : null}
                {p.instagram ? <a className="inline-flex items-center gap-1.5 hover:text-white" href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" />@{p.instagram}</a> : null}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3">
                {p.features.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold">{item}</div>)}
              </div>
            </div>
          </div>
        </section>
        <section id="full" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className={`text-sm font-bold uppercase tracking-[.18em] ${p.accent}`}>Impulsionando Full</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black sm:text-5xl">Front-end que converte. CRM, ERP, operação e automação sustentando tudo por trás.</h2>
          <p className="mt-5 max-w-3xl text-white/65">Cada cliente mantém sua identidade própria, enquanto o ecossistema conecta dados, relacionamento, financeiro, estoque, jornadas, BI e benefícios do Clube em uma arquitetura única.</p>
        </section>
      </main>
    </div>
  );
}
