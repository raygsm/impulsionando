import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FloatingWhatsApp } from "@/components/riomed/FloatingWhatsApp";
import { getRiomedSiteSettings } from "@/lib/riomed-public.functions";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  Headphones,
  MessageCircle,
  ChevronDown,
  Menu as MenuIcon,
  X,
  LogIn,
  Stethoscope,
  HeartPulse,
  Truck,
  Wrench,
  Hospital,
  Activity,
  Syringe,
  Bed,
} from "lucide-react";

export const Route = createFileRoute("/riomed")({
  component: RiomedLayout,
});

type NavItem = { to: string; label: string; mega?: "catalog" | "rental" | "services" };
const MAIN_NAV: NavItem[] = [
  { to: "/riomed", label: "Início" },
  { to: "/riomed/productos", label: "Catálogo", mega: "catalog" },
  { to: "/riomed/alquiler", label: "Locações", mega: "rental" },
  { to: "/riomed/servicio-tecnico", label: "Serviços", mega: "services" },
  { to: "/riomed/productos", label: "Comprar" },
];

function RiomedLayout() {
  const getSettings = useServerFn(getRiomedSiteSettings);
  const { data } = useQuery({
    queryKey: ["riomed-site-settings"],
    queryFn: () => getSettings(),
  });
  const s = data?.settings;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    // Paleta médica Rio Med — tokens locais
    root.style.setProperty("--riomed-primary", s?.primary_color ?? "#0B3D74"); // azul institucional
    root.style.setProperty("--riomed-accent", s?.accent_color ?? "#0AB1A0"); // turquesa
    root.style.setProperty("--riomed-deep", "#062a52"); // azul profundo
    root.style.setProperty("--riomed-cyan", "#06b6d4");
    root.style.setProperty("--riomed-green", "#16a34a");
    root.style.setProperty("--riomed-orange", "#ea580c");
    root.style.setProperty("--riomed-ink", "#0f172a");
  }, [s]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[color:var(--riomed-ink)] antialiased">
      {/* Topbar — institucional */}
      <div className="hidden md:block bg-[color:var(--riomed-deep)] text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Atendemos toda Bolívia</span>
            <span className="opacity-50">•</span>
            <span>Venta · Alquiler · Mantenimiento · Soporte Técnico</span>
          </div>
          <div className="flex items-center gap-3">
            <span>BOB / USD referencial — Banco Central de Bolivia</span>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/riomed" className="flex items-center gap-2 shrink-0">
            {s?.logo_url ? (
              <img src={s.logo_url} alt={s?.brand_name ?? "Rio Med"} className="h-10" />
            ) : (
              <span className="text-2xl font-extrabold tracking-tight text-[color:var(--riomed-primary)]">
                {s?.brand_name ?? "Rio Med"}
              </span>
            )}
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {MAIN_NAV.map((n) => (
              <div
                key={n.label}
                className="relative"
                onMouseEnter={() => n.mega && setOpenMega(n.mega)}
                onMouseLeave={() => setOpenMega(null)}
              >
                <Link
                  to={n.to}
                  className="px-3 py-2 rounded-md text-[15px] font-semibold text-slate-700 hover:text-[color:var(--riomed-primary)] hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                >
                  {n.label}
                  {n.mega && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </Link>
                {n.mega && openMega === n.mega && <MegaMenu kind={n.mega} />}
              </div>
            ))}
          </nav>

          <div className="flex-1" />

          {/* CTAs principais */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/riomed/carrinho"
              className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--riomed-primary)] hover:bg-slate-100 transition"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>

            <Link
              to="/riomed/soporte"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white bg-[color:var(--riomed-orange)] shadow-md shadow-orange-500/20 hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition"
            >
              <Headphones className="h-4 w-4" />
              Quero suporte técnico
            </Link>

            <Link
              to="/riomed/vendedor"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white bg-[color:var(--riomed-accent)] shadow-md shadow-teal-500/20 hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com vendedor
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              {MAIN_NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  className="block px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
              <div className="pt-3 grid grid-cols-1 gap-2">
                <Link
                  to="/riomed/soporte"
                  className="text-center rounded-lg px-3 py-2.5 font-bold text-white bg-[color:var(--riomed-orange)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Quero suporte técnico
                </Link>
                <Link
                  to="/riomed/vendedor"
                  className="text-center rounded-lg px-3 py-2.5 font-bold text-white bg-[color:var(--riomed-accent)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Falar com vendedor
                </Link>
                <Link
                  to="/riomed/carrinho"
                  className="text-center rounded-lg px-3 py-2.5 font-bold text-white bg-[color:var(--riomed-primary)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Ver carrinho
                </Link>
              </div>
              <div className="pt-3">
                <InlineLoginCard compact />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Rodapé limpo */}
      <footer className="mt-16 bg-[color:var(--riomed-deep)] text-white/90">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="text-xl font-extrabold text-white mb-2">
              {s?.brand_name ?? "Rio Med"}
            </div>
            <p className="text-white/70 leading-relaxed">
              Equipos e insumos médicos. Venta, alquiler, mantenimiento, calibración y
              soporte técnico para hospitales, clínicas, consultorios, ambulancias y
              home care en toda Bolivia.
            </p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Plataforma</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/riomed/productos" className="hover:text-white">Catálogo</Link></li>
              <li><Link to="/riomed/alquiler" className="hover:text-white">Locações</Link></li>
              <li><Link to="/riomed/servicio-tecnico" className="hover:text-white">Serviços</Link></li>
              <li><Link to="/riomed/carrinho" className="hover:text-white">Carrinho</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Institucional</div>
            <ul className="space-y-1.5 text-white/70">
              <li><Link to="/legal" className="hover:text-white">Privacidade</Link></li>
              <li><Link to="/legal" className="hover:text-white">Termos</Link></li>
              <li><Link to="/legal" className="hover:text-white">Garantia</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Contato</div>
            <ul className="space-y-1.5 text-white/70">
              {s?.whatsapp_official && <li>WhatsApp: {s.whatsapp_official}</li>}
              <li>Atendemos toda Bolívia</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Rio Med · Produzido e gerenciado por{" "}
          <span className="text-white font-semibold">Impulsionando Brasil</span>
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
}

/* ------------------------------ MEGA MENUS ------------------------------ */

function MegaMenu({ kind }: { kind: "catalog" | "rental" | "services" }) {
  const sections = MEGA_SECTIONS[kind];
  return (
    <div className="absolute left-0 top-full pt-2 w-[640px] z-50">
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xl p-5 grid grid-cols-2 gap-4">
        {sections.map((sec) => (
          <div key={sec.title}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--riomed-primary)] mb-2">
              {sec.title}
            </div>
            <ul className="space-y-1">
              {sec.items.map((it) => (
                <li key={it.label}>
                  <Link
                    to={it.to}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[color:var(--riomed-primary)]"
                  >
                    <it.icon className="h-4 w-4 opacity-70" />
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const MEGA_SECTIONS: Record<
  "catalog" | "rental" | "services",
  { title: string; items: { label: string; to: string; icon: any }[] }[]
> = {
  catalog: [
    {
      title: "Equipamentos",
      items: [
        { label: "Monitores multiparam.", to: "/riomed/productos", icon: Activity },
        { label: "Ventiladores", to: "/riomed/productos", icon: HeartPulse },
        { label: "Desfibriladores", to: "/riomed/productos", icon: HeartPulse },
        { label: "Bombas de infusão", to: "/riomed/productos", icon: Syringe },
        { label: "Camas hospitalares", to: "/riomed/productos", icon: Bed },
      ],
    },
    {
      title: "Diagnóstico & Insumos",
      items: [
        { label: "Eletrocardiógrafos", to: "/riomed/productos", icon: Activity },
        { label: "Oxímetros", to: "/riomed/productos", icon: Activity },
        { label: "Autoclaves", to: "/riomed/productos", icon: Wrench },
        { label: "Insumos e acessórios", to: "/riomed/productos", icon: Stethoscope },
        { label: "Novos e usados", to: "/riomed/productos", icon: Stethoscope },
      ],
    },
  ],
  rental: [
    {
      title: "Alta complexidade",
      items: [
        { label: "UTI", to: "/riomed/alquiler", icon: HeartPulse },
        { label: "Centro cirúrgico", to: "/riomed/alquiler", icon: Activity },
        { label: "Ambulâncias", to: "/riomed/alquiler", icon: Truck },
        { label: "Eventos médicos", to: "/riomed/alquiler", icon: Activity },
      ],
    },
    {
      title: "Atendimento e apoio",
      items: [
        { label: "Home Care", to: "/riomed/alquiler", icon: Bed },
        { label: "Clínicas", to: "/riomed/alquiler", icon: Hospital },
        { label: "Hospitais", to: "/riomed/alquiler", icon: Hospital },
        { label: "Equipamentos de apoio", to: "/riomed/alquiler", icon: Wrench },
      ],
    },
  ],
  services: [
    {
      title: "Técnico",
      items: [
        { label: "Manutenção preventiva", to: "/riomed/servicio-tecnico", icon: Wrench },
        { label: "Manutenção corretiva", to: "/riomed/servicio-tecnico", icon: Wrench },
        { label: "Calibração", to: "/riomed/servicio-tecnico", icon: Activity },
        { label: "Instalação", to: "/riomed/servicio-tecnico", icon: Wrench },
      ],
    },
    {
      title: "Operação",
      items: [
        { label: "Suporte técnico", to: "/riomed/servicio-tecnico", icon: Headphones },
        { label: "Treinamento", to: "/riomed/servicio-tecnico", icon: Users },
        { label: "Entrega técnica", to: "/riomed/servicio-tecnico", icon: Truck },
        { label: "Inspeção", to: "/riomed/servicio-tecnico", icon: Activity },
      ],
    },
  ],
};

/* ------------------------------ LOGIN INLINE ------------------------------ */

export function InlineLoginCard({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/app" });
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-lg bg-[color:var(--riomed-primary)] text-white grid place-items-center">
          <LogIn className="h-4 w-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 leading-tight">Área do Cliente</div>
          <div className="text-[11px] text-slate-500">
            Pedidos · Locações · Chamados · Garantias
          </div>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--riomed-primary)]/30 focus:border-[color:var(--riomed-primary)]"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--riomed-primary)]/30 focus:border-[color:var(--riomed-primary)]"
        />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[color:var(--riomed-primary)] text-white font-bold text-sm py-2.5 hover:brightness-110 active:brightness-95 transition disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <div className="flex items-center justify-between text-xs pt-1">
          <Link to="/auth" className="text-[color:var(--riomed-primary)] font-semibold hover:underline">
            Criar conta
          </Link>
          <Link to="/reset-password" className="text-slate-500 hover:text-slate-700">
            Esqueci minha senha
          </Link>
        </div>
      </form>
    </div>
  );
}

// Local import to avoid circular: Users icon
import { Users } from "lucide-react";
