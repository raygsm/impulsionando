import { ExternalLink, Lock, ShieldCheck, CreditCard, Receipt, Undo2, Headset } from "lucide-react";

/**
 * "Como comprar com segurança" — enquanto o checkout transparente da Colors
 * não está integrado, a finalização acontece em gateway externo homologado
 * (PCI-DSS). Esta seção comunica o fluxo real de forma transparente e
 * mantém o layout preparado para a futura integração invisível (mesma
 * paleta e ritmo do CheckoutTransparentePreview).
 */
export default function ComoComprarSeguranca() {
  return (
    <section id="como-comprar-com-seguranca" aria-labelledby="ccs-title" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_100%,rgba(16,185,129,0.12),transparent_60%)]" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Compra segura
          </span>
          <h2 id="ccs-title" className="mt-4 text-4xl font-bold sm:text-5xl">
            Como comprar com{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              segurança
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Hoje o pagamento acontece em <strong>gateway externo homologado</strong> (padrão PCI-DSS). Você
            escolhe o produto na Colors, é levado a um ambiente 100% seguro para pagar e volta com o pedido
            confirmado. Em breve, tudo isso será feito sem sair daqui — o layout já está preparado.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <span className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                Passo {i + 1}
              </span>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="text-sm font-bold">{s.title}</div>
              <div className="text-sm text-white/60">{s.desc}</div>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <t.icon className="h-4.5 w-4.5" aria-hidden />
              </div>
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="text-xs text-white/60">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/50">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Você será direcionado ao gateway externo apenas para digitar os dados de pagamento. Nenhum dado
          de cartão é armazenado pela Colors.
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Lock, title: "Escolha na Colors", desc: "Selecione o produto e clique em finalizar. Você segue no site oficial da Colors." },
  { icon: ExternalLink, title: "Gateway seguro", desc: "Redirecionamos ao ambiente PCI-DSS do gateway parceiro para pagamento." },
  { icon: CreditCard, title: "Pix, cartão ou boleto", desc: "Escolha a forma de pagamento. Aprovação em segundos no Pix e cartão." },
  { icon: Receipt, title: "Pedido confirmado", desc: "Você recebe confirmação por e-mail/WhatsApp e vê o pedido na sua conta Colors." },
] as const;

const TRUST = [
  { icon: ShieldCheck, title: "Ambiente PCI-DSS", desc: "Gateway auditado — padrão global de segurança de pagamentos." },
  { icon: Undo2, title: "Garantia de 7 dias", desc: "Direito de arrependimento conforme o Código de Defesa do Consumidor." },
  { icon: Headset, title: "Suporte humano", desc: "Atendimento Colors por WhatsApp para dúvidas antes e depois da compra." },
] as const;
