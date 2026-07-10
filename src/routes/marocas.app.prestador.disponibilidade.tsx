import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, SuccessBanner } from "@/components/marocas/MarocasUI";

export const Route = createFileRoute("/marocas/app/prestador/disponibilidade")({
  head: () => ({ meta: [{ title: "Disponibilidade — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: DisponibilidadePage,
});

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TURNOS = ["Manhã", "Tarde", "Noite"];

function DisponibilidadePage() {
  const [grid, setGrid] = useState<Record<string, boolean>>({
    "Seg-Manhã": true, "Seg-Tarde": true,
    "Ter-Manhã": true, "Ter-Tarde": true,
    "Qua-Manhã": true, "Qua-Tarde": true,
    "Qui-Manhã": true, "Qui-Tarde": true,
    "Sex-Manhã": true, "Sex-Tarde": true,
    "Sáb-Manhã": true,
  });
  const [salvo, setSalvo] = useState(false);
  const toggle = (k: string) => setGrid((g) => ({ ...g, [k]: !g[k] }));
  return (
    <MarocasAppShell
      title="Sua disponibilidade"
      description="Marque os turnos em que aceita serviços. Você pode ajustar a qualquer momento."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Disponibilidade" }]}
      actions={<button onClick={() => setSalvo(true)} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Salvar</button>}
    >
      {salvo && <div className="mb-4"><SuccessBanner title="Disponibilidade atualizada" description="Você começará a receber oportunidades dos novos turnos imediatamente." /></div>}
      <Section title="Grade semanal">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Turno</th>
                {DIAS.map((d) => <th key={d} className="px-3 py-2 text-center font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {TURNOS.map((t) => (
                <tr key={t}>
                  <td className="px-3 py-2 font-medium">{t}</td>
                  {DIAS.map((d) => {
                    const k = `${d}-${t}`;
                    const on = !!grid[k];
                    return (
                      <td key={k} className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(k)}
                          className={`h-7 w-full max-w-[64px] rounded-md border text-[11px] font-semibold ${
                            on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                          }`}
                        >
                          {on ? "Disp." : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </MarocasAppShell>
  );
}
