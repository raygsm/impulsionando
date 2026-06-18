import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  readWhatsAppLocalMetrics,
  clearWhatsAppLocalMetrics,
} from "@/lib/whatsapp-cta";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, MousePointerClick, Send, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/whatsapp-metrics")({
  head: () => ({
    meta: [{ title: "Métricas WhatsApp Oficial — Impulsionando" }],
  }),
  component: WhatsAppMetricsPage,
});

interface Row {
  ts: number;
  event: string;
  origin: string;
  path: string;
  variant?: string;
}

function WhatsAppMetricsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRows(readWhatsAppLocalMetrics() as Row[]);
  }, [tick]);

  const totals = useMemo(() => {
    const impressions = rows.filter((r) => r.event === "whatsapp_cta_impression").length;
    const clicks = rows.filter((r) =>
      ["whatsapp_cta_click", "whatsapp_fab_click", "whatsapp_notice_click"].includes(r.event),
    ).length;
    const submits = rows.filter((r) => r.event === "whatsapp_form_submit").length;
    return {
      impressions,
      clicks,
      submits,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      sr: clicks ? (submits / clicks) * 100 : 0,
    };
  }, [rows]);

  const byRoute = useMemo(() => {
    const map = new Map<string, { clicks: number; submits: number; impressions: number }>();
    for (const r of rows) {
      const key = r.path || "—";
      const cur = map.get(key) ?? { clicks: 0, submits: 0, impressions: 0 };
      if (r.event === "whatsapp_cta_impression") cur.impressions++;
      else if (r.event === "whatsapp_form_submit") cur.submits++;
      else cur.clicks++;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([path, v]) => ({
        path,
        ...v,
        ctr: v.impressions ? (v.clicks / v.impressions) * 100 : null,
        sr: v.clicks ? (v.submits / v.clicks) * 100 : null,
      }))
      .sort((a, b) => b.clicks + b.submits - (a.clicks + a.submits));
  }, [rows]);

  const byVariant = useMemo(() => {
    const map = new Map<string, { clicks: number; submits: number; impressions: number }>();
    for (const r of rows) {
      const key = r.variant || "control";
      const cur = map.get(key) ?? { clicks: 0, submits: 0, impressions: 0 };
      if (r.event === "whatsapp_cta_impression") cur.impressions++;
      else if (r.event === "whatsapp_form_submit") cur.submits++;
      else cur.clicks++;
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([variant, v]) => ({
      variant,
      ...v,
      ctr: v.impressions ? (v.clicks / v.impressions) * 100 : null,
      sr: v.clicks ? (v.submits / v.clicks) * 100 : null,
    }));
  }, [rows]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Métricas — WhatsApp Oficial"
        description="Taxa de clique e envio do canal oficial (21) 99307-5000, por rota e variante de CTA. Os dados refletem o buffer local deste navegador; o histórico completo está no GA4."
      />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearWhatsAppLocalMetrics();
            setTick((t) => t + 1);
          }}
        >
          <Trash2 className="w-4 h-4 mr-1" /> Limpar buffer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard icon={MessageCircle} label="Impressões" value={totals.impressions} />
        <StatCard icon={MousePointerClick} label="Cliques" value={totals.clicks} />
        <StatCard icon={Send} label="Envios" value={totals.submits} />
        <StatCard icon={MousePointerClick} label="CTR (cliques/impr.)" value={`${totals.ctr.toFixed(1)}%`} />
        <StatCard icon={Send} label="Taxa de envio (env./clique)" value={`${totals.sr.toFixed(1)}%`} />
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Por rota</h2>
        {byRoute.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda — interaja com os CTAs para popular.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4">Rota</th>
                  <th className="py-2 pr-4">Impr.</th>
                  <th className="py-2 pr-4">Cliques</th>
                  <th className="py-2 pr-4">Envios</th>
                  <th className="py-2 pr-4">CTR</th>
                  <th className="py-2">Envio</th>
                </tr>
              </thead>
              <tbody>
                {byRoute.map((r) => (
                  <tr key={r.path} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{r.path}</td>
                    <td className="py-2 pr-4">{r.impressions}</td>
                    <td className="py-2 pr-4">{r.clicks}</td>
                    <td className="py-2 pr-4">{r.submits}</td>
                    <td className="py-2 pr-4">{r.ctr === null ? "—" : `${r.ctr.toFixed(1)}%`}</td>
                    <td className="py-2">{r.sr === null ? "—" : `${r.sr.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Comparativo A/B por variante</h2>
        {byVariant.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {byVariant.map((v) => (
              <div key={v.variant} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Variante {v.variant}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {v.impressions} impr · {v.clicks} cliques · {v.submits} envios
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">CTR</div>
                    <div className="text-xl font-semibold">
                      {v.ctr === null ? "—" : `${v.ctr.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Taxa de envio</div>
                    <div className="text-xl font-semibold">
                      {v.sr === null ? "—" : `${v.sr.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Eventos: <code>whatsapp_cta_impression</code>, <code>whatsapp_cta_click</code>,{" "}
        <code>whatsapp_fab_click</code>, <code>whatsapp_notice_click</code>,{" "}
        <code>whatsapp_form_submit</code>. Todos enviam <code>path</code>, <code>origin</code> e{" "}
        <code>variant</code> ao GA4 e geram UTMs no link oficial.
      </p>
    </div>
  );
}
