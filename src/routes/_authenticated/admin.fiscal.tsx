import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
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
  listFailedFiscalRuns,
  sendTestFiscalEmail,
  logFiscalLinkAction,
  logFiscalPreviewCsvDownload,
  listTestSendHistory,
  getTestFiscalEmailPdfHtml,
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
  { value: "fiscal.email.test", label: "E-mail de teste" },
  { value: "fiscal.email.test.failed", label: "E-mail de teste (falhou)" },
  { value: "fiscal.schedule.update", label: "Atualização de agenda" },
  { value: "fiscal.preview", label: "Pré-visualização" },
  { value: "fiscal.preview.csv", label: "CSV baixado na pré-visualização" },
  { value: "fiscal.link.regenerated", label: "Link assinado regerado" },
  { value: "fiscal.link.copied", label: "Link assinado copiado" },
  { value: "fiscal.link.opened", label: "Link assinado aberto" },
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

  // Schedule form state (inclui retry + expiração)
  const [schedDraft, setSchedDraft] = useState({
    day: 1, hour: 6, minute: 0, tz: "America/Sao_Paulo",
    email_mode: "link" as "link" | "inline",
    max_attempts: 3,
    backoff_minutes: 60,
    link_expiry_hours: 168,
  });
  const [schedFeedback, setSchedFeedback] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState<number>(168);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ subject?: string; email_mode?: string; expires_at?: string } | null>(null);

  // Audit filters
  const [auditFilters, setAuditFilters] = useState<{
    from?: string; to?: string; user_email?: string;
    recipient?: string; kind?: string; kinds?: string[];
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
  const previewEmail = useServerFn(previewMonthlyFiscalEmail);
  const regenerateLink = useServerFn(regenerateFiscalReportSignedUrl);
  const fetchFailed = useServerFn(listFailedFiscalRuns);
  const sendTest = useServerFn(sendTestFiscalEmail);
  const logLink = useServerFn(logFiscalLinkAction);
  const logPreviewCsv = useServerFn(logFiscalPreviewCsvDownload);
  const fetchTestHistory = useServerFn(listTestSendHistory);
  const fetchTestPdfHtml = useServerFn(getTestFiscalEmailPdfHtml);

  const [showHistory, setShowHistory] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [testEmailMode, setTestEmailMode] = useState<"link" | "inline" | null>(null);
  // Test-history pagination + filters
  const TEST_PAGE_SIZE = 5;
  const [testFilters, setTestFilters] = useState<{
    recipient?: string;
    status?: "all" | "sent" | "failed";
    year?: number;
    month?: number;
    page: number;
  }>({ status: "all", page: 0 });



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
  const failedQ = useQuery({
    queryKey: ["admin-fiscal-failed"],
    queryFn: () => fetchFailed(),
    refetchInterval: 60_000,
  });
  const testHistoryQ = useQuery({
    queryKey: ["admin-fiscal-test-history", testFilters],
    queryFn: () => fetchTestHistory({ data: {
      limit: TEST_PAGE_SIZE,
      offset: testFilters.page * TEST_PAGE_SIZE,
      recipient: testFilters.recipient || undefined,
      status: testFilters.status === "all" ? undefined : testFilters.status,
      year: testFilters.year,
      month: testFilters.month,
    }}),
    refetchOnWindowFocus: false,
  });


  useEffect(() => {
    if (acctQ.data?.email && !recipientDraft) setRecipientDraft(acctQ.data.email);
  }, [acctQ.data?.email]);

  useEffect(() => {
    if (schedQ.data) {
      setSchedDraft({
        day: schedQ.data.day,
        hour: schedQ.data.hour,
        minute: schedQ.data.minute,
        tz: schedQ.data.tz,
        email_mode: schedQ.data.email_mode,
        max_attempts: schedQ.data.max_attempts ?? 3,
        backoff_minutes: schedQ.data.backoff_minutes ?? 60,
        link_expiry_hours: schedQ.data.link_expiry_hours ?? 168,
      });
      setExpiryHours(schedQ.data.link_expiry_hours ?? 168);
    }
  }, [schedQ.data]);

  // Validação client-side da agenda
  const schedErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!Number.isInteger(schedDraft.day) || schedDraft.day < 1 || schedDraft.day > 28)
      e.day = "Dia entre 1 e 28.";
    if (!Number.isInteger(schedDraft.hour) || schedDraft.hour < 0 || schedDraft.hour > 23)
      e.hour = "Hora 0–23.";
    if (!Number.isInteger(schedDraft.minute) || schedDraft.minute < 0 || schedDraft.minute > 59)
      e.minute = "Minuto 0–59.";
    if (!isValidTz(schedDraft.tz))
      e.tz = "Fuso IANA inválido (ex.: America/Sao_Paulo).";
    if (!Number.isInteger(schedDraft.max_attempts) || schedDraft.max_attempts < 1 || schedDraft.max_attempts > 10)
      e.max_attempts = "Entre 1 e 10.";
    if (!Number.isInteger(schedDraft.backoff_minutes) || schedDraft.backoff_minutes < 5 || schedDraft.backoff_minutes > 1440)
      e.backoff_minutes = "Entre 5 e 1440 min.";
    if (!Number.isInteger(schedDraft.link_expiry_hours) || schedDraft.link_expiry_hours < 1 || schedDraft.link_expiry_hours > 720)
      e.link_expiry_hours = "Entre 1h e 720h.";
    return e;
  }, [schedDraft]);
  const schedHasErrors = Object.keys(schedErrors).length > 0;

  const expiryError = useMemo(() => {
    if (!Number.isInteger(expiryHours) || expiryHours < 1 || expiryHours > 720)
      return "Expiração entre 1h e 720h.";
    return null;
  }, [expiryHours]);

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
          expiry_hours: expiryHours,
        },
      }),
    onSuccess: (res: any) => {
      setFeedback(`Enviado para ${res.recipient} (modo ${res.email_mode}).`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-status", year, month] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-failed"] });
    },
    onError: (e: any) => setFeedback(`Erro: ${e?.message ?? e}`),
  });

  const resendMut = useMutation({
    mutationFn: (opts: boolean | { force: boolean; reason?: string; year?: number; month?: number }) => {
      const norm = typeof opts === "boolean"
        ? { force: opts, reason: undefined, year, month }
        : { force: opts.force, reason: opts.reason, year: opts.year ?? year, month: opts.month ?? month };
      return resendEmail({ data: {
        year: norm.year, month: norm.month,
        force: norm.force,
        expiry_hours: expiryHours,
        reason: norm.reason,
      }});
    },
    onSuccess: (res: any) => {
      setFeedback(`Reenviado para ${res.recipient}${res.reason ? ` (motivo registrado)` : ""}.`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-status", year, month] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-failed"] });
    },
    onError: (e: any) => setFeedback(`Erro no reenvio: ${e?.message ?? e}`),
  });

  const schedMut = useMutation({
    mutationFn: () => saveSchedule({ data: schedDraft }),
    onSuccess: () => {
      setSchedFeedback("Agenda salva. O cron verifica de hora em hora e dispara no momento configurado.");
      qc.invalidateQueries({ queryKey: ["admin-fiscal-schedule"] });
    },
    onError: (e: any) => setSchedFeedback(`Erro: ${e?.message ?? e}`),
  });

  const previewMut = useMutation({
    mutationFn: () =>
      previewEmail({ data: { year, month, email_mode: schedDraft.email_mode } }),
    onSuccess: (res: any) => {
      setPreviewHtml(res.html);
      setPreviewMeta({ subject: res.subject, email_mode: res.email_mode, expires_at: res.expires_at });
    },
    onError: (e: any) => setFeedback(`Erro na pré-visualização: ${e?.message ?? e}`),
  });

  const regenMut = useMutation({
    mutationFn: (csv_path: string) => regenerateLink({ data: { csv_path, expiry_hours: expiryHours } }),
    onSuccess: async (res: any, csv_path: string) => {
      try { navigator.clipboard?.writeText(res.url); } catch {}
      // O servidor já registra fiscal.link.regenerated; aqui adicionamos o "copiado" pra rastrear UI
      try {
        await logLink({ data: {
          action: "copied",
          csv_path,
          signed_url: res.url,
          signed_url_expires_at: res.expires_at,
          year, month,
          source: "regenerate-button",
        }});
      } catch {}
      setFeedback(`Link regerado (expira ${new Date(res.expires_at).toLocaleString("pt-BR")}) e copiado.`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
    },
    onError: (e: any) => setFeedback(`Erro ao regerar link: ${e?.message ?? e}`),
  });

  const testMut = useMutation({
    mutationFn: () => sendTest({ data: {
      year, month,
      recipient: testRecipient,
      email_mode: testEmailMode ?? schedDraft.email_mode,
      expiry_hours: expiryHours,
    }}),
    onSuccess: (res: any) => {
      setFeedback(`E-mail de teste enviado para ${res.recipient} (modo ${res.email_mode}). Não conta como envio oficial.`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-test-history"] });
    },
    onError: (e: any) => {
      setFeedback(`Erro no envio de teste: ${e?.message ?? e}`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-fiscal-test-history"] });
    },
  });

  async function copySignedLink(opts: {
    url: string; csv_path?: string; expires_at?: string;
    year?: number; month?: number; source: string;
  }) {
    try { await navigator.clipboard?.writeText(opts.url); } catch {}
    try {
      await logLink({ data: {
        action: "copied",
        csv_path: opts.csv_path,
        signed_url: opts.url,
        signed_url_expires_at: opts.expires_at,
        year: opts.year, month: opts.month,
        source: opts.source,
      }});
    } catch {}
    setFeedback("Link copiado e registrado na auditoria.");
    qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
  }

  async function downloadPreviewCsv() {
    const res = await fetchCsv({ data: { year, month } });
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = res.filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    try {
      await logPreviewCsv({ data: {
        year, month,
        recipient: recipientDraft || acctQ.data?.email || null,
        email_mode: previewMeta?.email_mode === "inline" || previewMeta?.email_mode === "link"
          ? previewMeta.email_mode
          : schedDraft.email_mode,
        row_count: q.data?.totals.count ?? 0,
        filename: res.filename,
      }});
    } catch {}
    qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
  }


  async function downloadTestPdf(opts: {
    year: number; month: number;
    email_mode: "link" | "inline";
    recipient: string | null;
  }) {
    try {
      const res = await fetchTestPdfHtml({ data: opts });
      const win = window.open("", "_blank", "width=820,height=900");
      if (!win) {
        setFeedback("Não foi possível abrir a janela de impressão. Verifique o bloqueador de popups.");
        return;
      }
      // Sanitiza: o HTML do template é gerado pelo servidor a partir do nosso
      // próprio React Email template — origem confiável.
      win.document.open();
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${res.filename}</title>
        <style>@media print { @page { margin: 12mm; } body { -webkit-print-color-adjust: exact; } }</style>
      </head><body>${res.html}<script>setTimeout(function(){window.print();},250);</script></body></html>`);
      win.document.close();
      setFeedback(`PDF do teste pronto (${res.filename}). Use o diálogo de impressão para salvar.`);
      qc.invalidateQueries({ queryKey: ["admin-fiscal-logs"] });
    } catch (e: any) {
      setFeedback(`Erro ao gerar PDF: ${e?.message ?? e}`);
    }
  }


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
  const history = statusQ.data?.history ?? [];
  const failedRuns = failedQ.data?.runs ?? [];

  // Estado do link assinado do envio mais recente (para alerta pré-envio)
  const latestLinkState = useMemo(() => {
    const exp = latest?.signed_url_expires_at;
    if (!exp || !latest?.csv_path) return null;
    const ms = new Date(exp).getTime() - Date.now();
    const hours = ms / 3_600_000;
    return {
      csv_path: latest.csv_path as string,
      expires_at: exp as string,
      hours_remaining: hours,
      expired: hours <= 0,
      expiring_soon: hours > 0 && hours <= 24,
    };
  }, [latest]);



  const auditRows = useMemo(
    () =>
      (logsQ.data ?? []).map((l: any) => {
        const p = l.params ?? {};
        return {
          id: l.id,
          kind: l.kind,
          quando: new Date(l.created_at).toLocaleString("pt-BR"),
          usuario: l.user_email ?? (l.notes === "cron" ? "(cron)" : ""),
          acao: kindLabel(l.kind),
          ano: p.year ?? "",
          mes: p.month ?? "",
          destinatario: l.recipient ?? "",
          modo: p.email_mode ?? "",
          arquivo: p.path ?? p.filename ?? "",
          tentativa: p.attempt ?? "",
          link: p.signed_url ?? "",
          link_expira_em: p.signed_url_expires_at
            ? new Date(p.signed_url_expires_at).toLocaleString("pt-BR")
            : "",
          expiry_hours: p.expiry_hours ?? "",
          linhas: l.row_count ?? 0,
        };
      }),
    [logsQ.data],
  );

  function exportAuditCsv() {
    downloadCsv(
      `auditoria-fiscal-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "quando", "usuario", "acao", "ano", "mes", "destinatario",
        "modo", "arquivo", "tentativa", "expiry_hours", "link",
        "link_expira_em", "linhas",
      ],
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

          {/* Agenda + modo + retry */}
          <section className="no-print mb-6 rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Agenda do envio mensal</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              O cron roda de hora em hora; o e-mail só é disparado no dia/hora abaixo, no fuso
              escolhido, e apenas uma vez por mês (idempotente). Falhas respeitam o limite de tentativas e backoff abaixo.
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Dia do mês" error={schedErrors.day}>
                <input type="number" min={1} max={28} value={schedDraft.day}
                  onChange={(e) => setSchedDraft({ ...schedDraft, day: Number(e.target.value) })}
                  className={inputCls(schedErrors.day)} />
              </Field>
              <Field label="Hora (0-23)" error={schedErrors.hour}>
                <input type="number" min={0} max={23} value={schedDraft.hour}
                  onChange={(e) => setSchedDraft({ ...schedDraft, hour: Number(e.target.value) })}
                  className={inputCls(schedErrors.hour)} />
              </Field>
              <Field label="Minuto" error={schedErrors.minute}>
                <input type="number" min={0} max={59} value={schedDraft.minute}
                  onChange={(e) => setSchedDraft({ ...schedDraft, minute: Number(e.target.value) })}
                  className={inputCls(schedErrors.minute)} />
              </Field>
              <Field label="Fuso horário (IANA)" error={schedErrors.tz}>
                <input list="tz-list" value={schedDraft.tz}
                  onChange={(e) => setSchedDraft({ ...schedDraft, tz: e.target.value })}
                  className={inputCls(schedErrors.tz)} />
                <datalist id="tz-list">
                  {TIMEZONES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </Field>
              <Field label="Modo do e-mail">
                <select value={schedDraft.email_mode}
                  onChange={(e) => setSchedDraft({ ...schedDraft, email_mode: e.target.value as any })}
                  className={inputCls()}>
                  <option value="link">Apenas link assinado (CSV)</option>
                  <option value="inline">Resumo inline + link assinado</option>
                </select>
              </Field>
              <Field label="Máx. tentativas" error={schedErrors.max_attempts}>
                <input type="number" min={1} max={10} value={schedDraft.max_attempts}
                  onChange={(e) => setSchedDraft({ ...schedDraft, max_attempts: Number(e.target.value) })}
                  className={inputCls(schedErrors.max_attempts)} />
              </Field>
              <Field label="Backoff (min)" error={schedErrors.backoff_minutes}>
                <input type="number" min={5} max={1440} value={schedDraft.backoff_minutes}
                  onChange={(e) => setSchedDraft({ ...schedDraft, backoff_minutes: Number(e.target.value) })}
                  className={inputCls(schedErrors.backoff_minutes)} />
              </Field>
              <Field label="Expiração padrão do link (h)" error={schedErrors.link_expiry_hours}>
                <input type="number" min={1} max={720} value={schedDraft.link_expiry_hours}
                  onChange={(e) => setSchedDraft({ ...schedDraft, link_expiry_hours: Number(e.target.value) })}
                  className={inputCls(schedErrors.link_expiry_hours)} />
              </Field>
            </div>
            {schedHasErrors && (
              <p className="mt-2 rounded bg-red-500/10 px-3 py-2 text-xs text-red-700">
                Corrija os campos destacados antes de salvar.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => schedMut.mutate()}
                disabled={schedMut.isPending || schedHasErrors}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {schedMut.isPending ? "Salvando…" : "Salvar agenda"}
              </button>
              {schedFeedback && (
                <span className="text-xs text-muted-foreground">{schedFeedback}</span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">
                Após {schedDraft.max_attempts} falhas consecutivas o cron para de tentar; use "Forçar novo envio" para retomar.
              </span>
            </div>
          </section>

          {/* Envio + status do período + expiração + preview */}
          <section className="no-print mb-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Envio do período — {MONTHS[month - 1]}/{year}
              </h2>
              <div className="flex items-center gap-2">
                Status: {statusBadge(latest?.status)}
                {latest && (
                  <span className="text-[11px] text-muted-foreground">
                    tent. #{latest.attempt}/{schedDraft.max_attempts} · {new Date(latest.created_at).toLocaleString("pt-BR")}
                  </span>
                )}
                {history.length > 0 && (
                  <button onClick={() => setShowHistory((v) => !v)}
                    className="rounded border border-border bg-background px-2 py-0.5 text-[11px]">
                    {showHistory ? "Ocultar" : "Ver"} histórico ({history.length})
                  </button>
                )}
              </div>
            </div>
            {latest?.status === "failed" && latest?.error_message && (
              <p className="mb-2 rounded bg-red-500/10 px-3 py-2 text-xs text-red-700">
                Último erro: {latest.error_message}
              </p>
            )}
            {latestLinkState && (latestLinkState.expired || latestLinkState.expiring_soon) && (
              <div className={`mb-2 flex flex-wrap items-center gap-2 rounded px-3 py-2 text-xs ${
                latestLinkState.expired
                  ? "bg-red-500/10 text-red-700"
                  : "bg-amber-500/10 text-amber-800"
              }`}>
                <span>
                  {latestLinkState.expired
                    ? "⚠ O link assinado do último envio já expirou."
                    : `⚠ O link assinado expira em ~${Math.round(latestLinkState.hours_remaining)}h (${new Date(latestLinkState.expires_at).toLocaleString("pt-BR")}).`}
                  {" Regere antes de reenviar para o contador."}
                </span>
                <button
                  onClick={() => regenMut.mutate(latestLinkState.csv_path)}
                  disabled={regenMut.isPending || !!expiryError}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium">
                  {regenMut.isPending ? "Regerando…" : `Regerar link (${expiryHours}h)`}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">E-mail do contador
                <input type="email" value={recipientDraft}
                  onChange={(e) => setRecipientDraft(e.target.value)}
                  placeholder="contador@escritorio.com.br"
                  className="ml-2 w-72 rounded border border-border bg-background px-2 py-1 text-sm" />
              </label>
              <label className="text-sm">Link expira em (h)
                <input type="number" min={1} max={720} value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className={`ml-2 w-24 rounded border bg-background px-2 py-1 text-sm ${expiryError ? "border-red-500" : "border-border"}`} />
              </label>
              <button onClick={() => saveMut.mutate(recipientDraft)}
                disabled={saveMut.isPending || !recipientDraft}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50">
                {saveMut.isPending ? "Salvando…" : "Salvar padrão"}
              </button>
              <button onClick={() => previewMut.mutate()} disabled={previewMut.isPending}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50">
                {previewMut.isPending ? "Gerando…" : "Pré-visualizar e-mail"}
              </button>
              <button onClick={() => sendMut.mutate()}
                disabled={sendMut.isPending || !recipientDraft || !!expiryError}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {sendMut.isPending ? "Enviando…" : `Enviar agora`}
              </button>
              <button onClick={() => resendMut.mutate(false)}
                disabled={resendMut.isPending || latest?.status !== "failed" || !!expiryError}
                title={latest?.status === "failed"
                  ? "Respeita máx. tentativas e janela de backoff configurados"
                  : "Disponível apenas quando o último envio falhou"}
                className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-40">
                {resendMut.isPending ? "Reenviando…" : "Reenviar (último falhou)"}
              </button>
              <button onClick={() => resendMut.mutate(true)}
                disabled={resendMut.isPending || !!expiryError}
                title="Ignora máx. tentativas e backoff"
                className="rounded border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50">
                Forçar novo envio
              </button>
              {expiryError && (
                <span className="text-xs text-red-700">{expiryError}</span>
              )}
              {feedback && (
                <span className="text-xs text-muted-foreground">{feedback}</span>
              )}
            </div>

            {/* Envio de teste */}
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded border border-dashed border-border bg-muted/30 p-3">
              <div className="text-xs font-semibold text-foreground">
                Envio de teste
                <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  não conta como envio oficial
                </span>
              </div>
              <label className="text-xs">Destinatário de teste
                <input type="email" value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="ml-2 w-64 rounded border border-border bg-background px-2 py-1 text-xs" />
              </label>
              <label className="text-xs" title="Anexos não são suportados — ‘link assinado’ envia o CSV via link seguro; ‘inline’ adiciona um resumo no corpo do e-mail.">
                Modo do teste
                <select
                  value={testEmailMode ?? schedDraft.email_mode}
                  onChange={(e) => setTestEmailMode(e.target.value as "link" | "inline")}
                  className="ml-2 rounded border border-border bg-background px-2 py-1 text-xs">
                  <option value="link">Link assinado (CSV)</option>
                  <option value="inline">Resumo inline + link</option>
                </select>
              </label>
              {testEmailMode && testEmailMode !== schedDraft.email_mode && (
                <button type="button" onClick={() => setTestEmailMode(null)}
                  className="rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                  Usar modo configurado ({schedDraft.email_mode})
                </button>
              )}
              <button onClick={() => testMut.mutate()}
                disabled={testMut.isPending || !testRecipient || !!expiryError}
                title="Envia o corpo real e um link assinado novo para o destinatário informado, sem registrar como envio oficial"
                className="rounded border border-border bg-background px-3 py-1 text-xs font-medium disabled:opacity-50">
                {testMut.isPending ? "Enviando teste…" : `Enviar teste (${testEmailMode ?? schedDraft.email_mode})`}
              </button>
              <button onClick={() => downloadTestPdf({ year, month, email_mode: testEmailMode ?? schedDraft.email_mode, recipient: testRecipient || null })}
                title="Gera um PDF do corpo do e-mail de teste (independente do modo link/inline). Abre uma nova janela e dispara o diálogo de impressão para salvar como PDF. O download é registrado na auditoria."
                className="rounded border border-border bg-background px-3 py-1 text-xs font-medium">
                Baixar PDF do teste
              </button>
              <span className="text-[10px] text-muted-foreground">
                Útil para validar conteúdo/link antes do envio para o contador. Assunto vai com prefixo [TESTE]. O modo escolhido fica registrado na auditoria.
              </span>
            </div>

            {/* Histórico de envios de teste */}
            <div className="mt-3 rounded border border-border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
                <span className="text-xs font-semibold">Histórico de envios de teste</span>
                <div className="flex flex-wrap items-center gap-1">
                  <input type="text" placeholder="destinatário contém…"
                    value={testFilters.recipient ?? ""}
                    onChange={(e) => setTestFilters({ ...testFilters, recipient: e.target.value || undefined, page: 0 })}
                    className="w-40 rounded border border-border bg-background px-2 py-0.5 text-[10px]" />
                  <select value={testFilters.status ?? "all"}
                    onChange={(e) => setTestFilters({ ...testFilters, status: e.target.value as any, page: 0 })}
                    className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                    <option value="all">Todos status</option>
                    <option value="sent">Enviado</option>
                    <option value="failed">Falhou</option>
                  </select>
                  <select value={testFilters.month ?? ""}
                    onChange={(e) => setTestFilters({ ...testFilters, month: e.target.value ? Number(e.target.value) : undefined, page: 0 })}
                    className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                    <option value="">Mês</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>)}
                  </select>
                  <input type="number" placeholder="ano"
                    value={testFilters.year ?? ""}
                    onChange={(e) => setTestFilters({ ...testFilters, year: e.target.value ? Number(e.target.value) : undefined, page: 0 })}
                    className="w-16 rounded border border-border bg-background px-1 py-0.5 text-[10px]" />
                  <button onClick={() => setTestFilters({ status: "all", page: 0 })}
                    className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                    Limpar
                  </button>
                  <button onClick={() => testHistoryQ.refetch()}
                    className="rounded border border-border bg-background px-2 py-0.5 text-[10px]">
                    Atualizar
                  </button>
                </div>
              </div>
              {(() => {
                const data = testHistoryQ.data as any;
                const items: any[] = Array.isArray(data?.items) ? data.items : [];
                const total: number = data?.total ?? 0;
                const totalPages = Math.max(1, Math.ceil(total / TEST_PAGE_SIZE));
                if (testHistoryQ.isLoading) {
                  return <div className="px-3 py-2 text-[11px] text-muted-foreground">Carregando…</div>;
                }
                if (items.length === 0) {
                  return <div className="px-3 py-2 text-[11px] text-muted-foreground">
                    Nenhum envio de teste com esses filtros.
                  </div>;
                }
                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-1">Quando</th>
                            <th className="px-3 py-1">Status</th>
                            <th className="px-3 py-1">Destinatário</th>
                            <th className="px-3 py-1">Período</th>
                            <th className="px-3 py-1">Modo</th>
                            <th className="px-3 py-1">Erro</th>
                            <th className="px-3 py-1">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((t: any) => (
                            <tr key={t.id} className="border-t border-border/60 align-top">
                              <td className="px-3 py-1 whitespace-nowrap">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                              <td className="px-3 py-1">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  t.status === "failed"
                                    ? "bg-red-500/15 text-red-700"
                                    : "bg-emerald-500/15 text-emerald-700"
                                }`}>
                                  {t.status === "failed" ? "Falhou" : "Enviado"}
                                </span>
                              </td>
                              <td className="px-3 py-1">{t.recipient ?? "—"}</td>
                              <td className="px-3 py-1">
                                {t.year && t.month ? `${String(t.month).padStart(2, "0")}/${t.year}` : "—"}
                              </td>
                              <td className="px-3 py-1">{t.email_mode ?? "—"}</td>
                              <td className="px-3 py-1 text-red-700 max-w-xs truncate" title={t.error ?? ""}>
                                {t.error ?? "—"}
                              </td>
                              <td className="px-3 py-1">
                                {t.year && t.month && t.status !== "failed" ? (
                                  <button onClick={() => downloadTestPdf({
                                    year: t.year, month: t.month,
                                    email_mode: (t.email_mode === "inline" ? "inline" : "link"),
                                    recipient: t.recipient,
                                  })}
                                    className="rounded border border-border bg-background px-2 py-0.5 text-[10px]">
                                    Baixar PDF
                                  </button>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
                      <span>{total} registro(s) · página {testFilters.page + 1}/{totalPages}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTestFilters({ ...testFilters, page: Math.max(0, testFilters.page - 1) })}
                          disabled={testFilters.page === 0}
                          className="rounded border border-border bg-background px-2 py-0.5 disabled:opacity-40">
                          ‹ Anterior
                        </button>
                        <button onClick={() => setTestFilters({ ...testFilters, page: Math.min(totalPages - 1, testFilters.page + 1) })}
                          disabled={testFilters.page >= totalPages - 1}
                          className="rounded border border-border bg-background px-2 py-0.5 disabled:opacity-40">
                          Próxima ›
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>





            {previewHtml && (
              <div className="mt-4 rounded border border-border bg-background">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs">
                  <div>
                    <strong>Assunto:</strong> {previewMeta?.subject ?? "—"}
                    {" · "}<strong>Modo:</strong> {previewMeta?.email_mode ?? "—"}
                    {" · "}Link expiraria em {previewMeta?.expires_at ?? "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadPreviewCsv}
                      title="Baixa o CSV exato que seria enviado para o contador"
                      className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium">
                      Baixar CSV
                    </button>
                    <button onClick={() => { setPreviewHtml(null); setPreviewMeta(null); }}
                      className="rounded border border-border bg-background px-2 py-0.5 text-[11px]">
                      Fechar
                    </button>
                  </div>
                </div>

                <iframe title="Pré-visualização do e-mail" srcDoc={previewHtml}
                  className="h-[520px] w-full rounded-b bg-white" sandbox="" />
              </div>
            )}

            {showHistory && history.length > 0 && (
              <div className="mt-4 rounded border border-border">
                <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold">
                  Histórico de execuções — {MONTHS[month - 1]}/{year}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-1.5">Quando</th>
                        <th className="px-3 py-1.5">Status</th>
                        <th className="px-3 py-1.5">Origem</th>
                        <th className="px-3 py-1.5">Modo</th>
                        <th className="px-3 py-1.5">Tent.</th>
                        <th className="px-3 py-1.5">Destinatário</th>
                        <th className="px-3 py-1.5">Arquivo / link</th>
                        <th className="px-3 py-1.5">Mensagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h: any) => (
                        <tr key={h.id} className="border-t border-border/60 align-top">
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            {new Date(h.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-3 py-1.5">{statusBadge(h.status)}</td>
                          <td className="px-3 py-1.5">{h.triggered_by}</td>
                          <td className="px-3 py-1.5">{h.email_mode}</td>
                          <td className="px-3 py-1.5">#{h.attempt}</td>
                          <td className="px-3 py-1.5">{h.recipient}</td>
                          <td className="px-3 py-1.5">
                            {h.csv_path ? (
                              <div className="flex flex-col gap-0.5">
                                <code className="text-[10px]">{h.csv_path}</code>
                                {h.signed_url_expires_at && (
                                  <span className="text-[10px] text-muted-foreground">
                                    expira {new Date(h.signed_url_expires_at).toLocaleString("pt-BR")}
                                  </span>
                                )}
                                <button onClick={() => regenMut.mutate(h.csv_path)}
                                  disabled={regenMut.isPending || !!expiryError}
                                  className="self-start rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                                  Regerar link ({expiryHours}h)
                                </button>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-red-700">
                            {h.error_message ?? (h.message_id ? `msg ${h.message_id.slice(0, 8)}…` : "—")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
                  Fonte: <code>fiscal_email_runs</code>. Inclui parâmetros usados, todas as tentativas e o status/erro final de cada execução.
                </div>
              </div>
            )}
          </section>

          {/* Fila de reenvios agendados — próximo retry por período (ordenada por prioridade) */}
          {failedRuns.length > 0 && (() => {
            const sorted = [...failedRuns].sort((a: any, b: any) => {
              // 1) prontos primeiro, 2) menor restante, 3) limite atingido por último
              const maxA = a.max_attempts_reached ? 1 : 0;
              const maxB = b.max_attempts_reached ? 1 : 0;
              if (maxA !== maxB) return maxA - maxB;
              return (a.remaining_minutes ?? 0) - (b.remaining_minutes ?? 0);
            });
            const ready = sorted.filter((r) => !r.max_attempts_reached && r.backoff_ready).length;
            const waiting = sorted.filter((r) => !r.max_attempts_reached && !r.backoff_ready).length;
            const blocked = sorted.filter((r) => r.max_attempts_reached).length;
            return (
            <section className="no-print mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Fila de reenvios agendados ({sorted.length})
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    {ready} pronto(s) · {waiting} aguardando · {blocked} bloqueado(s)
                  </span>
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Backoff: {failedQ.data?.schedule.backoff_minutes}min · Máx. tent.: {failedQ.data?.schedule.max_attempts}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-3">#</th>
                      <th className="py-1 pr-3">Período</th>
                      <th className="py-1 pr-3">Tent.</th>
                      <th className="py-1 pr-3">Última falha</th>
                      <th className="py-1 pr-3">Próximo retry</th>
                      <th className="py-1 pr-3">Restante</th>
                      <th className="py-1 pr-3">Erro</th>
                      <th className="py-1 pr-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sorted.map((f: any, idx: number) => (
                      <tr key={f.id} className="border-t border-border/60 align-top">
                        <td className="py-1 pr-3 font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="py-1 pr-3 font-medium">
                          {String(f.month).padStart(2, "0")}/{f.year}
                        </td>
                        <td className="py-1 pr-3">
                          #{f.attempt}/{f.max_attempts}
                          {f.max_attempts_reached && (
                            <span className="ml-1 rounded bg-red-600 px-1 text-[9px] font-bold text-white">
                              MÁX
                            </span>
                          )}
                        </td>
                        <td className="py-1 pr-3">{new Date(f.updated_at ?? f.created_at).toLocaleString("pt-BR")}</td>
                        <td className="py-1 pr-3">
                          {f.max_attempts_reached
                            ? <span className="text-muted-foreground">— (limite atingido)</span>
                            : new Date(f.next_retry_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-1 pr-3">
                          {f.max_attempts_reached
                            ? "—"
                            : f.backoff_ready
                              ? <span className="text-emerald-700 font-medium">pronto</span>
                              : <span>~{f.remaining_minutes} min</span>}
                        </td>
                        <td className="py-1 pr-3 text-red-700 max-w-xs truncate" title={f.error_message ?? ""}>
                          {f.error_message ?? "—"}
                        </td>
                        <td className="py-1 pr-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => { setYear(f.year); setMonth(f.month); setShowHistory(true); }}
                              className="rounded border border-border bg-background px-2 py-0.5 text-[10px]">
                              Abrir período
                            </button>
                            <button
                              onClick={() => {
                                setYear(f.year); setMonth(f.month);
                                setTimeout(() => resendMut.mutate(false), 50);
                              }}
                              disabled={resendMut.isPending || f.max_attempts_reached || !f.backoff_ready}
                              title="Respeita backoff e máx. tentativas"
                              className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-700 disabled:opacity-40">
                              Reenviar
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt(
                                  `Motivo do reenvio imediato — ${String(f.month).padStart(2, "0")}/${f.year}\n\nIsso ignora backoff e máx. tentativas. O texto fica registrado na auditoria.`,
                                  "",
                                );
                                if (reason === null) return; // cancelado
                                const trimmed = reason.trim();
                                if (!trimmed) {
                                  setFeedback("Reenvio cancelado: informe um motivo.");
                                  return;
                                }
                                setYear(f.year); setMonth(f.month);
                                setTimeout(() => resendMut.mutate({
                                  force: true,
                                  reason: trimmed,
                                  year: f.year, month: f.month,
                                }), 50);
                              }}
                              disabled={resendMut.isPending}
                              title="Reenvia imediatamente ignorando backoff e máx. tentativas. Pede um motivo que é gravado na auditoria."
                              className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-40">
                              Reenviar agora
                            </button>


                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Ordenado por prioridade: prontos primeiro, depois por menor tempo restante; limite atingido vai pro fim. O cron respeita backoff e máx. tentativas — use "Forçar novo envio" no período selecionado para ignorar a política.
              </p>
            </section>
            );
          })()}






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

            {/* Atalhos rápidos por tipo de evento (multi) */}
            <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-muted-foreground">Atalhos:</span>
              {([
                { kinds: ["fiscal.preview.csv"], label: "CSV do preview" },
                { kinds: ["fiscal.email.test", "fiscal.email.test.failed", "fiscal.email.test.pdf"], label: "E-mail de teste" },
                { kinds: ["fiscal.email.retry"], label: "Reenvios" },
                { kinds: ["fiscal.preview.csv", "fiscal.email.test", "fiscal.email.test.failed", "fiscal.email.test.pdf", "fiscal.email.retry"], label: "Todos os 3" },
              ] as const).map((q) => {
                const active = JSON.stringify(auditFilters.kinds ?? []) === JSON.stringify(q.kinds);
                return (
                  <button key={q.label}
                    onClick={() => setAuditFilters({
                      ...auditFilters,
                      kinds: active ? undefined : [...q.kinds],
                      kind: undefined,
                    })}
                    className={`rounded-full border px-2 py-0.5 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}>
                    {q.label}
                  </button>
                );
              })}
              {auditFilters.kinds && (
                <button onClick={() => setAuditFilters({ ...auditFilters, kinds: undefined })}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground">
                  Limpar atalho
                </button>
              )}
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
                    <th className="py-1 pr-3">Link / expira</th>
                    <th className="py-1 pr-3 text-right">Linhas</th>
                  </tr>
                </thead>
                <tbody>
                  {(logsQ.data ?? []).map((l: any) => {
                    const p = l.params ?? {};
                    const url = p.signed_url as string | undefined;
                    const expIso = p.signed_url_expires_at as string | undefined;
                    const expired = expIso ? new Date(expIso).getTime() < Date.now() : false;
                    const csvPath = p.path as string | undefined;
                    return (
                      <tr key={l.id} className="border-t border-border/60 align-top">
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
                        <td className="py-1 pr-3">
                          {url ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <a href={url} target="_blank" rel="noreferrer"
                                  onClick={() => {
                                    if (!expired) {
                                      logLink({ data: {
                                        action: "opened",
                                        csv_path: csvPath,
                                        signed_url: url,
                                        signed_url_expires_at: expIso,
                                        year: p.year, month: p.month,
                                        source: "audit-table",
                                      }}).catch(() => {});
                                    }
                                  }}
                                  className={`underline ${expired ? "text-muted-foreground line-through" : "text-primary"}`}>
                                  {expired ? "Link expirado" : "Abrir CSV"}
                                </a>
                                {!expired && (
                                  <button
                                    onClick={() => copySignedLink({
                                      url, csv_path: csvPath, expires_at: expIso,
                                      year: p.year, month: p.month, source: "audit-table",
                                    })}
                                    title="Copia o link e registra na auditoria"
                                    className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                                    Copiar
                                  </button>
                                )}
                              </div>
                              {expIso && (
                                <span className="text-[10px] text-muted-foreground">
                                  expira {new Date(expIso).toLocaleString("pt-BR")}
                                </span>
                              )}
                              {csvPath && expired && (
                                <button onClick={() => regenMut.mutate(csvPath)}
                                  disabled={regenMut.isPending}
                                  className="self-start rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                                  Regerar link ({expiryHours}h)
                                </button>
                              )}
                            </div>

                          ) : csvPath ? (
                            <button onClick={() => regenMut.mutate(csvPath)}
                              disabled={regenMut.isPending}
                              className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                              Gerar link ({expiryHours}h)
                            </button>
                          ) : "—"}
                        </td>
                        <td className="py-1 pr-3 text-right">{l.row_count}</td>
                      </tr>
                    );
                  })}
                  {(logsQ.data ?? []).length === 0 && !logsQ.isLoading && (
                    <tr><td colSpan={9} className="py-4 text-center text-muted-foreground">
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

function inputCls(error?: string) {
  return `mt-1 w-full rounded border bg-background px-2 py-1 text-sm ${
    error ? "border-red-500" : "border-border"
  }`;
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="text-xs">
      <span>{label}</span>
      {children}
      {error && <span className="mt-0.5 block text-[10px] text-red-700">{error}</span>}
    </label>
  );
}
