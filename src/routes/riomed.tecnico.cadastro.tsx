import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerTechnician } from "@/lib/riomed-partners.functions";
import { PublicFormShell, PublicFormCard, Field, Input, Textarea } from "@/components/riomed/PublicForm";
import { toast } from "sonner";

export const Route = createFileRoute("/riomed/tecnico/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro de Técnico · Rio Med" }] }),
  component: Page,
});

function Page() {
  const fn = useServerFn(registerTechnician);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [f, setF] = useState({
    fullName: "", email: "", phone: "", document: "",
    specialties: "", serviceAreas: "", experienceYears: "", certifications: "", notes: "",
  });
  const submit = async () => {
    setBusy(true);
    try {
      await fn({ data: {
        fullName: f.fullName, email: f.email, phone: f.phone, document: f.document || undefined,
        specialties: f.specialties.split(",").map(s => s.trim()).filter(Boolean),
        serviceAreas: f.serviceAreas.split(",").map(s => s.trim()).filter(Boolean),
        experienceYears: f.experienceYears ? Number(f.experienceYears) : undefined,
        certifications: f.certifications.split(",").map(s => s.trim()).filter(Boolean),
        notes: f.notes || undefined,
      } });
      setDone(true);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <PublicFormShell title="Cadastro de Técnico" subtitle="Instalação, manutenção e assistência a equipamentos médicos.">
      <PublicFormCard title="Seus dados" busy={busy} done={done} disabled={!f.fullName || !f.email || !f.phone}
        doneText="Recebido! Vamos avaliar e entrar em contato em até 5 dias úteis." onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome completo*"><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
          <Field label="Documento (CI/CPF)"><Input value={f.document} onChange={(e) => setF({ ...f, document: e.target.value })} /></Field>
          <Field label="E-mail*"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp*"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Especialidades (vírgula)"><Input value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} placeholder="raio-x, autoclave, ultrassom" /></Field>
          <Field label="Áreas de atuação (vírgula)"><Input value={f.serviceAreas} onChange={(e) => setF({ ...f, serviceAreas: e.target.value })} placeholder="Santa Cruz, La Paz" /></Field>
          <Field label="Anos de experiência"><Input type="number" value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} /></Field>
          <Field label="Certificações (vírgula)"><Input value={f.certifications} onChange={(e) => setF({ ...f, certifications: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Observações"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field></div>
        </div>
      </PublicFormCard>
    </PublicFormShell>
  );
}
