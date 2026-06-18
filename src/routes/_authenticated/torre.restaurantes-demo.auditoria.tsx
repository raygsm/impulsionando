/**
 * /torre/restaurantes-demo/auditoria
 *
 * Tela de auditoria das ações da demo Bar & Restaurante.
 * Filtros: cenário, tipo de ação, sessão, lead (nome mascarado), janela de tempo.
 * Restrito a Super Admin pela server fn `fetchDemoRestauranteAudit`.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, RefreshCw, FileSearch } from "lucide-react";
import { fetchDemoRestauranteAudit } from "@/lib/demo-restaurante.functions";

const searchSchema = z.object({
  scenarioSlug: fallback(z.string(), "boteco-aurora").default("boteco-aurora"),
  sinceHours: fallback(z.number().int().min(1).max(720), 168).default(168),
  actionKey: fallback(z.string(), "").default(""),
  sessionId: fallback(z.string(), "").default(""),
  leadName: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authenticated/torre/restaurantes-demo/auditoria")({
  validateSearch: zodValidator(searchSchema),
  component: AuditoriaPage,
});

const ACTION_LABELS: Record<string, string> = {
  "qr.scan": "QR escaneado",
  "menu.open": "Abriu cardápio",
  "cart.add": "Adicionou ao carrinho",
  "cart.remove": "Removeu do carrinho",
  "cart.checkout_attempt": "Tentou checkout",
  "cart.checkout_simulated": "Checkout simulado",
  "survey.submit": "Pesquisa enviada",
  "voucher.apply": "Aplicou voucher",
};
const ACTION_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "qr.scan": "outline",
  "cart.checkout_simulated": "default",
  "survey.submit": "secondary",
};

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function describePayload(action: string, payload: unknown): string {
  if (!payload || typeof payload !== "object") return "—";
  const p = payload as Record<string, unknown>;
  const parts: string[] = [];
  if (action === "qr.scan" && p.title) parts.push(String(p.title));
  if (p.itemName) parts.push(`${p.qty ?? 1}× ${String(p.itemName)}`);
  if (p.totalCents != null) parts.push(`Total ${(Number(p.totalCents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  if (p.paymentMethod) parts.push(`Pgto ${String(p.paymentMethod)}`);
  if (p.voucher_code) parts.push(`Voucher ${String(p.voucher_code)}`);
  if (p.favoriteCategory) parts.push(`Favorito ${String(p.favoriteCategory)}`);
  if (p.qr_slug && action !== "qr.scan") parts.push(`QR ${String(p.qr_slug)}`);
  return parts.join(" · ") || "—";
}

function AuditoriaPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchAudit = useServerFn(fetchDemoRestauranteAudit);
  const [offset, setOffset] = useState(0);
  const limit = 100;

  const q = useQuery({
    queryKey: ["torre-resto-auditoria", search, offset],
    queryFn: () => fetchAudit({
      data: {
        scenarioSlug: search.scenarioSlug || undefined,
        sinceHours: search.sinceHours,
        actionKey: (search.actionKey || undefined) as
          | "qr.scan" | "cart.checkout_simulated" | "survey.submit" | undefined,
        sessionId: search.sessionId || undefined,
        leadName: search.leadName || undefined,
        limit,
        offset,
      },
    }),
    refetchInterval: 30_000,
  });

  const updateSearch = (patch: Partial<typeof search>) => {
    setOffset(0);
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const exportCsv = () => {
    if (!q.data) return;
    const rows: Array<Array<string | number>> = [
      ["Quando", "Ação", "Sessão", "Lead", "Resumo"],
      ...q.data.rows.map((r) => [
        new Date(r.created_at).toLocaleString("pt-BR"),
        ACTION_LABELS[r.action_key] ?? r.action_key,
        r.session_id.slice(0, 8),
        r.lead?.name ?? "—",
        describePayload(r.action_key, r.payload),
      ]),
    ];
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadCsv(`auditoria-restaurantes-${stamp}.csv`, rows);
  };

  return (
    <main className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto print:max-w-none print:p-0">
      <style>{`@media print { .print\\:hidden{display:none!important} }`}</style>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSearch className="w-3.5 h-3.5" /> Auditoria · Bar & Restaurante (demo)
          </div>
          <h1 className="text-2xl font-bold leading-tight">Eventos por lead e janela</h1>
          <p className="text-sm text-muted-foreground">
            Lista detalhada de checkouts simulados, vouchers emitidos, pesquisas enviadas e mais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild variant="outline" size="sm">
            <Link to="/torre/restaurantes-demo">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Torre
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={() => q.refetch()} aria-label="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!q.data?.rows.length}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
        </div>
      </header>

      <Card className="p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
        <div className="space-y-1">
          <Label className="text-xs">Janela</Label>
          <Select value={String(search.sinceHours)} onValueChange={(v) => updateSearch({ sinceHours: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="72">Últimos 3 dias</SelectItem>
              <SelectItem value="168">Últimos 7 dias</SelectItem>
              <SelectItem value="720">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo de ação</Label>
          <Select
            value={search.actionKey || "all"}
            onValueChange={(v) => updateSearch({ actionKey: v === "all" ? "" : v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cenário</Label>
          <Input
            value={search.scenarioSlug}
            onChange={(e) => updateSearch({ scenarioSlug: e.target.value })}
            placeholder="boteco-aurora"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lead (nome mascarado)</Label>
          <Input
            value={search.leadName}
            onChange={(e) => updateSearch({ leadName: e.target.value })}
            placeholder="ex. Marina"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sessão (UUID)</Label>
          <Input
            value={search.sessionId}
            onChange={(e) => updateSearch({ sessionId: e.target.value.trim() })}
            placeholder="00000000-…"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {q.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        ) : q.error ? (
          <p className="p-6 text-sm text-destructive">{(q.error as Error).message}</p>
        ) : !q.data?.rows.length ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum evento na janela atual.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left py-2 px-3">Quando</th>
                  <th className="text-left py-2 px-3">Ação</th>
                  <th className="text-left py-2 px-3">Lead</th>
                  <th className="text-left py-2 px-3">Sessão</th>
                  <th className="text-left py-2 px-3">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {q.data.rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={ACTION_VARIANT[r.action_key] ?? "outline"} className="text-[10px]">
                        {ACTION_LABELS[r.action_key] ?? r.action_key}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {r.lead ? (
                        <>
                          <div className="font-medium">{r.lead.name}</div>
                          <div className="text-muted-foreground font-mono">{r.lead.whatsapp}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs font-mono text-muted-foreground">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => updateSearch({ sessionId: r.session_id })}
                        title="Filtrar por esta sessão"
                      >
                        {r.session_id.slice(0, 8)}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-xs">{describePayload(r.action_key, r.payload)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground print:hidden">
        <span>
          {q.data ? `Mostrando ${q.data.rows.length} de ${q.data.total} eventos` : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Anterior
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={!q.data || offset + limit >= q.data.total}
            onClick={() => setOffset(offset + limit)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </main>
  );
}
