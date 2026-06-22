import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/riomed/alquiler")({
  head: () => ({ meta: [
    { title: "Alquiler de Equipamiento Médico — RioMed" },
    { name: "description", content: "Alquiler de camas hospitalarias, concentradores de oxígeno, sillas de ruedas y más." },
  ]}),
  component: AlquilerPage,
});

const ITEMS = [
  { t: "Camas hospitalarias", d: "Manuales y eléctricas con barandas y colchón." },
  { t: "Concentradores de oxígeno", d: "5L y 10L para uso domiciliario." },
  { t: "Sillas de ruedas", d: "Estándar, plegables y de transporte." },
  { t: "Andadores y muletas", d: "Movilidad asistida con entrega rápida." },
  { t: "Aspiradores de secreciones", d: "Para uso clínico y domiciliario." },
  { t: "Monitores multiparamétricos", d: "Para instituciones y home care." },
];

function AlquilerPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-3">Alquiler de equipamiento médico</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Solución rápida y económica para hospitales, clínicas y pacientes en casa. Entrega, instalación y servicio técnico incluidos.</p>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {ITEMS.map(i => (
          <div key={i.t} className="rounded-xl border p-5 bg-white">
            <div className="font-semibold mb-1">{i.t}</div>
            <p className="text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
      <Link to="/riomed/cotizar" className="inline-flex rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-primary, #0E7C66)" }}>Solicitar cotización de alquiler</Link>
    </div>
  );
}
