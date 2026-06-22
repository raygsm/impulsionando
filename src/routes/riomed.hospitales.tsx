import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/riomed/hospitales")({
  head: () => ({ meta: [
    { title: "Hospitales y Clínicas — RioMed" },
    { name: "description", content: "Soluciones B2B para hospitales y clínicas: equipamiento, mantenimiento y suministro continuo." },
  ]}),
  component: HospitalesPage,
});

function HospitalesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-3">Hospitales y Clínicas</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Cuentas corporativas con condiciones especiales, listas de precios, plazos, entrega programada y soporte técnico dedicado.</p>
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        {[
          { t: "Cuentas corporativas", d: "Línea de crédito, facturación electrónica y precios por volumen." },
          { t: "Licitaciones", d: "Preparamos documentación técnica y cotizaciones formales." },
          { t: "Mantenimiento preventivo", d: "Contratos anuales con cobertura de equipos críticos." },
          { t: "Reposición programada", d: "Entrega periódica de insumos según consumo." },
        ].map(i => (
          <div key={i.t} className="rounded-xl border p-6 bg-white">
            <div className="font-semibold text-lg mb-1">{i.t}</div>
            <p className="text-sm text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link to="/riomed/cotizar" className="inline-flex rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--riomed-primary, #0E7C66)" }}>Solicitar propuesta institucional</Link>
        <Link to="/riomed/hospital/portal" className="inline-flex rounded-full px-6 py-3 border font-semibold">Portal del cliente institucional</Link>
      </div>
    </div>
  );
}
