import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { importCompaniesCsv } from "@/lib/import-companies.functions";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/importar-clientes")({
  head: () => ({ meta: [{ title: "Importar Clientes (CSV)" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: ImportPage,
});

const HEADER = "name,subdomain,domain,email,phone,document,segment,environment,release_channel";
const SAMPLE = `${HEADER}
CHRISMED,chrismed,agenda.chrismed.com.br,contato@chrismed.com.br,,,saude,real,stable
Garrido,garrido,,contato@garrido.com.br,,,imobiliaria,real,stable`;

function parseCsv(text: string): { rows: any[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ["CSV vazio"] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line, i) => {
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length !== headers.length) {
      errors.push(`Linha ${i + 2}: esperado ${headers.length} colunas, achou ${cells.length}`);
    }
    return Object.fromEntries(headers.map((h, j) => [h, cells[j] ?? ""])) as Record<string, string>;
  });
  return { rows, errors };
}

function ImportPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const importFn = useServerFn(importCompaniesCsv);

  const importMut = useMutation({
    mutationFn: (vars: { dryRun: boolean }) =>
      importFn({ data: { rows: preview as any, dryRun: vars.dryRun } }),
    onSuccess: (r: any, vars) => {
      toast.success(
        vars.dryRun
          ? `Validação ok: ${r.total} linhas, ${r.errors} erro(s)`
          : `Importado: ${r.created} criado(s), ${r.updated} atualizado(s), ${r.errors} erro(s)`,
      );
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha na importação"),
  });

  const handleParse = (text: string) => {
    setCsv(text);
    if (!text.trim()) {
      setPreview([]);
      setParseErrors([]);
      return;
    }
    const { rows, errors } = parseCsv(text);
    setPreview(rows);
    setParseErrors(errors);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Importar Clientes (CSV)
        </h1>
        <p className="text-sm text-muted-foreground">
          Bulk-insert/update em <code>companies</code>. Match por <code>name</code> (case-insensitive).
        </p>
      </header>

      <Card className="p-4 bg-muted/30">
        <div className="text-sm font-medium mb-2">Formato esperado</div>
        <code className="block text-xs bg-background p-3 rounded whitespace-pre overflow-x-auto">{HEADER}</code>
        <div className="mt-2 text-xs text-muted-foreground">
          Obrigatório: <code>name</code>. Opcional: subdomain, domain, email, phone, document, segment, environment
          (demo/teste/real), release_channel (dev/beta/stable).
        </div>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => handleParse(SAMPLE)}>
          <FileText className="h-3 w-3 mr-1" /> Carregar exemplo
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <label className="text-sm font-medium">Cole o CSV abaixo</label>
        <textarea
          value={csv}
          onChange={(e) => handleParse(e.target.value)}
          className="w-full min-h-64 font-mono text-xs p-3 border rounded bg-background"
          placeholder={HEADER + "\nNome do tenant,sub,,email@x.com,,,segmento,real,stable"}
        />
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            handleParse(await f.text());
          }}
          className="text-xs"
        />
      </Card>

      {parseErrors.length > 0 && (
        <Card className="p-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <div className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" /> Avisos de parse
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {parseErrors.map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </Card>
      )}

      {preview.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Pré-visualização ({preview.length} linhas)</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={importMut.isPending}
                onClick={() => importMut.mutate({ dryRun: true })}
              >
                Validar (dry-run)
              </Button>
              <Button
                size="sm"
                disabled={importMut.isPending}
                onClick={() => importMut.mutate({ dryRun: false })}
              >
                Importar agora
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="py-1 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="py-1 pr-3 font-mono">{v || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <div className="text-xs text-muted-foreground mt-2">+{preview.length - 20} linhas…</div>
            )}
          </div>
        </Card>
      )}

      {importMut.data && (
        <Card className="p-4 space-y-2">
          <div className="text-sm font-medium">Resultado</div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-emerald-600">{importMut.data.created} criados</Badge>
            <Badge className="bg-blue-600">{importMut.data.updated} atualizados</Badge>
            {importMut.data.errors > 0 && <Badge className="bg-rose-600">{importMut.data.errors} erros</Badge>}
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer">Ver detalhes</summary>
            <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto">
              {importMut.data.results.map((r: any, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  {r.status === "error" ? (
                    <X className="h-3 w-3 text-rose-600 mt-0.5" />
                  ) : (
                    <Check className="h-3 w-3 text-emerald-600 mt-0.5" />
                  )}
                  <span><b>{r.name}</b> — {r.status}{r.message ? `: ${r.message}` : ""}</span>
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}
    </div>
  );
}
