import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  getMonthlyFiscalReport,
  exportMonthlyFiscalCsv,
  listFiscalAuditLogs,
  getAccountantEmail,
  setAccountantEmail,
  sendMonthlyFiscalEmail,
  resendMonthlyFiscalEmail,
  getFiscalScheduleSettings,
  setFiscalScheduleSettings,
  getFiscalPeriodStatus,
  previewMonthlyFiscalEmail,
  regenerateFiscalReportSignedUrl,
} from "@/lib/admin-fiscal.functions";
import { downloadCsv } from "@/lib/exports";

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

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Cuiaba",
  "America/Fortaleza",
  "America/Recife",
  "America/Noronha",
  "UTC",
];

const KIND_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "fiscal.report", label: "Consulta" },
  { value: "fiscal.csv", label: "Download CSV" },
  { value: "fiscal.email", label: "E-mail manual" },
  { value: "fiscal.email.retry", label: "Reenvio" },
  { value: "fiscal.email.cron", label: "E-mail automático" },
  { value: "fiscal.email.skipped", label: "Cron pulado (retry)" },
  { value: "fiscal.schedule.update", label: "Atualização de agenda" },
  { value: "fiscal.preview", label: "Pré-visualização" },
  { value: "fiscal.link.regenerated", label: "Link assinado regerado" },
];

function isValidTz(tz: string): boolean {
  if (!tz) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; }
  catch { return false; }
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function kindLabel(k: string) {
  return KIND_OPTIONS.find((o) => o.value === k)?.label ?? k;
}

function statusBadge(status: string | null | undefined) {
  if (!status) {
    return <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Nunca enviado</span>;
  }
  const map: Record<string, string> = {
    sent: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    failed: "bg-red-500/15 text-red-700 border-red-500/30",
  };
  const label: Record<string, string> = {
    sent: "Enviado",
    pending: "Gerado / processando",
    failed: "Falhou",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {label[status] ?? status}
    </span>
  );
}

function AdminFiscalPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth() + 1);
  const [recipientDraft, setRecipientDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const qc = useQueryClient();

  // Schedule form state
  const [schedDraft, setSchedDraft] = useState({
    day: 1, hour: 6, minute: 0, tz: "America/Sao_Paulo",
    email_mode: "link" as "link" | "inline",
  });
  const [schedFeedback, setSchedFeedback] = useState<string | null>(null);

  // Audit filters
  const [auditFilters, setAuditFilters] = useState<{
    from?: string; to?: string; user_email?: string;
    recipient?: string; kind?: string;
  }>({});

  const fetchReport = useServerFn(getMonthlyFiscalReport);
  const fetchCsv = useServerFn(exportMonthlyFiscalCsv);
  const fetchLogs = useServerFn(listFiscalAuditLogs);
  const fetchAccountant = useServerFn(getAccountantEmail);
  const saveAccountant = useServerFn(setAccountantEmail);
  const sendEmail = useServerFn(sendMonthlyFiscalEmail);
  const resendEmail = useServerFn(resendMonthlyFiscalEmail);
  const fetchSchedule = useServerFn(getFiscalScheduleSettings);
  const saveSchedule = useServerFn(setFiscalScheduleSettings);
  const fetchStatus = useServerFn(getFiscalPeriodStatus);

  const q = useQuery({
    queryKey: ["admin-fiscal", year, month],
    queryFn: () => fetchReport({ data: { year, month } }),
  });
  const logsQ = useQuery({
    queryKey: ["admin-fiscal-logs", auditFilters],
    queryFn: () => fetchLogs({ data: { ...auditFilters, limit: 1000 } }),
    refetchOnWindowFocus: false,
  });
  const acctQ = useQuery({
    queryKey: ["admin-fiscal-accountant"],
    queryFn: () => fetchAccountant(),
  });
  const schedQ = useQuery({
    queryKey: ["admin-fiscal-schedule"],
    queryFn: () => fetchSchedule(),
  });
  const statusQ = useQuery({
    queryKey: ["admin-fiscal-status", year, month],
    queryFn: () => fetchStatus({ data: { year, month } }),
  });

  useEffect(() => {
    if (acctQ.data?.email && !recipientDraft) setRecipientDraft(acctQ.data.email);
  }, [acctQ.data?.email]);

  useEffect(() => {
    if (schedQ.data) setSchedDraft(schedQ.data);
  }, [schedQ.data]);

  const saveMut = useMutation({
    mutationFn: (email: string) => saveAccountant({ data: { email } }),
    onSuccess: () => {
      setFeedback("E-mail do contador salvo.");
      qc.invalidateQueries({ queryKey: ["admin-fiscal-accountant"] });
    },
    onError: (e: any) => setFeedback(`Erro: ${e?.message ?? e}`),
  });

  const sendMut = useMutation({
    mutationFn: () =>
      sendEmail({
        data: {
          year, month,
          recipient: recipientDraft || undefined,
          email_mode: schedDraft.email_mode,
        },
      }),
    onSuccess: (res: any) => {
      setFeedback(`Enviado para ${res.recipient} (modo ${res.email_mode}).`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-status", year, month] });
    },
    onError: (e: any) => setFeedback(`Erro: ${e?.message ?? e}`),
  });

  const resendMut = useMutation({
    mutationFn: (force: boolean) =>
      resendEmail({ data: { year, month, force } }),
    onSuccess: (res: any) => {
      setFeedback(`Reenviado para ${res.recipient}.`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-status", year, month] });
    },
    onError: (e: any) => setFeedback(`Erro no reenvio: ${e?.message ?? e}`),
  });

  const schedMut = useMutation({
    mutationFn: () => saveSchedule({ data: schedDraft }),
    onSuccess: () => {
      setSchedFeedback("Agenda salva. O cron verifica a cada hora e dispara no momento configurado.");
      qc.invalidateQueries({ queryKey: ["admin-fiscal-schedule"] });
    },
    onError: (e: any) => setSchedFeedback(`Erro: ${e?.message ?? e}`),
  });

  async function downloadReportCsv() {
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
    qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
  }

  const r = q.data;
  const latest = statusQ.data?.latest;

  const auditRows = useMemo(
    () =>
      (logsQ.data ?? []).map((l: any) => {
        const p = l.params ?? {};
        return {
          quando: new Date(l.created_at).toLocaleString("pt-BR"),
          usuario: l.user_email ?? (l.notes === "cron" ? "(cron)" : ""),
          acao: kindLabel(l.kind),
          ano: p.year ?? "",
          mes: p.month ?? "",
          destinatario: l.recipient ?? "",
          modo: p.email_mode ?? "",
          arquivo: p.path ?? p.filename ?? "",
          tentativa: p.attempt ?? "",
          linhas: l.row_count ?? 0,
        };
      }),
    [logsQ.data],
  );

  function exportAuditCsv() {
    downloadCsv(
      `auditoria-fiscal-${new Date().toISOString().slice(0, 10)}.csv`,
      ["quando", "usuario", "acao", "ano", "mes", "destinatario", "modo", "arquivo", "tentativa", "linhas"],
      auditRows,
    );
  }

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
            Receitas pagas + estimativa de impostos (ISS, PIS, COFINS) com agenda configurável,
            controle de envio por período e auditoria completa.
          </p>
        </div>
        <div className="no-print flex flex-wrap items-end gap-2">
          <label className="text-sm">Mês{" "}
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="ml-1 rounded border border-border bg-background px-2 py-1 text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="text-sm">Ano{" "}
            <input type="number" value={year} min={2020} max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ml-1 w-24 rounded border border-border bg-background px-2 py-1 text-sm" />
          </label>
          <button onClick={() => q.refetch()}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm">
            Recalcular
          </button>
          <button onClick={downloadReportCsv} disabled={!r}
            className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            Baixar CSV
          </button>
          <button onClick={() => window.print()} disabled={!r}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50">
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
            <Stat label={`ISS (${(r.rates.iss * 100).toFixed(2)}%)`} value={brl(r.totals.iss)} />
            <Stat label={`PIS+COFINS (${((r.rates.pis + r.rates.cofins) * 100).toFixed(2)}%)`}
              value={brl(r.totals.pis + r.totals.cofins)} />
            <Stat label="Receita líquida" value={brl(r.totals.net)} />
          </section>

          {/* Agenda + modo */}
          <section className="no-print mb-6 rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Agenda do envio mensal</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              O cron roda de hora em hora; o e-mail só é disparado no dia/hora abaixo, no fuso
              escolhido, e apenas uma vez por mês (idempotente).
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <label className="text-xs">Dia do mês
                <input type="number" min={1} max={28} value={schedDraft.day}
                  onChange={(e) => setSchedDraft({ ...schedDraft, day: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" />
              </label>
              <label className="text-xs">Hora (0-23)
                <input type="number" min={0} max={23} value={schedDraft.hour}
                  onChange={(e) => setSchedDraft({ ...schedDraft, hour: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" />
              </label>
              <label className="text-xs">Minuto
                <input type="number" min={0} max={59} value={schedDraft.minute}
                  onChange={(e) => setSchedDraft({ ...schedDraft, minute: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm" />
              </label>
              <label className="text-xs">Fuso horário
                <select value={schedDraft.tz}
                  onChange={(e) => setSchedDraft({ ...schedDraft, tz: e.target.value })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm">
                  {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-xs">Modo do e-mail
                <select value={schedDraft.email_mode}
                  onChange={(e) => setSchedDraft({ ...schedDraft, email_mode: e.target.value as any })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm">
                  <option value="link">Apenas link assinado (CSV)</option>
                  <option value="inline">Resumo inline + link assinado</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => schedMut.mutate()} disabled={schedMut.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {schedMut.isPending ? "Salvando…" : "Salvar agenda"}
              </button>
              {schedFeedback && (
                <span className="text-xs text-muted-foreground">{schedFeedback}</span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">
                Anexar PDF via e-mail não é suportado pelo provedor; o modo "Resumo inline" embute a tabela no corpo
                do e-mail (pronta para "Imprimir → Salvar como PDF") junto com o link assinado para o CSV.
              </span>
            </div>
          </section>

          {/* Envio + status do período */}
          <section className="no-print mb-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Envio do período — {MONTHS[month - 1]}/{year}
              </h2>
              <div className="flex items-center gap-2">
                Status: {statusBadge(latest?.status)}
                {latest && (
                  <span className="text-[11px] text-muted-foreground">
                    tent. #{latest.attempt} · {new Date(latest.created_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
            {latest?.status === "failed" && latest?.error_message && (
              <p className="mb-2 rounded bg-red-500/10 px-3 py-2 text-xs text-red-700">
                Último erro: {latest.error_message}
              </p>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">E-mail do contador
                <input type="email" value={recipientDraft}
                  onChange={(e) => setRecipientDraft(e.target.value)}
                  placeholder="contador@escritorio.com.br"
                  className="ml-2 w-72 rounded border border-border bg-background px-2 py-1 text-sm" />
              </label>
              <button onClick={() => saveMut.mutate(recipientDraft)}
                disabled={saveMut.isPending || !recipientDraft}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50">
                {saveMut.isPending ? "Salvando…" : "Salvar padrão"}
              </button>
              <button onClick={() => sendMut.mutate()}
                disabled={sendMut.isPending || !recipientDraft}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {sendMut.isPending ? "Enviando…" : `Enviar agora`}
              </button>
              <button onClick={() => resendMut.mutate(false)}
                disabled={resendMut.isPending || latest?.status !== "failed"}
                title={latest?.status === "failed"
                  ? "Reenvia automaticamente o último período com falha"
                  : "Disponível apenas quando o último envio falhou"}
                className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-40">
                {resendMut.isPending ? "Reenviando…" : "Reenviar (último falhou)"}
              </button>
              <button onClick={() => resendMut.mutate(true)}
                disabled={resendMut.isPending}
                className="rounded border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50">
                Forçar novo envio
              </button>
              {feedback && (
                <span className="text-xs text-muted-foreground">{feedback}</span>
              )}
            </div>
          </section>

          {/* Tabela de faturas */}
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
                        {row.paid_at ? new Date(row.paid_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="py-2 pr-3">{row.company_name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{row.company_document || "—"}</td>
                      <td className="py-2 pr-3 text-xs">{row.period_start} → {row.period_end}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.gross)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.iss)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.pis)}</td>
                      <td className="py-2 pr-3 text-right">{brl(row.cofins)}</td>
                      <td className="py-2 pr-3 text-right font-medium">{brl(row.net)}</td>
                    </tr>
                  ))}
                  {r.rows.length === 0 && (
                    <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">
                      Nenhuma fatura quitada nesse período.
                    </td></tr>
                  )}
                </tbody>
                {r.rows.length > 0 && (
                  <tfoot className="border-t-2 border-border font-semibold">
                    <tr>
                      <td className="py-2 pr-3" colSpan={4}>TOTAL ({r.totals.count} faturas)</td>
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

          {/* Auditoria com filtros + CSV */}
          <section className="no-print mt-8 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Auditoria de exportações</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => logsQ.refetch()}
                  className="rounded border border-border bg-background px-2 py-1 text-xs">
                  Atualizar
                </button>
                <button onClick={exportAuditCsv} disabled={auditRows.length === 0}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  Baixar CSV
                </button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              <label className="text-xs">De
                <input type="date"
                  value={auditFilters.from?.slice(0, 10) ?? ""}
                  onChange={(e) => setAuditFilters({
                    ...auditFilters,
                    from: e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : undefined,
                  })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" />
              </label>
              <label className="text-xs">Até
                <input type="date"
                  value={auditFilters.to?.slice(0, 10) ?? ""}
                  onChange={(e) => setAuditFilters({
                    ...auditFilters,
                    to: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : undefined,
                  })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" />
              </label>
              <label className="text-xs">Usuário (e-mail)
                <input type="text" placeholder="contém…"
                  value={auditFilters.user_email ?? ""}
                  onChange={(e) => setAuditFilters({ ...auditFilters, user_email: e.target.value || undefined })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" />
              </label>
              <label className="text-xs">Destinatário
                <input type="text" placeholder="contains…"
                  value={auditFilters.recipient ?? ""}
                  onChange={(e) => setAuditFilters({ ...auditFilters, recipient: e.target.value || undefined })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs" />
              </label>
              <label className="text-xs">Ação
                <select value={auditFilters.kind ?? ""}
                  onChange={(e) => setAuditFilters({ ...auditFilters, kind: e.target.value || undefined })}
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs">
                  {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <button onClick={() => setAuditFilters({})}
                className="rounded border border-border bg-background px-2 py-1 text-xs">
                Limpar filtros
              </button>
              <span className="text-[11px] text-muted-foreground">
                {auditRows.length} registro(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3">Quando</th>
                    <th className="py-1 pr-3">Usuário</th>
                    <th className="py-1 pr-3">Ação</th>
                    <th className="py-1 pr-3">Período</th>
                    <th className="py-1 pr-3">Destinatário</th>
                    <th className="py-1 pr-3">Modo</th>
                    <th className="py-1 pr-3">Tent.</th>
                    <th className="py-1 pr-3 text-right">Linhas</th>
                  </tr>
                </thead>
                <tbody>
                  {(logsQ.data ?? []).map((l: any) => {
                    const p = l.params ?? {};
                    return (
                      <tr key={l.id} className="border-t border-border/60">
                        <td className="py-1 pr-3">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                        <td className="py-1 pr-3">
                          {l.user_email ?? (l.notes === "cron" ? "— (cron)" : "—")}
                        </td>
                        <td className="py-1 pr-3">{kindLabel(l.kind)}</td>
                        <td className="py-1 pr-3">
                          {p.year && p.month ? `${String(p.month).padStart(2, "0")}/${p.year}` : "—"}
                        </td>
                        <td className="py-1 pr-3">{l.recipient ?? "—"}</td>
                        <td className="py-1 pr-3">{p.email_mode ?? "—"}</td>
                        <td className="py-1 pr-3">{p.attempt ?? "—"}</td>
                        <td className="py-1 pr-3 text-right">{l.row_count}</td>
                      </tr>
                    );
                  })}
                  {(logsQ.data ?? []).length === 0 && !logsQ.isLoading && (
                    <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">
                      Nenhum registro com esses filtros.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Fonte: <code>core_export_logs</code> (scope <code>admin.fiscal</code>). O CSV
              respeita exatamente os filtros aplicados.
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
