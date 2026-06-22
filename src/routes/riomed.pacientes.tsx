import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/riomed/pacientes")({
  head: () => ({ meta: [
    { title: "Pacientes y Home Care — RioMed" },
    { name: "description", content: "Equipamiento médico para uso domiciliario: oxígeno, camas, monitores, sillas de ruedas." },
  ]}),
  component: PacientesPage,
});

function PacientesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-3">Pacientes y cuidado domiciliario</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Entregamos e instalamos en su domicilio. Le acompañamos con orientación, servicio técnico y reposición.</p>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { t: "Oxigenoterapia", d: "Concentradores, tubos y accesorios." },
          { t: "Camas hospitalarias", d: "Compra o alquiler con instalación." },
          { t: "Sillas de ruedas", d: "Modelos para distintas necesidades." },
          { t: "Aspiración", d: "Equipos portátiles y de mesa." },
          { t: "Nebulización", d: "Para uso continuo en casa." },
          { t: "Cuidados post-operatorios", d: "Insumos y equipos especializados." },
        ].map(i => (
          <div key={i.t} className="rounded-xl border p-5 bg-white">
            <div className="font-semibold mb-1">{i.t}</div>
            <p className="text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
      <Link to="/riomed/cotizar" className="inline-flex rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-primary, #0E7C66)" }}>Hablar con un asesor</Link>
    </div>
  );
}
