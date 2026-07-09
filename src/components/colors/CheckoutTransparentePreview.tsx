import { CheckCircle2, CreditCard, Lock, PackageCheck, ShieldCheck, Truck } from "lucide-react";

/**
 * Preview visual da experiência de checkout transparente.
 * 100% UI/mock — nenhuma integração de pagamento real aqui.
 * Serve para transmitir confiança e preparar o cliente para a jornada que vem.
 */
export default function CheckoutTransparentePreview() {
  return (
    <section id="checkout-preview" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_0%,rgba(16,185,129,0.18),transparent_60%)]" />
      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Nova experiência
          </span>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Checkout transparente,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">100% dentro da Colors</span>.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Você cadastra seus dados uma única vez, revisa o pedido e finaliza a compra sem sair da Colors Saúde.
            Segurança, clareza e rastreio do início ao fim.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          {/* Mock do checkout */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/25 via-lime-400/10 to-transparent blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950 via-black to-emerald-950/40 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-white/60">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="ml-3 flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 font-mono">
                  <Lock className="h-3 w-3 text-emerald-400" aria-hidden />
                  colors.impulsionando.com.br/checkout
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
                {/* Resumo do pedido */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">Seu pedido</p>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-lg font-black text-black">SGB</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">Super Green Black</div>
                      <div className="text-xs text-white/60">60 cápsulas · 30 dias</div>
                      <div className="mt-2 text-emerald-300">R$ 197,00</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <Row label="Subtotal" value="R$ 197,00" />
                    <Row label="Frete Colors Log" value="Grátis" positive />
                    <Row label="Desconto" value="- R$ 30,00" positive />
                    <div className="my-2 border-t border-dashed border-white/10" />
                    <Row label="Total" value="R$ 167,00" bold />
                  </div>
                </div>

                {/* Formulário mock */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">Pagamento</p>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    <CreditCard className="h-4 w-4" aria-hidden /> Cartão · Pix · Boleto
                  </div>
                  <MockField label="Número do cartão" placeholder="•••• •••• •••• 4242" />
                  <div className="grid grid-cols-2 gap-3">
                    <MockField label="Validade" placeholder="12/29" />
                    <MockField label="CVV" placeholder="•••" />
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-2 w-full cursor-not-allowed rounded-xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-black text-black opacity-90"
                  >
                    Finalizar compra com segurança
                  </button>
                  <p className="text-center text-[10px] uppercase tracking-widest text-white/40">Prévia visual · integração em breve</p>
                </div>
              </div>
            </div>
          </div>

          {/* Passos */}
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{s.title}</div>
                  <div className="mt-1 text-sm text-white/60">{s.desc}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5 text-sm text-emerald-200">
              <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden />
              Todos os pedidos ficam disponíveis na sua <strong>área do cliente Colors</strong> para acompanhamento e recompra em um clique.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: ShieldCheck, title: "Cadastro único e seguro", desc: "Informe seus dados uma vez e use em todas as compras futuras." },
  { icon: CreditCard, title: "Pagamento transparente", desc: "Cartão, Pix ou boleto direto na Colors, sem ser redirecionado." },
  { icon: Truck, title: "Colors Log rastreia tudo", desc: "Acompanhe cada etapa da entrega no seu painel do cliente." },
  { icon: PackageCheck, title: "Recompra em 1 clique", desc: "Repita seu pedido preferido quando ele estiver acabando." },
] as const;

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-sm font-bold text-white" : "text-sm text-white/60"}>{label}</span>
      <span className={
        (bold ? "text-base font-black text-white " : "text-sm ") +
        (positive ? "text-emerald-300" : "text-white/80")
      }>{value}</span>
    </div>
  );
}

function MockField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white/70">{placeholder}</div>
    </div>
  );
}
