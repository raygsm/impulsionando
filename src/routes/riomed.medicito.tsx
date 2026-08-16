import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, Send, ShieldCheck, Sparkles, UserRound, Loader2, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/riomed/medicito")({
  head: () => ({
    meta: [
      { title: "Medicito — Seu Concierge Médico | RioMed" },
      { name: "description", content: "Converse com o Medicito, o concierge da RioMed para produtos, locação, manutenção, suporte e atendimento comercial." },
    ],
  }),
  component: MedicitoPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sessionId() {
  if (typeof window === "undefined") return "riomed:web:server";
  const key = "riomed-medicito-session";
  const current = window.sessionStorage.getItem(key);
  if (current?.startsWith("riomed:")) return current;
  const next = `riomed:web:${crypto.randomUUID()}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function MedicitoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canSend = useMemo(() => (input.trim().length > 0 || Boolean(image)) && !sending, [input, image, sending]);

  function chooseImage(file: File | null) {
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      setError("Envie uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setError("A imagem deve ter no máximo 8 MB.");
      return;
    }
    setError(null);
    setImage(file);
  }

  async function uploadImage(file: File, session: string) {
    const form = new FormData();
    form.append("image", file);
    const response = await fetch("/api/riomed/medicito/upload", {
      method: "POST",
      headers: { "x-riomed-session": session },
      body: form,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.uploadId) throw new Error(payload?.error || "Não foi possível enviar a imagem.");
    return payload.uploadId as string;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const attachedImage = image;
    const userMessage = input.trim() || (attachedImage ? "Analise esta imagem e me ajude a identificar o equipamento, peça, etiqueta ou código visível." : "");
    if (!userMessage || sending) return;

    setError(null);
    setSending(true);
    setInput("");
    setImage(null);
    const visibleMessage = attachedImage ? `${userMessage}\n\n📎 Imagem anexada: ${attachedImage.name}` : userMessage;
    setMessages((current) => [...current, { role: "user", content: visibleMessage }, { role: "assistant", content: "" }]);

    try {
      const session = sessionId();
      const uploadId = attachedImage ? await uploadImage(attachedImage, session) : undefined;
      const response = await fetch("/api/riomed/medicito/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-riomed-session": session,
        },
        body: JSON.stringify({ text: userMessage, pathname: window.location.pathname, uploadId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Não foi possível falar com o Medicito agora.");
      }
      if (!response.body) throw new Error("O canal do Medicito não retornou conteúdo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = { role: "assistant", content: accumulated };
          return next;
        });
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Falha temporária no atendimento.";
      setError(message);
      setMessages((current) => {
        const next = [...current];
        if (next.at(-1)?.role === "assistant" && !next.at(-1)?.content) next.pop();
        return next;
      });
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      <section className="border-b bg-gradient-to-br from-[color:var(--riomed-deep)] to-[color:var(--riomed-primary)] text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20"><Bot className="h-8 w-8" /></div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-cyan-100"><Sparkles className="h-4 w-4" /> Inteligência RioMed conectada ao Core Impulsionando</div>
              <h1 className="text-3xl font-extrabold md:text-4xl">Medicito — Seu Concierge Médico</h1>
              <p className="mt-3 max-w-3xl text-white/80">Peça ajuda para encontrar equipamentos e peças, solicitar cotação, locação, manutenção, suporte ou atendimento comercial. Você também pode enviar uma foto para análise visual responsável.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-7 md:grid-cols-[1fr_280px]">
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3 text-sm font-semibold text-slate-700">Atendimento com o Medicito</div>
          <div className="h-[480px] space-y-4 overflow-y-auto p-5" aria-live="polite">
            {messages.length === 0 && (
              <div className="mx-auto mt-14 max-w-lg text-center text-slate-500">
                <Bot className="mx-auto mb-3 h-10 w-10 text-[color:var(--riomed-primary)]" />
                <p className="font-semibold text-slate-700">Como posso ajudar?</p>
                <p className="mt-2 text-sm">Ex.: “Preciso cotar um monitor multiparamétrico”, “quero solicitar manutenção” ou envie uma foto de uma peça/etiqueta que deseja identificar.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <div className="mt-1 rounded-full bg-blue-50 p-2"><Bot className="h-4 w-4 text-[color:var(--riomed-primary)]" /></div>}
                <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-[color:var(--riomed-primary)] text-white" : "bg-slate-100 text-slate-800"}`}>
                  {message.content || <span className="inline-flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Pensando…</span>}
                </div>
                {message.role === "user" && <div className="mt-1 rounded-full bg-slate-100 p-2"><UserRound className="h-4 w-4 text-slate-600" /></div>}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={submit} className="border-t bg-white p-4">
            {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {image && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-slate-700">
                <span className="truncate">📎 {image.name} · {(image.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }} className="ml-3 rounded-md p-1 hover:bg-cyan-100" aria-label="Remover imagem"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
                disabled={sending}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={sending} className="inline-flex w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" aria-label="Anexar imagem">
                <ImagePlus className="h-5 w-5" />
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (canSend) event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={4000}
                rows={2}
                placeholder="Conte ao Medicito o que você precisa…"
                className="min-h-[54px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--riomed-primary)] focus:ring-2 focus:ring-blue-100"
                disabled={sending}
              />
              <button type="submit" disabled={!canSend} className="inline-flex w-12 items-center justify-center rounded-xl bg-[color:var(--riomed-primary)] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensagem">
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Imagens: JPEG, PNG ou WebP, até 8 MB. O Medicito não realiza diagnóstico médico. Estoque, preço, compatibilidade, garantia e prazo só são informados quando confirmados nos sistemas RioMed.</p>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold text-slate-800"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Atendimento responsável</div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Consulta dados reais da RioMed.</li>
              <li>• Não inventa preço ou estoque.</li>
              <li>• Pode analisar foto com nível de confiança.</li>
              <li>• Pode encaminhar para especialista.</li>
              <li>• Mantém contexto do atendimento.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5 text-sm text-slate-700">
            <strong>Não sabe o nome da peça?</strong>
            <p className="mt-2">Envie uma foto nítida. Se possível, inclua etiqueta, placa, código, modelo e conectores. O Medicito separa o que está visível do que ainda precisa ser confirmado no catálogo RioMed.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
