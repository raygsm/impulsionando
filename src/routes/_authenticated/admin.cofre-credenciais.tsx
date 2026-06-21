import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/insights/KpiCard";
import { Loader2, RotateCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { fetchCredentialVault, markRotatedFn } from "@/lib/credentials-vault.functions";

export const Route = createFileRoute("/_authenticated/admin/cofre-credenciais")({
  head: () => ({ meta: [{ title: "Cofre de Credenciais — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CofrePage,
});

const SOURCES = [
  { key: "integration", label: "Integrações" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "mercadopago", label: "Mercado Pago" },
  { key: "fiscal", label: "Fiscal" },
];

function CofrePage() {
  const fn = useServerFn(fetchCredentialVault);
  const rotateFn = useServerFn(markRotatedFn);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["credentials-vault"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const [src, setSrc] = useState<string>("");
  const [q, setQ] = useState("");

  const d = data as any;
  const filtered = useMemo(() => {
    if (!d) return [];
    let xs = d.entries as any[];
    if (src) xs = xs.filter((e) => e.source === src);
    if (q) { const Q = q.toLowerCase(); xs = xs.filter((e) => `${e.label} ${e.status} ${e.environment}`.toLowerCase().includes(Q)); }
    return xs;
  }, [d, src, q]);

  async function rotate(entry: any) {
    const reason = window.prompt(`Confirmar rotação de "${entry.label}".\nMotivo (opcional):`, "");
    if (reason === null) return;
    try {
      await rotateFn({ data: { entryId: entry.id, reason } });
      toast.success("Rotação registrada no audit trail");
      refetch();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cofre de Credenciais" description="Inventário centralizado de credenciais ativas no core (integrações, WhatsApp, Mercado Pago, Fiscal). Idade da chave + registro de rotação no audit trail. Valores ficam mascarados." />

      {isLoading || !d ? (
        <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>
      ) : error ? (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Credenciais" value={d.counts.total} />
            <KpiCard label="Antigas (>180d)" value={d.counts.stale} hint="Considerar rotação" />
            <KpiCard label="Inativas" value={d.counts.inactive} />
            <KpiCard label="Sem segredo" value={d.counts.missingSecret} />
          </div>

          <Card className="p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setSrc("")}><Badge variant={src === "" ? "default" : "outline"}>todas</Badge></button>
              {SOURCES.map((s) => (
                <button key={s.key} onClick={() => setSrc(s.key)}><Badge variant={src === s.key ? "default" : "outline"}>{s.label}</Badge></button>
              ))}
            </div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome, status, ambiente…" className="flex-1 min-w-[200px]" />
          </Card>

          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground bg-muted/40"><tr>
                <th className="py-2 px-3">Fonte</th><th>Credencial</th><th>Ambiente</th><th>Status</th><th>Ativo</th><th>Segredo</th><th>Idade</th><th>Atualizado</th><th className="text-right pr-3">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((e: any) => {
                  const stale = e.ageDays != null && e.ageDays > 180;
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="py-2 px-3"><Badge variant="secondary" className="font-mono text-[10px]">{e.source}</Badge></td>
                      <td className="font-medium max-w-[260px] truncate">{e.label}</td>
                      <td className="text-muted-foreground">{e.environment ?? "—"}</td>
                      <td><Badge variant={e.status === "connected" || e.status === "healthy" ? "secondary" : e.status === "error" || e.status === "down" ? "destructive" : "outline"}>{e.status ?? "—"}</Badge></td>
                      <td>{e.activeFlag ? "✓" : <span className="text-muted-foreground">—</span>}</td>
                      <td className="font-mono text-[10px] max-w-[200px] truncate" title={e.secretRefs.join(", ")}>{e.hasSecret ? e.secretRefs.join(", ") : <span className="text-amber-700 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />ausente</span>}</td>
                      <td className={stale ? "text-amber-700 font-semibold" : ""}>{e.ageDays != null ? `${e.ageDays}d` : "—"}</td>
                      <td className="text-muted-foreground">{String(e.updatedAt).slice(0,10)}</td>
                      <td className="text-right pr-3">
                        <Button size="sm" variant="outline" onClick={() => rotate(e)}>
                          <RotateCw className="h-3 w-3 mr-1" /> Marcar rotação
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Sem credenciais com este filtro.</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card className="p-3 text-xs text-muted-foreground">
            <strong>Como rotacionar de fato:</strong> 1) gere uma nova chave no provedor; 2) atualize o segredo no Lovable Cloud (Project Settings → Secrets); 3) clique em "Marcar rotação" aqui para registrar a data e o motivo no audit trail. A "Idade" reseta para 0.
          </Card>
        </>
      )}
    </div>
  );
}
