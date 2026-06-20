import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getMonthlyFiscalReport,
  exportMonthlyFiscalCsv,
} from "@/lib/admin-fiscal.functions";

export const Route = createFileRoute("/_authenticated/admin/fiscal")({
  head: () => ({
    meta: [
      { title: "Relatório fiscal mensal — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminFiscalPage,
});

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminFiscalPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth() + 1);
  const fetchReport = useServerFn(getMonthlyFiscalReport);
  const fetchCsv = useServerFn(exportMonthlyFiscalCsv);

  const q = useQuery({
    queryKey: ["admin-fiscal", year, month],
    queryFn: () => fetchReport({ data: { year, month } }),
  });

  async function downloadCsv() {
    const res = await fetchCsv({ data: { year, month } });
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const r = q.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 print:px-0 print:py-0">
      <style>{`@media print {
        .no-print { display: none !important; }
        body { background: white; }
      }`}</style>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatório fiscal mensal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Receitas pagas + estimativa de impostos (ISS, PIS, COFINS) a partir das faturas
            quitadas no período. Alíquotas configuráveis via <code>core_settings</code>
            (chaves <code>fiscal.iss_rate</code>, <code>fiscal.pis_rate</code>,{" "}
            <code>fiscal.cofins_rate</code>).
          </p>
        </div>
        <div className="no-print flex flex-wrap items-end gap-2">
          <label className="text-sm">
            Mês{" "}
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="ml-1 rounded border border-border bg-background px-2 py-1 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Ano{" "}
            <input
              type="number"
              value={year}
              min={2020}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ml-1 w-24 rounded border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <button
            onClick={downloadCsv}
            disabled={!r}
            className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Baixar CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={!r}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Imprimir / Salvar PDF
          </button>
        </div>
      </header>

      {q.isLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {q.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      )}

      {r && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Faturas" value={r.totals.count.toString()} />
            <Stat label="Receita bruta" value={brl(r.totals.gross)} />
            <Stat
              label={`ISS (${(r.rates.iss * 100).toFixed(2)}%)`}
              value={brl(r.totals.iss)}
            />
            <Stat
              label={`PIS+COFINS (${((r.rates.pis + r.rates.cofins) * 100).toFixed(2)}%)`}
              value={brl(r.totals.pis + r.totals.cofins)}
            />
            <Stat label="Receita líquida" value={brl(r.totals.net)} />
          </section>

          <section className="rounded-lg border border-border bg-card p-4 print:border-0 print:p-0">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Faturas pagas em {MONTHS[r.month - 1]} {r.year}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Pago em</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">CNPJ/CPF</th>
                    <th className="py-2 pr-3">Período</th>
                    <th className="py-2 pr-3 text-right">Bruto</th>
                    <th className="py-2 pr-3 text-right">ISS</th>
                    <th className="py-2 pr-3 text-right">PIS</th>
                    <th className="py-2 pr-3 text-right">COFINS</th>
                    <th className="py-2 pr-3 text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={row.invoice_id} className="border-t border-border/60">
                      <td className="py-2 pr-3">
                        {row.paid_at
                          ? new Date(row.paid_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="py-2 pr-3">{row.company_name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {row.company_document || "—"}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {row.period_start} → {row.period_end}
                      </td>
                      <td className="py-2 pr-3 text-right">{brl(row.gross)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.iss)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.pis)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.cofins)}</td>
                      <td className="py-2 pr-3 text-right font-medium">{brl(row.net)}</td>
                    </tr>
                  ))}
                  {r.rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground">
                        Nenhuma fatura quitada nesse período.
                      </td>
                    </tr>
                  )}
                </tbody>
                {r.rows.length > 0 && (
                  <tfoot className="border-t-2 border-border font-semibold">
                    <tr>
                      <td className="py-2 pr-3" colSpan={4}>
                        TOTAL ({r.totals.count} faturas)
                      </td>
                      <td className="py-2 pr-3 text-right">{brl(r.totals.gross)}</td>
                      <td className="py-2 pr-3 text-right">{brl(r.totals.iss)}</td>
                      <td className="py-2 pr-3 text-right">{brl(r.totals.pis)}</td>
                      <td className="py-2 pr-3 text-right">{brl(r.totals.cofins)}</td>
                      <td className="py-2 pr-3 text-right">{brl(r.totals.net)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Gerado em {new Date(r.generated_at).toLocaleString("pt-BR")}. Valores de imposto
              são estimativa contábil — confirme com seu contador antes de emitir guias.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
