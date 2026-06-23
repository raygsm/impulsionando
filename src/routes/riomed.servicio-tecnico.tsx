import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ClipboardCheck, GraduationCap, Headphones, ShieldCheck, Wrench } from "lucide-react";

export const Route = createFileRoute("/riomed/servicio-tecnico")({
  head: () => ({ meta: [
    { title: "Servicio Técnico Médico — RioMed" },
    { name: "description", content: "Mantenimiento preventivo, correctivo, calibración, instalación y capacitación de equipos médico-hospitalarios en Bolivia." },
  ]}),
  component: ServicioTecnicoPage,
});

const SERVICES = [
  { icon: ShieldCheck, t: "Mantenimiento preventivo", d: "Planes mensuales o anuales para evitar paradas. Cronograma + reportes." },
  { icon: Wrench, t: "Correctivo de urgencia", d: "Atención prioritaria con diagnóstico y presupuesto en hasta 24 h." },
  { icon: Activity, t: "Calibración", d: "Equipos calibrados con certificación técnica y trazabilidad." },
  { icon: ClipboardCheck, t: "Instalación", d: "Instalación profesional con prueba funcional documentada." },
  { icon: GraduationCap, t: "Capacitación", d: "Treinamento do time clínico para uso seguro do equipamento." },
  { icon: Headphones, t: "Soporte 24/7", d: "Atención prioritaria para contratos institucionales." },
];

function ServicioTecnicoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
      <header>
        <div className="text-sm text-slate-500 mb-2">Servicio técnico médico-hospitalario</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Mantenimiento, calibración e instalación</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">Equipo técnico certificado en Bolivia. Atendemos hospitales, clínicas, ambulancias, consultorios y pacientes en domicilio.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link to="/riomed/soporte" className="rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-accent, #0AB1A0)" }}>Abrir ticket de soporte</Link>
          <Link to="/riomed/vendedor" className="rounded-full px-6 py-3 border font-semibold">Falar com vendedor</Link>
          <Link to="/riomed/tecnico/cadastro" className="rounded-full px-6 py-3 border font-semibold">Sou técnico</Link>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-5">Servicios técnicos</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {SERVICES.map((s) => (
            <div key={s.t} className="rounded-2xl border bg-white p-6 hover:shadow-md transition">
              <s.icon className="mb-3" style={{ color: "var(--riomed-primary, #0B3D74)" }} />
              <div className="font-semibold text-lg mb-1">{s.t}</div>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-slate-50 p-8">
        <h3 className="text-xl font-bold mb-2">¿Cómo funciona?</h3>
        <ol className="grid md:grid-cols-4 gap-4 mt-4 text-sm">
          {["Abre tu ticket","Diagnóstico técnico","Presupuesto y aprobación","Servicio + reporte"].map((s, i) => (
            <li key={s} className="rounded-xl bg-white border p-4">
              <div className="text-xs text-slate-500 mb-1">Paso {i+1}</div>
              <div className="font-semibold">{s}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, var(--riomed-primary,#0B3D74), var(--riomed-accent,#0AB1A0))" }}>
        <h3 className="text-2xl font-bold mb-2">Contrato institucional</h3>
        <p className="opacity-90 mb-5 max-w-xl">Atención prioritaria, SLA y reportes mensuales. Ideal para hospitales y clínicas con flota de equipamiento.</p>
        <Link to="/riomed/vendedor" className="rounded-full px-6 py-3 bg-white text-slate-900 font-semibold">Falar com vendedor</Link>
      </section>
    </div>
  );
}
