import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Calendar, Users, Clock, MapPin, PartyPopper, CheckCircle2, Music, Cake, Briefcase } from "lucide-react";
import { FOOD_MARCA } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/reservas")({
  head: () => ({
    meta: [
      { title: "Reserva de Mesa e Eventos — Casa Impulsiona" },
      { name: "description", content: "Reserve mesa no salão, área externa ou privês para grupos. Casamentos, corporativo, aniversários e confraternizações com buffet, drinks e música." },
      { property: "og:title", content: "Reservas e Eventos — Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/reservas" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/reservas" }],
  }),
  component: ReservasPage,
});

function ReservasPage() {
  const [enviado, setEnviado] = useState(false);
  const [tipo, setTipo] = useState<"mesa" | "evento">("mesa");
  const idNome = useId(); const idData = useId(); const idHora = useId(); const idPessoas = useId(); const idOcasiao = useId(); const idContato = useId();

  return (
    <>
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Reservas e eventos</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Reserve sua mesa ou seu evento.</h1>
          <p className="mt-3 text-white/85 max-w-2xl">
            Salão para {FOOD_MARCA.capacidade} pessoas, {FOOD_MARCA.mesas} mesas, área externa, mezanino
            e privês para grupos. Reserva sem taxa. Eventos privados com buffet personalizado.
          </p>
          <div className="mt-6 inline-flex rounded-md bg-white/10 p-1">
            <button type="button" onClick={() => setTipo("mesa")} className={`px-4 py-2 rounded text-sm font-semibold ${tipo === "mesa" ? "bg-[color:var(--fs-amber)] text-white" : "text-white/80"}`}>
              Reserva de mesa
            </button>
            <button type="button" onClick={() => setTipo("evento")} className={`px-4 py-2 rounded text-sm font-semibold ${tipo === "evento" ? "bg-[color:var(--fs-amber)] text-white" : "text-white/80"}`}>
              Evento privado
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {enviado ? (
            <div className="rounded-2xl bg-white border border-emerald-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-2xl font-bold mt-4">Solicitação recebida!</h2>
              <p className="text-black/70 mt-2">
                Nossa equipe entrará em contato pelo WhatsApp em até 30 minutos para confirmar
                sua {tipo === "mesa" ? "reserva" : "proposta de evento"}.
              </p>
              <button type="button" onClick={() => setEnviado(false)} className="mt-6 text-sm font-semibold text-[color:var(--fs-brick)] underline">
                Fazer nova solicitação
              </button>
            </div>
          ) : (
            <form
              className="rounded-2xl bg-white border border-black/5 p-6 space-y-4"
              onSubmit={(e) => { e.preventDefault(); setEnviado(true); }}
            >
              <h2 className="font-serif text-xl font-bold">
                {tipo === "mesa" ? "Reservar mesa" : "Solicitar orçamento de evento"}
              </h2>
              <p className="text-sm text-black/60">
                {tipo === "mesa"
                  ? "Reserva sem taxa. Confirmação por WhatsApp em até 30 minutos."
                  : "Casamentos, corporativo, aniversários, confraternizações. Buffet e bar personalizados."}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={idNome} className="text-sm font-semibold">Nome completo</label>
                  <input id={idNome} required type="text" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idContato} className="text-sm font-semibold">WhatsApp</label>
                  <input id={idContato} required type="tel" placeholder="(21) 99999-9999" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idData} className="text-sm font-semibold inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</label>
                  <input id={idData} required type="date" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idHora} className="text-sm font-semibold inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</label>
                  <input id={idHora} required type="time" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idPessoas} className="text-sm font-semibold inline-flex items-center gap-1"><Users className="h-3 w-3" /> Nº de pessoas</label>
                  <input id={idPessoas} required type="number" min={1} max={200} className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idOcasiao} className="text-sm font-semibold">Ocasião</label>
                  <select id={idOcasiao} className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)] bg-white">
                    {tipo === "mesa" ? (
                      <>
                        <option>Almoço em família</option>
                        <option>Happy hour</option>
                        <option>Jantar romântico</option>
                        <option>Comemoração</option>
                      </>
                    ) : (
                      <>
                        <option>Aniversário</option>
                        <option>Casamento / cerimônia</option>
                        <option>Corporativo / confraternização</option>
                        <option>Formatura</option>
                        <option>Outro</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-[color:var(--fs-amber)] text-white px-5 py-3 rounded-md font-semibold hover:opacity-90">
                {tipo === "mesa" ? "Reservar mesa" : "Solicitar proposta"}
              </button>
              <p className="text-xs text-black/50">
                Ao enviar, você concorda em receber a confirmação via WhatsApp. Cadastro
                automático no clube de fidelidade (opcional).
              </p>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-[color:var(--fs-cream)] border border-black/5 p-6">
            <h3 className="font-serif font-bold">Nossa casa</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="inline-flex items-start gap-2"><Users className="h-4 w-4 text-[color:var(--fs-brick)] mt-0.5" /><span>Até {FOOD_MARCA.capacidade} pessoas · {FOOD_MARCA.mesas} mesas</span></li>
              <li className="inline-flex items-start gap-2"><MapPin className="h-4 w-4 text-[color:var(--fs-brick)] mt-0.5" /><span>Salão interno, mezanino, área externa, privê</span></li>
              <li className="inline-flex items-start gap-2"><Music className="h-4 w-4 text-[color:var(--fs-brick)] mt-0.5" /><span>Música ao vivo às sextas e sábados</span></li>
              <li className="inline-flex items-start gap-2"><PartyPopper className="h-4 w-4 text-[color:var(--fs-brick)] mt-0.5" /><span>Buffet, drinks e bolo personalizados</span></li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <h3 className="font-serif font-bold">Modalidades de evento</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="inline-flex items-start gap-2"><Cake className="h-4 w-4 text-[color:var(--fs-amber)] mt-0.5" /><span><b>Aniversários</b> · a partir de 20 pessoas</span></li>
              <li className="inline-flex items-start gap-2"><Briefcase className="h-4 w-4 text-[color:var(--fs-amber)] mt-0.5" /><span><b>Corporativo</b> · confraternização, kick-off</span></li>
              <li className="inline-flex items-start gap-2"><PartyPopper className="h-4 w-4 text-[color:var(--fs-amber)] mt-0.5" /><span><b>Casa fechada</b> · exclusividade até 180 pessoas</span></li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
