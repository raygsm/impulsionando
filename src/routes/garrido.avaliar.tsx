import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { CheckCircle2, LineChart, Search, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/garrido/avaliar")({
  head: () => ({
    meta: [
      { title: "Avaliação gratuita de imóvel — Imobiliária Garrido" },
      { name: "description", content: "Avaliação profissional e gratuita do seu imóvel com metodologia CRECI. Descubra o valor real de venda ou locação." },
      { property: "og:title", content: "Avaliação gratuita de imóvel — Garrido" },
      { property: "og:description", content: "Metodologia CRECI, análise comparativa de mercado, sem compromisso." },
    ],
  }),
  component: AvaliarPage,
});

function AvaliarPage() {
  const [sent, setSent] = useState(false);
  return (
    <section className="py-12 md:py-16 bg-[color:var(--garrido-cream)]">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-[1.1fr_1fr] gap-8 items-start">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Proprietários</div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Avaliação profissional. <span className="text-[color:var(--garrido-gold)]">Grátis</span> e sem compromisso.
          </h1>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Nossa metodologia combina Análise Comparativa de Mercado (ACM), inspeção técnica e histórico
            de negócios recentes no bairro. Você recebe um laudo com o valor sugerido para venda e locação.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              { icon: Search, t: "Análise comparativa", d: "Comparamos com imóveis semelhantes vendidos e anunciados." },
              { icon: ClipboardCheck, t: "Vistoria técnica", d: "Avaliamos estado de conservação, reformas e diferenciais." },
              { icon: LineChart, t: "Laudo em até 3 dias", d: "Você recebe o relatório completo com faixa recomendada." },
            ].map((p) => (
              <div key={p.t} className="flex gap-3 items-start bg-white rounded-lg p-4 border border-black/5">
                <p.icon className="h-6 w-6 text-[color:var(--garrido-gold)] shrink-0" aria-hidden />
                <div>
                  <div className="font-semibold text-[color:var(--garrido-ink)]">{p.t}</div>
                  <p className="text-sm text-slate-500">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-black/5">
          {sent ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="font-serif text-xl font-bold mt-4">Solicitação recebida</h2>
              <p className="text-sm text-slate-500 mt-2">Nossa equipe entrará em contato em até 1 dia útil.</p>
            </div>
          ) : (
            <FormAvaliar onSuccess={() => setSent(true)} />
          )}
        </div>
      </div>
    </section>
  );
}

function FormAvaliar({ onSuccess }: { onSuccess: () => void }) {
  const nomeId = useId(), telId = useId(), emailId = useId();
  const tipoId = useId(), enderecoId = useId(), cepId = useId(), objetivoId = useId();
  const areaId = useId(), quartosId = useId(), obsId = useId();
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSuccess(); }} className="space-y-3" aria-label="Solicitar avaliação">
      <h2 className="font-serif text-xl font-bold text-[color:var(--garrido-ink)]">Quero minha avaliação</h2>
      <div>
        <label htmlFor={nomeId} className="text-xs font-semibold block mb-1">Nome</label>
        <input id={nomeId} required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={telId} className="text-xs font-semibold block mb-1">WhatsApp</label>
          <input id={telId} required className="input" placeholder="(21) 99999-9999" />
        </div>
        <div>
          <label htmlFor={emailId} className="text-xs font-semibold block mb-1">E-mail</label>
          <input id={emailId} required type="email" className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={tipoId} className="text-xs font-semibold block mb-1">Tipo</label>
          <select id={tipoId} className="input">
            <option>Apartamento</option><option>Casa</option><option>Cobertura</option>
            <option>Comercial</option><option>Rural</option><option>Terreno</option>
          </select>
        </div>
        <div>
          <label htmlFor={objetivoId} className="text-xs font-semibold block mb-1">Objetivo</label>
          <select id={objetivoId} className="input">
            <option>Vender</option><option>Alugar</option><option>Vender e alugar</option><option>Só saber o valor</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor={enderecoId} className="text-xs font-semibold block mb-1">Endereço</label>
          <input id={enderecoId} required className="input" placeholder="Rua, número, bairro, cidade" />
        </div>
        <div>
          <label htmlFor={cepId} className="text-xs font-semibold block mb-1">CEP</label>
          <input id={cepId} className="input" placeholder="00000-000" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={areaId} className="text-xs font-semibold block mb-1">Área (m²)</label>
          <input id={areaId} inputMode="numeric" className="input" />
        </div>
        <div>
          <label htmlFor={quartosId} className="text-xs font-semibold block mb-1">Quartos</label>
          <input id={quartosId} inputMode="numeric" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor={obsId} className="text-xs font-semibold block mb-1">Observações</label>
        <textarea id={obsId} rows={3} className="input" placeholder="Reformas, andar, vista, garagem..." />
      </div>
      <button type="submit" className="w-full rounded-lg bg-[color:var(--garrido-ink)] text-white font-bold py-2.5">
        Solicitar avaliação grátis
      </button>
      <style>{`.input{width:100%;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:.55rem .7rem;font-size:.875rem;background:#fff;}`}</style>
    </form>
  );
}
