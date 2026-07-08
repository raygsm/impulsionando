import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Mail, Phone, MessageCircle, MapPin, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/garrido/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Imobiliária Garrido" },
      { name: "description", content: "Fale com a Imobiliária Garrido: WhatsApp, telefone, e-mail e endereço. Corretor dedicado, atendimento 7 dias." },
      { property: "og:title", content: "Contato — Imobiliária Garrido" },
      { property: "og:description", content: "WhatsApp, telefone, e-mail e endereço. Atendimento 7 dias." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const [sent, setSent] = useState(false);
  const nomeId = useId(), telId = useId(), emailId = useId(), assuntoId = useId(), msgId = useId();
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[color:var(--garrido-ink)]">Fale com a Garrido</h1>
          <p className="mt-3 text-slate-600">Escolha o canal mais rápido para você. Atendemos todos os dias.</p>
          <div className="mt-6 space-y-3">
            <Contato icon={MessageCircle} label="WhatsApp" value="(21) 99999-0000" href="https://wa.me/5521999990000" />
            <Contato icon={Phone} label="Telefone" value="(21) 4002-8922" href="tel:+552140028922" />
            <Contato icon={Mail} label="E-mail" value="atendimento@garrido.com.br" href="mailto:atendimento@garrido.com.br" />
            <Contato icon={MapPin} label="Endereço" value="Av. das Américas, 500 — Barra da Tijuca, Rio de Janeiro/RJ" />
            <Contato icon={Clock} label="Horário" value="Seg a Sex 9h–19h · Sáb 9h–14h · Dom sob agendamento" />
          </div>
          <div className="mt-6 aspect-video rounded-xl overflow-hidden border border-black/5">
            <iframe
              title="Localização Garrido"
              loading="lazy"
              src="https://www.google.com/maps?q=-23.0045,-43.3653&z=14&output=embed"
              className="w-full h-full border-0"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-black/5">
          {sent ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="font-serif text-xl font-bold mt-4">Mensagem enviada</h2>
              <p className="text-sm text-slate-500 mt-2">Responderemos em até 1 dia útil.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3" aria-label="Contato">
              <h2 className="font-serif text-xl font-bold text-[color:var(--garrido-ink)]">Envie uma mensagem</h2>
              <div>
                <label htmlFor={nomeId} className="text-xs font-semibold block mb-1">Nome</label>
                <input id={nomeId} required className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={telId} className="text-xs font-semibold block mb-1">WhatsApp</label>
                  <input id={telId} required className="input" />
                </div>
                <div>
                  <label htmlFor={emailId} className="text-xs font-semibold block mb-1">E-mail</label>
                  <input id={emailId} required type="email" className="input" />
                </div>
              </div>
              <div>
                <label htmlFor={assuntoId} className="text-xs font-semibold block mb-1">Assunto</label>
                <select id={assuntoId} className="input">
                  <option>Quero comprar</option>
                  <option>Quero alugar</option>
                  <option>Quero anunciar</option>
                  <option>Quero avaliação</option>
                  <option>Sou corretor</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label htmlFor={msgId} className="text-xs font-semibold block mb-1">Mensagem</label>
                <textarea id={msgId} rows={4} required className="input" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-[color:var(--garrido-ink)] text-white font-bold py-2.5">
                Enviar mensagem
              </button>
              <style>{`.input{width:100%;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:.55rem .7rem;font-size:.875rem;background:#fff;}`}</style>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Contato({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-lg bg-white p-4 border border-black/5">
      <Icon className="h-5 w-5 text-[color:var(--garrido-gold)] mt-0.5" aria-hidden />
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">{label}</div>
        <div className="font-semibold text-[color:var(--garrido-ink)]">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="block hover:-translate-y-0.5 transition">{inner}</a> : inner;
}
