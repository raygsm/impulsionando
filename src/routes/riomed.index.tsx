import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getRiomedSiteSettings,
  listRiomedPublicProducts,
} from "@/lib/riomed-public.functions";
import { InlineLoginCard } from "./riomed";
import {
  Stethoscope,
  HeartPulse,
  Truck,
  Wrench,
  Hospital,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Bed,
  Activity,
  Syringe,
  Package,
  CheckCircle2,
  ShoppingCart,
  MessageCircle,
  Building2,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/riomed/")({
  head: () => ({
    meta: [
      { title: "Rio Med — Equipos e Insumos Médicos en Bolivia" },
      {
        name: "description",
        content:
          "Venta, alquiler, mantenimiento, calibración y soporte técnico de equipos médicos para hospitales, clínicas, consultorios, ambulancias y home care en toda Bolivia.",
      },
      {
        property: "og:title",
        content: "Rio Med — Equipos e Insumos Médicos en Bolivia",
      },
      {
        property: "og:description",
        content:
          "Plataforma médica completa: venta, alquiler mensual, servicio técnico y atención comercial especializada.",
      },
    ],
  }),
  component: RiomedHome,
});

function RiomedHome() {
  const getSettings = useServerFn(getRiomedSiteSettings);
  const listProducts = useServerFn(listRiomedPublicProducts);
  const settings = useQuery({
    queryKey: ["riomed-site-settings"],
    queryFn: () => getSettings(),
  });
  const [q, setQ] = useState("");
  const products = useQuery({
    queryKey: ["riomed-public-products", q],
    queryFn: () => listProducts({ data: { search: q || undefined, limit: 8 } }),
  });
  const s = settings.data?.settings;

  return (
    <div className="bg-white">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[color:var(--riomed-deep)] via-[color:var(--riomed-primary)] to-[#0a4a8a] text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px, 60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider mb-5 border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Plataforma médica · Bolivia
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5">
              Equipos e Insumos Médicos
              <br />
              <span className="text-[color:var(--riomed-accent)]">
                para Toda Bolivia
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl mb-8">
              Venta, alquiler, mantenimiento, calibración y soporte técnico
              especializado para hospitales, clínicas, consultorios, ambulancias,
              home care y profesionales de la salud.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to="/riomed/productos"
                className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--riomed-green)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition px-6 py-3.5 font-bold text-white shadow-lg shadow-green-900/30"
              >
                <ShoppingCart className="h-5 w-5" />
                Ver catálogo
              </Link>
              <Link
                to="/riomed/servicio-tecnico"
                className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--riomed-orange)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-900/30"
              >
                <Headphones className="h-5 w-5" />
                Quero suporte técnico
              </Link>
              <Link
                to="/riomed/cotizar"
                className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--riomed-accent)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition px-6 py-3.5 font-bold text-white shadow-lg shadow-teal-900/30"
              >
                <MessageCircle className="h-5 w-5" />
                Falar com vendedor
              </Link>
            </div>

            <form
              className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-2xl max-w-xl"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar equipo, código o marca…"
                className="flex-1 bg-transparent outline-none text-slate-900 px-2 py-2.5 text-[15px]"
              />
              <Link
                to="/riomed/productos"
                search={{ q } as any}
                className="rounded-lg px-5 py-2.5 text-white font-bold text-sm bg-[color:var(--riomed-primary)] hover:brightness-110 transition"
              >
                Buscar
              </Link>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
              {["Garantía", "Entrega técnica", "BOB · USD ref.", "Soporte 24/7"].map(
                (t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--riomed-accent)]" />
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          <div>
            <InlineLoginCard />
          </div>
        </div>
      </section>

      {/* ===================== JORNADAS POR TIPO DE CLIENTE ===================== */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Atendimento por perfil
          </h2>
          <p className="text-slate-600 text-lg">
            Soluções dedicadas para cada tipo de cliente.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {JORNADAS.map((j) => (
            <Link
              key={j.title}
              to={j.to}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="h-32 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${j.from}, ${j.to_color})` }}
              >
                <j.icon className="absolute right-4 top-4 h-20 w-20 text-white/20 group-hover:scale-110 transition-transform" />
                <div className="absolute left-5 bottom-3 right-5">
                  <div className="text-white font-extrabold text-xl drop-shadow">
                    {j.title}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {j.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[color:var(--riomed-primary)] group-hover:gap-2 transition-all">
                  Ver soluções <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================== CATEGORIAS ============================== */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Categorias
              </h2>
              <p className="text-slate-600">Navegue pelo catálogo médico completo.</p>
            </div>
            <Link
              to="/riomed/productos"
              className="text-sm font-bold inline-flex items-center gap-1 text-[color:var(--riomed-primary)] hover:gap-2 transition-all"
            >
              Ver tudo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIAS.map((c) => (
              <Link
                key={c.label}
                to="/riomed/productos"
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-[color:var(--riomed-primary)] hover:shadow-md transition"
              >
                <div className="h-11 w-11 rounded-lg bg-[color:var(--riomed-primary)]/10 text-[color:var(--riomed-primary)] grid place-items-center group-hover:bg-[color:var(--riomed-primary)] group-hover:text-white transition">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm text-slate-800 leading-tight">
                  {c.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CONFIANÇA ============================ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONFIANCA.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition"
            >
              <div className="h-12 w-12 rounded-xl bg-[color:var(--riomed-accent)]/10 text-[color:var(--riomed-accent)] grid place-items-center mb-4">
                <c.icon className="h-6 w-6" />
              </div>
              <div className="font-extrabold text-lg text-slate-900 mb-1">
                {c.title}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ DESTAQUES ============================ */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Produtos em destaque
              </h2>
              <p className="text-slate-600">
                Preços em BOB e USD referencial — fonte oficial boliviana.
              </p>
            </div>
            <Link
              to="/riomed/productos"
              className="text-sm font-bold inline-flex items-center gap-1 text-[color:var(--riomed-primary)] hover:gap-2 transition-all"
            >
              Ver catálogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(products.data?.items ?? []).slice(0, 8).map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
            {!products.data?.items?.length &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white animate-pulse"
                >
                  <div className="aspect-square bg-slate-100 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded mt-3" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ============================ LOCAÇÕES ============================ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-[color:var(--riomed-primary)] to-[color:var(--riomed-accent)] text-white p-8 md:p-12 grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
              Assinatura mensal
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              Locação de equipamentos médicos
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-xl">
              UTI, home care, ambulâncias, centro cirúrgico e equipamentos de
              apoio com manutenção inclusa e entrega técnica.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/riomed/alquiler"
                className="rounded-lg bg-white text-[color:var(--riomed-primary)] hover:brightness-95 hover:-translate-y-0.5 transition px-6 py-3 font-bold shadow-lg"
              >
                Ver planos de locação
              </Link>
              <Link
                to="/riomed/cotizar"
                className="rounded-lg bg-[color:var(--riomed-deep)] text-white hover:brightness-125 hover:-translate-y-0.5 transition px-6 py-3 font-bold"
              >
                Falar com vendedor
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: HeartPulse, label: "UTI" },
              { icon: Bed, label: "Home Care" },
              { icon: Truck, label: "Ambulâncias" },
              { icon: Activity, label: "Centro Cirúrgico" },
            ].map((x) => (
              <div
                key={x.label}
                className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-5"
              >
                <x.icon className="h-8 w-8 mb-2" />
                <div className="font-bold">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ SERVIÇOS ============================ */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
              Serviços técnicos
            </h2>
            <p className="text-slate-600 text-lg">
              Equipe especializada para instalação, manutenção e calibração.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICOS.map((s) => (
              <Link
                key={s.title}
                to="/riomed/servicio-tecnico"
                className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-[color:var(--riomed-orange)] transition"
              >
                <div className="h-12 w-12 rounded-xl bg-[color:var(--riomed-orange)]/10 text-[color:var(--riomed-orange)] grid place-items-center mb-3 group-hover:bg-[color:var(--riomed-orange)] group-hover:text-white transition">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="font-extrabold text-slate-900 mb-1">{s.title}</div>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= CTA FINAL ============================= */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Precisa de um equipamento específico?
        </h2>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
          Fale agora com um vendedor Rio Med ou abra um chamado de suporte
          técnico. Atendimento profissional em toda a Bolívia.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/riomed/cotizar"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-4 bg-[color:var(--riomed-accent)] text-white font-bold hover:brightness-110 hover:-translate-y-0.5 transition shadow-xl shadow-teal-200"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com vendedor
          </Link>
          <Link
            to="/riomed/servicio-tecnico"
            className="inline-flex items-center gap-2 rounded-lg px-7 py-4 bg-[color:var(--riomed-orange)] text-white font-bold hover:brightness-110 hover:-translate-y-0.5 transition shadow-xl shadow-orange-200"
          >
            <Headphones className="h-5 w-5" />
            Quero suporte técnico
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------ PRODUCT CARD ------------------------------ */
function ProductCard({ p }: { p: any }) {
  const priceBOB = p.price_bob ?? p.price ?? null;
  const priceUSD = p.price_usd ?? (priceBOB ? +(priceBOB / 6.96).toFixed(2) : null);
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
      <div className="aspect-square bg-slate-50 grid place-items-center overflow-hidden relative">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Stethoscope className="h-12 w-12 text-slate-300" />
        )}
        {p.condition && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              p.condition === "novo" || p.condition === "nuevo"
                ? "bg-[color:var(--riomed-green)] text-white"
                : "bg-slate-700 text-white"
            }`}
          >
            {p.condition}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-[11px] text-slate-500 font-mono mb-0.5">{p.sku}</div>
        <div className="font-bold text-sm text-slate-900 line-clamp-2 h-10 mb-2">
          {p.name}
        </div>
        {priceBOB ? (
          <div className="mb-3">
            <div className="text-lg font-extrabold text-[color:var(--riomed-primary)] leading-none">
              BOB {Number(priceBOB).toLocaleString("es-BO")}
            </div>
            {priceUSD && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                ≈ USD {priceUSD.toLocaleString("en-US")}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 text-xs font-semibold text-slate-500">
            Sob cotación
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            to="/riomed/carrinho"
            search={{ add: p.sku } as any}
            className="text-center text-xs rounded-md py-2 font-bold text-white bg-[color:var(--riomed-primary)] hover:brightness-110 transition"
          >
            Carrinho
          </Link>
          <Link
            to={priceBOB ? "/riomed/checkout" : "/riomed/cotizar"}
            search={{ producto: p.sku } as any}
            className="text-center text-xs rounded-md py-2 font-bold text-white bg-[color:var(--riomed-green)] hover:brightness-110 transition"
          >
            {priceBOB ? "Comprar" : "Cotizar"}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- DATA ---------------------------------- */
const JORNADAS = [
  {
    title: "Hospitais",
    desc: "Volume, UTI, centro cirúrgico, manutenção e contratos mensais com SLA.",
    icon: Hospital,
    to: "/riomed/hospitales",
    from: "#0B3D74",
    to_color: "#0a4a8a",
  },
  {
    title: "Clínicas",
    desc: "Diagnóstico, equipamentos médicos, calibração, instalação e garantia.",
    icon: Building2,
    to: "/riomed/hospitales",
    from: "#0AB1A0",
    to_color: "#06b6d4",
  },
  {
    title: "Consultórios",
    desc: "Compra rápida, equipamentos compactos, kits e suporte inicial.",
    icon: Stethoscope,
    to: "/riomed/productos",
    from: "#0e7c66",
    to_color: "#16a34a",
  },
  {
    title: "Ambulâncias",
    desc: "Desfibriladores, oxigênio, monitores e atendimento de urgência.",
    icon: Truck,
    to: "/riomed/productos",
    from: "#ea580c",
    to_color: "#dc2626",
  },
  {
    title: "Home Care",
    desc: "Locação mensal, cama hospitalar, concentrador e suporte familiar.",
    icon: Bed,
    to: "/riomed/alquiler",
    from: "#0B3D74",
    to_color: "#0AB1A0",
  },
  {
    title: "Profissionais da Saúde",
    desc: "Acessórios, insumos, produtos menores e compra direta.",
    icon: UserRound,
    to: "/riomed/productos",
    from: "#062a52",
    to_color: "#0B3D74",
  },
] as const;

const CATEGORIAS = [
  { label: "Equipamentos hospitalares", icon: Hospital },
  { label: "Diagnóstico", icon: Activity },
  { label: "UTI", icon: HeartPulse },
  { label: "Centro cirúrgico", icon: Wrench },
  { label: "Insumos", icon: Syringe },
  { label: "Acessórios", icon: Package },
  { label: "Locação", icon: Bed },
  { label: "Serviços técnicos", icon: Headphones },
] as const;

const CONFIANCA = [
  {
    title: "Venda e locação",
    desc: "Catálogo completo para compra direta ou contratação mensal.",
    icon: ShoppingCart,
  },
  {
    title: "Suporte técnico",
    desc: "Equipe especializada para instalação, calibração e manutenção.",
    icon: Headphones,
  },
  {
    title: "Garantia",
    desc: "Produtos com garantia e atendimento pós-venda em toda Bolívia.",
    icon: ShieldCheck,
  },
  {
    title: "Entrega técnica",
    desc: "Logística médica com retirada na loja ou despacho ao destino.",
    icon: Truck,
  },
] as const;

const SERVICOS = [
  { title: "Manutenção preventiva", desc: "Plano programado para garantir disponibilidade.", icon: Wrench },
  { title: "Manutenção corretiva", desc: "Atendimento técnico para falhas e reparos.", icon: Wrench },
  { title: "Instalação", desc: "Montagem e configuração no local.", icon: Activity },
  { title: "Calibração", desc: "Certificação e ajuste fino de equipamentos.", icon: ShieldCheck },
] as const;

void Users;
