import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerSupplier } from "@/lib/riomed-partners.functions";
import { PublicFormShell, PublicFormCard, Field, Input, Textarea } from "@/components/riomed/PublicForm";
import { toast } from "sonner";

export const Route = createFileRoute("/riomed/fornecedor/cadastro")({
  head: () => ({ meta: [{ title: "Seja fornecedor · Rio Med" }] }),
  component: Page,
});

function Page() {
  const fn = useServerFn(registerSupplier);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const [f, setF] = useState({
    legalName: "", tradeName: "", taxId: "", contactName: "", contactEmail: "", contactPhone: "",
    website: "", categories: "", notes: "",
    offerName: "", offerPrice: "", offerMoq: "",
  });
  const submit = async () => {
    setBusy(true);
    try {
      await fn({ data: {
        legalName: f.legalName, tradeName: f.tradeName || undefined, taxId: f.taxId || undefined,
        contactName: f.contactName, contactEmail: f.contactEmail, contactPhone: f.contactPhone,
        website: f.website || undefined, country: "BO",
        categories: f.categories ? f.categories.split(",").map(s => s.trim()).filter(Boolean) : [],
        notes: f.notes || undefined,
        offers: f.offerName ? [{ productName: f.offerName, unitPrice: f.offerPrice ? Number(f.offerPrice) : undefined, moq: f.offerMoq ? Number(f.offerMoq) : undefined }] : [],
      } });
      setDone(true);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };
  return (
    <PublicFormShell title="Cadastro de Fornecedor" subtitle="Envie sua proposta de produtos para a equipe Rio Med avaliar.">
      <PublicFormCard title="Sua empresa" busy={busy} done={done} disabled={!f.legalName || !f.contactEmail || !f.contactPhone}
        doneText="Recebemos seu cadastro. Vamos analisar e entrar em contato." onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Razão social*"><Input value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} /></Field>
          <Field label="Nome fantasia"><Input value={f.tradeName} onChange={(e) => setF({ ...f, tradeName: e.target.value })} /></Field>
          <Field label="NIT / Tax ID"><Input value={f.taxId} onChange={(e) => setF({ ...f, taxId: e.target.value })} /></Field>
          <Field label="Site"><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
          <Field label="Contato*"><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
          <Field label="E-mail*"><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp*"><Input value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} /></Field>
          <Field label="Categorias (separe por vírgula)"><Input value={f.categories} onChange={(e) => setF({ ...f, categories: e.target.value })} placeholder="hospitalar, descartáveis, equipamentos" /></Field>
          <div className="sm:col-span-2"><Field label="Observações"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field></div>
        </div>
        <div className="border-t pt-3 mt-2">
          <p className="text-sm font-medium mb-2">Produto em destaque (opcional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Nome do produto"><Input value={f.offerName} onChange={(e) => setF({ ...f, offerName: e.target.value })} /></Field>
            <Field label="Preço unitário"><Input value={f.offerPrice} onChange={(e) => setF({ ...f, offerPrice: e.target.value })} /></Field>
            <Field label="MOQ"><Input value={f.offerMoq} onChange={(e) => setF({ ...f, offerMoq: e.target.value })} /></Field>
          </div>
        </div>
      </PublicFormCard>
    </PublicFormShell>
  );
}
