import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeDollarSign, FlaskConical, PackageCheck, Pill, ShoppingCart, Warehouse } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/ativese-pharma")({ component: AtivesePharma });

const items = [
  [Pill,"Pedido autorizado","Recebimento do pedido somente após autorização do paciente e validação aplicável."],
  [FlaskConical,"Manipulação e qualidade","Produção, conferência, controle de qualidade e rastreabilidade por lote."],
  [ShoppingCart,"PDV e vendas","Orçamentos, pagamentos, descontos autorizados, caixa, ticket e recorrência."],
  [Warehouse,"Estoque inteligente","Insumos, produtos, lotes, validade, FEFO, inventário, compras, ruptura e perdas."],
  [BadgeDollarSign,"Margem e resultado","CMV, margem bruta, contribuição, giro, cobertura e desempenho por produto."],
  [PackageCheck,"Entrega e pós-venda","Retirada, entrega, status do pedido, SLA, recompra e relacionamento."],
] as const;

function AtivesePharma(){return <main className="min-h-screen bg-[#f7f6f1] text-[#17221d]"><section className="bg-[#1b2a24] px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#d5bc75]">Ative-se Pharma</p><h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-tight">Da prescrição ao cuidado continuado, com operação farmacêutica rastreável.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">A Ative-se transforma pedidos autorizados em uma jornada organizada de validação, orçamento, pagamento, manipulação, qualidade, retirada ou entrega — mantendo a escolha do paciente e a segregação entre contexto clínico e comercial.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/grupo-evr/farmacia" className="rounded-xl bg-[#d5bc75] px-5 py-3 font-semibold text-[#1b2a24]">Abrir operação da farmácia</Link><Link to="/grupo-evr/gestao" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold">Ver indicadores <ArrowRight className="h-4 w-4"/></Link></div></div></section><section className="mx-auto max-w-6xl px-5 py-12"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dedfd9] bg-white p-6"><Icon className="h-6 w-6 text-[#173e31]"/><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#68736d]">{text}</p></article>)}</div></section></main>}
