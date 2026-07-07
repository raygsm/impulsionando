import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ALL_WORKFLOWS, REGUA_LABEL, WORKFLOWS_BUNDLE_URL, type Regua } from "@/data/automacao-catalog";
import { FlowCard } from "@/components/core/automacao/FlowCard";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { registerAutomationRequest, getAutomationApprovalCounts } from "@/lib/automation-approvals.functions";

export const Route = createFileRoute("/_authenticated/core/automacao/fluxos")({
  head: () => ({ meta: [{ title: "Fluxos — Automação" }, { name: "robots", content: "noindex" }] }),
  component: FluxosPage,
});

const REGUAS: Regua[] = ["captacao","conversao","relacionamento","retencao","financeiro","suporte","vitrine","nicho"];

function FluxosPage() {
  const [q, setQ] = useState("");
  const [regua, setRegua] = useState<Regua | "all">("all");
  const search = useSearch({ strict: false }) as { tenant?: string; mode?: "demo" | "producao" };
  const tenantSlug = search?.tenant ?? null;
  const mode = search?.mode ?? "demo";
  const register = useServerFn(registerAutomationRequest);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ALL_WORKFLOWS.filter((w) => (regua === "all" || w.regua === regua))
      .filter((w) => !needle || w.nome.toLowerCase().includes(needle) || w.slug.includes(needle));
  }, [q, regua]);

  const logBundle = async () => {
    try {
      await register({
        data: {
          tenantSlug,
          mode,
          regua: regua === "all" ? null : regua,
          action: "download_zip",
          files: [WORKFLOWS_BUNDLE_URL],
          note: `Pacote completo (${ALL_WORKFLOWS.length} fluxos)`,
        },
      });
    } catch {
      // não bloqueia download
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground max-w-2xl">
          Baixe os JSONs individualmente em cada card ou o pacote completo com os {ALL_WORKFLOWS.length} workflows para importar no N8N
          (<span className="font-mono">Workflows → Import from File</span>). Cada download é registrado em{" "}
          <Link to="/core/automacao/aprovacoes" className="underline">Aprovações</Link>{tenantSlug ? <> — tenant <b>{tenantSlug}</b>, modo <b>{mode}</b></> : null}.
        </div>
        <Button asChild size="sm">
          <a href={WORKFLOWS_BUNDLE_URL} download onClick={logBundle}>
            <Download className="h-4 w-4 mr-1" /> Baixar pacote completo (.zip)
          </a>
        </Button>
      </div>

      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs flex items-start gap-2">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <b>Downloads estão liberados</b> — só a <i>ativação em produção</i> exige aprovação backend.
          Se um botão for bloqueado, sua solicitação fica registrada em{" "}
          <Link to="/core/automacao/aprovacoes" className="underline font-medium">/core/automacao/aprovacoes</Link>{" "}
          para acompanhamento.
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar por nome ou slug..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Button size="sm" variant={regua === "all" ? "default" : "outline"} onClick={() => setRegua("all")}>Todas</Button>
        {REGUAS.map((r) => (
          <Button key={r} size="sm" variant={regua === r ? "default" : "outline"} onClick={() => setRegua(r)}>
            {REGUA_LABEL[r]}
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{items.length} workflow(s)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((wf) => <FlowCard key={wf.slug} wf={wf} />)}
      </div>
    </div>
  );
}
