import { createFileRoute, Link } from "@tanstack/react-router";
import { Bed, Building2, Hospital, HeartPulse, Stethoscope, Truck, Users } from "lucide-react";

export const Route = createFileRoute("/riomed/alquiler")({
  head: () => ({ meta: [
    { title: "Alquiler de Equipamiento Médico — RioMed" },
    { name: "description", content: "Alquiler mensual de camas hospitalarias, monitores, concentradores de oxígeno, sillas de ruedas y más. Para hospitales, clínicas, ambulancias y home care." },
  ]}),
  component: AlquilerPage,
});

const NICHES = [
  { icon: Hospital, t: "Hospitales", d: "Camas UTI, monitores, bombas de infusión, ventiladores. Contratos institucionales 6 a 24 meses.", anchor: "hospital" },
  { icon: Building2, t: "Clínicas", d: "Equipamiento clínico bajo demanda, expansión sin CapEx. Plan mensual escalable.", anchor: "clinica" },
  { icon: Stethoscope, t: "Consultorios", d: "Equipamiento esencial para abrir o renovar consultorio con plan mensual reducido.", anchor: "consultorio" },
  { icon: Truck, t: "Ambulancias", d: "Kits de emergencia, monitores de transporte, oxígeno portátil con reposición.", anchor: "ambulancia" },
  { icon: Bed, t: "Home care", d: "Camas, concentradores, aspiradores y sillas de ruedas para uso domiciliario.", anchor: "home_care" },
  { icon: Users, t: "Profesionales", d: "Equipamiento para profesionales independientes, atención domiciliar y peritajes.", anchor: "profesional" },
];

const ITEMS = [
  { t: "Camas hospitalarias", d: "Manuales y eléctricas con barandas y colchón." },
  { t: "Concentradores de oxígeno", d: "5L y 10L para uso domiciliario." },
  { t: "Sillas de ruedas", d: "Estándar, plegables y de transporte." },
  { t: "Andadores y muletas", d: "Movilidad asistida con entrega rápida." },
  { t: "Aspiradores de secreciones", d: "Para uso clínico y domiciliario." },
  { t: "Monitores multiparamétricos", d: "Para instituciones y home care." },
  { t: "Bombas de infusión", d: "Para uso continuo en internación." },
  { t: "Ventiladores y BiPAP", d: "Suporte ventilatorio en UTI y home care." },
];

function AlquilerPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
      <header>
        <div className="text-sm text-slate-500 mb-2">Locação mensal médica e hospitalar</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Alquiler de equipamiento médico</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">Solución rápida y económica para hospitales, clínicas, ambulancias y home care. Entrega, instalación y servicio técnico incluidos. Sin CapEx, plan mensual previsible.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link to="/riomed/vendedor" className="rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-primary, #0B3D74)" }}>Falar com vendedor</Link>
          <Link to="/riomed/cotizar" className="rounded-full px-6 py-3 border font-semibold">Solicitar cotización</Link>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-5">Locação por perfil</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {NICHES.map((n) => (
            <div key={n.t} id={n.anchor} className="rounded-2xl border bg-white p-5 hover:shadow-md transition">
              <n.icon className="mb-3" style={{ color: "var(--riomed-primary, #0B3D74)" }} />
              <div className="font-semibold text-lg mb-1">{n.t}</div>
              <p className="text-sm text-muted-foreground mb-4">{n.d}</p>
              <Link to="/riomed/vendedor" className="text-sm font-semibold" style={{ color: "var(--riomed-accent, #0AB1A0)" }}>Falar com especialista →</Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-5">Catálogo de locação</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {ITEMS.map((i) => (
            <div key={i.t} className="rounded-xl border p-5 bg-white">
              <div className="font-semibold mb-1 flex items-center gap-2"><HeartPulse size={16} style={{color:"var(--riomed-accent,#0AB1A0)"}} />{i.t}</div>
              <p className="text-sm text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, var(--riomed-primary,#0B3D74), var(--riomed-accent,#0AB1A0))" }}>
        <h3 className="text-2xl font-bold mb-2">Plano mensal sem dor de cabeça</h3>
        <p className="opacity-90 mb-5 max-w-xl">Manutenção, calibração e troca de equipamento incluídos. Apenas use; nós cuidamos do resto.</p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/riomed/vendedor" className="rounded-full px-6 py-3 bg-white text-slate-900 font-semibold">Falar com vendedor</Link>
          <Link to="/riomed/soporte" className="rounded-full px-6 py-3 border border-white/40 font-semibold">Soporte técnico</Link>
        </div>
      </section>
    </div>
  );
}
