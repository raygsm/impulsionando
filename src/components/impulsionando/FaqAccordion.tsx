import { useState } from "react";
import { Plus } from "lucide-react";

export type FaqItem = { question: string; answer: string };

/**
 * Acordeão de FAQ acessível. Substitui as implementações `<details>`
 * duplicadas em WMP, Colors, Central de Ajuda, Marocas etc.
 *
 * Use `buildFaqJsonLd(faqs)` no `head().scripts` da rota para o
 * schema.org FAQPage — evita duplicar o boilerplate em cada rota.
 */
export function FaqAccordion({
  faqs,
  defaultOpenIndex = 0,
}: {
  faqs: FaqItem[];
  defaultOpenIndex?: number;
}) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpenIndex);
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm divide-y divide-border">
      {faqs.map((f, i) => {
        const open = openIndex === i;
        return (
          <div key={f.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : i)}
              aria-expanded={open}
              className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-muted/40 transition"
            >
              <span className="font-serif text-base md:text-lg">{f.question}</span>
              <span
                aria-hidden
                className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-muted text-primary transition ${open ? "rotate-45" : ""}`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            {open && (
              <div className="px-5 pb-5 text-sm opacity-80 leading-relaxed">
                {f.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper para gerar JSON-LD FAQPage. Uso:
 *   head: () => ({ scripts: [buildFaqJsonLd(FAQS)] })
 */
export function buildFaqJsonLd(faqs: FaqItem[]) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }),
  };
}
