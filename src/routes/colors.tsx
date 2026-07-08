import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Sparkles, Heart, Baby, Zap, Moon, Dumbbell, Droplets, Instagram, Youtube, Phone, MessageCircle, CheckCircle2 } from "lucide-react";

/**
 * colors.impulsionando.com.br — Landing FRONT-END only.
 * Referência de conteúdo: https://grupocolors.com.br/colors-saude/
 * Somente UI/apresentação. Nenhuma alteração de backend/infra.
 */

export const Route = createFileRoute("/colors")({
  head: () => ({
    meta: [
      { title: "Colors Saúde — Diversidade transformando vidas com qualidade premium" },
      { name: "description", content: "Colors Saúde: soluções em emagrecimento, libido, sono, virilidade masculina e saúde infantil. Submarcas Green, Blue e Yellow com produtos premium e canais oficiais de venda." },
      { property: "og:title", content: "Colors Saúde — Qualidade Premium em Saúde e Bem-Estar" },
      { property: "og:description", content: "Green (mulheres), Blue (homens) e Yellow (infantil). Produtos oficiais, entrega Colors Log e atendimento humano." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://colors.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/" }],
  }),
  component: ColorsSaudePage,
});

type Product = {
  brand: "Green" | "Blue" | "Yellow" | "Colors";
  name: string;
  tagline: string;
  description: string;
  bullets?: string[];
  links: { label: string; href: string }[];
  accent: string; // tailwind gradient classes
  emoji: string;
};

const PRODUCTS: Product[] = [
  {
    brand: "Green",
    name: "Super Green Black",
    tagline: "O campeão do emagrecimento",
    description:
      "Unimos os melhores segredos do emagrecimento com poderosos ativos de queima de gordura. Resultados já nos primeiros três dias.",
    links: [
      { label: "Maisfy", href: "https://supergreenblack.com.br/m" },
      { label: "Monetizze", href: "https://supergreenblack.com.br/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p" },
    ],
    accent: "from-emerald-500 to-lime-500",
    emoji: "💚",
  },
  {
    brand: "Green",
    name: "Super S.O.S. Hair",
    tagline: "A revolução em crescimento capilar",
    description:
      "Vitaminas A, D, E, C, B3, B5, B6 e B7. Crescimento até 6x mais rápido, combate à queda e fortalecimento de unhas.",
    links: [
      { label: "Maisfy", href: "http://supersoshair.com.br/m" },
      { label: "Monetizze", href: "http://supersoshair.com.br/" },
      { label: "Perfect Pay", href: "https://supersoshair.com.br/p/" },
    ],
    accent: "from-emerald-500 to-teal-500",
    emoji: "🌿",
  },
  {
    brand: "Green",
    name: "Super Green Black Creatina",
    tagline: "100% pura. Força e performance.",
    description:
      "Aumento de força e potência muscular, melhora de performance em alta intensidade, ganho de massa magra e recuperação aprimorada.",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/creatina/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-creatina/" },
    ],
    accent: "from-emerald-600 to-green-500",
    emoji: "💪",
  },
  {
    brand: "Green",
    name: "Super Green Black Pré-Treino",
    tagline: "Explosão de energia e foco",
    description:
      "Energia e resiliência muscular, aumento de força, queima de gordura, recuperação rápida, foco mental e clareza.",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/pre-treino/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-pre-treino/" },
    ],
    accent: "from-lime-500 to-emerald-500",
    emoji: "⚡",
  },
  {
    brand: "Green",
    name: "Ômega 3 Peixinho — Sabor Cereja",
    tagline: "Saúde do coração e do cérebro",
    description:
      "Cápsulas com sabor irresistível para toda a família. Suporte cardiovascular, cerebral e imunológico.",
    links: [
      { label: "Monetizze", href: "https://supergreenblack.com.br/omega3/" },
      { label: "Perfect Pay", href: "https://supergreenblack.com.br/p-omega3/" },
    ],
    accent: "from-teal-500 to-cyan-500",
    emoji: "🐟",
  },
  {
    brand: "Blue",
    name: "Mesa no Pau",
    tagline: "Seja o super herói da sua própria história",
    description:
      "A revolução masculina da Blue. Performance de até 4 horas, confiança e vitalidade em uma fórmula premium.",
    links: [
      { label: "Maisfy", href: "https://mesanopau.com.br/m" },
      { label: "Monetizze", href: "https://mesanopau.com.br/" },
      { label: "Perfect Pay", href: "https://mesanopau.com.br/p" },
    ],
    accent: "from-blue-600 to-indigo-600",
    emoji: "💙",
  },
  {
    brand: "Yellow",
    name: "Super Bam Bam Bam",
    tagline: "A energia que toda criança precisa",
    description:
      "Gominhas em formato de ursinho, sabor framboesa. Auxilia no crescimento, no desenvolvimento saudável e na disposição diária.",
    links: [
      { label: "Maisfy", href: "https://superbambam.com.br/m" },
      { label: "Monetizze", href: "https://superbambam.com.br/" },
      { label: "Perfect Pay", href: "https://superbambam.com.br/p" },
    ],
    accent: "from-yellow-400 to-amber-500",
    emoji: "🧸",
  },
  {
    brand: "Colors",
    name: "Super S.O.S Sleep",
    tagline: "O rei do sono",
    description:
      "Induz o sono naturalmente, promove sono restaurador, combate a insônia e melhora o humor. Seu companheiro noturno.",
    links: [
      { label: "Maisfy", href: "https://supersossleep.com.br/m" },
      { label: "Monetizze", href: "https://supersossleep.com.br/" },
      { label: "Perfect Pay", href: "https://supersossleep.com.br/p" },
    ],
    accent: "from-violet-600 to-fuchsia-600",
    emoji: "🌙",
  },
];

const BRAND_FILTERS = ["Todos", "Green", "Blue", "Yellow", "Colors"] as const;
type BrandFilter = (typeof BRAND_FILTERS)[number];

function ColorsSaudePage() {
  const [filter, setFilter] = useState<BrandFilter>("Todos");
  useEffect(() => {
    // Aplica accent visual mesmo fora do TenantBrandingProvider.
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--brand-primary");
    root.style.setProperty("--brand-primary", "142 71% 45%");
    return () => {
      if (prev) root.style.setProperty("--brand-primary", prev);
      else root.style.removeProperty("--brand-primary");
    };
  }, []);

  const visible = PRODUCTS.filter((p) => filter === "Todos" || p.brand === filter);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white antialiased">
      <TopBar />
      <Hero />
      <TrustStrip />
      <QuemSomos />
      <SubmarcasGrid />

      <section id="produtos" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="container relative mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Nossos Produtos</p>
            <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Linha completa. Qualidade premium.</h2>
            <p className="mt-4 text-lg text-white/70">
              Produtos oficiais das submarcas Green, Blue, Yellow e Colors. Compre apenas pelos canais autorizados listados abaixo.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {BRAND_FILTERS.map((b) => (
              <button
                key={b}
                onClick={() => setFilter(b)}
                className={
                  "rounded-full border px-5 py-2 text-sm font-medium transition " +
                  (filter === b
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : "border-white/15 text-white/70 hover:border-white/30 hover:text-white")
                }
              >
                {b}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.name} product={p} />
            ))}
          </div>
        </div>
      </section>

      <Depoimentos />
      <Logistica />
      <Ebooks />
      <Newsletter />
      <SiteFooter />
      <FloatingWhats />
    </div>
  );
}

/* -------------------------- Sections -------------------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f0d]/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
          <span className="text-lg font-black tracking-tight">
            colors<span className="text-emerald-400">.</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
          <a href="#quem-somos" className="hover:text-white">Quem somos</a>
          <a href="#submarcas" className="hover:text-white">Submarcas</a>
          <a href="#produtos" className="hover:text-white">Produtos</a>
          <a href="#logistica" className="hover:text-white">Entrega</a>
          <a href="#contato" className="hover:text-white">Contato</a>
        </nav>
        <a
          href="https://wa.me/5521967862834"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 sm:inline-flex"
        >
          Falar no WhatsApp
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_0%,rgba(16,185,129,0.35),transparent_60%),radial-gradient(800px_circle_at_80%_20%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(700px_circle_at_50%_100%,rgba(234,179,8,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,15,13,1))]" />
      </div>

      <div className="container relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Diversidade · Qualidade Premium
        </span>
        <h1 className="mt-6 max-w-4xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-black leading-[1.05] text-transparent sm:text-7xl">
          Colors Saúde <span className="text-emerald-400">transforma vidas</span> com produtos que funcionam.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
          Soluções em emagrecimento, libido, sono, virilidade masculina e saúde infantil. Uma família de marcas para cada momento da sua vida.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#produtos"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 font-semibold text-black shadow-2xl shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            Ver produtos oficiais <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#submarcas"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Conheça as submarcas
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { n: "45k+", l: "Afiliados" },
            { n: "25k+", l: "Vendas / ano" },
            { n: "8", l: "Produtos premium" },
            { n: "100%", l: "Canais oficiais" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-black text-white sm:text-4xl">{s.n}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, label: "Produtos autênticos" },
    { icon: Truck, label: "Colors Log · entrega rápida" },
    { icon: Heart, label: "Feito com cuidado" },
    { icon: CheckCircle2, label: "Canais oficiais" },
  ];
  return (
    <div className="border-y border-white/10 bg-white/[0.02]">
      <div className="container mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-3 text-sm text-white/70">
            <Icon className="h-5 w-5 text-emerald-400" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuemSomos() {
  return (
    <section id="quem-somos" className="py-24">
      <div className="container mx-auto grid max-w-7xl gap-16 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Quem somos</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Nascemos para ser referência em saúde e bem-estar.
          </h2>
          <div className="mt-6 space-y-4 text-white/70">
            <p>
              Em 2019 a marca <strong className="text-white">Green</strong> estreou com o Super Green,
              rapidamente se tornando um dos emagrecedores mais populares do Brasil — mais de 25.000 vendas
              no primeiro ano e uma rede de 45.000 afiliados.
            </p>
            <p>
              Em 2022, a Green passou a integrar a estrutura da <strong className="text-white">Colors Saúde</strong>.
              Nasceram então as submarcas <span className="text-emerald-400 font-semibold">Green</span> (feminino),
              <span className="text-blue-400 font-semibold"> Blue</span> (masculino) e
              <span className="text-yellow-400 font-semibold"> Yellow</span> (infantil), com uma linha ampla e premium.
            </p>
            <p>
              Compre sempre pelos <strong className="text-white">canais oficiais</strong> listados aqui. A Colors
              e suas submarcas <strong className="text-white">não vendem em marketplaces</strong> como Mercado Livre.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20 blur-2xl" />
          <div className="relative grid grid-cols-2 gap-4">
            {[
              { icon: Sparkles, t: "Emagrecimento", c: "from-emerald-500 to-lime-500" },
              { icon: Zap, t: "Performance", c: "from-lime-500 to-yellow-400" },
              { icon: Moon, t: "Sono e Calma", c: "from-violet-600 to-fuchsia-600" },
              { icon: Baby, t: "Saúde Infantil", c: "from-yellow-400 to-amber-500" },
              { icon: Dumbbell, t: "Força Masculina", c: "from-blue-600 to-indigo-600" },
              { icon: Droplets, t: "Cabelo e Beleza", c: "from-teal-500 to-emerald-500" },
            ].map(({ icon: Icon, t, c }) => (
              <div key={t} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.06]">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c} text-black shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SubmarcasGrid() {
  const subs = [
    {
      name: "Green",
      audience: "Público feminino",
      color: "from-emerald-500 via-green-500 to-lime-500",
      copy: "Emagrecimento, beleza, cabelo e performance. Fórmulas que entregam resultado com segurança.",
      icon: Sparkles,
    },
    {
      name: "Blue",
      audience: "Público masculino",
      color: "from-blue-600 via-indigo-600 to-sky-500",
      copy: "Virilidade, libido, força e vitalidade. Fórmulas premium para o homem que quer performar.",
      icon: Dumbbell,
    },
    {
      name: "Yellow",
      audience: "Público infantil",
      color: "from-yellow-400 via-amber-400 to-orange-400",
      copy: "Vitaminas, crescimento e disposição. Sabor irresistível e cuidado com quem a gente mais ama.",
      icon: Baby,
    },
  ];
  return (
    <section id="submarcas" className="relative py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Submarcas</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Uma família para cada público.</h2>
          <p className="mt-4 text-lg text-white/70">
            Diferentes cores, diferentes propósitos, o mesmo compromisso com qualidade premium.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {subs.map((s) => (
            <div key={s.name} className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${s.color} p-8 text-black shadow-2xl transition hover:-translate-y-1`}>
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <s.icon className="h-9 w-9" />
              <h3 className="mt-6 text-4xl font-black">{s.name}</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wider opacity-80">{s.audience}</p>
              <p className="mt-4 text-black/80">{s.copy}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                Ver produtos <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${product.accent}`} />
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${product.accent} px-3 py-1 text-xs font-bold text-black`}>
          {product.brand}
        </span>
        <span className="text-2xl">{product.emoji}</span>
      </div>
      <h3 className="mt-4 text-2xl font-bold leading-tight">{product.name}</h3>
      <p className="mt-1 text-sm font-semibold text-emerald-300">{product.tagline}</p>
      <p className="mt-3 text-sm text-white/70">{product.description}</p>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Canais oficiais</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Depoimentos() {
  const items = [
    { name: "Camila R.", brand: "Green", text: "Perdi 8kg em 60 dias com o Super Green Black. Nunca me senti tão bem comigo mesma." },
    { name: "Rafael M.", brand: "Blue", text: "O Mesa no Pau devolveu minha confiança. Recomendo de olhos fechados." },
    { name: "Juliana T.", brand: "Yellow", text: "Meu filho ama o Bam Bam Bam. Finalmente uma vitamina que ele pede pra tomar!" },
  ];
  return (
    <section className="border-t border-white/10 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Histórias reais</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Transformando vidas todos os dias.</h2>
          <p className="mt-4 text-lg text-white/70">
            Em vez de prometer, compartilhamos resultados reais de quem confia na Colors Saúde.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((d) => (
            <figure key={d.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <blockquote className="text-white/80">"{d.text}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 font-bold text-black">
                  {d.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-white/50">Cliente {d.brand}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Logistica() {
  return (
    <section id="logistica" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
      <div className="container relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-white/5 to-emerald-600/20 p-10">
          <Truck className="h-12 w-12 text-emerald-400" />
          <h3 className="mt-6 text-3xl font-bold">Colors Log</h3>
          <p className="mt-3 text-white/70">
            Nossa logística própria garante que seu pedido chegue rápido e em segurança. Despacho em até 3 dias úteis e entrega entre 3 e 10 dias úteis conforme CEP.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Rastreamento por e-mail</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Suporte pelo WhatsApp</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Embalagem discreta</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Prazos & Entrega</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Segurança do pedido à porta.</h2>
          <p className="mt-4 text-lg text-white/70">
            Toda a operação logística da Colors Saúde é feita pela Colors Log. Você acompanha cada etapa e conta com nosso time para qualquer dúvida.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatBox n="3 dias úteis" l="Despacho" />
            <StatBox n="3 a 10 dias" l="Entrega" />
            <StatBox n="24/7" l="WhatsApp" />
            <StatBox n="100%" l="Rastreado" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBox({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-2xl font-black text-emerald-400">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{l}</div>
    </div>
  );
}

function Ebooks() {
  return (
    <section className="border-y border-white/10 bg-gradient-to-br from-emerald-950/60 via-[#0a0f0d] to-blue-950/40 py-20">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Presente pra você</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Baixe nossos e-books de saúde.</h2>
          <p className="mt-4 text-lg text-white/70">
            Preencha o formulário e receba 2 e-books incríveis por e-mail com dicas práticas de bem-estar.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
          >
            <input
              type="text"
              placeholder="Seu nome"
              className="col-span-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400 sm:col-span-1"
            />
            <input
              type="email"
              placeholder="Seu e-mail"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
            />
            <select className="col-span-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-emerald-400 sm:col-span-1">
              <option>Gênero</option>
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Prefiro não dizer</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
            >
              Enviar e receber presente
            </button>
            <p className="col-span-2 text-xs text-white/50">Ao enviar você aceita nossa política de privacidade.</p>
          </form>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 blur-2xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="text-6xl">📚</div>
            <p className="mt-4 text-lg font-semibold">2 e-books exclusivos</p>
            <p className="mt-1 text-sm text-white/60">Enviados direto pra sua caixa de entrada.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section id="contato" className="py-20">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Comunidade Colors</p>
        <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Receba dicas de saúde e ofertas exclusivas.</h2>
        <p className="mt-4 text-lg text-white/70">
          Cadastre-se e faça parte da comunidade Colors. Você escolhe: e-mail, SMS ou WhatsApp.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            placeholder="seu@email.com"
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
          />
          <button className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-emerald-400">
            Quero receber
          </button>
        </form>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
              <span className="text-lg font-black">colors<span className="text-emerald-400">.</span></span>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Diversidade transformando vidas com qualidade premium. Green · Blue · Yellow.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Institucional</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><a className="hover:text-white" href="#quem-somos">Quem somos</a></li>
              <li><a className="hover:text-white" href="#submarcas">Submarcas</a></li>
              <li><a className="hover:text-white" href="#produtos">Produtos</a></li>
              <li><a className="hover:text-white" href="#logistica">Colors Log</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Redes sociais</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white" href="https://www.instagram.com/colorssaude/"><Instagram className="h-4 w-4" /> @colorssaude</a></li>
              <li><a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white" href="https://www.youtube.com/@colorssaude"><Youtube className="h-4 w-4" /> YouTube Colors</a></li>
              <li><a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white" href="https://www.instagram.com/green.bemestar/"><Instagram className="h-4 w-4" /> @green.bemestar</a></li>
              <li><a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white" href="https://www.instagram.com/blue.bemestar/"><Instagram className="h-4 w-4" /> @blue.bemestar</a></li>
              <li><a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white" href="https://www.instagram.com/yellow.bemestar/"><Instagram className="h-4 w-4" /> @yellow.bemestar</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Atendimento</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-400" /> 21 96786-2834</li>
              <li>
                <a href="https://wa.me/5521967862834" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle className="h-4 w-4 text-emerald-400" /> WhatsApp SAC
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © 2020–{new Date().getFullYear()} Colors Saúde · CNPJ 40.314.815/0001-60 · Submarcas: Green (mulheres), Blue (homens) e Yellow (infantil) · www.colorssaude.com.br
        </div>
      </div>
    </footer>
  );
}

function FloatingWhats() {
  return (
    <a
      href="https://wa.me/5521967862834"
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
