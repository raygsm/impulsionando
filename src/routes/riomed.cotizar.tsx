import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { submitRiomedQuote } from "@/lib/riomed-public.functions";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/riomed/cotizar")({
  head: () => ({
    meta: [
      { title: "Cotizar — RioMed" },
      { name: "description", content: "Solicitá una cotización de equipamiento médico-hospitalario. Atención por especialistas RioMed." },
      { property: "og:title", content: "Cotizar — RioMed" },
      { property: "og:description", content: "Cotización en línea de equipamiento médico-hospitalario." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ producto: typeof s.producto === "string" ? s.producto : undefined }),
  component: CotizarPage,
});

function CotizarPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/riomed/cotizar" });
  const submit = useServerFn(submitRiomedQuote);
  const [done, setDone] = useState(false);

  const [f, setF] = useState({
    name: "",
    whatsapp: "",
    email: "",
    clientType: "paciente" as const,
    needType: "compra" as const,
    productDesired: search.producto ?? "",
    productCode: "",
    city: "",
    department: "",
    urgency: "media" as const,
    notes: "",
    photoUrl: "",
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/riomed/cotizar",
  });

  const mut = useMutation({
    mutationFn: (v: typeof f) => submit({ data: v }),
    onSuccess: () => setDone(true),
  });

  const upd = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
        <h1 className="text-3xl font-bold mb-2">¡Cotización recibida!</h1>
        <p className="text-muted-foreground mb-6">
          Un especialista RioMed va a contactarte por WhatsApp. Si es urgente, escribinos directamente.
        </p>
        <button
          onClick={() => navigate({ to: "/riomed" })}
          className="rounded-full px-6 py-3 text-white font-semibold"
          style={{ background: "var(--riomed-primary, #0E7C66)" }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl lg:text-4xl font-bold mb-2">Solicitar cotización</h1>
      <p className="text-muted-foreground mb-8">Completá el formulario y te respondemos por WhatsApp con la propuesta.</p>

      <form
        className="space-y-5 bg-white border rounded-2xl p-6 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); mut.mutate(f); }}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nombre completo *">
            <input required value={f.name} onChange={(e) => upd("name", e.target.value)} className="input" />
          </Field>
          <Field label="WhatsApp *">
            <input required value={f.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} placeholder="+595 ..." className="input" />
          </Field>
        </div>

        <Field label="E-mail">
          <input type="email" value={f.email} onChange={(e) => upd("email", e.target.value)} className="input" />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tipo de cliente *">
            <select value={f.clientType} onChange={(e) => upd("clientType", e.target.value)} className="input">
              <option value="paciente">Paciente</option>
              <option value="clinica">Clínica</option>
              <option value="hospital">Hospital</option>
              <option value="empresa">Empresa</option>
              <option value="proveedor">Proveedor</option>
              <option value="tecnico">Técnico</option>
              <option value="candidato">Candidato</option>
            </select>
          </Field>
          <Field label="Necesidad *">
            <select value={f.needType} onChange={(e) => upd("needType", e.target.value)} className="input">
              <option value="compra">Compra</option>
              <option value="alquiler">Alquiler</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Producto deseado">
            <input value={f.productDesired} onChange={(e) => upd("productDesired", e.target.value)} placeholder="Ej: Concentrador de oxígeno" className="input" />
          </Field>
          <Field label="Código (SKU), si lo conoce">
            <input value={f.productCode} onChange={(e) => upd("productCode", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Foto del producto (URL)">
          <input value={f.photoUrl} onChange={(e) => upd("photoUrl", e.target.value)} placeholder="https://..." className="input" />
          <p className="text-xs text-muted-foreground mt-1">Si tenés una foto, pegá el enlace o envianos por WhatsApp.</p>
        </Field>

        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Ciudad">
            <input value={f.city} onChange={(e) => upd("city", e.target.value)} className="input" />
          </Field>
          <Field label="Departamento">
            <input value={f.department} onChange={(e) => upd("department", e.target.value)} className="input" />
          </Field>
          <Field label="Urgencia">
            <select value={f.urgency} onChange={(e) => upd("urgency", e.target.value)} className="input">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </Field>
        </div>

        <Field label="Observaciones">
          <textarea value={f.notes} onChange={(e) => upd("notes", e.target.value)} rows={4} className="input" />
        </Field>

        {mut.isError && (
          <div className="text-sm text-red-600">No pudimos enviar tu cotización. Intentá de nuevo o usá el WhatsApp.</div>
        )}

        <button
          type="submit"
          disabled={mut.isPending}
          className="w-full rounded-full py-3 text-white font-semibold disabled:opacity-50"
          style={{ background: "var(--riomed-primary, #0E7C66)" }}
        >
          {mut.isPending ? "Enviando…" : "Enviar cotización"}
        </button>
      </form>

      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;padding:.55rem .75rem;font-size:.9rem;background:#fff}.input:focus{outline:2px solid var(--riomed-primary,#0E7C66);outline-offset:1px}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}
