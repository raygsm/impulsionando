import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { colorsEvents } from "@/lib/colors-analytics";

const CONTACT_EMAIL = "contato@colorssaude.com.br";

/**
 * Formulário de contato — front-end puro. Sem backend: monta um mailto:
 * pré-preenchido para o SAC oficial e registra evento GA4.
 * Se um dia o backend/edge estiver liberado, trocar handleSubmit por
 * chamada ao endpoint interno de leads.
 */
export default function ContatoSection() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) return;

    const subject = encodeURIComponent(`[Site Colors] ${assunto || "Solicitação de atendimento"}`);
    const body = encodeURIComponent(
      `Nome: ${nome}\nE-mail: ${email}\nAssunto: ${assunto || "-"}\n\nMensagem:\n${mensagem}`,
    );
    colorsEvents.leadSubmit("contato_form");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section id="contato" className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#0a0f0d] via-emerald-950/30 to-[#0a0f0d] py-24">
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Fale com a gente</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Atendimento humano, do lado de cá.</h2>
          <p className="mt-4 text-lg text-white/70">
            Dúvidas sobre produtos, pedidos ou parcerias? Nosso SAC atende de segunda a sexta pelo WhatsApp e por e-mail.
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-emerald-400" aria-hidden />
              <div>
                <p className="font-semibold">E-mail</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-white/70 hover:text-white">{CONTACT_EMAIL}</a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-400" aria-hidden />
              <div>
                <p className="font-semibold">WhatsApp SAC</p>
                <a
                  href="https://wa.me/5521967862834"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => colorsEvents.whatsappClick("contato_section")}
                  className="text-sm text-white/70 hover:text-white"
                >
                  21 96786-2834
                </a>
              </div>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Nome</span>
              <input
                required
                maxLength={80}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
                placeholder="Seu nome completo"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60">E-mail</span>
              <input
                required
                type="email"
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
                placeholder="voce@email.com"
              />
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Assunto</span>
            <input
              maxLength={120}
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
              placeholder="Ex: dúvida sobre pedido, parceria, sugestão…"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Mensagem</span>
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
              placeholder="Conte pra gente como podemos ajudar."
            />
          </label>
          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            <Send className="h-4 w-4" /> Enviar mensagem
          </button>
          {sent && (
            <p className="text-center text-sm text-emerald-300" role="status">
              Abrimos seu cliente de e-mail para envio ao nosso SAC. Se preferir, fale conosco no WhatsApp.
            </p>
          )}
          <p className="text-center text-xs text-white/40">Ao enviar, você concorda com a nossa política de privacidade.</p>
        </form>
      </div>
    </section>
  );
}
