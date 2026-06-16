import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listDemoCompanies,
  impersonateDemo,
  runWizardSmokeTest,
  runWizardSmokeBatch,
  listSmokeHistory,
  replaySmokeRun,
  exportSmokeHistory,
  getSmokeRetentionPolicy,
} from "@/lib/demos.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import {
  ExternalLink,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  History,
  Play,
  RotateCcw,
  Download,
  FileText,
  FileArchive,
  ShieldCheck,
  BookmarkPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarClock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useMemo, useState, useEffect } from "react";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type HistoryPreset = {
  id: string;
  name: string;
  since: string;
  status: "all" | "success" | "failure";
  search: string;
};

const PRESETS_KEY = "core-demos:history-presets";

function loadPresets(): HistoryPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    return raw ? (JSON.parse(raw) as HistoryPreset[]) : [];
  } catch {
    return [];
  }
}
function savePresetsToStorage(list: HistoryPreset[]) {
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const fmtBRL = (v: number) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/_authenticated/core/demos")({
  component: CoreDemosPage,
});

type DemoRow = {
  id: string;
  name: string;
  trade_name: string | null;
  email: string | null;
  environment: string | null;
  status: string | null;
  primary_color: string | null;
  niche: { id: string; slug: string; name: string } | null;
  contracts: Array<{
    id: string;
    status: string;
    recurring_amount: number;
    setup_amount: number;
    next_due_date: string;
    invoices: Array<{ id: string; status: string; amount: number; due_date: string }>;
  }>;
};

type SmokeStep = { key: string; ok: boolean; detail?: string };
type SmokeRunRow = {
  id: string;
  label: string | null;
  niche_slug: string | null;
  success: boolean;
  duration_ms: number;
  steps: SmokeStep[];
  ids: Record<string, string | null>;
  error: string | null;
  batch_id: string | null;
  replay_of: string | null;
  created_at: string;
};

type SortKey = "name" | "niche" | "invoice_amount" | "invoice_due" | "invoice_status";
type SortDir = "asc" | "desc";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printHistoryPDF(rows: SmokeRunRow[]) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Histórico Smoke Tests</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111}
  h1{font-size:18px;margin:0 0 16px}
  table{border-collapse:collapse;width:100%;font-size:11px}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f3f4f6}
  .ok{color:#059669;font-weight:600}
  .fail{color:#dc2626;font-weight:600}
  pre{margin:0;font-size:10px;white-space:pre-wrap;word-break:break-all}
</style></head><body>
<h1>Histórico Smoke Tests — ${new Date().toLocaleString("pt-BR")}</h1>
<table><thead><tr>
  <th>Data</th><th>Label</th><th>Nicho</th><th>Status</th><th>Tempo</th>
  <th>Batch</th><th>Replay de</th><th>IDs</th><th>Logs</th><th>Erro</th>
</tr></thead><tbody>
${rows
  .map(
    (r) => `<tr>
  <td>${new Date(r.created_at).toLocaleString("pt-BR")}</td>
  <td>${r.label ?? "—"}</td>
  <td>${r.niche_slug ?? "—"}</td>
  <td class="${r.success ? "ok" : "fail"}">${r.success ? "OK" : "FALHA"}</td>
  <td>${r.duration_ms}ms</td>
  <td>${r.batch_id ? r.batch_id.slice(0, 8) : "—"}</td>
  <td>${r.replay_of ? r.replay_of.slice(0, 8) : "—"}</td>
  <td><pre>${JSON.stringify(r.ids, null, 2)}</pre></td>
  <td><pre>${(r.steps ?? []).map((s) => `${s.ok ? "✓" : "✗"} ${s.key}${s.detail ? " — " + s.detail : ""}`).join("\n")}</pre></td>
  <td>${r.error ?? ""}</td>
</tr>`,
  )
  .join("")}
</tbody></table>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function CoreDemosPage() {
  const qc = useQueryClient();
  const fetchDemos = useServerFn(listDemoCompanies);
  const impersonate = useServerFn(impersonateDemo);
  const smoke = useServerFn(runWizardSmokeTest);
  const smokeBatch = useServerFn(runWizardSmokeBatch);
  const fetchHistory = useServerFn(listSmokeHistory);
  const replay = useServerFn(replaySmokeRun);
  const exportHistory = useServerFn(exportSmokeHistory);
  const fetchRetention = useServerFn(getSmokeRetentionPolicy);

  const { data: retention } = useQuery({
    queryKey: ["core-smoke-retention"],
    queryFn: () => fetchRetention(),
    staleTime: 5 * 60_000,
  });

  // filtros + paginação do histórico
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageSize = 20;
  const [historySince, setHistorySince] = useState<string>("all");
  const [historyStatus, setHistoryStatus] = useState<"all" | "success" | "failure">("all");
  const [historySearch, setHistorySearch] = useState("");
  const debouncedSearch = useDebouncedValue(historySearch, 350);
  const [selectedRun, setSelectedRun] = useState<SmokeRunRow | null>(null);

  // Reset page when filters change (debounced text)
  useEffect(() => {
    setHistoryPage(0);
  }, [debouncedSearch, historySince, historyStatus]);

  const historyFilters = useMemo(
    () => ({
      sinceDays: historySince === "all" ? null : Number(historySince),
      status: historyStatus,
      search: debouncedSearch.trim() || undefined,
    }),
    [historySince, historyStatus, debouncedSearch],
  );

  // Filter presets (localStorage)
  const [presets, setPresets] = useState<HistoryPreset[]>(() => loadPresets());
  const persistPresets = (list: HistoryPreset[]) => {
    setPresets(list);
    savePresetsToStorage(list);
  };
  const handleSavePreset = () => {
    const name = window.prompt(
      "Nome do conjunto de filtros",
      `Preset ${presets.length + 1}`,
    );
    if (!name) return;
    const next: HistoryPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      since: historySince,
      status: historyStatus,
      search: historySearch,
    };
    persistPresets([next, ...presets].slice(0, 12));
    toast.success(`Preset "${next.name}" salvo`);
  };
  const applyPreset = (p: HistoryPreset) => {
    setHistorySince(p.since);
    setHistoryStatus(p.status);
    setHistorySearch(p.search);
    setHistoryPage(0);
  };
  const removePreset = (id: string) => {
    persistPresets(presets.filter((p) => p.id !== id));
  };
  const activePresetId = useMemo(
    () =>
      presets.find(
        (p) =>
          p.since === historySince &&
          p.status === historyStatus &&
          p.search === historySearch,
      )?.id ?? null,
    [presets, historySince, historyStatus, historySearch],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["core-demos"],
    queryFn: () => fetchDemos(),
  });

  const { data: historyData, isLoading: loadingHistory, isFetching: fetchingHistory } = useQuery({
    queryKey: ["core-smoke-history", historyPage, historyFilters],
    queryFn: () =>
      fetchHistory({
        data: {
          limit: historyPageSize,
          offset: historyPage * historyPageSize,
          ...historyFilters,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const impersonateMut = useMutation({
    mutationFn: (companyId: string) => impersonate({ data: { companyId } }),
    onSuccess: (r) => {
      if (r.inviteLink) {
        window.open(r.inviteLink, "_blank");
        toast.success("Magic link aberto em nova aba.");
      } else {
        toast.error("Não foi possível gerar o link.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [smokeReport, setSmokeReport] = useState<Awaited<ReturnType<typeof smoke>> | null>(null);
  const [batchReport, setBatchReport] = useState<Awaited<ReturnType<typeof smokeBatch>> | null>(
    null,
  );

  const smokeMut = useMutation({
    mutationFn: (label: string) => smoke({ data: { label } }),
    onSuccess: (r) => {
      setSmokeReport(r);
      qc.invalidateQueries({ queryKey: ["core-demos"] });
      qc.invalidateQueries({ queryKey: ["core-smoke-history"] });
      if (r.success) toast.success("Smoke test ✅ todos os passos OK");
      else toast.error("Smoke test ❌ houve falhas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batchMut = useMutation({
    mutationFn: (targets: Array<{ label: string; nicheSlug: string | null }>) =>
      smokeBatch({ data: { targets } }),
    onSuccess: (r) => {
      setBatchReport(r);
      qc.invalidateQueries({ queryKey: ["core-smoke-history"] });
      if (r.failCount === 0)
        toast.success(`Batch ✅ ${r.okCount}/${r.results.length} sucessos`);
      else toast.error(`Batch ❌ ${r.failCount} falha(s) em ${r.results.length}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replayMut = useMutation({
    mutationFn: (runId: string) => replay({ data: { runId } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["core-smoke-history"] });
      if (r.success) toast.success(`Replay ✅ (de ${r.replayOf.slice(0, 8)})`);
      else toast.error(`Replay ❌ houve falhas`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buildExportFilename = (ext: string) => {
    const period =
      historySince === "all" ? "all" : `last${historySince}d`;
    const status = historyStatus === "all" ? "any" : historyStatus;
    const slug = (debouncedSearch || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);
    const stamp = new Date().toISOString().slice(0, 10);
    const parts = ["smoke-history", stamp, period, status];
    if (slug) parts.push(`q-${slug}`);
    return `${parts.join("_")}.${ext}`;
  };

  const buildCsv = (rows: SmokeRunRow[]) => {
    const header = [
      "id",
      "created_at",
      "label",
      "niche_slug",
      "success",
      "duration_ms",
      "batch_id",
      "replay_of",
      "ids",
      "steps",
      "error",
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.created_at,
          row.label,
          row.niche_slug,
          row.success,
          row.duration_ms,
          row.batch_id,
          row.replay_of,
          row.ids,
          (row.steps ?? [])
            .map((s) => `${s.ok ? "OK" : "FAIL"}:${s.key}${s.detail ? "=" + s.detail : ""}`)
            .join(" | "),
          row.error,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    return lines.join("\n");
  };

  const buildPdfBlob = (rows: SmokeRunRow[]): Blob => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Histórico Smoke Tests", 40, 36);
    doc.setFontSize(9);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} · período: ${
        historySince === "all" ? "todo" : `últimos ${historySince}d`
      } · status: ${historyStatus} · busca: ${debouncedSearch || "—"} · ${rows.length} linha(s)`,
      40,
      52,
    );
    autoTable(doc, {
      startY: 70,
      styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [243, 244, 246], textColor: 20 },
      head: [["Data", "Label", "Nicho", "Status", "Tempo", "Batch", "Replay", "Etapas", "Erro"]],
      body: rows.map((r) => [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.label ?? "—",
        r.niche_slug ?? "—",
        r.success ? "OK" : "FALHA",
        `${r.duration_ms}ms`,
        r.batch_id ? r.batch_id.slice(0, 8) : "—",
        r.replay_of ? r.replay_of.slice(0, 8) : "—",
        (r.steps ?? [])
          .map((s) => `${s.ok ? "✓" : "✗"} ${s.key}`)
          .join("\n"),
        r.error ?? "",
      ]),
      columnStyles: {
        7: { cellWidth: 180 },
        8: { cellWidth: 120 },
      },
    });
    return doc.output("blob");
  };

  const handleExportCsv = async () => {
    const r = await exportHistory({ data: historyFilters });
    const rows = (r.runs ?? []) as unknown as SmokeRunRow[];
    downloadBlob(buildCsv(rows), buildExportFilename("csv"), "text/csv;charset=utf-8");
    toast.success(`CSV exportado (${rows.length} linhas)`);
  };

  const handleExportPdf = async () => {
    const r = await exportHistory({ data: historyFilters });
    const rows = (r.runs ?? []) as unknown as SmokeRunRow[];
    const blob = buildPdfBlob(rows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename("pdf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`PDF exportado (${rows.length} linhas)`);
  };

  const handleExportZip = async () => {
    const r = await exportHistory({ data: historyFilters });
    const rows = (r.runs ?? []) as unknown as SmokeRunRow[];
    const zip = new JSZip();
    const base = buildExportFilename("").replace(/\.$/, "");

    zip.file(`${base}.csv`, buildCsv(rows));
    zip.file(`${base}.pdf`, buildPdfBlob(rows));

    // Raw per-run JSON (full audit trail offline)
    const runsFolder = zip.folder("runs");
    for (const row of rows) {
      runsFolder?.file(`${row.id}.json`, JSON.stringify(row, null, 2));
    }
    // Single newline-delimited JSON file with all runs
    zip.file("runs.ndjson", rows.map((r) => JSON.stringify(r)).join("\n"));
    // Pretty array of all runs
    zip.file("runs.json", JSON.stringify(rows, null, 2));

    // Aggregates
    const okCount = rows.filter((r) => r.success).length;
    const failCount = rows.length - okCount;
    const durations = rows.map((r) => Number(r.duration_ms || 0));
    const total = durations.reduce((a, b) => a + b, 0);
    const avg = durations.length ? Math.round(total / durations.length) : 0;
    const min = durations.length ? Math.min(...durations) : 0;
    const max = durations.length ? Math.max(...durations) : 0;
    const nicheCounts: Record<string, number> = {};
    for (const r of rows) {
      const k = r.niche_slug ?? "—";
      nicheCounts[k] = (nicheCounts[k] ?? 0) + 1;
    }
    const sortedDates = rows
      .map((r) => r.created_at)
      .filter(Boolean)
      .sort();
    const firstAt = sortedDates[0] ?? null;
    const lastAt = sortedDates[sortedDates.length - 1] ?? null;

    const manifest = {
      generatedAt: new Date().toISOString(),
      generatedBy: "core/demos history export",
      filters: {
        sinceDays: historyFilters.sinceDays,
        status: historyFilters.status,
        search: historyFilters.search ?? null,
      },
      period: {
        label:
          historySince === "all" ? "todo o histórico" : `últimos ${historySince} dias`,
        firstAt,
        lastAt,
      },
      counts: {
        total: rows.length,
        success: okCount,
        failure: failCount,
        successRate: rows.length ? +(okCount / rows.length).toFixed(4) : 0,
        byNiche: nicheCounts,
      },
      durations: {
        totalMs: total,
        avgMs: avg,
        minMs: min,
        maxMs: max,
      },
      retention: retention
        ? {
            retentionDays: retention.retentionDays,
            schedule: retention.schedule,
            scheduleLabel: retention.scheduleLabel,
            active: retention.active,
          }
        : null,
      files: {
        csv: `${base}.csv`,
        pdf: `${base}.pdf`,
        runsDir: "runs/<id>.json",
        runsNdjson: "runs.ndjson",
        runsJson: "runs.json",
      },
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename("zip");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`ZIP exportado (${rows.length} runs · ${okCount} ok / ${failCount} falhas)`);
  };


  const demos = (data?.demos ?? []) as unknown as DemoRow[];
  const history = (historyData?.runs ?? []) as unknown as SmokeRunRow[];
  const historyTotal = historyData?.total ?? 0;

  // Filtros + paginação + ordenação dos demos
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [demoPage, setDemoPage] = useState(0);
  const [demoPageSize, setDemoPageSize] = useState(12);

  const niches = useMemo(() => {
    const map = new Map<string, string>();
    demos.forEach((d) => {
      if (d.niche?.slug) map.set(d.niche.slug, d.niche.name);
    });
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [demos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = demos.filter((d) => {
      if (nicheFilter !== "all" && d.niche?.slug !== nicheFilter) return false;
      const invoice = d.contracts?.[0]?.invoices?.[0];
      if (statusFilter !== "all") {
        if (statusFilter === "none" && invoice) return false;
        if (statusFilter !== "none" && invoice?.status !== statusFilter) return false;
      }
      if (!q) return true;
      const hay = [d.name, d.trade_name, d.email, d.niche?.name, d.niche?.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const ia = a.contracts?.[0]?.invoices?.[0];
      const ib = b.contracts?.[0]?.invoices?.[0];
      switch (sortKey) {
        case "name":
          return (a.trade_name ?? a.name ?? "").localeCompare(b.trade_name ?? b.name ?? "") * dir;
        case "niche":
          return ((a.niche?.name ?? "").localeCompare(b.niche?.name ?? "")) * dir;
        case "invoice_amount":
          return ((Number(ia?.amount ?? 0) - Number(ib?.amount ?? 0))) * dir;
        case "invoice_due":
          return ((ia?.due_date ?? "").localeCompare(ib?.due_date ?? "")) * dir;
        case "invoice_status":
          return ((ia?.status ?? "").localeCompare(ib?.status ?? "")) * dir;
      }
      return 0;
    });
    return list;
  }, [demos, search, nicheFilter, statusFilter, sortKey, sortDir]);

  const pagedDemos = useMemo(
    () => filtered.slice(demoPage * demoPageSize, demoPage * demoPageSize + demoPageSize),
    [filtered, demoPage, demoPageSize],
  );
  const totalDemoPages = Math.max(1, Math.ceil(filtered.length / demoPageSize));

  const runBatchAllNiches = () => {
    const targets =
      niches.length > 0
        ? niches.map((n) => ({ label: `${n.slug}-${Date.now()}`, nicheSlug: n.slug }))
        : [{ label: `default-${Date.now()}`, nicheSlug: null }];
    setBatchReport(null);
    batchMut.mutate(targets);
  };

  const runBatchFiltered = () => {
    if (filtered.length === 0) return;
    const targets = filtered.slice(0, 20).map((d) => ({
      label: `${d.niche?.slug ?? "x"}-${d.id.slice(0, 6)}`,
      nicheSlug: d.niche?.slug ?? null,
    }));
    setBatchReport(null);
    batchMut.mutate(targets);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demos por nicho"
        description="Empresas demonstração geradas pelo CORE com contrato e 1ª fatura prontos."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => smokeMut.mutate(`single-${Date.now()}`)}
              disabled={smokeMut.isPending || batchMut.isPending}
              variant="outline"
              size="sm"
            >
              {smokeMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              Smoke test (1x)
            </Button>
            <Button
              onClick={runBatchAllNiches}
              disabled={smokeMut.isPending || batchMut.isPending}
              variant="outline"
              size="sm"
            >
              {batchMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Rodar em todos os nichos ({niches.length || 1})
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, empresa…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os nichos</SelectItem>
              {niches.map((n) => (
                <SelectItem key={n.slug} value={n.slug}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status da fatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer status</SelectItem>
              <SelectItem value="open">Aberta</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="none">Sem fatura</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="niche">Nicho</SelectItem>
              <SelectItem value="invoice_amount">Valor da 1ª fatura</SelectItem>
              <SelectItem value="invoice_due">Vencimento</SelectItem>
              <SelectItem value="invoice_status">Status da fatura</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
            <SelectTrigger>
              <SelectValue placeholder="Direção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Crescente</SelectItem>
              <SelectItem value="desc">Decrescente</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(demoPageSize)}
            onValueChange={(v) => {
              setDemoPageSize(Number(v));
              setDemoPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 / página</SelectItem>
              <SelectItem value="12">12 / página</SelectItem>
              <SelectItem value="24">24 / página</SelectItem>
              <SelectItem value="48">48 / página</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            {filtered.length} de {demos.length} demos · pág. {demoPage + 1}/{totalDemoPages}
          </span>
          {filtered.length > 0 && filtered.length !== demos.length && (
            <Button
              size="sm"
              variant="ghost"
              onClick={runBatchFiltered}
              disabled={batchMut.isPending}
            >
              <Play className="mr-2 h-3.5 w-3.5" />
              Rodar smoke nas {Math.min(filtered.length, 20)} demos filtradas
            </Button>
          )}
        </div>
      </Card>

      {/* Relatório execução única */}
      {smokeReport && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Smoke test {smokeReport.success ? "✅" : "❌"} ·{" "}
              <span className="text-muted-foreground font-normal">
                {smokeReport.durationMs}ms
              </span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSmokeReport(null)}>
              fechar
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {smokeReport.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                {s.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                )}
                <span className="font-mono">{s.key}</span>
                {s.detail && <span className="text-muted-foreground">— {s.detail}</span>}
              </li>
            ))}
          </ul>
          <pre className="mt-3 text-xs bg-muted/40 rounded p-2 overflow-x-auto">
            {JSON.stringify(smokeReport.ids, null, 2)}
          </pre>
        </Card>
      )}

      {/* Relatório batch */}
      {batchReport && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Batch{" "}
              {batchReport.failCount === 0 ? "✅" : "❌"} · {batchReport.okCount} ok /{" "}
              {batchReport.failCount} falhas ·{" "}
              <span className="text-muted-foreground font-normal">
                {batchReport.totalMs}ms · #{batchReport.batchId.slice(0, 8)}
              </span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setBatchReport(null)}>
              fechar
            </Button>
          </div>
          <div className="space-y-2">
            {batchReport.results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border rounded p-2"
              >
                <div className="flex items-center gap-2">
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-mono">{r.label}</span>
                  {r.nicheSlug && (
                    <Badge variant="outline" className="text-xs">
                      {r.nicheSlug}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{r.durationMs}ms</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de demos */}
      {isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando demos…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          {demos.length === 0
            ? "Nenhuma empresa demo encontrada. A migration de seed cria uma por nicho ativo."
            : "Nenhuma demo bate com os filtros atuais."}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedDemos.map((d) => {
              const contract = d.contracts?.[0];
              const invoice = contract?.invoices?.[0];
              return (
                <Card key={d.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{d.trade_name || d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.niche?.name ?? "—"}</div>
                    </div>
                    <Badge variant="secondary">{d.environment ?? "demo"}</Badge>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>
                      e-mail: <span className="font-mono">{d.email}</span>
                    </div>
                    {contract && (
                      <div>
                        contrato: {fmtBRL(Number(contract.recurring_amount))}/mês · próx.{" "}
                        {contract.next_due_date}
                      </div>
                    )}
                    {invoice && (
                      <div>
                        1ª fatura: <Badge variant="outline">{invoice.status}</Badge>{" "}
                        {fmtBRL(Number(invoice.amount))} · venc. {invoice.due_date}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => impersonateMut.mutate(d.id)}
                    disabled={impersonateMut.isPending}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Entrar como admin demo
                  </Button>
                </Card>
              );
            })}
          </div>
          {totalDemoPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDemoPage((p) => Math.max(0, p - 1))}
                disabled={demoPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {demoPage + 1} de {totalDemoPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDemoPage((p) => Math.min(totalDemoPages - 1, p + 1))}
                disabled={demoPage >= totalDemoPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Histórico */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Histórico de smoke tests</h3>
          <Badge variant="secondary">{historyTotal}</Badge>
          {fetchingHistory && !loadingHistory && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-2 h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <FileText className="mr-2 h-3.5 w-3.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportZip}>
              <FileArchive className="mr-2 h-3.5 w-3.5" />
              ZIP (CSV+PDF)
            </Button>
          </div>
        </div>

        {/* Política de retenção */}
        {retention && (
          <div className="flex items-start gap-2 mb-3 rounded border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">
                Retenção automática: {retention.retentionDays} dias
              </div>
              <div className="text-muted-foreground">
                Limpeza agendada {retention.scheduleLabel.toLowerCase()} (cron{" "}
                <code className="font-mono">{retention.schedule}</code>) ·{" "}
                {retention.active ? "ativa" : "pausada"}
              </div>
            </div>
          </div>
        )}


        {/* Presets de filtros salvos */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs text-muted-foreground">Presets:</span>
          {presets.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              nenhum salvo ainda
            </span>
          )}
          {presets.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 border rounded-full pl-2 pr-1 py-0.5 text-xs ${
                activePresetId === p.id
                  ? "bg-primary/10 border-primary/40"
                  : "hover:bg-muted/50"
              }`}
            >
              <button
                type="button"
                onClick={() => applyPreset(p)}
                className="flex items-center gap-1"
                title={`período: ${p.since} · status: ${p.status} · busca: ${p.search || "—"}`}
              >
                <span>{p.name}</span>
              </button>
              <button
                type="button"
                onClick={() => removePreset(p.id)}
                className="p-0.5 hover:text-destructive"
                title="Remover preset"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs ml-auto"
            onClick={handleSavePreset}
            disabled={presets.length >= 12}
          >
            <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
            Salvar filtros atuais
          </Button>
        </div>

        {/* filtros do histórico */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por label, nicho ou erro…"
              className="pl-8"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>
          <Select value={historySince} onValueChange={setHistorySince}>
            <SelectTrigger>
              <SelectValue placeholder="Intervalo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o histórico</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={historyStatus}
            onValueChange={(v) => setHistoryStatus(v as "all" | "success" | "failure")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Apenas sucesso</SelectItem>
              <SelectItem value="failure">Apenas falhas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingHistory ? (

          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : history.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhuma execução bate com os filtros atuais.
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRun(h)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 text-sm border rounded px-2 py-1.5 hover:bg-muted/50 w-full">
                      {h.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className="font-mono text-xs truncate">{h.label ?? "—"}</span>
                      {h.niche_slug && (
                        <Badge variant="outline" className="text-xs">
                          {h.niche_slug}
                        </Badge>
                      )}
                      {h.batch_id && (
                        <Badge variant="secondary" className="text-xs">
                          batch {h.batch_id.slice(0, 6)}
                        </Badge>
                      )}
                      {h.replay_of && (
                        <Badge variant="outline" className="text-xs">
                          replay de {h.replay_of.slice(0, 6)}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {h.duration_ms}ms ·{" "}
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Reexecutar com os mesmos parâmetros"
                    onClick={() => replayMut.mutate(h.id)}
                    disabled={replayMut.isPending}
                  >
                    {replayMut.isPending && replayMut.variables === h.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            {historyTotal > historyPageSize && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                  disabled={historyPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {historyPage + 1} de{" "}
                  {Math.max(1, Math.ceil(historyTotal / historyPageSize))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={(historyPage + 1) * historyPageSize >= historyTotal}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de detalhes da execução */}
      <Dialog open={!!selectedRun} onOpenChange={(o) => !o && setSelectedRun(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedRun && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRun.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-mono text-sm">{selectedRun.label ?? "—"}</span>
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 mt-1">
                  <span>
                    {new Date(selectedRun.created_at).toLocaleString("pt-BR")} ·{" "}
                    {selectedRun.duration_ms}ms
                  </span>
                  {selectedRun.niche_slug && (
                    <Badge variant="outline">{selectedRun.niche_slug}</Badge>
                  )}
                  {selectedRun.batch_id && (
                    <Badge variant="secondary">
                      batch {selectedRun.batch_id.slice(0, 8)}
                    </Badge>
                  )}
                  {selectedRun.replay_of && (
                    <Badge variant="outline">
                      replay de {selectedRun.replay_of.slice(0, 8)}
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedRun.error && (
                  <div className="text-sm text-destructive border border-destructive/30 rounded p-3 bg-destructive/5">
                    <div className="font-semibold mb-1">Erro</div>
                    <div className="font-mono text-xs whitespace-pre-wrap">
                      {selectedRun.error}
                    </div>
                  </div>
                )}

                <section>
                  <h4 className="text-sm font-semibold mb-2">
                    Etapas do wizard ({selectedRun.steps?.length ?? 0})
                  </h4>
                  <ol className="space-y-1.5">
                    {(selectedRun.steps ?? []).map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm border-l-2 pl-3 py-0.5"
                        style={{
                          borderColor: s.ok
                            ? "hsl(var(--primary))"
                            : "hsl(var(--destructive))",
                        }}
                      >
                        <span className="text-xs text-muted-foreground w-5 shrink-0">
                          {i + 1}.
                        </span>
                        {s.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-mono text-xs">{s.key}</div>
                          {s.detail && (
                            <div className="text-xs text-muted-foreground">
                              {s.detail}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h4 className="text-sm font-semibold mb-2">IDs utilizados</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedRun.ids ?? {}).map(([k, v]) => (
                      <div key={k} className="border rounded p-2">
                        <div className="text-muted-foreground text-[10px] uppercase">
                          {k}
                        </div>
                        <div className="font-mono break-all">{v ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold mb-2">Logs brutos (JSON)</h4>
                  <pre className="text-[11px] bg-muted/40 rounded p-3 overflow-x-auto">
                    {JSON.stringify(
                      {
                        id: selectedRun.id,
                        label: selectedRun.label,
                        niche_slug: selectedRun.niche_slug,
                        success: selectedRun.success,
                        duration_ms: selectedRun.duration_ms,
                        batch_id: selectedRun.batch_id,
                        replay_of: selectedRun.replay_of,
                        created_at: selectedRun.created_at,
                        error: selectedRun.error,
                        ids: selectedRun.ids,
                        steps: selectedRun.steps,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </section>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const json = JSON.stringify(selectedRun, null, 2);
                      navigator.clipboard.writeText(json).then(
                        () => toast.success("JSON copiado"),
                        () => toast.error("Falha ao copiar"),
                      );
                    }}
                  >
                    Copiar JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      replayMut.mutate(selectedRun.id);
                      setSelectedRun(null);
                    }}
                    disabled={replayMut.isPending}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reexecutar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
