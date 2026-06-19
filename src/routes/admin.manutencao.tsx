import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isMaintenanceOn, setMaintenance } from "@/lib/maintenance";

export const Route = createFileRoute("/admin/manutencao")({
  head: () => ({
    meta: [
      { title: "Modo manutenção — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminMaintenancePage,
});

function AdminMaintenancePage() {
  const [on, setOn] = useState(false);
  const [healthz, setHealthz] = useState<string>("…");

  useEffect(() => {
    setOn(isMaintenanceOn());
    fetch("/healthz", { cache: "no-store" })
      .then((r) => setHealthz(r.ok ? `OK (${r.status})` : `FAIL (${r.status})`))
      .catch(() => setHealthz("FAIL (network)"));
  }, []);

  const toggle = () => {
    const next = !on;
    setMaintenance(next);
    setOn(next);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold text-foreground">Modo manutenção</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quando ativado, todo visitante é redirecionado para{" "}
        <Link to="/manutencao" className="underline">
          /manutencao
        </Link>
        . A preferência é local (por navegador) — use-o como interruptor rápido durante o cutover do
        DNS de <strong>agenda.chrismed.com.br</strong>.
      </p>

      <div className="mt-8 flex items-center justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <div className="text-sm font-medium text-foreground">
            Status: <span className={on ? "text-amber-600" : "text-emerald-600"}>{on ? "ATIVO" : "Desativado"}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            /healthz: <span className="font-mono">{healthz}</span>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            on
              ? "border border-input bg-background text-foreground hover:bg-accent"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {on ? "Desativar manutenção" : "Ativar manutenção"}
        </button>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>A flag é salva em <code>localStorage</code> (chave <code>impulsionando:maintenance_mode</code>).</li>
          <li>Enquanto ATIVO, qualquer rota redireciona para /manutencao, exceto /admin/manutencao e /healthz.</li>
          <li>Para forçar manutenção global (todos os usuários), me peça para evoluir para uma flag em banco/edge.</li>
        </ul>
      </div>
    </div>
  );
}
