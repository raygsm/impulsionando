import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MessageCircle, ChevronRight, ArrowLeft, Truck, CalendarDays, Store, HelpCircle, ClipboardList } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";

const searchSchema = z.object({
  topico: z.enum(["pedidos", "delivery", "reservas", "pagamento", "cardapio", "operador"]).optional(),
});

export const Route = createFileRoute("/marocas/assistente")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Assistente Marocas — Respostas guiadas 24h" },
      { name: "description", content: "Assistente Marocas para pedidos, delivery, reservas, pagamento e dúvidas de operadores." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistentePage,
});

interface Node {
  id: string;
  label: string;
  icon?: React.ReactNode;
  answer?: { text: string; cta?: { label: string; href: string } };
  children?: Node[];
}

const WHATSAPP_SAC = "https://wa.me/5521999999999?text=Ol%C3%A1%20Marocas%2C%20SAC";

const TREE: Node[] = [
  {
    id: "pedidos",
    label: "Meus pedidos",
    icon: <ClipboardList className="h-4 w-4" />,
    children: [
      { id: "rastrear", label: "Rastrear pedido", answer: { text: "Use o código MRC enviado no WhatsApp e acompanhe em tempo real (recebido → preparando → saiu → entregue).", cta: { label: "Rastrear", href: "/marocas/pedidos" } } },
      { id: "atraso", label: "Meu pedido está atrasado", answer: { text: "Se passou o tempo estimado + 15 min, aciona o SAC no WhatsApp com o código do pedido. Resolvemos ou reenviamos.", cta: { label: "Abrir SAC", href: WHATSAPP_SAC } } },
      { id: "erro", label: "Veio errado ou faltou item", answer: { text: "Registramos o incidente e reenviamos o item ou estornamos. Prazo médio: 24h.", cta: { label: "Registrar SAC", href: WHATSAPP_SAC } } },
    ],
  },
  {
    id: "delivery",
    label: "Delivery e retirada",
    icon: <Truck className="h-4 w-4" />,
    children: [
      { id: "area", label: "Vocês entregam no meu bairro?", answer: { text: "Delivery próprio para bairros da Zona Sul. No checkout, ao informar o CEP, você vê taxa e tempo estimados." } },
      { id: "tempo", label: "Qual o tempo médio?", answer: { text: "35 a 45 min para delivery. 15 min para retirada — avisamos no WhatsApp quando estiver na bandeja." } },
      { id: "taxa", label: "Como funciona a taxa?", answer: { text: "Taxa fixa por bairro, sem surge. Aparece no checkout antes de finalizar." } },
    ],
  },
  {
    id: "reservas",
    label: "Reservas",
    icon: <CalendarDays className="h-4 w-4" />,
    children: [
      { id: "nova", label: "Como reservar", answer: { text: "Escolha data, horário e nº de pessoas. Confirmação chega em minutos pelo WhatsApp.", cta: { label: "Reservar", href: "/marocas/reservas" } } },
      { id: "remarcar", label: "Remarcar ou cancelar", answer: { text: "Sem taxa, até 2h antes. Use o link na mensagem de confirmação." } },
    ],
  },
  {
    id: "pagamento",
    label: "Pagamento",
    icon: <Store className="h-4 w-4" />,
    children: [
      { id: "formas", label: "Formas aceitas", answer: { text: "PIX (aprovação em segundos), cartão de crédito/débito e presencial (retirada/entrega)." } },
      { id: "recibo", label: "Preciso de nota fiscal", answer: { text: "Solicite pelo SAC com o código do pedido. Emitimos em até 2 dias úteis.", cta: { label: "Solicitar", href: WHATSAPP_SAC } } },
    ],
  },
  {
    id: "cardapio",
    label: "Cardápio",
    icon: <HelpCircle className="h-4 w-4" />,
    children: [
      { id: "vegetariano", label: "Opções vegetarianas/veganas", answer: { text: "Filtre no cardápio pelas tags 'vegetariano' e 'vegano'.", cta: { label: "Ver cardápio", href: "/marocas/cardapio" } } },
      { id: "esgotado", label: "Prato aparece como esgotado", answer: { text: "Nosso cardápio é inteligente: itens somem quando esgotam e voltam sozinhos ao repor estoque." } },
    ],
  },
  {
    id: "operador",
    label: "Sou operador (bar, restaurante, delivery)",
    icon: <Store className="h-4 w-4" />,
    children: [
      { id: "planos", label: "Conhecer os planos", answer: { text: "Balcão para cardápio digital, Salão para operação completa, Rede para franquias e dark kitchens.", cta: { label: "Ver planos", href: "/marocas/planos" } } },
      { id: "pulseira", label: "Comandas por pulseira", answer: { text: "Módulo previsto no plano Salão. Você já cadastra hoje e ativa quando o hardware chegar — sem retrabalho." } },
    ],
  },
];

function AssistentePage() {
  const { topico } = Route.useSearch();
  const [openId, setOpenId] = useState<string | null>(topico ?? null);
  const [answerId, setAnswerId] = useState<string | null>(null);

  const open = useMemo(() => TREE.find((t) => t.id === openId) ?? null, [openId]);
  const answer = useMemo(() => open?.children?.find((c) => c.id === answerId)?.answer ?? null, [open, answerId]);

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Assistente" }]}>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold">Assistente Marocas</h1>
        <p className="text-muted-foreground mt-2">Escolha um tópico. WhatsApp entra apenas quando precisar falar com pessoa.</p>

        {!open && (
          <ul className="mt-8 grid sm:grid-cols-2 gap-3">
            {TREE.map((n) => (
              <li key={n.id}>
                <button onClick={() => { setOpenId(n.id); setAnswerId(null); }} className="w-full text-left rounded-2xl border p-4 hover:border-primary hover:bg-primary/5 transition flex items-center gap-3">
                  <div className="rounded-md p-2 bg-primary/10 text-primary">{n.icon}</div>
                  <div className="flex-1 font-semibold">{n.label}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && (
          <div className="mt-8 rounded-2xl border p-5">
            <button onClick={() => { setOpenId(null); setAnswerId(null); }} className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
              <ArrowLeft className="h-3.5 w-3.5" /> Tópicos
            </button>
            <h2 className="text-xl font-bold mt-2">{open.label}</h2>
            <ul className="mt-4 divide-y">
              {open.children?.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setAnswerId((prev) => (prev === c.id ? null : c.id))} aria-expanded={answerId === c.id}
                    className="w-full text-left py-3 flex items-center justify-between gap-3 hover:text-primary">
                    <span className="font-medium">{c.label}</span>
                    <ChevronRight className={`h-4 w-4 transition ${answerId === c.id ? "rotate-90" : ""}`} />
                  </button>
                  {answerId === c.id && c.answer && (
                    <div className="pb-4 pl-1 text-sm text-muted-foreground">
                      <p>{c.answer.text}</p>
                      {c.answer.cta && (
                        <Link to={c.answer.cta.href as any} className="inline-flex items-center gap-1 mt-3 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold">
                          {c.answer.cta.label}
                        </Link>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 rounded-xl border-dashed border p-4 text-sm text-muted-foreground flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
          <span>Precisa falar com pessoa? Use o SAC no botão de ajuda ou pelo WhatsApp — somente pós-venda em horário comercial.</span>
        </div>
      </div>
    </MarocasShell>
  );
}
