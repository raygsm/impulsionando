import { createFileRoute } from "@tanstack/react-router";
import { Boxes, ClipboardCheck, PackageSearch, ShieldCheck, Workflow } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/operacao")({ component: OperacaoEvr });

const flows = [
  [Workflow,"Jornadas integradas","Lead, consulta, acompanhamento, encaminhamento autorizado, orçamento, pagamento, produção, entrega e recorrência."],
  [ClipboardCheck,"Tarefas operacionais","Pendências, responsáveis, SLAs, exceções e histórico por empresa."],
  [PackageSearch,"Pedidos e produção","Visão operacional da Ative-se com validação, produção, qualidade, retirada e entrega."],
  [Boxes,"Estoque e abastecimento","Compras, fornecedores, inventário, lote, validade, cobertura e reposição."],
  [ShieldCheck,"Controles e auditoria","Permissões, trilhas de auditoria, consentimentos e segregação de contexto."],
] as const;

function OperacaoEvr(){return <main className="min-h-screen bg-[#f6f7f4] px-5 py-14 text-[#17221d]"><section className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#708078]">Grupo EVR · Operação</p><h1 className="mt-3 text-5xl font-semibold tracking-tight">Tudo que precisa acontecer, em uma operação rastreável.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#617067]">A camada operacional conecta tarefas, exceções, SLAs e handoffs entre empresas sem perder a responsabilidade de cada CNPJ e de cada equipe.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{flows.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dbe2dc] bg-white p-6"><Icon className="h-6 w-6 text-[#173e31]"/><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#65736b]">{text}</p></article>)}</div></section></main>}
