import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Download, FileSignature, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  getContractSignedUrl, signContractDocument, listContractSignatures,
} from "@/lib/contracts.functions";
import {
  checkContractAccess, listContractVersionsWithEvidence,
} from "@/lib/contracts-admin.functions";
import { generateAndUploadSignedContract } from "@/lib/contractPdf";
import { supabase } from "@/integrations/supabase/client";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contrato/$id")({
  head: () => ({ meta: [{ title: "Assinatura de Contrato — Impulsionando" }] }),
  component: ContractSignPage,
});

function ContractSignPage() {
  const { id } = useParams({ strict: false });
  const urlFn = useServerFn(getContractSignedUrl);
  const signFn = useServerFn(signContractDocument);
  const sigsFn = useServerFn(listContractSignatures);

  const accessFn = useServerFn(checkContractAccess);
  const versionsFn = useServerFn(listContractVersionsWithEvidence);

  const access = useQuery({
    queryKey: ["contract-access", id],
    queryFn: () => accessFn({ data: { contract_document_id: id! } }),
    enabled: !!id,
    retry: false,
  });

  const doc = useQuery({
    queryKey: ["contract-doc", id],
    queryFn: async () =>
      (await supabase
        .from("contract_documents")
        .select("id, company_id, contract_number, version, status, snapshot, file_hash, signed_storage_path, signed_file_hash, generated_at, signed_at, companies:company_id(name)")
        .eq("id", id!)
        .maybeSingle()).data,
    enabled: !!id && access.data?.allowed === true,
  });

  const urlQ = useQuery({
    queryKey: ["contract-url", id],
    queryFn: () => urlFn({ data: { id: id! } }),
    enabled: !!id && access.data?.allowed === true,
  });

  const sigs = useQuery({
    queryKey: ["contract-sigs-public", id],
    queryFn: () => sigsFn({ data: { contract_document_id: id! } }),
    enabled: !!id && access.data?.allowed === true,
  });

  const versions = useQuery({
    queryKey: ["contract-versions-public", id],
    queryFn: () => versionsFn({ data: { contract_document_id: id! } }),
    enabled: !!id && access.data?.allowed === true,
  });


  const [form, setForm] = useState({ signer_name: "", signer_email: "", signer_doc: "", agree: false });

  const sign = useMutation({
    mutationFn: async () => {
      if (!form.agree) throw new Error("Confirme o aceite dos termos.");
      if (!form.signer_name || !form.signer_email) throw new Error("Informe nome e e-mail.");
      const d = doc.data as any;
      if (!d) throw new Error("Contrato não carregado.");
      const signedAtIso = new Date().toISOString();

      // Hash de assinatura (mesmo cálculo do servidor) para carimbar no PDF
      const enc = new TextEncoder().encode(`${d.file_hash}|${form.signer_email.toLowerCase()}|${signedAtIso}`);
      const digest = await crypto.subtle.digest("SHA-256", enc);
      const signature_hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

      const snap = d.snapshot ?? {};
      const stampPayload = await generateAndUploadSignedContract(
        {
          company_id: d.company_id,
          company_name: snap.company_name ?? d.companies?.name ?? "",
          company_doc: snap.company_doc,
          contract_number: d.contract_number,
          plan_name: snap.plan ?? "",
          modules: snap.modules ?? [],
          monthly_brl: snap.monthly_brl ?? 0,
          setup_brl: snap.setup_brl ?? 0,
          cycle: snap.cycle ?? "mensal",
          minimum_term_days: snap.minimum_term_days,
          signer_name: form.signer_name,
          signer_email: form.signer_email,
          version: d.version ?? 1,
        },
        {
          signer_name: form.signer_name,
          signer_email: form.signer_email,
          signer_doc: form.signer_doc || undefined,
          signed_at: signedAtIso,
          signature_hash,
          original_file_hash: d.file_hash,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      );

      return signFn({
        data: {
          contract_document_id: id!,
          signer_name: form.signer_name,
          signer_email: form.signer_email,
          signer_doc: form.signer_doc || undefined,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          signed_storage_path: stampPayload.signed_storage_path,
          signed_file_hash: stampPayload.signed_file_hash,
          evidence: {
            timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
            language: typeof navigator !== "undefined" ? navigator.language : undefined,
            screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
            client_signature_hash: signature_hash,
            signed_at_client: signedAtIso,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Contrato assinado eletronicamente");
      sigs.refetch();
      doc.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha na assinatura"),
  });

  const signed = doc.data?.status === "signed" || (sigs.data ?? []).length > 0;

  if (access.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Verificando acesso…</div>;
  }
  if (access.isError || !access.data?.allowed) {
    return (
      <div className="max-w-md mx-auto p-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">
          Este contrato pertence a outra empresa ou seu perfil não tem permissão para visualizá-lo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-semibold">Assinatura eletrônica de contrato</h1>
      </div>

      <Card className="p-5 shadow-card space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm text-muted-foreground">Contrato</div>
            <div className="font-mono">{doc.data?.contract_number ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {doc.data?.companies?.name ? `Empresa: ${doc.data.companies.name}` : ""}
            </div>
          </div>
          <Badge variant="outline" className={signed ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}>
            {signed ? "Assinado" : "Aguardando assinatura"}
          </Badge>
        </div>

        {urlQ.data?.url && (
          <iframe
            title="Pré-visualização do contrato"
            src={urlQ.data.url}
            className="w-full h-[60vh] border rounded-md bg-white"
          />
        )}

        <div className="flex flex-wrap gap-2">
          {urlQ.data?.url && (
            <a href={urlQ.data.url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> Baixar PDF original</Button>
            </a>
          )}
          {(doc.data as any)?.signed_storage_path && (
            <Button
              size="sm"
              onClick={async () => {
                const r = await urlFn({ data: { id: id!, signed: true } });
                if (r?.url) window.open(r.url, "_blank");
              }}
            >
              <Download className="w-4 h-4 mr-1" /> Baixar PDF assinado (carimbado)
            </Button>
          )}
        </div>
      </Card>

      {!signed && (
        <Card className="p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> <strong>Aceite eletrônico</strong></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome completo do responsável</Label>
              <Input value={form.signer_name} onChange={(e) => setForm({ ...form, signer_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={form.signer_email} onChange={(e) => setForm({ ...form, signer_email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">CPF/CNPJ</Label>
              <Input value={form.signer_doc} onChange={(e) => setForm({ ...form, signer_doc: e.target.value })} />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={form.agree} onCheckedChange={(v) => setForm({ ...form, agree: !!v })} />
            <span>Li, concordo e aceito eletronicamente todos os termos deste contrato. Confirmo que sou o responsável legal pelo aceite.</span>
          </label>
          <div className="flex justify-end">
            <Button onClick={() => sign.mutate()} disabled={sign.isPending}>
              {sign.isPending ? "Assinando…" : "Assinar contrato"}
            </Button>
          </div>
        </Card>
      )}

      {(sigs.data ?? []).length > 0 && (
        <Card className="p-5 shadow-card space-y-2">
          <div className="font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Assinaturas registradas</div>
          {(sigs.data ?? []).map((s: any) => (
            <div key={s.id} className="border rounded p-2 text-sm">
              <div><strong>{s.signer_name}</strong> · {s.signer_email}</div>
              <div className="text-xs text-muted-foreground">
                Assinado em {new Date(s.signed_at).toLocaleString("pt-BR")} · hash {s.signature_hash?.slice(0, 24)}…
              </div>
            </div>
          ))}
        </Card>
      )}

      {(versions.data ?? []).length > 1 && (
        <Card className="p-5 shadow-card space-y-2">
          <div className="font-medium flex items-center gap-1"><History className="w-4 h-4" /> Histórico de versões</div>
          {(versions.data ?? []).map((v: any) => (
            <div key={v.id} className="border rounded p-2 text-sm flex items-center justify-between gap-2">
              <div>
                <div><strong>v{v.version}</strong> · status {v.status}</div>
                <div className="text-xs text-muted-foreground">
                  Gerado {new Date(v.generated_at).toLocaleString("pt-BR")}
                  {v.signed_at && ` · assinado ${new Date(v.signed_at).toLocaleString("pt-BR")}`}
                </div>
                {v.signatures?.[0] && (
                  <div className="font-mono text-[10px] mt-1">evidência: {v.signatures[0].signature_hash?.slice(0,32)}…</div>
                )}
              </div>
              {v.id === id ? (
                <Badge variant="outline" className="bg-sky-100 text-sky-700">Atual</Badge>
              ) : (
                <a className="text-xs underline" href={`/contrato/${v.id}`}>abrir</a>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
