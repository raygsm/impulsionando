import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitHospitalRequest } from "@/lib/riomed-partners.functions";
import { PublicFormShell, PublicFormCard, Field, Input, Textarea } from "@/components/riomed/PublicForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/riomed/hospital/portal")({
  head: () => ({ meta: [{ title: "Portal Hospitalar · Rio Med" }] }),
  component: Page,
});

function Page() {
  const fn = useServerFn(submitHospitalRequest);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [f, setF] = useState({
    hospitalName: "", contactName: "", contactEmail: "", contactPhone: "",
    requestKind: "quote" as "purchase"|"rental"|"consignment"|"loan"|"emergency"|"quote",
    title: "", description: "",
    priority: "normal" as "low"|"normal"|"high"|"urgent"|"critical",
    neededBy: "", estimatedValue: "",
  });
  const submit = async () => {
    setBusy(true);
    try {
      await fn({ data: {
        hospitalName: f.hospitalName,
        contactName: f.contactName, contactEmail: f.contactEmail, contactPhone: f.contactPhone,
        requestKind: f.requestKind, title: f.title, description: f.description || undefined,
        priority: f.priority, neededBy: f.neededBy || undefined,
        estimatedValue: f.estimatedValue ? Number(f.estimatedValue) : undefined,
      } });
      setDone(true);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <PublicFormShell title="Portal Hospitalar Rio Med" subtitle="Pedidos urgentes, comodato, locação e cotações com prioridade.">
      <PublicFormCard title="Sua solicitação" busy={busy} done={done}
        disabled={!f.hospitalName || !f.contactEmail || !f.contactPhone || !f.title}
        doneText="Solicitação registrada. Nosso time hospitalar entra em contato no SLA combinado." onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Hospital / Clínica*"><Input value={f.hospitalName} onChange={(e) => setF({ ...f, hospitalName: e.target.value })} /></Field>
          <Field label="Responsável*"><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
          <Field label="E-mail*"><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label="Telefone*"><Input value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} /></Field>
          <Field label="Tipo">
            <Select value={f.requestKind} onValueChange={(v: any) => setF({ ...f, requestKind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quote">Cotação</SelectItem>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="rental">Locação</SelectItem>
                <SelectItem value="consignment">Consignação</SelectItem>
                <SelectItem value="loan">Comodato</SelectItem>
                <SelectItem value="emergency">Urgência</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={f.priority} onValueChange={(v: any) => setF({ ...f, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Necessário até"><Input type="date" value={f.neededBy} onChange={(e) => setF({ ...f, neededBy: e.target.value })} /></Field>
          <Field label="Valor estimado (BOB)"><Input value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Título*"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Compra urgente de 200 luvas estéreis" /></Field></div>
          <div className="sm:col-span-2"><Field label="Descrição"><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
        </div>
      </PublicFormCard>
    </PublicFormShell>
  );
}
