import { useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, Clock, Send, CheckCircle2 } from "lucide-react";
import { useBrand } from "./BrandThemeProvider";
import { toast } from "sonner";

export function BrandContact() {
  const b = useBrand();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Preencha nome e email.");
      return;
    }
    setSent(true);
    toast.success("Simulação: mensagem enviada com sucesso.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="text-xs uppercase tracking-wider" style={{ color: b.palette.muted }}>Fale com a {b.companyName}</div>
        <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
          Estamos prontos para te atender
        </h1>
        <p className="mt-3 text-base" style={{ color: b.palette.muted }}>
          Responda em até 2 horas úteis. Preferimos conversar antes de qualquer proposta.
        </p>

        <div className="mt-8 space-y-4">
          {[
            { icon: MessageCircle, label: "WhatsApp", value: b.contact.whatsapp },
            { icon: Phone, label: "Telefone", value: b.contact.phone },
            { icon: Mail, label: "Email", value: b.contact.email },
            { icon: MapPin, label: "Endereço", value: b.contact.address },
            { icon: Clock, label: "Horário", value: b.contact.hours },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fff", borderColor: `${b.palette.ink}12` }}>
                <span className="grid h-10 w-10 place-items-center rounded-lg shrink-0" style={{ background: `${b.palette.primary}15`, color: b.palette.primary }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs" style={{ color: b.palette.muted }}>{row.label}</div>
                  <div className="text-sm font-semibold" style={{ color: b.palette.ink }}>{row.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 aspect-[16/9] rounded-2xl border overflow-hidden relative" style={{ background: b.palette.ink, borderColor: `${b.palette.ink}22` }}>
          <div className="absolute inset-0 opacity-60" style={{ background: b.hero.imageGradient }} aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <div style={{ color: b.palette.primaryFg }}>
              <MapPin className="h-8 w-8 mx-auto" style={{ color: b.palette.accent }} />
              <p className="mt-2 text-sm font-semibold">{b.contact.address}</p>
              <p className="text-xs opacity-70 mt-1">Mapa interativo · simulação de demonstração</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <form
          onSubmit={submit}
          className="rounded-2xl border p-6 sm:p-8"
          style={{ background: "#fff", borderColor: `${b.palette.ink}12` }}
        >
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: b.palette.primary }} />
              <h2 className="mt-3 text-xl font-bold" style={{ color: b.palette.ink, fontFamily: b.typography.heading }}>
                Mensagem enviada
              </h2>
              <p className="mt-2 text-sm" style={{ color: b.palette.muted }}>
                Nossa equipe entra em contato em até 2 horas úteis.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
                className="mt-6 text-xs font-semibold underline"
                style={{ color: b.palette.primary }}
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold" style={{ color: b.palette.ink, fontFamily: b.typography.heading }}>
                Envie sua mensagem
              </h2>
              <p className="mt-1 text-sm" style={{ color: b.palette.muted }}>
                Preencha os campos e retornaremos rapidamente.
              </p>

              <div className="mt-6 grid gap-4">
                {[
                  { key: "name", label: "Seu nome", type: "text", required: true },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "WhatsApp", type: "tel", required: false },
                ].map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs font-semibold" style={{ color: b.palette.ink }}>
                      {f.label}{f.required && " *"}
                    </span>
                    <input
                      required={f.required}
                      type={f.type}
                      value={(form as Record<string, string>)[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: `${b.palette.ink}22`, color: b.palette.ink }}
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs font-semibold" style={{ color: b.palette.ink }}>Mensagem</span>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: `${b.palette.ink}22`, color: b.palette.ink }}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold"
                style={{ background: b.palette.primary, color: b.palette.primaryFg }}
              >
                Enviar mensagem <Send className="h-4 w-4" />
              </button>

              <p className="mt-3 text-[11px] text-center" style={{ color: b.palette.muted }}>
                Ao enviar, você concorda com a nossa política de privacidade.
              </p>
            </>
          )}
        </form>

        <div className="mt-6 rounded-2xl border p-5" style={{ background: b.palette.ink, color: b.palette.primaryFg, borderColor: `${b.palette.ink}` }}>
          <h3 className="font-semibold" style={{ fontFamily: b.typography.heading }}>
            Perguntas frequentes
          </h3>
          <div className="mt-3 space-y-3">
            {b.faq.map((f) => (
              <details key={f.question} className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: `${b.palette.primaryFg}20` }}>
                <summary className="cursor-pointer text-sm font-semibold">{f.question}</summary>
                <p className="mt-2 text-sm opacity-80">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
