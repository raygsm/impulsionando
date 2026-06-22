import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FloatingWhatsApp } from "@/components/riomed/FloatingWhatsApp";
import { getRiomedSiteSettings } from "@/lib/riomed-public.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/riomed")({
  component: RiomedLayout,
});

const NAV = [
  { to: "/riomed", label: "Inicio" },
  { to: "/riomed/productos", label: "Productos" },
  { to: "/riomed/alquiler", label: "Alquiler" },
  { to: "/riomed/hospitales", label: "Hospitales y Clínicas" },
  { to: "/riomed/pacientes", label: "Pacientes" },
  { to: "/riomed/servicio-tecnico", label: "Servicio Técnico" },
  { to: "/riomed/fornecedor/cadastro", label: "Proveedores" },
  { to: "/riomed/trabalhe-conosco", label: "Trabaja con Nosotros" },
  { to: "/riomed/cotizar", label: "Cotizar" },
  { to: "/area-cliente", label: "Área del Cliente" },
];

function RiomedLayout() {
  const getSettings = useServerFn(getRiomedSiteSettings);
  const { data } = useQuery({ queryKey: ["riomed-site-settings"], queryFn: () => getSettings() });
  const s = data?.settings;

  useEffect(() => {
    if (!s) return;
    const root = document.documentElement;
    root.style.setProperty("--riomed-primary", s.primary_color);
    root.style.setProperty("--riomed-accent", s.accent_color);
  }, [s]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/riomed" className="flex items-center gap-2">
            {s?.logo_url
              ? <img src={s.logo_url} alt={s?.brand_name ?? "RioMed"} className="h-9" />
              : <span className="text-2xl font-bold" style={{ color: s?.primary_color ?? "#0E7C66" }}>{s?.brand_name ?? "RioMed"}</span>}
          </Link>
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} className="hover:text-[color:var(--riomed-primary)] transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/riomed/cotizar"
            className="hidden md:inline-flex rounded-full px-4 py-2 text-white text-sm font-semibold"
            style={{ background: s?.primary_color ?? "#0E7C66" }}
          >
            {s?.hero_cta_label ?? "Solicitar cotización"}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-slate-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-bold text-lg mb-2" style={{ color: s?.primary_color ?? "#0E7C66" }}>{s?.brand_name ?? "RioMed"}</div>
            <p className="text-muted-foreground">{s?.footer_text ?? "Equipamiento médico-hospitalario confiable."}</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Para clientes</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/riomed/pacientes">Pacientes</Link></li>
              <li><Link to="/riomed/hospitales">Hospitales y Clínicas</Link></li>
              <li><Link to="/riomed/alquiler">Alquiler</Link></li>
              <li><Link to="/riomed/servicio-tecnico">Servicio Técnico</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Trabaja con nosotros</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/riomed/fornecedor/cadastro">Proveedores</Link></li>
              <li><Link to="/riomed/tecnico/cadastro">Técnicos</Link></li>
              <li><Link to="/riomed/trabalhe-conosco">Talentos</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Contacto</div>
            <p className="text-muted-foreground">WhatsApp: {s?.whatsapp_official}</p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {s?.brand_name ?? "RioMed"} · powered by Impulsionando
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
}
