import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { runRiomedImport } from "@/lib/riomed-import.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/importacoes")({
  head: () => ({ meta: [{ title: "Rio Med · Importações" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='imports' title='Importações RioMed'><Page /></TenantModuleShell>),
});

const TARGETS: Array<{ value: string; label: string }> = [
  { value: "__ignore", label: "— Ignorar coluna —" },
  { value: "sku", label: "SKU (obrigatório)" },
  { value: "name", label: "Nome do produto (obrigatório)" },
  { value: "description", label: "Descrição" },
  { value: "category", label: "Categoria" },
  { value: "barcode", label: "Código de barras" },
  { value: "stock", label: "Estoque inicial" },
  { value: "price_sale", label: "Preço de venda" },
  { value: "price_rental_daily", label: "Preço locação/dia" },
  { value: "price_rental_monthly", label: "Preço locação/mês" },
  { value: "image_url", label: "URL da imagem" },
];

// Sugestões automáticas por nome de coluna
function guessTarget(col: string): string {
  const s = col.toLowerCase().trim();
  if (/sku|c[oó]digo|cod[\.\s_-]?prod|item|ref/.test(s)) return "sku";
  if (/nombre|produto|product|descri[cç][aã]o\s*curta|t[ií]tulo|titulo/.test(s) && !s.includes("longa")) return "name";
  if (/descri[cç][aã]o|description|detalhe|observ/.test(s)) return "description";
  if (/categor|familia|grupo|linha/.test(s)) return "category";
  if (/c[oó]digo[\s_-]?barra|barcode|ean|gtin/.test(s)) return "barcode";
  if (/estoque|stock|qtd|quantidade|cantidad|disponib/.test(s)) return "stock";
  if (/locac.*dia|alqu.*dia|renta.*d[ií]a/.test(s)) return "price_rental_daily";
  if (/locac.*m[eê]s|alqu.*m[eê]s|renta.*mes/.test(s)) return "price_rental_monthly";
  if (/pre[cç]o|precio|price|valor/.test(s)) return "price_sale";
  if (/imagem|foto|image|url.*img/.test(s)) return "image_url";
  return "__ignore";
}

function Page() {
  const qc = useQueryClient();
  const runImport = useServerFn(runRiomedImport);

  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string>("");
  const [mappingName, setMappingName] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runRiomedImport>> | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["riomed-import-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("riomed_import_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const validMapping = useMemo(() => {
    const targets = Object.values(mapping).filter((t) => t && t !== "__ignore");
    return targets.includes("sku") && targets.includes("name");
  }, [mapping]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => {
        const data = res.data.filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));
        if (!data.length) { toast.error("CSV vazio"); return; }
        const cols = res.meta.fields ?? Object.keys(data[0]);
        setColumns(cols);
        setRows(data);
        const initial: Record<string, string> = {};
        cols.forEach((c) => { initial[c] = guessTarget(c); });
        setMapping(initial);
        toast.success(`${data.length} linhas carregadas. ${cols.length} colunas detectadas.`);
      },
      error: (err) => toast.error(`Erro ao ler CSV: ${err.message}`),
    });
  };

  const execute = async () => {
    if (!validMapping) { toast.error("Mapeie ao menos SKU e Nome"); return; }
    setRunning(true);
    setResult(null);
    try {
      const cleanMapping: Record<string, string> = {};
      Object.entries(mapping).forEach(([k, v]) => { if (v && v !== "__ignore") cleanMapping[k] = v; });
      const out = await runImport({
        data: { rows, mapping: cleanMapping, sourceLabel: fileName, mappingName: mappingName || undefined },
      });
      setResult(out);
      toast.success(`✓ ${out.created} criados, ${out.updated} atualizados`);
      qc.invalidateQueries({ queryKey: ["riomed-import-jobs"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Importações</h1>
        <p className="text-sm text-muted-foreground">Suba uma planilha CSV, confirme o mapeamento de colunas e importe milhares de produtos com estoque e preço.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> 1. Arquivo CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {fileName && <p className="text-sm text-muted-foreground"><FileText className="h-3 w-3 inline mr-1" /> {fileName} · {rows.length} linhas · {columns.length} colunas</p>}
        </CardContent>
      </Card>

      {columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Mapeamento de colunas</CardTitle>
            <p className="text-xs text-muted-foreground">Os campos foram sugeridos automaticamente. Ajuste se preciso.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {columns.map((col) => (
                <div key={col} className="flex items-center gap-2">
                  <Label className="w-1/3 text-xs truncate" title={col}>{col}</Label>
                  <Select value={mapping[col] ?? "__ignore"} onValueChange={(v) => setMapping((m) => ({ ...m, [col]: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGETS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!validMapping && <p className="text-xs text-destructive">Mapeie ao menos as colunas SKU e Nome.</p>}
          </CardContent>
        </Card>
      )}

      {columns.length > 0 && rows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">3. Pré-visualização (5 primeiras linhas)</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <table className="text-xs w-full">
              <thead className="bg-muted/50">
                <tr>{columns.map((c) => (
                  <th key={c} className="text-left p-2 border-b">
                    <div>{c}</div>
                    <div className="text-muted-foreground font-normal">{mapping[c] && mapping[c] !== "__ignore" ? `→ ${TARGETS.find(t => t.value === mapping[c])?.label}` : "—"}</div>
                  </th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{columns.map((c) => <td key={c} className="p-2 border-b">{String(r[c] ?? "")}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {columns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">4. Executar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Salvar mapeamento como (opcional)</Label>
              <Input value={mappingName} onChange={(e) => setMappingName(e.target.value)} placeholder="Ex.: Planilha Fornecedor X" />
            </div>
            <Button onClick={execute} disabled={!validMapping || running} size="lg">
              {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando…</> : <>Importar {rows.length} linhas</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-base">Resultado</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">{result.created} criados</Badge>
              <Badge variant="secondary">{result.updated} atualizados</Badge>
              <Badge variant="outline">{result.skipped} ignorados</Badge>
              {result.failed > 0 && <Badge variant="destructive">{result.failed} com erro</Badge>}
            </div>
            {result.errors.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer">Ver erros ({result.errors.length})</summary>
                <ul className="mt-2 space-y-1">{result.errors.map((e, i) => <li key={i}>Linha {e.row}: {e.message}</li>)}</ul>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Histórico</h2>
        <div className="space-y-2">
          {history.map((j) => (
            <Card key={j.id}>
              <CardContent className="p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{j.source_label ?? "Importação"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString("pt-BR")} · {j.total_rows} linhas</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={j.status === "done" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>{j.status}</Badge>
                  <Badge variant="outline">+{j.rows_created}</Badge>
                  <Badge variant="outline">~{j.rows_updated}</Badge>
                  {j.rows_failed > 0 && <Badge variant="destructive">×{j.rows_failed}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {!history.length && <p className="text-sm text-muted-foreground">Nenhuma importação ainda.</p>}
        </div>
      </section>
    </div>
  );
}
