import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { Wrench, LifeBuoy, Phone } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/suporte")({
  head: () => ({ meta: [{ title: "Suporte 24h — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: SuportePage,
});

function SuportePage() {
  const [enviado, setEnviado] = useState(false);
  return (
    <MarocasAppShell
      title="Suporte 24h"
      description="Manutenção, dúvidas ou emergências — nosso concierge responde em minutos."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Suporte" }]}
    >
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <a href="tel:552199307500" className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:border-primary transition">
          <Phone className="h-6 w-6 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Emergência 24h</p>
            <p className="font-semibold">(21) 99307-5000</p>
          </div>
        </a>
        <a href="https://wa.me/5521993075000" target="_blank" rel="noopener noreferrer" className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:border-primary transition">
          <LifeBuoy className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">WhatsApp SAC</p>
            <p className="font-semibold">Fale com o concierge</p>
          </div>
        </a>
      </div>

      <Section title="Solicitar manutenção">
        {enviado ? (
          <SuccessBanner title="Chamado registrado" description="Nossa equipe vai entrar em contato em até 30 minutos. Você recebe atualizações por WhatsApp." />
        ) : (
          <form
            className="rounded-xl border bg-card p-5 space-y-3"
            onSubmit={(e) => { e.preventDefault(); setEnviado(true); }}
          >
            <div>
              <label className="text-xs font-medium">Categoria</label>
              <select required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Selecione…</option>
                <option>Ar-condicionado</option>
                <option>Água / hidráulica</option>
                <option>Elétrica / lâmpada</option>
                <option>Eletrodomésticos</option>
                <option>Limpeza extra</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Descreva o problema</label>
              <textarea rows={4} required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ex.: ar-condicionado do quarto principal não está gelando." />
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">
              <Wrench className="h-4 w-4" /> Abrir chamado
            </button>
            <p className="text-[11px] text-muted-foreground">Persistência real será conectada pelo Codex.</p>
          </form>
        )}
      </Section>
    </MarocasAppShell>
  );
}
