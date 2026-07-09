import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Wrench,
  Truck,
  HeartPulse,
  Stethoscope,
  Hospital,
  Activity,
  Bed,
  MessageCircle,
  Headphones,
  ShieldCheck,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/riomed/")({
  head: () => ({
    meta: [
      { title: "RioMed — Equipos médicos, alquiler y servicio técnico en Bolivia" },
      {
        name: "description",
        content:
          "Importación, distribución, venta, alquiler y servicio técnico de equipamiento médico-hospitalario en toda Bolivia. Atendemos hospitales, clínicas, consultorios y pacientes en home care.",
      },
      { property: "og:title", content: "RioMed — Equipos médicos, alquiler y servicio técnico en Bolivia" },
      {
        property: "og:description",
        content:
          "Venta, alquiler y mantenimiento de equipamiento médico. Cobertura nacional, soporte técnico especializado y cotización rápida por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://impulsionando.com.br/riomed" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/riomed" }],
  }),
  component: RiomedHome,
});

function RiomedHome() {
  return (
    <div className="text-[color:var(--riomed-ink)]">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--riomed-deep) 0%, var(--riomed-primary) 55%, var(--riomed-accent) 130%)",
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-white space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              <MapPin className="h-3.5 w-3.5" /> Atendemos toda Bolivia · Sede La Paz
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Equipamiento médico-hospitalario, <span className="text-[color:var(--riomed-accent)]">a la altura</span> de tu operación.
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
              Importación y distribución directa, venta, alquiler y servicio técnico certificado para hospitales, clínicas, consultorios, ambulancias y pacientes en home care.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/riomed/cotizar"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--riomed-accent)] hover:bg-[color:var(--riomed-accent)]/90 text-white font-semibold px-6 py-3 min-h-11 shadow-lg transition"
              >
                <ShoppingCart className="h-5 w-5" /> Solicitar cotización
              </Link>
              <Link
                to="/riomed/hospital/portal"
                className="inline-flex items-center gap-2 rounded-full bg-white text-[color:var(--riomed-deep)] hover:bg-white/90 font-semibold px-6 py-3 min-h-11 shadow-lg transition"
              >
                Portal hospitalario <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/riomed/soporte"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-6 py-3 min-h-11 backdrop-blur transition"
              >
                <Headphones className="h-5 w-5" /> Soporte técnico
              </Link>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-6 max-w-2xl">
              {[
                { icon: ShieldCheck, label: "Equipos certificados" },
                { icon: Clock, label: "Soporte técnico 24/7" },
                { icon: Truck, label: "Cobertura nacional" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm text-white/90 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                >
                  <Icon className="h-4 w-4 text-[color:var(--riomed-accent)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature cluster */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/95 backdrop-blur shadow-2xl p-6 md:p-7 grid grid-cols-2 gap-4">
              {[
                { icon: Stethoscope, title: "Diagnóstico", desc: "Monitores, ECG, ultrasonido." },
                { icon: HeartPulse, title: "Terapia", desc: "Ventiladores, oxígeno, bombas." },
                { icon: Bed, title: "Hospitalización", desc: "Camas, mobiliario clínico." },
                { icon: Activity, title: "Imagen", desc: "Rayos X, ecografía, PACS." },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 p-4 hover:border-[color:var(--riomed-primary)] hover:shadow-md transition"
                >
                  <Icon className="h-6 w-6 text-[color:var(--riomed-primary)] mb-2" />
                  <div className="font-semibold text-[color:var(--riomed-ink)] text-sm">{title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--riomed-accent)]">
            Nuestros pilares
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--riomed-ink)] mt-2">
            Todo el ciclo del equipamiento médico bajo un mismo proveedor
          </h2>
          <p className="text-slate-600 mt-3 text-lg">
            De la importación al mantenimiento posventa — con contrato, garantía y trazabilidad para cada equipo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: ShoppingCart,
              title: "Venta de equipos",
              desc: "Catálogo B2B con monitores, ventiladores, bombas, camas, ultrasonido e insumos hospitalarios.",
              cta: "Solicitar cotización",
              to: "/riomed/cotizar" as const,
            },
            {
              icon: HeartPulse,
              title: "Alquiler / Home Care",
              desc: "Concentradores de oxígeno, camas y equipamiento respiratorio con entrega, retiro y soporte.",
              cta: "Ver alquiler",
              to: "/riomed/alquiler" as const,
            },
            {
              icon: Wrench,
              title: "Servicio Técnico",
              desc: "Mantenimiento preventivo, correctivo, calibración y contratos SLA para instituciones de salud.",
              cta: "Solicitar servicio",
              to: "/riomed/servicio-tecnico" as const,
            },
            {
              icon: Truck,
              title: "Importación y distribución",
              desc: "Representación de marcas internacionales con logística, aduana y nacionalización llave en mano.",
              cta: "Hablar con vendedor",
              to: "/riomed/vendedor" as const,
            },
          ].map(({ icon: Icon, title, desc, cta, to }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-[color:var(--riomed-primary)] hover:shadow-xl transition flex flex-col"
            >
              <div className="h-11 w-11 rounded-xl bg-[color:var(--riomed-primary)]/10 text-[color:var(--riomed-primary)] flex items-center justify-center mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-[color:var(--riomed-ink)]">{title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed flex-1">{desc}</p>
              <Link
                to={to}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--riomed-primary)] group-hover:text-[color:var(--riomed-accent)] transition"
              >
                {cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SEGMENTOS */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--riomed-accent)]">
              A quién servimos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--riomed-ink)] mt-2">
              Soluciones dedicadas para cada tipo de cliente
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Hospital, title: "Hospitales y clínicas", desc: "Compra institucional, licitaciones, SLA técnico.", to: "/riomed/hospitales" as const },
              { icon: Stethoscope, title: "Consultorios", desc: "Setup completo del consultorio médico.", to: "/riomed/hospitales" as const },
              { icon: HeartPulse, title: "Pacientes / Home Care", desc: "Alquiler y venta con entrega domiciliaria.", to: "/riomed/pacientes" as const },
              { icon: Truck, title: "Ambulancias y rescate", desc: "Equipos móviles y consumibles.", to: "/riomed/hospitales" as const },
            ].map(({ icon: Icon, title, desc, to }) => (
              <Link
                key={title}
                to={to}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-[color:var(--riomed-primary)] hover:shadow-lg transition block"
              >
                <Icon className="h-6 w-6 text-[color:var(--riomed-primary)] mb-3" />
                <div className="font-semibold text-[color:var(--riomed-ink)]">{title}</div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, var(--riomed-primary) 0%, var(--riomed-deep) 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-16 text-center text-white space-y-5">
          <h2 className="text-3xl md:text-4xl font-bold">
            ¿Necesitás un equipo hoy o un contrato de mantenimiento?
          </h2>
          <p className="text-white/85 text-lg max-w-2xl mx-auto">
            Enviá tu solicitud por el portal hospitalario o pedí cotización — en horas hábiles un especialista responde con propuesta, disponibilidad y plazo.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link
              to="/riomed/cotizar"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--riomed-accent)] hover:bg-[color:var(--riomed-accent)]/90 text-white font-semibold px-6 py-3 min-h-11 shadow-lg transition"
            >
              Solicitar cotización <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/riomed/hospital/portal"
              className="inline-flex items-center gap-2 rounded-full bg-white text-[color:var(--riomed-deep)] hover:bg-white/90 font-semibold px-6 py-3 min-h-11 shadow-lg transition"
            >
              Portal hospitalario <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/riomed/soporte"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-6 py-3 min-h-11 backdrop-blur transition"
            >
              <MessageCircle className="h-5 w-5" /> Soporte técnico
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
