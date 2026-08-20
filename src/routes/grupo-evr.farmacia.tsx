import { createFileRoute } from "@tanstack/react-router";
import { BadgeDollarSign, Boxes, ClipboardCheck, PackageSearch, Pill, ReceiptText, ScanLine, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/farmacia")({ component: FarmaciaEvr });

const cards = [
  [Pill,"Pedidos clínicos autorizados","Recebe pedidos encaminhados pelo paciente, vinculados à prescrição e prontos para validação farmacêutica."],
  [ClipboardCheck,"Validação farmacêutica","Fila de conferência antes de orçamento, produção, dispensação ou entrega."],
  [Boxes,"Estoque e compras","Saldo, giro, ruptura, fornecedores, reposição, lote, validade, reserva e inventário."],
  [ScanLine,"Produção e rastreabilidade","Status por etapa, lote, controle de qualidade, responsável e histórico auditável."],
  [ReceiptText,"PDV e pagamentos","Venda de balcão e fechamento conectado ao financeiro, com Pix, cartão e conciliação conforme integrações habilitadas."],
  [BadgeDollarSign,"Margem e rentabilidade","Receita, CMV, margem por item, ticket, perdas, desconto, conversão de orçamento e recompra."],
];

function FarmaciaEvr(){
 return <main className="min-h-screen bg-[#faf8f3] text-[#24251f]">
  <section className="bg-[#3b3424] px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8caa6]">Ative-se Pharma · Grupo EVR</p><h1 className="mt-3 max-w-4xl text-4xl font-semibold md:text-5xl">Farmácia como comércio, operação e continuidade da jornada.</h1><p className="mt-5 max-w-3xl leading-7 text-white/72">A Ative-se passa a operar com o Core Full: PDV, estoque, compras, pedidos, produção, pagamentos, CRM, BI e rastreabilidade. Quando o paciente autoriza, o pedido clínico chega à farmácia para validação, orçamento e execução.</p></div></section>
  <section className="mx-auto max-w-6xl px-5 py-14"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{cards.map(([Icon,title,text]:any)=><article key={title} className="rounded-3xl border border-[#e7e0d0] bg-white p-7"><Icon className="h-6 w-6 text-[#79622e]"/><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-[#656255]">{text}</p></article>)}</div>
  <div className="mt-10 grid gap-5 lg:grid-cols-2"><section className="rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-2xl font-semibold">Fluxo clínica → farmácia</h2><ol className="mt-6 space-y-4 text-sm text-[#5f6259]"><li>1. Profissional emite pedido/prescrição no contexto clínico.</li><li>2. Paciente recebe o documento e escolhe se quer encaminhar à Ative-se.</li><li>3. Farmácia recebe apenas o necessário para executar o atendimento autorizado.</li><li>4. Farmacêutico valida, orça e solicita aprovação do paciente.</li><li>5. Após aprovação/pagamento: produção ou separação, qualidade, dispensação/entrega.</li><li>6. CRM registra relacionamento farmacêutico sem abrir o prontuário clínico para o varejo.</li></ol></section>
  <section className="rounded-3xl bg-[#12231d] p-7 text-white"><ShieldCheck className="h-7 w-7 text-[#d5bc75]"/><h2 className="mt-6 text-2xl font-semibold">Segregação inteligente</h2><p className="mt-4 leading-7 text-white/70">O paciente pode existir nos dois contextos sem transformar o balcão da farmácia em usuário do prontuário. Dados clínicos sensíveis ficam limitados à finalidade assistencial; a farmácia recebe o que precisa para validar e cumprir o pedido.</p></section></div></section>
 </main>
}
