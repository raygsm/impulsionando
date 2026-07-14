/**
 * /admin/clientes/colors/vendas/importar — importador de vendas Maisfy (Fase 2).
 * Aceita CSV colado (cabeçalhos em pt/en tolerantes). Suporta dry-run.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { importColorsSales } from "@/lib/colors-import.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/colors/vendas/importar")({
  head: () => ({ meta: [{ title: "Importar vendas Maisfy — Colors" }] }),
  component: ImportColorsSalesPage,
});

// Aliases tolerantes de cabeçalho (lowercase, sem acento)
const HEADER_MAP: Record<string, string> = {
  "id da venda": "external_sale_id",
  "sale id": "external_sale_id",
  "transaction id": "external_sale_id",
  "id_venda": "external_sale_id",
  "external_sale_id": "external_sale_id",

  "id do pedido": "external_order_id",
  "order id": "external_order_id",
  "external_order_id": "external_order_id",

  "sub_id": "colors_checkout_id",
  "external_id": "colors_checkout_id",
  "colors_checkout_id": "colors_checkout_id",
  "ref": "colors_checkout_id",

  "status": "status",
  "situacao": "status",

  "nome": "customer_name",
  "cliente": "customer_name",
  "customer_name": "customer_name",
  "name": "customer_name",

  "email": "customer_email",
  "e-mail": "customer_email",
  "customer_email": "customer_email",

  "telefone": "customer_whatsapp",
  "whatsapp": "customer_whatsapp",
  "phone": "customer_whatsapp",
  "customer_whatsapp": "customer_whatsapp",

  "cpf": "customer_cpf",
  "documento": "customer_cpf",
  "customer_cpf": "customer_cpf",

  "produto": "product_name",
  "product": "product_name",
  "product_name": "product_name",
  "product_slug": "product_slug",
  "slug": "product_slug",

  "quantidade": "quantity",
  "qtd": "quantity",
  "quantity": "quantity",
  "kit": "kit_size",
  "kit_size": "kit_size",

  "valor": "total_price_cents_raw",
  "total": "total_price_cents_raw",
  "amount": "total_price_cents_raw",
  "valor liquido": "total_price_cents_raw",
  "valor bruto": "total_price_cents_raw",

  "cupom": "coupon",
  "coupon": "coupon",

  "codigo do afiliado": "affiliate_code",
  "codigo afiliado": "affiliate_code",
  "affiliate_code": "affiliate_code",
  "id do afiliado": "affiliate_external_id",
  "affiliate_id": "affiliate_external_id",
  "affiliate_external_id": "affiliate_external_id",
  "afiliado": "affiliate_name",
  "affiliate_name": "affiliate_name",

  "data": "approved_at",
  "data aprovacao": "approved_at",
  "approved_at": "approved_at",
};

function normHeader(h: string) {
  return h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") && !lines[0].includes(",") ? ";" : (lines[0].split(",").length > lines[0].split(";").length ? "," : ";");
  const split = (line: string) => {
    const out: string[] = [];
    let cur = ""; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { quoted = !quoted; continue; }
      if (c === sep && !quoted) { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map(normHeader);
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return row;
  });
}
function toCents(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(".", "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}
function mapRows(raw: Record<string, string>[]) {
  return raw.map((r) => {
    const m: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      const target = HEADER_MAP[k];
      if (!target) continue;
      if (target === "total_price_cents_raw") m.total_price_cents = toCents(v);
      else if (target === "quantity" || target === "kit_size") m[target] = Number(v) || undefined;
      else m[target] = v || undefined;
    }
    if (!m.status) m.status = "approved";
    return m;
  }).filter((r) => r.external_sale_id);
}

function ImportColorsSalesPage() {
  const runImport = useServerFn(importColorsSales);
  const [csv, setCsv] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof importColorsSales>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    try { return mapRows(parseCsv(csv)); } catch { return []; }
  }, [csv]);

  const onFile = async (f: File) => {
    setCsv(await f.text());
  };

  const submit = async () => {
    setError(null); setResult(null); setLoading(true);
    try {
      const r = await runImport({ data: { platform: "maisfy", dryRun, rows: preview } });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black text-white">Importar vendas Maisfy — Colors</h1>
      <p className="mt-1 text-sm text-white/60">
        Cole o CSV exportado da Maisfy ou faça upload. Cabeçalhos em pt/en são tolerantes.
        Deduplicação por (plataforma, id_venda). Recomendado rodar dry-run antes.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
          <Upload className="h-4 w-4" />
          Enviar CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="accent-emerald-500" />
          Dry-run (simular sem gravar)
        </label>
        <button
          onClick={submit}
          disabled={loading || preview.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {dryRun ? "Simular" : `Importar ${preview.length} vendas`}
        </button>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="id_venda,status,email,produto,valor,codigo_afiliado&#10;123,approved,user@ex.com,Super Green Black,197.00,AFL01"
        rows={10}
        className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/90"
      />

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
        <b>{preview.length}</b> linhas prontas para importar.
        {preview.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">Prévia das 3 primeiras</summary>
            <pre className="mt-2 overflow-x-auto">{JSON.stringify(preview.slice(0, 3), null, 2)}</pre>
          </details>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-white">
          <div className="text-emerald-300">
            {result.dryRun ? "✓ Simulação concluída" : "✓ Importação concluída"}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <Stat label="Total" v={result.total} />
            <Stat label="Criadas" v={result.created} />
            <Stat label="Atualizadas" v={result.updated} />
            <Stat label="Falhas" v={result.failed} />
          </div>
          {result.errors.length > 0 && (
            <details className="mt-3 text-xs text-red-300">
              <summary className="cursor-pointer">Ver {result.errors.length} erros</summary>
              <pre className="mt-2 overflow-x-auto">{JSON.stringify(result.errors, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md bg-black/30 p-2">
      <div className="text-lg font-black">{v}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}
