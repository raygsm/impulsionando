import { createFileRoute, Link } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { KpiCard, Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_RESERVA, fmtDateBR } from "@/components/marocas/marocasMockData";
import { CalendarCheck, MapPin, Users, KeyRound, LifeBuoy, Map as MapIcon } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/")({
  head: () => ({ meta: [{ title: "Minha reserva — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: MinhaReservaPage,
});

function MinhaReservaPage() {
  const r = MOCK_HOSPEDE_RESERVA;
  return (
    <MarocasAppShell
      title={`Sua estadia em ${r.imovelApelido}`}
      description="Tudo o que você precisa para uma estadia perfeita — antes, durante e depois."
      breadcrumbs={[{ label: "Hóspede" }]}
    >
      <SuccessBanner title="Reserva confirmada!" description={`Código ${r.codigo} · Estamos prontos para receber você.`} />

      <div className="mt-6 grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="aspect-[16/7] bg-muted overflow-hidden">
              <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=60" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h2 className="font-serif text-2xl">{r.imovelApelido}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.endereco}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Check-in" value={fmtDateBR(r.checkin)} hint="a partir das 15h" icon={<CalendarCheck className="h-4 w-4" />} />
                <KpiCard label="Check-out" value={fmtDateBR(r.checkout)} hint="até as 11h" icon={<CalendarCheck className="h-4 w-4" />} />
                <KpiCard label="Noites" value={r.noites} />
                <KpiCard label="Hóspedes" value={`${r.adultos}+${r.criancas}`} icon={<Users className="h-4 w-4" />} />
              </div>
            </div>
          </div>

          <Section title="Antes de chegar">
            <div className="grid md:grid-cols-3 gap-3">
              <Link to="/marocas/app/hospede/acesso" className="rounded-xl border bg-card p-4 hover:border-primary transition">
                <KeyRound className="h-5 w-5 text-primary" />
                <h3 className="mt-2 font-semibold text-sm">Acesso & senha</h3>
                <p className="text-xs text-muted-foreground mt-1">Endereço, senha da porta e Wi-Fi liberados 24h antes.</p>
              </Link>
              <Link to="/marocas/app/hospede/regras" className="rounded-xl border bg-card p-4 hover:border-primary transition">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="mt-2 font-semibold text-sm">Regras da casa</h3>
                <p className="text-xs text-muted-foreground mt-1">Horários, animais, silêncio e cuidados básicos.</p>
              </Link>
              <Link to="/marocas/app/hospede/roteiros" className="rounded-xl border bg-card p-4 hover:border-primary transition">
                <MapIcon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 font-semibold text-sm">Roteiros no Rio</h3>
                <p className="text-xs text-muted-foreground mt-1">Sugestões personalizadas pelo bairro do imóvel.</p>
              </Link>
            </div>
          </Section>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">Concierge Marocas</h3>
            <p className="text-xs text-muted-foreground mt-1">24 horas por dia, todos os dias da sua estadia.</p>
            <a href={`tel:${r.concierge.replace(/\D/g, "")}`} className="mt-3 block text-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90">
              Ligar agora · {r.concierge}
            </a>
            <Link to="/marocas/app/hospede/suporte" className="mt-2 block text-center rounded-md border px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-1.5 justify-center w-full">
              <LifeBuoy className="h-4 w-4" /> Abrir chamado
            </Link>
          </div>
          <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            <p><span className="font-semibold text-foreground">Código da reserva:</span> {r.codigo}</p>
            <p className="mt-1">Adicione ao seu calendário para receber lembretes automáticos.</p>
          </div>
        </aside>
      </div>
    </MarocasAppShell>
  );
}
