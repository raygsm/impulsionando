import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRiomedTeam, submitRiomedSellerLead } from "@/lib/riomed-public.functions";
import { CheckCircle2, MessageCircle, Phone, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/riomed/vendedor")({
  head: () => ({
    meta: [
      { title: "Hablar con un vendedor — RioMed" },
      { name: "description", content: "Elegí un vendedor o dejá tu contacto y RioMed te conecta por rotación equilibrada." },
    ],
  }),
  component: VendedorPage,
});

type Form = {
  customerName: string; customerPhone: string; customerEmail: string;
  interest: string;
  profile: "hospital"|"clinica"|"consultorio"|"ambulancia"|"home_care"|"profesional"|"periferico"|"otro";
  notes: string; preferredSellerId: string;
};

function VendedorPage() {
  const list = useServerFn(listRiomedTeam);
  const submit = useServerFn(submitRiomedSellerLead);
  const { data } = useQuery({ queryKey: ["riomed-team"], queryFn: () => list() });
  const sellers = (data?.team ?? []).filter((s: any) => s.member_role === "vendedor");
  const manager = (data?.team ?? []).find((s: any) => s.member_role === "gerente");

  const [f, setF] = useState<Form>({
    customerName: "", customerPhone: "", customerEmail: "",
    interest: "", profile: "clinica", notes: "", preferredSellerId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ sellerName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function send() {
    setSubmitting(true); setError(null);
    try {
      const res = await submit({ data: { ...f, preferredSellerId: f.preferredSellerId || undefined } });
      setResult({ sellerName: res.sellerName || "Equipo comercial" });
    } catch (e: any) { setError(e?.message ?? "Error"); }
    finally { setSubmitting(false); }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={56} />
          <h1 className="text-3xl font-bold mb-2">¡Listo!</h1>
          <p className="text-muted-foreground mb-2">Te conectamos con:</p>
          <div className="text-2xl font-bold mb-6">{result.sellerName}</div>
          <p className="text-sm text-slate-500 mb-6">Vas a recibir contacto por WhatsApp a la brevedad.</p>
          <Link to="/riomed" className="rounded-full px-5 py-2.5 text-white font-semibold" style={{ background: "var(--riomed-primary, #0B3D74)" }}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Hablar con un vendedor</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Elegí un especialista o dejá tu contacto y nuestro sistema te conecta por rotación equilibrada.</p>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Equipo comercial</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sellers.map((s: any) => {
              const selected = f.preferredSellerId === s.id;
              return (
                <button key={s.id} type="button" onClick={() => set("preferredSellerId", selected ? "" : s.id)} className={`text-left rounded-xl border p-4 transition ${selected ? "border-slate-900 ring-2 ring-slate-900/10" : "bg-white hover:border-slate-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full grid place-items-center text-white font-bold" style={{ background: "var(--riomed-primary, #0B3D74)" }}>{s.full_name.split(" ").map((p: string) => p[0]).slice(0,2).join("")}</div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.full_name}</div>
                      <div className="text-xs text-slate-500 truncate">{s.specialty}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={()=>set("preferredSellerId", "")} className="mt-3 text-sm underline text-slate-500">No tengo preferencia — asignar automáticamente</button>

          {manager && (
            <div className="mt-6 rounded-xl border bg-slate-50 p-4 flex items-center gap-3">
              <UserCircle2 size={36} className="text-slate-700" />
              <div className="text-sm">
                <div className="font-semibold">{manager.full_name} — {manager.specialty}</div>
                <div className="text-slate-500">Para escalamientos y compras institucionales.</div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3 h-fit">
          <Field label="Nombre o institución *"><input className="ri-input" value={f.customerName} onChange={(e)=>set("customerName", e.target.value)} /></Field>
          <Field label="WhatsApp *"><input className="ri-input" value={f.customerPhone} onChange={(e)=>set("customerPhone", e.target.value)} placeholder="+591 7..." /></Field>
          <Field label="Email (opcional)"><input type="email" className="ri-input" value={f.customerEmail} onChange={(e)=>set("customerEmail", e.target.value)} /></Field>
          <Field label="Perfil">
            <select className="ri-input" value={f.profile} onChange={(e)=>set("profile", e.target.value as Form["profile"])}>
              <option value="hospital">Hospital</option>
              <option value="clinica">Clínica</option>
              <option value="consultorio">Consultorio</option>
              <option value="ambulancia">Ambulancia / emergencia</option>
              <option value="home_care">Home care / paciente</option>
              <option value="profesional">Profesional médico</option>
              <option value="periferico">Distribuidor / periférico</option>
              <option value="otro">Otro</option>
            </select>
          </Field>
          <Field label="Qué necesita"><input className="ri-input" value={f.interest} onChange={(e)=>set("interest", e.target.value)} placeholder="Ej. 5 monitores multiparamétricos" /></Field>
          <Field label="Notas adicionales"><textarea className="ri-input min-h-[90px]" value={f.notes} onChange={(e)=>set("notes", e.target.value)} /></Field>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="button" disabled={submitting || f.customerName.length<2 || f.customerPhone.length<6} onClick={send} className="w-full rounded-full px-6 py-3 text-white font-semibold disabled:opacity-40" style={{ background: "var(--riomed-accent, #0AB1A0)" }}>
            <MessageCircle size={18} className="inline mr-2" />{submitting ? "Enviando..." : "Conectarme con vendedor"}
          </button>
          <div className="text-xs text-slate-500 text-center flex items-center gap-1 justify-center"><Phone size={12}/> Respuesta promedio: &lt; 30 min en horario comercial.</div>
        </section>
      </div>

      <style>{`.ri-input{width:100%;padding:.6rem .85rem;border:1px solid #e2e8f0;border-radius:.6rem;background:#fff;font-size:.95rem}.ri-input:focus{outline:none;border-color:var(--riomed-primary,#0B3D74);box-shadow:0 0 0 3px rgba(11,61,116,.12)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>{children}</label>;
}
