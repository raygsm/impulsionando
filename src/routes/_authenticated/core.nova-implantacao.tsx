import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeProjectPrompt,
  saveDraftGeneration,
  approveAndProvision,
} from "@/lib/ai-generator.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Upload, CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  Loader2, FileText, Image as ImageIcon, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/nova-implantacao")({
  head: () => ({ meta: [{ title: "Nova Implantação por IA — Impulsionando Core" }] }),
  component: NovaImplantacaoIA,
});

type ClientData = {
  companyName: string;
  legalName: string;
  document: string;
  responsibleName: string;
  email: string;
  financialEmail: string;
  whatsapp: string;
  segment: string;
  website: string;
  instagram: string;
};

type ProjectData = {
  projectName: string;
  subdomain: string;
  customDomain: string;
  segment: string;
  objective: string;
  audience: string;
  city: string;
  state: string;
};

type FileEntry = {
  kind: "logo" | "institucional" | "apoio";
  bucketPath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

type Analysis = {
  segmento: string;
  tipo_negocio: string;
  publico_alvo: string;
  modulos_sugeridos: string[];
  paginas_sugeridas: string[];
  comunicacoes_sugeridas: string[];
  identidade_sugerida?: { cor_primaria?: string; cor_secundaria?: string; tom_voz?: string };
  resumo_executivo: string;
};

function NovaImplantacaoIA() {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<ClientData>({
    companyName: "", legalName: "", document: "", responsibleName: "",
    email: "", financialEmail: "", whatsapp: "", segment: "",
    website: "", instagram: "",
  });
  const [project, setProject] = useState<ProjectData>({
    projectName: "", subdomain: "", customDomain: "", segment: "",
    objective: "", audience: "", city: "", state: "",
  });
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<{ step: string; ok: boolean }[] | null>(null);

  const analyzeFn = useServerFn(analyzeProjectPrompt);
  const saveFn = useServerFn(saveDraftGeneration);
  const provisionFn = useServerFn(approveAndProvision);

  const handleUpload = useCallback(async (kind: FileEntry["kind"], fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("ai-project-uploads").upload(path, file);
      if (error) {
        toast({ title: "Falha no upload", description: error.message, variant: "destructive" });
        continue;
      }
      setFiles((prev) => [
        ...prev,
        { kind, bucketPath: path, originalName: file.name, mimeType: file.type, sizeBytes: file.size },
      ]);
    }
  }, []);

  const validateStep1 = () => {
    if (!client.companyName || !client.responsibleName || !client.email || !client.whatsapp || !client.document) {
      toast({ title: "Campos obrigatórios", description: "Preencha empresa, responsável, e-mail, WhatsApp e documento.", variant: "destructive" });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(client.email)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!project.projectName || !project.subdomain) {
      toast({ title: "Nome do projeto e subdomínio são obrigatórios", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (prompt.trim().length < 20) {
      toast({ title: "Prompt muito curto", description: "Descreva o projeto com ao menos 20 caracteres.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeFn({
        data: {
          prompt,
          clientData: client,
          projectData: project,
          filesMeta: files.map((f) => ({ kind: f.kind, name: f.originalName, mime: f.mimeType })),
        },
      });
      setAnalysis(result as Analysis);
      const saved = await saveFn({
        data: {
          prompt,
          clientData: client,
          projectData: project,
          uploadedFiles: files,
          aiAnalysis: result,
          status: "analisado",
        },
      });
      setGenerationId(saved.id ?? null);
      setStep(5);
    } catch (e: any) {
      toast({ title: "Falha na análise", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!generationId) return;
    setProvisioning(true);
    try {
      const result = await provisionFn({ data: { generationId } });
      setChecklist(result.checklist ?? []);
      toast({ title: "Cliente provisionado!", description: `${result.name} criado com sucesso.` });
    } catch (e: any) {
      toast({ title: "Falha no provisionamento", description: e.message, variant: "destructive" });
    } finally {
      setProvisioning(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnalysis(null);
    setGenerationId(null);
    setChecklist(null);
    setFiles([]);
    setPrompt("");
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
          A IA analisa, sugere a estrutura e aguarda sua aprovação antes de provisionar.
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mt-6 mb-2">
          {["Cliente", "Projeto", "Prompt", "Uploads", "Análise"].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
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

      {/* STEP 1: Cliente */}
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

      {/* STEP 2: Projeto */}
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

      {/* STEP 3: Prompt */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Descreva o Projeto</h2>
          <p className="text-sm text-muted-foreground">
            Conte para a IA tudo o que o cliente precisa: tipo de negócio, jornada, recursos, integrações, identidade.
          </p>
          <Textarea
            rows={12}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Criar um site completo para psicóloga especializada em ansiedade e depressão, com agenda online, área do paciente, pagamentos online, comunicação por WhatsApp e e-mail, blog, FAQ, SEO e área administrativa completa."
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <Button onClick={() => setStep(4)} disabled={prompt.trim().length < 20}>
              Avançar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Uploads */}
      {step === 4 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Upload de Arquivos</h2>
          <p className="text-sm text-muted-foreground">
            Anexe logo, imagens institucionais e materiais de apoio (PDFs, apresentações). A IA usa estes arquivos para identidade visual.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DropZone label="Logo principal" icon={<ImageIcon className="w-5 h-5" />} accept="image/*" onFiles={(fl) => handleUpload("logo", fl)} />
            <DropZone label="Imagens institucionais" icon={<ImageIcon className="w-5 h-5" />} accept="image/*" multiple onFiles={(fl) => handleUpload("institucional", fl)} />
            <DropZone label="Materiais adicionais" icon={<FileText className="w-5 h-5" />} accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" multiple onFiles={(fl) => handleUpload("apoio", fl)} />
          </div>
          {files.length > 0 && (
            <div className="border rounded-md p-3 space-y-1 bg-muted/30">
              <div className="text-xs font-medium mb-1">{files.length} arquivo(s) enviados:</div>
              {files.map((f, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <Badge variant="outline">{f.kind}</Badge>
                  <span>{f.originalName}</span>
                  <span className="text-muted-foreground">({Math.round(f.sizeBytes / 1024)} KB)</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analisar Projeto
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: Análise + Aprovação */}
      {step === 5 && analysis && (
        <>
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Análise da IA</h2>
            </div>
            <p className="text-sm">{analysis.resumo_executivo}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <InfoBox label="Segmento" value={analysis.segmento} />
              <InfoBox label="Tipo de negócio" value={analysis.tipo_negocio} />
              <InfoBox label="Público-alvo" value={analysis.publico_alvo} />
            </div>

            <Section title={`Módulos sugeridos (${analysis.modulos_sugeridos.length})`}>
              <div className="flex flex-wrap gap-2">
                {analysis.modulos_sugeridos.map((m) => <Badge key={m}>{m}</Badge>)}
              </div>
            </Section>

            <Section title="Páginas sugeridas">
              <div className="flex flex-wrap gap-2">
                {analysis.paginas_sugeridas.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
              </div>
            </Section>

            <Section title="Comunicações automáticas">
              <div className="flex flex-wrap gap-2">
                {analysis.comunicacoes_sugeridas.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}
              </div>
            </Section>

            {analysis.identidade_sugerida && (
              <Section title="Identidade sugerida">
                <div className="flex items-center gap-3 text-sm">
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
              </Section>
            )}
          </Card>

          {checklist ? (
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-lg">Checklist de Implantação</h2>
              </div>
              {checklist.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-amber-600" />}
                  {c.step}
                </div>
              ))}
              <div className="pt-3 flex gap-2">
                <Button onClick={handleReset}>Criar outra implantação</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 flex gap-3 flex-wrap">
              <Button onClick={handleApprove} disabled={provisioning} size="lg">
                {provisioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                Aprovar e Criar
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
      <span className="text-xs font-medium">{label}</span>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      {children}
    </div>
  );
}
