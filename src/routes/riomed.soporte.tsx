import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { openRiomedSupportTicket } from "@/lib/riomed-public.functions";
import { CheckCircle2, ChevronRight, Headphones, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/riomed/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte Técnico — RioMed" },
      { name: "description", content: "Abra un ticket de soporte técnico médico-hospitalario. Atención preventiva, correctiva, calibración e instalación." },
    ],
  }),
  component: SoportePage,
});

type Form = {
  customerName: string; customerPhone: string; customerEmail: string;
  equipmentType: string; equipmentBrand: string;
  issueCategory: "mantenimiento_preventivo"|"correctivo"|"calibracion"|"instalacion"|"capacitacion"|"otro";
  urgency: "baja"|"media"|"alta"|"critica";
  locationCity: string; preferredWindow: string; description: string;
};

const STEPS = [
  "Identificación",
  "Equipamento",
  "Tipo de servicio",
  "Urgencia",
  "Ubicación",
  "Detalles",
  "Confirmar",
] as const;

function SoportePage() {
  const open = useServerFn(openRiomedSupportTicket);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<Form>({
    customerName: "", customerPhone: "", customerEmail: "",
    equipmentType: "", equipmentBrand: "",
    issueCategory: "correctivo", urgency: "media",
    locationCity: "", preferredWindow: "", description: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const canNext = (() => {
    if (step === 0) return f.customerName.trim().length >= 2 && f.customerPhone.trim().length >= 6;
    if (step === 1) return f.equipmentType.trim().length >= 2;
    return true;
  })();

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await open({ data: f });
      setProtocol(res.protocol);
    } catch (e: any) {
      setError(e?.message ?? "Error al abrir ticket");
    } finally { setSubmitting(false); }
  }

  if (protocol) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={56} />
          <h1 className="text-3xl font-bold mb-2">Ticket abierto</h1>
          <p className="text-muted-foreground mb-6">Nuestro equipo técnico se pondrá en contacto en breve por el canal indicado.</p>
          <div className="rounded-xl bg-slate-50 border p-5 mb-6">
            <div className="text-xs uppercase tracking-wide text-slate-500">Protocolo</div>
            <div className="text-2xl font-mono font-bold">{protocol}</div>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/riomed" className="rounded-full border px-5 py-2.5 font-medium">Volver al inicio</Link>
            <Link to="/riomed/productos" className="rounded-full px-5 py-2.5 text-white font-semibold" style={{ background: "var(--riomed-primary, #0B3D74)" }}>Ver catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2 text-sm text-slate-500">
        <Headphones size={18} /> Soporte técnico médico-hospitalario
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Abrir solicitud de soporte</h1>

      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${i === step ? "bg-slate-900 text-white border-slate-900" : i < step ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500"}`}>
              {i + 1}. {label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm space-y-4">
        {step === 0 && (
          <>
            <Field label="Nombre completo o institución *">
              <input className="ri-input" value={f.customerName} onChange={(e)=>set("customerName", e.target.value)} />
            </Field>
            <Field label="WhatsApp / teléfono *">
              <input className="ri-input" value={f.customerPhone} onChange={(e)=>set("customerPhone", e.target.value)} placeholder="+591 7..." />
            </Field>
            <Field label="Email (opcional)">
              <input type="email" className="ri-input" value={f.customerEmail} onChange={(e)=>set("customerEmail", e.target.value)} />
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Tipo de equipo *">
              <input className="ri-input" value={f.equipmentType} onChange={(e)=>set("equipmentType", e.target.value)} placeholder="Ej. Monitor multiparamétrico, autoclave, concentrador..." />
            </Field>
            <Field label="Marca / modelo">
              <input className="ri-input" value={f.equipmentBrand} onChange={(e)=>set("equipmentBrand", e.target.value)} placeholder="Ej. Mindray BeneVision N15" />
            </Field>
          </>
        )}
        {step === 2 && (
          <Field label="Tipo de servicio">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                ["mantenimiento_preventivo","Preventivo"],
                ["correctivo","Correctivo"],
                ["calibracion","Calibración"],
                ["instalacion","Instalación"],
                ["capacitacion","Capacitación"],
                ["otro","Otro"],
              ].map(([v,l]) => (
                <button key={v} type="button" onClick={()=>set("issueCategory", v as Form["issueCategory"])} className={`px-3 py-2 rounded-lg border text-sm ${f.issueCategory===v?"bg-slate-900 text-white border-slate-900":"bg-white"}`}>{l}</button>
              ))}
            </div>
          </Field>
        )}
        {step === 3 && (
          <Field label="Urgencia">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                ["baja","Baja"],["media","Media"],["alta","Alta"],["critica","Crítica"],
              ].map(([v,l]) => (
                <button key={v} type="button" onClick={()=>set("urgency", v as Form["urgency"])} className={`px-3 py-2 rounded-lg border text-sm ${f.urgency===v?"bg-slate-900 text-white border-slate-900":"bg-white"}`}>{l}</button>
              ))}
            </div>
          </Field>
        )}
        {step === 4 && (
          <>
            <Field label="Ciudad / departamento">
              <input className="ri-input" value={f.locationCity} onChange={(e)=>set("locationCity", e.target.value)} placeholder="Santa Cruz, La Paz, Cochabamba..." />
            </Field>
            <Field label="Mejor horario para visita">
              <input className="ri-input" value={f.preferredWindow} onChange={(e)=>set("preferredWindow", e.target.value)} placeholder="Mañana / tarde / hora específica" />
            </Field>
          </>
        )}
        {step === 5 && (
          <Field label="Descripción del problema">
            <textarea className="ri-input min-h-[140px]" value={f.description} onChange={(e)=>set("description", e.target.value)} placeholder="Cuéntenos lo que está sucediendo con el equipo." />
          </Field>
        )}
        {step === 6 && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck size={18}/> Revise los datos antes de enviar</div>
            <Row k="Solicitante" v={f.customerName} />
            <Row k="Contacto" v={f.customerPhone} />
            <Row k="Equipo" v={`${f.equipmentType}${f.equipmentBrand?` — ${f.equipmentBrand}`:""}`} />
            <Row k="Servicio" v={f.issueCategory} />
            <Row k="Urgencia" v={f.urgency} />
            <Row k="Ubicación" v={f.locationCity || "—"} />
            {error && <div className="text-red-600">{error}</div>}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button type="button" disabled={step===0} onClick={()=>setStep((s)=>Math.max(0,s-1))} className="px-4 py-2 rounded-full border disabled:opacity-40">Anterior</button>
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canNext} onClick={()=>setStep((s)=>s+1)} className="px-5 py-2 rounded-full text-white font-semibold disabled:opacity-40" style={{ background: "var(--riomed-primary, #0B3D74)" }}>Siguiente</button>
          ) : (
            <button type="button" disabled={submitting} onClick={submit} className="px-6 py-2 rounded-full text-white font-semibold disabled:opacity-40" style={{ background: "var(--riomed-accent, #0AB1A0)" }}>{submitting ? "Enviando..." : "Abrir ticket"}</button>
          )}
        </div>
      </div>

      <style>{`.ri-input{width:100%;padding:.6rem .85rem;border:1px solid #e2e8f0;border-radius:.6rem;background:#fff;font-size:.95rem}.ri-input:focus{outline:none;border-color:var(--riomed-primary,#0B3D74);box-shadow:0 0 0 3px rgba(11,61,116,.12)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 py-1 border-b border-slate-100"><span className="text-slate-500">{k}</span><span className="font-medium text-right">{v}</span></div>;
}
