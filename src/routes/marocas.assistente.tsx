import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Building2, MessageCircle, ChevronRight, ArrowLeft, Wrench, ShoppingBag, LifeBuoy, MapPin, Sparkles } from "lucide-react";
import { MarocasHelpFab } from "@/components/marocas/MarocasHelpFab";

const searchSchema = z.object({
  topico: z
    .enum([
      "suporte",
      "emergencia",
      "manutencao",
      "contratacao",
      "dicas",
      "praias",
      "restaurantes",
      "mercados",
      "farmacias",
      "transporte",
      "passeios",
    ])
    .optional(),
});

export const Route = createFileRoute("/marocas/assistente")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Assistente Marocas — Respostas guiadas 24h" },
      { name: "description", content: "Tire dúvidas sobre manutenção, contratação de serviços e dicas do Rio com o Assistente Marocas." },
    ],
  }),
  component: AssistentePage,
});

interface AssistantAnswer {
  text: string;
  cta?: { label: string; href: string; external?: boolean };
}

interface AssistantNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  answer?: AssistantAnswer;
  children?: AssistantNode[];
}

const WHATSAPP_URL = "https://wa.me/5521999999999?text=Ol%C3%A1%20Marocas";

const TREE: AssistantNode[] = [
  {
    id: "manutencao",
    label: "Manutenção",
    icon: <Wrench className="h-4 w-4" />,
    children: [
      {
        id: "vazamento",
        label: "Vazamento de água",
        answer: {
          text: "Feche o registro geral imediatamente. Acione a Marocas pelo WhatsApp informando o apartamento. Nossa equipe disponibiliza encanador parceiro em até 90 minutos na Zona Sul.",
          cta: { label: "Acionar Marocas", href: WHATSAPP_URL, external: true },
        },
      },
      {
        id: "ar-condicionado",
        label: "Ar-condicionado não gela",
        answer: {
          text: "Verifique se o filtro está limpo e se a temperatura está abaixo de 22°C. Persistindo, agendamos higienização ou visita técnica em até 48h pelo plano mensal.",
          cta: { label: "Solicitar visita", href: "/marocas/contratar/mensal" },
        },
      },
      {
        id: "eletrico",
        label: "Falta de energia / quadro disparou",
        answer: {
          text: "Localize o quadro de força e religue os disjuntores. Se persistir, desconecte aparelhos de alta carga (ar, micro-ondas) e religue um por um. Para emergência elétrica, acione plantão 24h.",
          cta: { label: "Plantão 24h", href: WHATSAPP_URL, external: true },
        },
      },
      {
        id: "preventiva",
        label: "Agendar manutenção preventiva",
        answer: {
          text: "Proprietários do Plano Mensal têm preventiva incluída a cada 3 meses. Para Avulso, agendamos sob orçamento.",
          cta: { label: "Ver planos", href: "/marocas/planos" },
        },
      },
    ],
  },
  {
    id: "contratacao",
    label: "Contratação de serviços",
    icon: <ShoppingBag className="h-4 w-4" />,
    children: [
      {
        id: "limpeza-avulsa",
        label: "Contratar limpeza avulsa",
        answer: {
          text: "Limpeza completa por R$ 160,00, com checklist fotográfico. Lavagem de roupa de cama: R$ 29,90 em conjunto ou R$ 49,90 avulso.",
          cta: { label: "Contratar avulso", href: "/marocas/contratar/avulso" },
        },
      },
      {
        id: "gestao",
        label: "Contratar gestão completa do imóvel",
        answer: {
          text: "Plano Mensal inclui limpezas ilimitadas, enxoval, atendimento ao hóspede, portal do proprietário e repasse PIX automático. Valor sob consulta.",
          cta: { label: "Solicitar proposta", href: "/marocas/contratar/mensal" },
        },
      },
      {
        id: "care",
        label: "Adicionar proteção patrimonial",
        answer: {
          text: "Marocas Care+ é add-on do plano mensal com cobertura de danos, reposição expressa e plantão 24h.",
          cta: { label: "Conhecer Care+", href: "/marocas/contratar/care-plus" },
        },
      },
    ],
  },
  {
    id: "emergencia",
    label: "Emergência 24h",
    icon: <LifeBuoy className="h-4 w-4" />,
    children: [
      {
        id: "seguranca",
        label: "Sinto-me inseguro / problema com hóspede",
        answer: {
          text: "Saia para local seguro. Acione a Marocas e a polícia (190) imediatamente. Nossa equipe assume a mediação e contato com a plataforma de hospedagem.",
          cta: { label: "Acionar Marocas", href: WHATSAPP_URL, external: true },
        },
      },
      {
        id: "saude",
        label: "Mal súbito / acidente",
        answer: {
          text: "SAMU 192 · Bombeiros 193. Hospitais próximos: Copa D'Or, Pasteur (Copacabana), Clínica São Vicente (Gávea). A Marocas pode ajudar com tradução e deslocamento.",
        },
      },
      {
        id: "trancado",
        label: "Esqueci as chaves / fechei sem chave",
        answer: {
          text: "Acione a Marocas. Mantemos cópia de chaves dos imóveis do plano mensal; entrega em até 60 min na Zona Sul.",
          cta: { label: "Pedir chave reserva", href: WHATSAPP_URL, external: true },
        },
      },
    ],
  },
  {
    id: "dicas",
    label: "Dicas do Rio",
    icon: <MapPin className="h-4 w-4" />,
    children: [
      {
        id: "praias",
        label: "Praias e horários",
        answer: {
          text: "Copacabana e Ipanema têm posto salva-vidas das 8h às 17h. Arpoador para o pôr do sol. Leblon (posto 12) é mais família. Sempre confira bandeira de balneabilidade.",
        },
      },
      {
        id: "restaurantes",
        label: "Onde comer perto",
        answer: {
          text: "Café: Cafeína (Ipanema), Talho Capixaba (Leblon). Almoço: Galeto Sat's (Copa), Aconchego Carioca (Praça da Bandeira). Jantar: Oro, Lasai, Sushi Leblon.",
        },
      },
      {
        id: "transporte",
        label: "Como me locomover",
        answer: {
          text: "Metrô Linha 1 conecta Ipanema, Copacabana e Centro. Bike Itaú via app. Uber funciona em toda Zona Sul. Evite carro no Centro nos horários de pico.",
        },
      },
      {
        id: "passeios",
        label: "Passeios essenciais",
        answer: {
          text: "Cristo Redentor (compre online), Pão de Açúcar (entardecer é o melhor horário), Jardim Botânico, Parque Lage, Floresta da Tijuca. Reserve 1 dia para o Centro Histórico.",
        },
      },
      {
        id: "mercados",
        label: "Mercados e farmácias",
        answer: {
          text: "Mercados: Hortifruti, Zona Sul, Pão de Açúcar (24h em Copa). Farmácias 24h: Drogaria Pacheco e Drogasil em Copacabana e Ipanema.",
        },
      },
    ],
  },
  {
    id: "suporte",
    label: "Suporte geral",
    icon: <MessageCircle className="h-4 w-4" />,
    children: [
      {
        id: "falar-humano",
        label: "Falar com pessoa do time",
        answer: {
          text: "Atendimento humano via WhatsApp das 7h às 22h. Plantão 24h para emergências.",
          cta: { label: "Abrir WhatsApp", href: WHATSAPP_URL, external: true },
        },
      },
      {
        id: "repasse",
        label: "Dúvida sobre repasse PIX",
        answer: {
          text: "Repasse processado entre os dias 1 e 5 de cada mês. Acompanhe extrato e comprovantes no Portal do Proprietário.",
          cta: { label: "Entrar no portal", href: "/marocas/login" },
        },
      },
    ],
  },
];

function findNode(id: string | undefined, nodes: AssistantNode[] = TREE): AssistantNode | undefined {
  if (!id) return undefined;
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = n.children && findNode(id, n.children);
    if (found) return found;
  }
}

function AssistentePage() {
  const { topico } = Route.useSearch();
  const initialPath = useMemo(() => (topico ? [topico] : []), [topico]);
  const [path, setPath] = useState<string[]>(initialPath);

  const currentList = useMemo(() => {
    let nodes: AssistantNode[] = TREE;
    for (const id of path) {
      const next = nodes.find((n) => n.id === id);
      if (!next || !next.children) return [];
      nodes = next.children;
    }
    return nodes;
  }, [path]);

  const currentNode = path.length ? findNode(path[path.length - 1]) : undefined;
  const showAnswer = currentNode && currentNode.answer && (!currentNode.children || currentNode.children.length === 0);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/marocas" className="flex items-center gap-2 font-bold text-xl">
            <Building2 className="h-6 w-6 text-primary" /> Marocas
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/marocas/planos" className="hover:underline">Planos</Link>
            <Link to="/marocas/login" className="rounded-md border px-3 py-1.5 font-medium">Entrar</Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest">
          <Sparkles className="h-4 w-4" /> Assistente Marocas
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">Como podemos ajudar agora?</h1>
        <p className="text-muted-foreground mt-2">
          Respostas guiadas para manutenção, contratação de serviços, emergências e dicas do Rio.
          Atendimento humano a qualquer momento pelo WhatsApp.
        </p>

        {path.length > 0 && (
          <button
            onClick={() => setPath((p) => p.slice(0, -1))}
            className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
        )}

        <div className="mt-6 rounded-2xl border bg-card p-2">
          {showAnswer ? (
            <div className="p-5">
              <h2 className="font-semibold text-lg">{currentNode!.label}</h2>
              <p className="text-muted-foreground mt-3 whitespace-pre-line">{currentNode!.answer!.text}</p>
              {currentNode!.answer!.cta && (
                currentNode!.answer!.cta.external ? (
                  <a
                    href={currentNode!.answer!.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold"
                  >
                    {currentNode!.answer!.cta.label}
                  </a>
                ) : (
                  <Link
                    to={currentNode!.answer!.cta.href}
                    className="inline-block mt-4 rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold"
                  >
                    {currentNode!.answer!.cta.label}
                  </Link>
                )
              )}
              <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                <button onClick={() => setPath([])} className="text-sm underline">Recomeçar</button>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                  Falar com pessoa do time
                </a>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {currentList.map((node) => (
                <li key={node.id}>
                  <button
                    onClick={() => setPath((p) => [...p, node.id])}
                    className="w-full flex items-center justify-between text-left p-4 hover:bg-muted/50 transition rounded-lg"
                  >
                    <span className="flex items-center gap-3">
                      {node.icon && <span className="text-primary">{node.icon}</span>}
                      <span className="font-medium">{node.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Em emergências com risco imediato, ligue 190 (polícia), 192 (SAMU) ou 193 (bombeiros).
        </p>
      </section>
      <MarocasHelpFab />
    </main>
  );
}
