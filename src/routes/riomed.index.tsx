import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getRiomedSiteSettings, listRiomedPublicProducts } from "@/lib/riomed-public.functions";
import { Stethoscope, HeartPulse, Truck, Wrench, Hospital, Users, Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/riomed/")({
  head: () => ({
    meta: [
      { title: "RioMed — Equipamiento médico-hospitalario" },
      { name: "description", content: "Venta, alquiler y servicio técnico de equipamiento médico-hospitalario. Cotizá en línea y recibí atención de un especialista." },
      { property: "og:title", content: "RioMed — Equipamiento médico-hospitalario" },
      { property: "og:description", content: "Venta, alquiler y servicio técnico. Atención profesional para hospitales, clínicas y pacientes." },
    ],
  }),
  component: RiomedHome,
});

function RiomedHome() {
  const getSettings = useServerFn(getRiomedSiteSettings);
  const listProducts = useServerFn(listRiomedPublicProducts);
  const settings = useQuery({ queryKey: ["riomed-site-settings"], queryFn: () => getSettings() });
  const [q, setQ] = useState("");
  const products = useQuery({ queryKey: ["riomed-public-products", q], queryFn: () => listProducts({ data: { search: q || undefined, limit: 8 } }) });
  const s = settings.data?.settings;
  const primary = s?.primary_color ?? "#0E7C66";
  const accent = s?.accent_color ?? "#0AB1A0";

  return (
    <div>
      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
              Equipamiento médico-hospitalario
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {s?.hero_title}
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-xl">{s?.hero_subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/riomed/cotizar" className="rounded-full bg-white text-slate-900 px-6 py-3 font-semibold inline-flex items-center gap-2">
                {s?.hero_cta_label} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/riomed/productos" className="rounded-full border-2 border-white/70 px-6 py-3 font-semibold">
                Ver catálogo
              </Link>
            </div>
            <form
              className="mt-8 flex items-center gap-2 bg-white rounded-full p-2 shadow-xl max-w-md"
              onSubmit={(e) => { e.preventDefault(); }}
            >
              <Search className="h-5 w-5 text-slate-400 ml-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar producto, código o marca…"
                className="flex-1 bg-transparent outline-none text-slate-900 px-2 py-2"
              />
              <Link
                to="/riomed/productos"
                search={{ q } as any}
                className="rounded-full px-4 py-2 text-white font-semibold text-sm"
                style={{ background: primary }}
              >
                Buscar
              </Link>
            </form>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl"></div>
              <div className="relative grid grid-cols-2 gap-4">
                {[Stethoscope, HeartPulse, Hospital, Wrench].map((Icon, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                    <Icon className="h-10 w-10 mb-3" />
                    <div className="text-sm font-semibold opacity-90">
                      {["Diagnóstico", "UCI / UTI", "Hospitalario", "Servicio técnico"][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCIAS */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: Users, title: "Pacientes", desc: "Acceso a equipamiento domiciliario, oxígeno, camas y más.", to: "/riomed/pacientes", color: primary },
          { icon: Hospital, title: "Hospitales y Clínicas", desc: "Atención corporativa, compras recurrentes y consignación.", to: "/riomed/hospitales", color: accent },
          { icon: Truck, title: "Alquiler", desc: "Equipamiento de alta complejidad por períodos flexibles.", to: "/riomed/alquiler", color: primary },
        ].map((b) => (
          <Link key={b.to} to={b.to} className="group rounded-2xl border p-6 hover:shadow-xl transition-all">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 text-white" style={{ background: b.color }}>
              <b.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{b.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{b.desc}</p>
            <span className="text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: b.color }}>
              Saber más <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      {/* DESTACADOS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Productos destacados</h2>
              <p className="text-muted-foreground">Selección de equipamiento disponible.</p>
            </div>
            <Link to="/riomed/productos" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: primary }}>
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(products.data?.items ?? []).slice(0, 8).map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="object-cover w-full h-full" />
                    : <Stethoscope className="h-10 w-10 text-slate-300" />}
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                  <div className="font-semibold text-sm line-clamp-2 h-10">{p.name}</div>
                  <Link
                    to="/riomed/cotizar"
                    search={{ producto: p.sku } as any}
                    className="mt-3 block text-center text-sm rounded-full py-1.5 text-white font-semibold"
                    style={{ background: primary }}
                  >
                    Cotizar
                  </Link>
                </div>
              </div>
            ))}
            {!products.data?.items?.length && (
              <div className="col-span-full text-center text-muted-foreground py-10">Cargando productos…</div>
            )}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">¿Necesitás un equipo específico?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Completá una cotización online o hablá con un especialista RioMed por WhatsApp.
        </p>
        <Link
          to="/riomed/cotizar"
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-white font-semibold"
          style={{ background: primary }}
        >
          Solicitar cotización <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
