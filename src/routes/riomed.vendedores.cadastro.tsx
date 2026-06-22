import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { submitRiomedSellerApplication } from "@/lib/riomed-public.functions";

export const Route = createFileRoute("/riomed/vendedores/cadastro")({
  head: () => ({ meta: [
    { title: "Trabaja como vendedor RioMed" },
    { name: "description", content: "Postúlate como vendedor RioMed. Comisiones, territorio y CRM dedicado." },
  ]}),
  component: VendedoresCadastroPage,
});

function VendedoresCadastroPage() {
  const submit = useServerFn(submitRiomedSellerApplication);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", territory: "", notes: "" });
  const [done, setDone] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (data: typeof form) => submit({ data }),
    onSuccess: (r: any) => {
      if (r?.alreadyExists) {
        toast.info("Ya existe una postulación con este e-mail.");
        setDone(`Tu postulación está en estado: ${r.status}`);
      } else {
        toast.success("Postulación enviada. La gestión revisará tu acceso.");
        setDone("Postulación recibida. Te avisaremos por WhatsApp/e-mail.");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al enviar"),
  });

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">¡Listo!</h1>
        <p className="text-muted-foreground">{done}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Postulación de vendedor RioMed</h1>
      <p className="text-muted-foreground mb-6">Después de la aprobación tendrás acceso al CRM, distribución automática de leads y panel de comisiones.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); m.mutate(form); }}
      >
        <Field label="Nombre completo *"><input required className="w-full rounded border px-3 py-2" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} /></Field>
        <Field label="E-mail *"><input required type="email" className="w-full rounded border px-3 py-2" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></Field>
        <Field label="WhatsApp *"><input required className="w-full rounded border px-3 py-2" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></Field>
        <Field label="Territorio / ciudad"><input className="w-full rounded border px-3 py-2" value={form.territory} onChange={e=>setForm({...form, territory:e.target.value})} /></Field>
        <Field label="Experiencia / observaciones"><textarea rows={4} className="w-full rounded border px-3 py-2" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></Field>
        <button disabled={m.isPending} className="w-full rounded-full py-3 text-white font-semibold disabled:opacity-50" style={{ background: "var(--riomed-primary, #0E7C66)" }}>
          {m.isPending ? "Enviando..." : "Enviar postulación"}
        </button>
      </form>
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
