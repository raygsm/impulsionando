import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeProjectPrompt,
  saveDraftGeneration,
  approveAndProvision,
  validateAnalysisPlan,
  getProvisioningStatus,
} from "@/lib/ai-generator.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Upload, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ArrowLeft,
  Loader2, FileText, Image as ImageIcon, Rocket, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/nova-implantacao")({
  head: () => ({ meta: [{ title: "Nova Implantação por IA — Impulsionando Core" }] }),
  component: NovaImplantacaoIA,
});

type ClientData = {
  companyName: string; legalName: string; document: string; responsibleName: string;
  email: string; financialEmail: string; whatsapp: string; segment: string;
  website: string; instagram: string;
};
type ProjectData = {
  projectName: string; subdomain: string; customDomain: string; segment: string;
  objective: string; audience: string; city: string; state: string;
};
type FileEntry = {
  kind: "logo" | "institucional" | "apoio";
  bucketPath: string; originalName: string; mimeType: string; sizeBytes: number;
};
type Analysis = {
  segmento: string; tipo_negocio: string; publico_alvo: string;
  modulos_sugeridos: string[]; paginas_sugeridas: string[]; comunicacoes_sugeridas: string[];
  identidade_sugerida?: { cor_primaria?: string; cor_secundaria?: string; tom_voz?: string };
  resumo_executivo: string;
};
type ValidationPlan = {
  modules: { slug: string; exists: boolean; name: string; category: string | null; certified: boolean; version: string | null }[];
  communications: { event_code: string; channels: string[]; template_available: boolean }[];
  pages: { name: string; reused: boolean }[];
  duplicate: { existing: any; fillable: Record<string, any> } | null;
  summary: { modules_total: number; modules_ready: number; comms_total: number; comms_ready: number };
};
type ProvStep = { key: string; label: string; ok: boolean | null; message?: string };

function NovaImplantacaoIA() {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<ClientData>({
    companyName: "", legalName: "", document: "", responsibleName: "",
    email: "", financialEmail: "", whatsapp: "", segment: "", website: "", instagram: "",
  });
  const [project, setProject] = useState<ProjectData>({
    projectName: "", subdomain: "", customDomain: "", segment: "",
    objective: "", audience: "", city: "", state: "",
  });
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [plan, setPlan] = useState<ValidationPlan | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [provSteps, setProvSteps] = useState<ProvStep[] | null>(null);
  const [provStatus, setProvStatus] = useState<string | null>(null);
  const [provError, setProvError] = useState<string | null>(null);
  const [mergeIntoId, setMergeIntoId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const analyzeFn = useServerFn(analyzeProjectPrompt);
  const saveFn = useServerFn(saveDraftGeneration);
  const provisionFn = useServerFn(approveAndProvision);
  const validateFn = useServerFn(validateAnalysisPlan);
  const statusFn = useServerFn(getProvisioningStatus);

  useEffect(() => {
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, []);

  const handleUpload = useCallback(async (kind: FileEntry["kind"], fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name}: arquivo maior que 25MB`);
          continue;
        }
        const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("ai-project-uploads").upload(path, file);
        if (error) { toast.error("Falha no upload: " + error.message); continue; }
        setFiles((prev) => [
          ...prev,
          { kind, bucketPath: path, originalName: file.name, mimeType: file.type, sizeBytes: file.size },
        ]);
      }
    } finally { setUploading(false); }
  }, []);

  const validateStep1 = () => {
    if (!client.companyName || !client.responsibleName || !client.email || !client.whatsapp || !client.document) {
      toast.error("Preencha empresa, responsável, e-mail, WhatsApp e documento."); return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(client.email)) { toast.error("E-mail inválido"); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!project.projectName || !project.subdomain) {
      toast.error("Nome do projeto e subdomínio são obrigatórios"); return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (prompt.trim().length < 20) { toast.error("Descreva o projeto com ao menos 20 caracteres."); return; }
    setAnalyzing(true);
    try {
      const result = await analyzeFn({
        data: {
          prompt, clientData: client, projectData: project,
          filesMeta: files.map((f) => ({ kind: f.kind, name: f.originalName, mime: f.mimeType })),
        },
      });
      setAnalysis(result as Analysis);
      const saved = await saveFn({
        data: {
          prompt, clientData: client, projectData: project, uploadedFiles: files,
          aiAnalysis: result, status: "analisado",
        },
      });
      const id = saved.id ?? null;
      setGenerationId(id);
      setStep(5);
      if (id) {
        setValidating(true);
        try {
          const p = (await validateFn({ data: { generationId: id } })) as ValidationPlan;
          setPlan(p);
        } catch (e: any) {
          toast.error("Falha na validação: " + e.message);
        } finally { setValidating(false); }
      }
    } catch (e: any) {
      toast.error("Falha na análise: " + e.message);
    } finally { setAnalyzing(false); }
  };

  const startPolling = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await statusFn({ data: { generationId: id } });
        setProvSteps(s.steps as ProvStep[]);
        setProvStatus(s.status);
        if (s.error) setProvError(s.error);
        if (s.status === "provisionado" || s.status === "falhou") {
          if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
        }
      } catch { /* ignore transient */ }
    }, 1200) as unknown as number;
  };

  const handleApprove = async () => {
    if (!generationId) return;
    setProvisioning(true);
    setProvError(null);
    setProvSteps([]);
    setProvStatus("provisionando");
    startPolling(generationId);
    try {
      const result = await provisionFn({
        data: { generationId, mergeIntoExistingCompanyId: mergeIntoId ?? undefined },
      });
      setProvSteps(result.checklist as ProvStep[]);
      setProvStatus("provisionado");
      toast.success(`${result.name ?? "Cliente"} ${result.reused ? "atualizado" : "criado"} com sucesso.`);
    } catch (e: any) {
      setProvError(e.message);
      setProvStatus("falhou");
      toast.error("Falha no provisionamento: " + e.message);
    } finally {
      setProvisioning(false);
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    }
  };

  const handleReset = () => {
    setStep(1); setAnalysis(null); setPlan(null); setGenerationId(null);
    setProvSteps(null); setProvStatus(null); setProvError(null); setMergeIntoId(null);
    setFiles([]); setPrompt("");
  };

  const handleRevalidate = async () => {
    if (!generationId) return;
    setValidating(true);
    try {
      const p = (await validateFn({ data: { generationId } })) as ValidationPlan;
      setPlan(p);
    } catch (e: any) { toast.error(e.message); }
    finally { setValidating(false); }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Nova Implantação por IA</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Crie cliente, projeto, módulos, comunicação e usuário master a partir de um prompt e arquivos.
          A IA analisa, valida o reaproveitamento e aguarda sua aprovação antes de provisionar.
        </p>

        <div className="flex items-center gap-2 mt-6 mb-2 flex-wrap">
          {["Cliente", "Projeto", "Prompt", "Uploads", "Análise"].map((label, i) => {
            const n = i + 1;
            const active = step === n; const done = step > n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  done ? "bg-green-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{done ? "✓" : n}</div>
                <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
                {n < 5 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </Card>

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Dados do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome da empresa *" value={client.companyName} onChange={(v) => setClient({ ...client, companyName: v })} />
            <Field label="Razão social" value={client.legalName} onChange={(v) => setClient({ ...client, legalName: v })} />
            <Field label="CPF/CNPJ *" value={client.document} onChange={(v) => setClient({ ...client, document: v })} />
            <Field label="Responsável *" value={client.responsibleName} onChange={(v) => setClient({ ...client, responsibleName: v })} />
            <Field label="E-mail principal *" type="email" value={client.email} onChange={(v) => setClient({ ...client, email: v })} />
            <Field label="E-mail financeiro" type="email" value={client.financialEmail} onChange={(v) => setClient({ ...client, financialEmail: v })} />
            <Field label="WhatsApp principal *" value={client.whatsapp} onChange={(v) => setClient({ ...client, whatsapp: v })} />
            <Field label="Segmento" value={client.segment} onChange={(v) => setClient({ ...client, segment: v })} />
            <Field label="Site atual" value={client.website} onChange={(v) => setClient({ ...client, website: v })} />
            <Field label="Instagram" value={client.instagram} onChange={(v) => setClient({ ...client, instagram: v })} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => validateStep1() && setStep(2)}>Avançar <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Dados do Projeto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome do projeto *" value={project.projectName} onChange={(v) => setProject({ ...project, projectName: v })} />
            <Field label="Subdomínio desejado *" value={project.subdomain} onChange={(v) => setProject({ ...project, subdomain: v })} placeholder="cliente" />
            <Field label="Domínio próprio (opcional)" value={project.customDomain} onChange={(v) => setProject({ ...project, customDomain: v })} placeholder="cliente.com.br" />
            <Field label="Segmento" value={project.segment} onChange={(v) => setProject({ ...project, segment: v })} />
            <Field label="Objetivo principal" value={project.objective} onChange={(v) => setProject({ ...project, objective: v })} />
            <Field label="Público-alvo" value={project.audience} onChange={(v) => setProject({ ...project, audience: v })} />
            <Field label="Cidade" value={project.city} onChange={(v) => setProject({ ...project, city: v })} />
            <Field label="Estado" value={project.state} onChange={(v) => setProject({ ...project, state: v })} />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <Button onClick={() => validateStep2() && setStep(3)}>Avançar <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Descreva o Projeto</h2>
          <p className="text-sm text-muted-foreground">
            Conte para a IA tudo o que o cliente precisa: tipo de negócio, jornada, recursos, integrações, identidade.
          </p>
          <Textarea rows={12} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Criar um site completo para psicóloga especializada em ansiedade e depressão, com agenda online, área do paciente, pagamentos online, comunicação por WhatsApp e e-mail, blog, FAQ, SEO e área administrativa completa." />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <Button onClick={() => setStep(4)} disabled={prompt.trim().length < 20}>Avançar <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Upload de Arquivos</h2>
          <p className="text-sm text-muted-foreground">
            Anexe logo, imagens institucionais, PDFs, apresentações e materiais de apoio. A IA usa esses arquivos para extrair tom, segmento e identidade visual.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DropZone label="Logo principal (PNG/SVG)" icon={<ImageIcon className="w-5 h-5" />}
              accept="image/png,image/jpeg,image/svg+xml,image/webp" onFiles={(fl) => handleUpload("logo", fl)} />
            <DropZone label="Imagens institucionais" icon={<ImageIcon className="w-5 h-5" />}
              accept="image/*" multiple onFiles={(fl) => handleUpload("institucional", fl)} />
            <DropZone label="PDFs, apresentações e materiais de apoio" icon={<FileText className="w-5 h-5" />}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.key,.odt,.odp,image/*"
              multiple onFiles={(fl) => handleUpload("apoio", fl)} />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> enviando arquivos...
            </div>
          )}
          {files.length > 0 && (
            <div className="border rounded-md p-3 space-y-1 bg-muted/30">
              <div className="text-xs font-medium mb-1">{files.length} arquivo(s) enviados:</div>
              {files.map((f, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <Badge variant="outline">{f.kind}</Badge>
                  <span>{f.originalName}</span>
                  <span className="text-muted-foreground">({Math.round(f.sizeBytes / 1024)} KB)</span>
                  <span className="text-muted-foreground text-[10px]">{f.mimeType || "?"}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <Button onClick={handleAnalyze} disabled={analyzing || uploading}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analisar Projeto
            </Button>
          </div>
        </Card>
      )}

      {step === 5 && analysis && (
        <>
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Análise da IA</h2>
              </div>
              <Button size="sm" variant="ghost" onClick={handleRevalidate} disabled={validating}>
                <RefreshCw className={`w-3 h-3 mr-1 ${validating ? "animate-spin" : ""}`} /> Revalidar
              </Button>
            </div>
            <p className="text-sm">{analysis.resumo_executivo}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <InfoBox label="Segmento" value={analysis.segmento} />
              <InfoBox label="Tipo de negócio" value={analysis.tipo_negocio} />
              <InfoBox label="Público-alvo" value={analysis.publico_alvo} />
            </div>

            {plan?.summary && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">
                  Módulos: {plan.summary.modules_ready}/{plan.summary.modules_total} prontos
                </Badge>
                <Badge variant="secondary">
                  Comunicações: {plan.summary.comms_ready}/{plan.summary.comms_total} com template global
                </Badge>
                <Badge variant="secondary">Páginas: {plan.pages.length} (conteúdo reutilizado)</Badge>
              </div>
            )}
          </Card>

          {/* Duplicate warning */}
          {plan?.duplicate && (
            <Card className="p-6 space-y-3 border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold">Cliente já existe (CPF/CNPJ)</h3>
              </div>
              <div className="text-sm">
                Encontramos <strong>{plan.duplicate.existing.name}</strong> com o mesmo documento{" "}
                <code className="text-xs">{plan.duplicate.existing.document}</code>.
              </div>
              {Object.keys(plan.duplicate.fillable).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Campos faltantes que serão complementados:{" "}
                  {Object.entries(plan.duplicate.fillable).map(([k, v]) => (
                    <Badge key={k} variant="outline" className="ml-1">{k}: {String(v)}</Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant={mergeIntoId ? "default" : "outline"}
                  onClick={() => setMergeIntoId(plan.duplicate!.existing.id)}>
                  {mergeIntoId ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                  Reutilizar e complementar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMergeIntoId(null)}>
                  Criar novo mesmo assim
                </Button>
              </div>
            </Card>
          )}

          {/* Modules plan */}
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold">Módulos que serão instalados / reutilizados</h3>
            {validating && !plan && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Validando catálogo...
              </div>
            )}
            <div className="space-y-1.5">
              {(plan?.modules ?? analysis.modulos_sugeridos.map((s) => ({ slug: s, exists: true, name: s, category: null, certified: true, version: null }))).map((m: any) => (
                <div key={m.slug} className="flex items-center gap-2 text-sm">
                  {m.exists && m.certified
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : m.exists
                      ? <AlertTriangle className="w-4 h-4 text-amber-600" />
                      : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium">{m.name}</span>
                  <code className="text-xs text-muted-foreground">{m.slug}</code>
                  {m.category && <Badge variant="outline" className="text-[10px]">{m.category}</Badge>}
                  {m.version && <Badge variant="secondary" className="text-[10px]">v{m.version}</Badge>}
                  {!m.exists && <span className="text-xs text-red-600">não encontrado</span>}
                  {m.exists && !m.certified && <span className="text-xs text-amber-600">não certificado</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Pages */}
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold">Páginas (conteúdo editável reutilizado)</h3>
            <div className="flex flex-wrap gap-2">
              {(plan?.pages ?? analysis.paginas_sugeridas.map((p) => ({ name: p, reused: true }))).map((p: any, i: number) => (
                <Badge key={i} variant="secondary">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />{p.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Páginas são entregues como conteúdo editável dentro dos módulos <code>area_cliente</code> e site.
            </p>
          </Card>

          {/* Communications */}
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold">Comunicações automáticas</h3>
            <div className="space-y-1.5">
              {(plan?.communications ?? analysis.comunicacoes_sugeridas.map((c) => ({ event_code: c, channels: [], template_available: false }))).map((c: any) => (
                <div key={c.event_code} className="flex items-center gap-2 text-sm">
                  {c.template_available
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <code className="text-xs">{c.event_code}</code>
                  {c.channels.length > 0
                    ? c.channels.map((ch: string) => <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>)
                    : <span className="text-xs text-amber-600">sem template global — criar manual</span>}
                </div>
              ))}
            </div>
          </Card>

          {analysis.identidade_sugerida && (
            <Card className="p-6 space-y-2">
              <h3 className="font-semibold">Identidade sugerida</h3>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {analysis.identidade_sugerida.cor_primaria && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded border" style={{ background: analysis.identidade_sugerida.cor_primaria }} />
                    {analysis.identidade_sugerida.cor_primaria}
                  </span>
                )}
                {analysis.identidade_sugerida.cor_secundaria && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded border" style={{ background: analysis.identidade_sugerida.cor_secundaria }} />
                    {analysis.identidade_sugerida.cor_secundaria}
                  </span>
                )}
                {analysis.identidade_sugerida.tom_voz && <span className="text-muted-foreground">Tom: {analysis.identidade_sugerida.tom_voz}</span>}
              </div>
            </Card>
          )}

          {/* Provisioning progress / approval */}
          {provSteps && provSteps.length > 0 ? (
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                {provStatus === "provisionado" ? <Rocket className="w-5 h-5 text-green-600" />
                  : provStatus === "falhou" ? <XCircle className="w-5 h-5 text-red-600" />
                    : <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                <h2 className="font-semibold text-lg">
                  {provStatus === "provisionado" ? "Implantação concluída"
                    : provStatus === "falhou" ? "Implantação falhou"
                      : "Provisionando em tempo real..."}
                </h2>
              </div>
              {provSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {s.ok === null
                    ? <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-muted-foreground" />
                    : s.ok
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                      : <XCircle className="w-4 h-4 mt-0.5 text-amber-600" />}
                  <div>
                    <div>{s.label}</div>
                    {s.message && <div className="text-xs text-muted-foreground">{s.message}</div>}
                  </div>
                </div>
              ))}
              {provError && (
                <div className="text-sm text-red-600 border border-red-300 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                  {provError}
                </div>
              )}
              {(provStatus === "provisionado" || provStatus === "falhou") && (
                <div className="pt-3 flex gap-2 flex-wrap">
                  <Button onClick={handleReset}>Criar outra implantação</Button>
                  {provStatus === "falhou" && (
                    <Button variant="outline" onClick={handleApprove}>Tentar novamente</Button>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 flex gap-3 flex-wrap">
              <Button onClick={handleApprove} disabled={provisioning || validating} size="lg">
                {provisioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                {mergeIntoId ? "Aprovar e Atualizar Cliente" : "Aprovar e Criar"}
              </Button>
              <Button variant="outline" onClick={() => setStep(3)}>Editar Prompt</Button>
              <Button variant="ghost" onClick={handleReset}>Cancelar</Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function DropZone({ label, icon, accept, multiple, onFiles }: {
  label: string; icon: React.ReactNode; accept?: string; multiple?: boolean;
  onFiles: (fl: FileList | null) => void;
}) {
  return (
    <label className="border-2 border-dashed border-muted-foreground/30 rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition">
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
      <Upload className="w-4 h-4 text-muted-foreground" />
      <input type="file" className="hidden" accept={accept} multiple={multiple} onChange={(e) => onFiles(e.target.files)} />
    </label>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
