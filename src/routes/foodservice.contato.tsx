import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, CheckCircle2 } from "lucide-react";
import { FOOD_MARCA } from "@/data/foodservice-menu";

export const Route = createFileRoute("/foodservice/contato")({
  head: () => ({
    meta: [
      { title: "Contato, Endereço e Horários — Casa Impulsiona" },
      { name: "description", content: "Endereço, telefone, WhatsApp e horários da Casa Impulsiona. Estamos na Barra da Tijuca com estacionamento próprio." },
      { property: "og:title", content: "Contato — Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/contato" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/contato" }],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const [enviado, setEnviado] = useState(false);
  const idNome = useId(); const idEmail = useId(); const idMsg = useId(); const idAssunto = useId();

  return (
    <>
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Contato</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Fale com a Casa Impulsiona.</h1>
          <p className="mt-3 text-white/85 max-w-2xl">
            Reservas, delivery, eventos privados, imprensa e parcerias. Retornamos em minutos no horário comercial.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <MapPin className="h-5 w-5 text-[color:var(--fs-brick)]" />
            <div className="font-serif font-bold mt-2">Endereço</div>
            <p className="text-sm text-black/70 mt-1">{FOOD_MARCA.endereco}</p>
            <p className="text-xs text-black/50 mt-2">Estacionamento próprio · valet nas sextas e sábados</p>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <Phone className="h-5 w-5 text-[color:var(--fs-brick)]" />
            <div className="font-serif font-bold mt-2">Telefone</div>
            <a href={`tel:+55${FOOD_MARCA.telefone.replace(/\D/g, "")}`} className="text-sm text-black/70 mt-1 block hover:text-[color:var(--fs-brick)]">
              {FOOD_MARCA.telefone}
            </a>
            <a href={FOOD_MARCA.whatsapp} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <MessageCircle className="h-4 w-4" /> WhatsApp direto
            </a>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 p-6">
            <Clock className="h-5 w-5 text-[color:var(--fs-brick)]" />
            <div className="font-serif font-bold mt-2">Horário de atendimento</div>
            <ul className="text-sm text-black/70 mt-2 space-y-1">
              {Object.entries(FOOD_MARCA.horario).map(([dia, hora]) => (
                <li key={dia} className="flex justify-between gap-3">
                  <span>{dia}</span><span className="font-semibold">{hora}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[color:var(--fs-cream)] border border-black/5 p-6">
            <div className="font-serif font-bold">Siga a casa</div>
            <div className="mt-3 flex gap-3">
              <a href={FOOD_MARCA.instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm rounded-md border border-black/10 px-3 py-1.5 hover:bg-white">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a href="mailto:contato@casaimpulsiona.com.br" className="inline-flex items-center gap-1 text-sm rounded-md border border-black/10 px-3 py-1.5 hover:bg-white">
                <Mail className="h-4 w-4" /> E-mail
              </a>
            </div>
          </div>
        </aside>

        <div className="md:col-span-2">
          {enviado ? (
            <div className="rounded-2xl bg-white border border-emerald-200 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-2xl font-bold mt-4">Mensagem enviada!</h2>
              <p className="text-black/70 mt-2">Retornaremos em até 2 horas no horário comercial.</p>
            </div>
          ) : (
            <form className="rounded-2xl bg-white border border-black/5 p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setEnviado(true); }}>
              <h2 className="font-serif text-xl font-bold">Envie sua mensagem</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={idNome} className="text-sm font-semibold">Nome</label>
                  <input id={idNome} required type="text" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div>
                  <label htmlFor={idEmail} className="text-sm font-semibold">E-mail</label>
                  <input id={idEmail} required type="email" className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={idAssunto} className="text-sm font-semibold">Assunto</label>
                  <select id={idAssunto} className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)] bg-white">
                    <option>Reserva de mesa</option>
                    <option>Evento privado</option>
                    <option>Delivery — dúvida sobre pedido</option>
                    <option>Imprensa</option>
                    <option>Parceria comercial</option>
                    <option>Trabalhe conosco</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={idMsg} className="text-sm font-semibold">Mensagem</label>
                  <textarea id={idMsg} required rows={5} className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:border-[color:var(--fs-amber)]" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[color:var(--fs-amber)] text-white px-5 py-3 rounded-md font-semibold hover:opacity-90">
                Enviar mensagem
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
