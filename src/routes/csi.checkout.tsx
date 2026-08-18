import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Landmark, LockKeyhole, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/csi/checkout")({ component: CsiCheckout });

const steps = [
  ["01", "Identificação", "Confirmação de identidade e dados cadastrais."],
  ["02", "Objetivos", "Valor pretendido, horizonte e necessidade de liquidez."],
  ["03", "Suitability", "Compatibilidade entre perfil, conhecimento e produto."],
  ["04", "Revisão", "Riscos, custos, documentos e consentimentos."],
  ["05", "Parceiro regulado", "Envio seguro para execução somente após integração homologada."],
];

function CsiCheckout() {
  return <main className="min-h-screen bg-[#07111b] text-white">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div><p className="text-xs uppercase tracking-[.18em] text-amber-300">CSI Invest</p><p className="font-semibold">Jornada de investimento</p></div><Link to="/csi/portal" className="inline-flex items-center gap-2 text-sm text-slate-300"><ArrowLeft className="h-4 w-4"/> Área do investidor</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7"><div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-200"><ShieldCheck className="h-3.5 w-3.5"/> Fluxo preparado para integração</div><h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Transparência antes de investir.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">A CSI prepara e qualifica sua intenção. A execução financeira acontece somente pelo parceiro regulado e homologado. Enquanto a API não estiver ativa, nenhuma ordem, débito ou aplicação é realizada.</p>
          <div className="mt-9 space-y-3">{steps.map(([n,t,d])=><div key={n} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950">{n}</span><div><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-slate-400">{d}</p></div></div>)}</div>
        </div>
        <aside className="lg:col-span-5"><div className="sticky top-6 rounded-[28px] border border-white/10 bg-[#0b1824] p-6"><div className="flex items-center gap-3"><Landmark className="h-6 w-6 text-amber-300"/><div><p className="text-xs uppercase tracking-[.15em] text-slate-500">Integração financeira</p><h2 className="font-semibold">Aguardando credenciais homologadas</h2></div></div><div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><div className="flex items-center gap-2 text-sm text-slate-300"><LockKeyhole className="h-4 w-4 text-amber-300"/> Nenhuma cobrança será feita agora.</div><p className="mt-3 text-xs leading-relaxed text-slate-500">Quando as APIs forem configuradas, esta etapa passará a gerar o handoff seguro, referência externa e retorno de status do parceiro, preservando a trilha de auditoria.</p></div><button disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-slate-700 px-5 py-3 font-semibold text-slate-400">Continuar após homologação <ArrowRight className="h-4 w-4"/></button><div className="mt-5 flex gap-3 text-xs leading-relaxed text-slate-500"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300"/> Estrutura de consentimento, suitability, intenção e partner handoff preparada.</div></div></aside>
      </div>
    </section>
  </main>;
}
