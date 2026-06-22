import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerCandidate } from "@/lib/riomed-partners.functions";
import { PublicFormShell, PublicFormCard, Field, Input, Textarea } from "@/components/riomed/PublicForm";
import { toast } from "sonner";

export const Route = createFileRoute("/riomed/trabalhe-conosco")({
  head: () => ({ meta: [{ title: "Trabalhe conosco · Rio Med" }] }),
  component: Page,
});

function Page() {
  const fn = useServerFn(registerCandidate);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [f, setF] = useState({
    fullName: "", email: "", phone: "", positionInterest: "", city: "",
    experienceSummary: "", resumeUrl: "", linkedinUrl: "", expectedSalary: "",
  });
  const submit = async () => {
    setBusy(true);
    try {
      await fn({ data: {
        fullName: f.fullName, email: f.email, phone: f.phone,
        positionInterest: f.positionInterest, city: f.city || undefined,
        experienceSummary: f.experienceSummary || undefined,
        resumeUrl: f.resumeUrl || undefined, linkedinUrl: f.linkedinUrl || undefined,
        expectedSalary: f.expectedSalary ? Number(f.expectedSalary) : undefined,
      } });
      setDone(true);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <PublicFormShell title="Trabalhe conosco" subtitle="Envie seu currículo para o banco de talentos Rio Med.">
      <PublicFormCard title="Seu perfil" busy={busy} done={done} disabled={!f.fullName || !f.email || !f.phone || !f.positionInterest}
        doneText="Currículo recebido! Quando surgir uma vaga compatível, entraremos em contato." onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome completo*"><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
          <Field label="Cargo de interesse*"><Input value={f.positionInterest} onChange={(e) => setF({ ...f, positionInterest: e.target.value })} /></Field>
          <Field label="E-mail*"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp*"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Cidade"><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
          <Field label="Pretensão salarial"><Input value={f.expectedSalary} onChange={(e) => setF({ ...f, expectedSalary: e.target.value })} /></Field>
          <Field label="LinkedIn"><Input value={f.linkedinUrl} onChange={(e) => setF({ ...f, linkedinUrl: e.target.value })} /></Field>
          <Field label="Link do currículo"><Input value={f.resumeUrl} onChange={(e) => setF({ ...f, resumeUrl: e.target.value })} placeholder="Google Drive, Dropbox..." /></Field>
          <div className="sm:col-span-2"><Field label="Resumo da experiência"><Textarea rows={4} value={f.experienceSummary} onChange={(e) => setF({ ...f, experienceSummary: e.target.value })} /></Field></div>
        </div>
      </PublicFormCard>
    </PublicFormShell>
  );
}
