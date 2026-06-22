import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/riomed/servicio-tecnico")({
  head: () => ({ meta: [
    { title: "Servicio Técnico — RioMed" },
    { name: "description", content: "Mantenimiento preventivo y correctivo de equipos médico-hospitalarios." },
  ]}),
  component: ServicioTecnicoPage,
});

function ServicioTecnicoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-3">Servicio Técnico Especializado</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Mantenimiento preventivo, correctivo y calibración de equipos médicos. Atención a domicilio, clínica u hospital.</p>
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        {[
          { t: "Mantenimiento preventivo", d: "Planes mensuales o anuales para evitar paradas." },
          { t: "Correctivo de urgencia", d: "Atención prioritaria con diagnóstico y presupuesto." },
          { t: "Calibración", d: "Equipos calibrados con certificación técnica." },
          { t: "Repuestos originales", d: "Stock disponible y garantía." },
        ].map(i => (
          <div key={i.t} className="rounded-xl border p-6 bg-white">
            <div className="font-semibold text-lg mb-1">{i.t}</div>
            <p className="text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link to="/riomed/cotizar" className="inline-flex rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-primary, #0E7C66)" }}>Solicitar visita técnica</Link>
        <Link to="/riomed/tecnico/cadastro" className="inline-flex rounded-full px-6 py-3 border font-semibold">Soy técnico — quiero registrarme</Link>
      </div>
    </div>
  );
}
