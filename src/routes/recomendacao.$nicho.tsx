import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Crown, Sparkles, Zap, BookOpen, Layers, Building2, Network } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/recomendacao/$nicho")({
  head: ({ params }) => {
    const r = RECOMENDACOES[params.nicho];
    const title = r ? `${r.nicheLabel} — Recomendação Impulsionando` : "Recomendação por nicho";
    return {
      meta: [
        { title },
        { name: "description", content: r?.lead ?? "Recomendação inteligente de plano e módulos por nicho." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!RECOMENDACOES[params.nicho]) throw notFound();
    return { nicho: params.nicho };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="text-lg font-semibold mb-2">Nicho não encontrado</p>
        <Button asChild><Link to="/escolher-nicho">Escolher nicho</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="text-destructive mb-3">{String((error as Error)?.message ?? error)}</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  ),
  component: RecomendacaoPage,
});

type RecPlan = {
  level: "essencial" | "ideal" | "full";
  modules: string[];
  why: string;
};

type Recomendacao = {
  nicheLabel: string;
  headline: string;
  lead: string;
  ganhos: string[];
  plans: RecPlan[];
  combo: { title: string; text: string };
  /**
   * Oferta vertical opcional: bloco destacado para um perfil específico
   * dentro do nicho (ex.: universidade com muitos polos → White Label).
   * Renderiza após o grid de planos com CTA direto para contratação.
   */
  verticalOffer?: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    cta: { label: string; to: string; search?: Record<string, string> };
    secondaryCta?: { label: string; to: string };
  };
};

const RECOMENDACOES: Record<string, Recomendacao> = {
  "bares-restaurantes": {
    nicheLabel: "Bar ou Restaurante",
    headline: "Para bares e restaurantes, o essencial é transformar atendimento em relacionamento",
    lead:
      "No salão, o garçom continua atendendo normalmente. O sistema entra para organizar cardápio digital, QR Code, identificação do cliente, comanda, vouchers, eventos, fidelidade e relacionamento depois da visita. O objetivo não é mandar WhatsApp avisando prato pronto — o objetivo é fazer o cliente voltar.",
    ganhos: [
      "Cliente identificado no momento em que abre o QR Code",
      "Cardápio sempre atualizado, sem reimpressão",
      "Comanda digital integrada à operação do salão",
      "Pesquisa, voucher e campanhas pós-visita",
      "Histórico de consumo para recorrência e fidelidade",
    ],
    plans: [
      {
        level: "essencial",
        modules: ["Cardápio Digital", "QR Code / Comanda", "Comunicação pós-visita"],
        why: "Com isso você já identifica o cliente, mostra o cardápio, inicia a jornada e pode enviar pesquisa, voucher e campanhas futuras.",
      },
      {
        level: "ideal",
        modules: ["Cardápio Digital", "QR Code / Comanda", "CRM", "Comunicação", "Fidelidade", "Dashboards"],
        why: "O Ideal permite transformar consumo em histórico, cliente em recorrência e visita em relacionamento.",
      },
      {
        level: "full",
        modules: ["PDV", "Eventos", "Ingressos", "Reservas", "BI avançado", "Integrações"],
        why: "Indicado para casas com eventos, volume alto, reservas, múltiplas áreas ou necessidade de BI executivo.",
      },
    ],
    combo: {
      title: "Por que Cardápio + QR Code + CRM + Comunicação funcionam juntos",
      text: "Quando o cliente acessa o QR Code, você identifica quem está na mesa. Quando fecha a conta, pode enviar pesquisa. Depois, pode enviar voucher, evento ou promoção. Isso transforma uma visita em relacionamento.",
    },
  },
  "clinicas": {
    nicheLabel: "Clínica ou Consultório",
    headline: "Para clínicas, organizar a agenda é o começo — o ganho real está na recorrência do paciente",
    lead:
      "Agenda online, confirmação automática, portal do paciente, pagamento antecipado e relacionamento pós-consulta. Menos no-show, mais retorno e dashboard claro de produtividade por profissional.",
    ganhos: [
      "Agenda sempre cheia, com confirmação automática",
      "Redução de faltas com lembretes e pré-pagamento",
      "Portal do paciente com histórico e remarcação",
      "Visão clara de produtividade por profissional",
    ],
    plans: [
      { level: "essencial", modules: ["Agenda", "Profissionais", "Comunicação por e-mail"],
        why: "Organiza horários, profissionais e confirmações básicas." },
      { level: "ideal", modules: ["Agenda", "Portal do Paciente", "Pagamentos", "Comunicação", "Dashboard"],
        why: "Reduz faltas, melhora remarcações, centraliza pacientes e permite acompanhar produtividade." },
      { level: "full", modules: ["Múltiplas unidades", "BI avançado", "Integrações", "WhatsApp", "Automação avançada"],
        why: "Para clínicas com várias unidades, BI executivo e automação de jornadas completas." },
    ],
    combo: {
      title: "Por que Agenda + Portal + Comunicação + Dashboard combinam",
      text: "Agenda organiza o atendimento. Portal do Paciente centraliza dados. Comunicação reduz faltas. Dashboard mostra produtividade.",
    },
  },
  "psicologia": {
    nicheLabel: "Psicologia e Terapias",
    headline: "Para psicologia e terapias, sigilo + recorrência são o coração da operação",
    lead:
      "Agenda, prontuário sigiloso, sessões recorrentes, pagamento antecipado e relacionamento ético. Sem ruído operacional, sem furo de horário.",
    ganhos: [
      "Sessões recorrentes com pagamento automático",
      "Prontuário sigiloso com auditoria LGPD",
      "Lembretes humanos, sem invasão",
      "Visão por terapeuta e por tipo de terapia",
    ],
    plans: [
      { level: "essencial", modules: ["Agenda", "Prontuário", "Pagamento"], why: "Tudo o que um consultório solo precisa." },
      { level: "ideal", modules: ["Agenda", "Prontuário", "Portal do Paciente", "Pagamento recorrente", "Comunicação"], why: "Recorrência e relacionamento sem perder o tom clínico." },
      { level: "full", modules: ["Múltiplos terapeutas", "Supervisão", "BI", "Integrações"], why: "Clínicas com várias salas, equipes e supervisão." },
    ],
    combo: {
      title: "Agenda + Prontuário + Pagamento recorrente",
      text: "O paciente entra, marca, paga e volta. Você só precisa atender — o sistema cuida do resto.",
    },
  },
  "imobiliaria": {
    nicheLabel: "Imobiliária",
    headline: "Para imobiliárias, o segredo é não perder o lead entre o primeiro contato e a chave",
    lead:
      "CRM imobiliário, vitrine integrada, visitas, propostas, contratos e portal do cliente em uma jornada única — do anúncio à entrega da chave.",
    ganhos: [
      "Lead atribuído ao corretor certo, no tempo certo",
      "Visitas, propostas e contratos em um só funil",
      "Visão de conversão por corretor, canal e imóvel",
      "Portal do cliente para acompanhar a negociação",
    ],
    plans: [
      { level: "essencial", modules: ["CRM Imobiliário", "Imóveis", "Visitas"], why: "Organiza leads, imóveis e visitas." },
      { level: "ideal", modules: ["CRM Imobiliário", "Imóveis", "Visitas", "Propostas", "Comunicação", "Dashboards"], why: "Permite acompanhar o funil completo, melhorar follow-up e controlar conversão por corretor." },
      { level: "full", modules: ["Site imobiliário", "Portais", "Locação", "Proprietário", "Inquilino", "BI executivo", "Integrações"], why: "Operações com locação, portais externos e múltiplas franquias." },
    ],
    combo: {
      title: "CRM + Imóveis + Visitas + Comunicação + BI",
      text: "CRM acompanha o lead. Imóveis alimentam a busca. Visitas geram histórico. Comunicação mantém o cliente ativo. BI mostra onde a venda trava.",
    },
  },
  "contabilidade": {
    nicheLabel: "Contabilidade",
    headline: "Para contabilidade, portal + obrigações + comunicação reduzem 70% das mensagens repetitivas",
    lead:
      "Portal do cliente, calendário de obrigações, documentos centralizados, financeiro e dashboards — para o escritório atender mais clientes sem aumentar a equipe.",
    ganhos: [
      "Documentos chegam no portal, não no WhatsApp pessoal",
      "Obrigações com alerta automático para cliente e equipe",
      "Financeiro do cliente integrado",
      "Visão de produtividade por departamento",
    ],
    plans: [
      { level: "essencial", modules: ["Clientes", "Documentos", "Comunicação"], why: "Cadastros, recebimento de documentos e canal único." },
      { level: "ideal", modules: ["Portal do Cliente", "Obrigações", "Documentos", "Comunicação", "Financeiro", "Dashboards"], why: "Reduz pressão da equipe e profissionaliza o relacionamento." },
      { level: "full", modules: ["Folha dentro do ERP", "Fiscal", "BI", "Automações", "Integrações"], why: "Escritórios com muitos clientes, folhas e departamentos." },
    ],
    combo: {
      title: "Portal + Obrigações + Comunicação",
      text: "O cliente sabe o que precisa entregar, quando precisa entregar e onde entregar. A equipe trabalha o que importa.",
    },
  },
  "juridico": {
    nicheLabel: "Escritório Jurídico",
    headline: "Para escritórios, CRM jurídico + portal do cliente é o que separa banca de operação profissional",
    lead:
      "CRM jurídico, processos, prazos, portal do cliente, comunicação ética e financeiro. Tudo em um só ambiente seguro.",
    ganhos: [
      "Clientes acompanham o andamento sem ligar",
      "Prazos com alerta automático",
      "Histórico completo por processo e cliente",
      "Financeiro de honorários integrado",
    ],
    plans: [
      { level: "essencial", modules: ["CRM Jurídico", "Clientes", "Documentos"], why: "Fundação organizada para a banca." },
      { level: "ideal", modules: ["CRM Jurídico", "Processos", "Portal do Cliente", "Comunicação", "Financeiro", "Dashboards"], why: "Operação profissional com transparência para o cliente." },
      { level: "full", modules: ["Monitoramento processual", "Integrações jurídicas", "Automações", "BI", "Múltiplos advogados/equipes"], why: "Escritórios maiores com várias equipes e integrações com tribunais." },
    ],
    combo: {
      title: "CRM + Processos + Portal + Financeiro",
      text: "O cliente acompanha. A equipe foca no jurídico. O sócio enxerga o resultado em tempo real.",
    },
  },
  "microcervejarias": {
    nicheLabel: "Cervejaria",
    headline: "Para cervejarias, vender direto e ativar marca é o que sustenta a margem",
    lead:
      "Marketplace B2B, PDV, eventos, ações de marca e relacionamento com bares parceiros — tudo numa só plataforma.",
    ganhos: [
      "Pedidos B2B com taxa transparente",
      "Eventos e ativações com gestão integrada",
      "Bares parceiros ativos e fiéis",
      "Marca conectada ao consumidor final",
    ],
    plans: [
      { level: "essencial", modules: ["Catálogo", "PDV"], why: "Vender com profissionalismo desde o dia 1." },
      { level: "ideal", modules: ["Marketplace B2B", "PDV", "CRM de Bares", "Comunicação"], why: "Recorrência de pedidos e ativação de marca." },
      { level: "full", modules: ["Eventos", "BI", "Integrações fiscais", "Automação"], why: "Cervejarias com volume, eventos e múltiplos canais." },
    ],
    combo: {
      title: "Marketplace + PDV + CRM de Bares",
      text: "O bar pede no marketplace, recebe rápido, fideliza. Você vende mais sem aumentar a equipe comercial.",
    },
  },
  "eventos": {
    nicheLabel: "Eventos",
    headline: "Para eventos, vender ingresso é só o começo — o lucro está no pós-evento",
    lead:
      "Ingressos, listas, check-in, relacionamento com público e dashboards. Transforme cada evento em um asset de recorrência.",
    ganhos: ["Check-in rápido sem fila", "Listas e cortesias controladas", "Pesquisa e relacionamento pós-evento", "BI por evento e por canal de venda"],
    plans: [
      { level: "essencial", modules: ["Ingressos", "Check-in"], why: "Operação básica sem dor de cabeça." },
      { level: "ideal", modules: ["Ingressos", "Check-in", "CRM", "Comunicação", "Dashboards"], why: "Recorrência de público e visão clara de cada evento." },
      { level: "full", modules: ["Multi-eventos", "BI executivo", "Integrações", "Patrocínios"], why: "Produtoras com calendário denso e patrocinadores." },
    ],
    combo: { title: "Ingressos + CRM + Comunicação", text: "Quem compra hoje volta no próximo — se você falar com a pessoa certa, no tempo certo." },
  },
  "veiculos": {
    nicheLabel: "Revenda de Veículos",
    headline: "Para revenda, lead + estoque + proposta no mesmo lugar fecha mais negócio",
    lead: "Estoque integrado, leads qualificados, propostas e financiamento — sem planilha, sem perda.",
    ganhos: ["Estoque sempre atualizado", "Lead atribuído ao vendedor certo", "Propostas e financiamento integrados", "Visão de conversão por veículo e canal"],
    plans: [
      { level: "essencial", modules: ["Estoque", "CRM"], why: "O básico para profissionalizar." },
      { level: "ideal", modules: ["Estoque", "CRM", "Propostas", "Comunicação", "Dashboards"], why: "Funil completo com follow-up automático." },
      { level: "full", modules: ["Multi-loja", "BI", "Integrações financiamento", "Portais"], why: "Grupos com várias lojas e integrações." },
    ],
    combo: { title: "Estoque + CRM + Propostas", text: "O cliente vê o carro, você manda a proposta na hora, fecha sem perder tempo." },
  },
  "servicos": {
    nicheLabel: "Serviços",
    headline: "Para serviços, agenda + propostas + cobrança = previsibilidade",
    lead: "Agenda, propostas, contratos, cobrança recorrente e relacionamento — operação enxuta e profissional.",
    ganhos: ["Agenda sem furo", "Propostas e contratos digitais", "Cobrança recorrente automática", "Cliente fidelizado"],
    plans: [
      { level: "essencial", modules: ["Agenda", "Clientes"], why: "Comece organizando o básico." },
      { level: "ideal", modules: ["Agenda", "Propostas", "Contratos", "Cobrança", "Comunicação"], why: "Fluxo profissional de ponta a ponta." },
      { level: "full", modules: ["Multi-equipe", "BI", "Integrações", "Automação"], why: "Operações grandes com várias frentes." },
    ],
    combo: { title: "Agenda + Cobrança + Comunicação", text: "Cliente marca, paga, recebe. Você cuida do serviço." },
  },
  "ecommerce": {
    nicheLabel: "E-commerce",
    headline: "Para e-commerce, o pós-venda é onde a marca vira recorrência",
    lead: "Catálogo, pedidos, estoque, CRM e automação pós-venda. Sem trocar de ferramenta a cada etapa.",
    ganhos: ["Catálogo e estoque sincronizados", "CRM com histórico de compra", "Pós-venda automatizado", "Visão de cohort e recompra"],
    plans: [
      { level: "essencial", modules: ["Catálogo", "Pedidos"], why: "Vender com profissionalismo." },
      { level: "ideal", modules: ["Catálogo", "Pedidos", "Estoque", "CRM", "Comunicação"], why: "Recorrência e relacionamento de marca." },
      { level: "full", modules: ["Multi-canal", "BI", "Integrações marketplaces", "Automação"], why: "Operações multi-canal com grande volume." },
    ],
    combo: { title: "Catálogo + CRM + Comunicação", text: "Quem comprou volta — se a comunicação for boa." },
  },
  "white-label": {
    nicheLabel: "White Label",
    headline: "Para parceiros White Label, plataforma com sua marca é o seu novo produto",
    lead: "Plataforma completa com sua marca, gestão de revenda, múltiplos clientes e split de pagamento.",
    ganhos: ["Sua marca, sua identidade", "Gestão de revendedores", "Split de pagamento automático", "Múltiplos clientes no mesmo ambiente"],
    plans: [
      { level: "essencial", modules: ["Plataforma com marca", "1 unidade"], why: "Comece a vender com sua identidade." },
      { level: "ideal", modules: ["Plataforma com marca", "Marketplace B2B", "Múltiplas unidades", "Suporte"], why: "Escala de operação com várias frentes." },
      { level: "full", modules: ["Marca própria completa", "Gestão de revendedores", "Split de pagamento", "Integrações"], why: "Modelo de revenda completo." },
    ],
    combo: { title: "Marca + Revenda + Split", text: "Sua marca na frente, nossa tecnologia atrás, o split na conta certa." },
  },
  "saude": {
    nicheLabel: "Saúde",
    headline: "Para clínicas, terapias e cuidado, agenda + prontuário + relacionamento são o coração da operação",
    lead:
      "Fisioterapia, nutrição, odontologia, terapias integrativas e demais áreas de saúde. Agenda, prontuário, retorno automático, financeiro e portal do paciente em uma única plataforma — sem ferramentas soltas.",
    ganhos: [
      "Agenda multiprofissional sem furos nem sobreposição",
      "Prontuário digital com histórico completo do paciente",
      "Confirmação e retorno automáticos via WhatsApp",
      "Portal do paciente com receitas, atestados e exames",
      "Financeiro integrado a convênios e particulares",
    ],
    plans: [
      { level: "essencial", modules: ["Agenda", "Cadastro de pacientes"], why: "O básico para profissionalizar a operação e parar de perder paciente por desorganização." },
      { level: "ideal", modules: ["Agenda", "Prontuário", "Portal do paciente", "Comunicação", "Financeiro"], why: "Operação completa de cuidado — do agendamento ao financeiro, com relacionamento contínuo." },
      { level: "full", modules: ["Multi-unidades", "Convênios", "Teleconsulta", "Indicadores clínicos", "BI"], why: "Para clínicas com várias unidades, convênios e necessidade de indicadores clínicos." },
    ],
    combo: { title: "Agenda + Prontuário + Portal do paciente", text: "O paciente marca, é lembrado, comparece, registra a evolução, recebe o documento. Tudo conectado." },
  },
  "fitness": {
    nicheLabel: "Fitness e Performance",
    headline: "Para academias, boxes e estúdios, retenção é tudo — e retenção mora no relacionamento",
    lead:
      "Academias, CrossFit, funcional, personal trainers, pilates e yoga. Matrícula, agenda de aulas e personal, cobrança recorrente, frequência e relacionamento — para reduzir churn e aumentar LTV.",
    ganhos: [
      "Matrícula 100% digital com contrato assinado",
      "Agenda de aulas, turmas e personal em um só calendário",
      "Cobrança recorrente automática (Pix, cartão, boleto)",
      "Acompanhamento de frequência e alerta de evasão",
      "Comunicação automática para retenção e winback",
    ],
    plans: [
      { level: "essencial", modules: ["Matrícula digital", "Cobrança recorrente"], why: "Comece profissionalizando a entrada e a cobrança do aluno." },
      { level: "ideal", modules: ["Matrícula", "Agenda de aulas", "Frequência", "Comunicação", "Financeiro"], why: "Operação completa de retenção — do primeiro check-in à régua de winback." },
      { level: "full", modules: ["Multi-unidades", "App do aluno", "BI de retenção", "Integrações wearables"], why: "Para redes com várias unidades, app próprio e indicadores de performance." },
    ],
    combo: { title: "Matrícula + Frequência + Comunicação", text: "Aluno entra fácil, é acompanhado, e quando some, recebe contato no tempo certo — antes do churn." },
  },
  "fornecedores": {
    nicheLabel: "Fornecedores e Indústria",
    headline: "Para fornecedores B2B, catálogo digital + pedido + relacionamento com revenda é o que escala",
    lead:
      "Distribuidoras, vinícolas, destilarias, torrefações e indústrias. Catálogo B2B com tabelas por cliente, pedidos pelos próprios revendedores, comissões de representantes e relacionamento contínuo com o ponto de venda.",
    ganhos: [
      "Catálogo B2B com tabelas e condições por cliente",
      "Pedido digital direto pelo revendedor (sem ligação)",
      "Comissão automática de representantes",
      "Histórico de compra e sell-out por revenda",
      "Campanhas e blasts segmentados por canal",
    ],
    plans: [
      { level: "essencial", modules: ["Catálogo B2B", "Pedidos"], why: "Tire o pedido do WhatsApp e do papel e tenha histórico de verdade." },
      { level: "ideal", modules: ["Catálogo B2B", "Pedidos", "Comissões", "CRM de revenda", "Comunicação"], why: "Operação completa de relacionamento com revenda, com comissão e CRM integrados." },
      { level: "full", modules: ["Sell-out", "Campanhas", "BI de canal", "Integrações ERP"], why: "Para indústrias que precisam de sell-out, BI de canal e integração com ERP corporativo." },
    ],
    combo: { title: "Catálogo + Pedido + CRM de revenda", text: "O revendedor compra sozinho, você acompanha o sell-out e ativa campanha onde precisa." },
  },
  "educacao": {
    nicheLabel: "Educação",
    headline: "Para escolas e cursos, matrícula + portal do aluno + financeiro tiram a operação da planilha",
    lead:
      "Escolas, cursos livres, idiomas, faculdades e educação corporativa. Matrícula digital, portal do aluno, financeiro, polos e relacionamento — sem trocar de sistema a cada turma nova.",
    ganhos: [
      "Matrícula digital com contrato e cobrança",
      "Portal do aluno com notas, frequência e documentos",
      "Financeiro com mensalidades e inadimplência sob controle",
      "Gestão de polos, turmas e professores",
      "Comunicação automática com aluno e responsável",
    ],
    plans: [
      { level: "essencial", modules: ["Matrícula digital", "Cobrança"], why: "Resolva matrícula e mensalidade antes de pensar em qualquer outra coisa." },
      { level: "ideal", modules: ["Matrícula", "Portal do aluno", "Financeiro", "Comunicação", "Turmas"], why: "Operação completa do ciclo do aluno — entrada, jornada e cobrança." },
      { level: "full", modules: ["Multi-polos", "BI acadêmico", "EAD", "Integrações MEC/sistemas oficiais"], why: "Para grupos com vários polos, EAD próprio e integrações oficiais." },
    ],
    combo: { title: "Matrícula + Portal do aluno + Financeiro", text: "Aluno entra, acompanha o curso pelo portal, paga em dia. Secretaria sai da planilha." },
    verticalOffer: {
      eyebrow: "Universidade com muitos polos?",
      title: "White Label Acadêmico — sua marca, sua plataforma, todos os polos sob controle",
      description:
        "Reitoria centraliza políticas, matrícula, financeiro e BI; cada polo opera com a sua identidade, autonomia local e relatórios próprios. Tudo em uma instância White Label da Impulsionando, com sua marca, seu domínio e seu app.",
      bullets: [
        "Marca, domínio e app próprios — reitoria + cada polo com identidade local",
        "Multi-polos com permissões por unidade, curso e coordenação",
        "BI consolidado da reitoria com drill-down por polo, curso e turma",
        "Matrícula, financeiro, EAD e portal do aluno padronizados em todos os polos",
        "Onboarding assistido + migração de bases e contratos existentes",
      ],
      cta: {
        label: "Contratar White Label Acadêmico",
        to: "/orcamento",
        search: { segmento: "white-label-educacao", origem: "recomendacao-educacao" },
      },
      secondaryCta: { label: "Ver como funciona o White Label", to: "/nichos/white-label" },
    },
  },
};

const PLAN_META = {
  essencial: { label: "Essencial", subtitle: "Para começar com o que realmente importa.", icon: Sparkles, color: "from-blue-500 to-blue-700" },
  ideal:     { label: "Ideal",     subtitle: "Recomendado — transformar operação em relacionamento e gestão.", icon: Zap, color: "from-primary to-primary-glow" },
  full:      { label: "Full",      subtitle: "Para operações completas, multiunidades, BI avançado e automações robustas.", icon: Crown, color: "from-indigo-700 to-blue-900" },
} as const;

function RecomendacaoPage() {
  const { nicho } = Route.useLoaderData();
  const r = RECOMENDACOES[nicho]!;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Passo 2 de 3 — Recomendação para {r.nicheLabel}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-4xl leading-tight">
            {r.headline}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl leading-relaxed">
            {r.lead}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
        {/* O que você ganha */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">O que a sua operação ganha</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.ganhos.map((g) => (
              <div key={g} className="flex items-start gap-2.5 p-4 rounded-lg bg-muted/40 border">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendação por plano */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Recomendação inteligente por plano</h2>
          <p className="text-sm text-muted-foreground mb-6">Comece pelo que faz mais sentido hoje — você pode evoluir quando quiser.</p>
          <div className="grid lg:grid-cols-3 gap-5">
            {r.plans.map((p) => {
              const meta = PLAN_META[p.level];
              const Icon = meta.icon;
              const isIdeal = p.level === "ideal";
              return (
                <Card
                  key={p.level}
                  className={
                    "relative p-6 flex flex-col border-2 " +
                    (isIdeal ? "border-primary shadow-elegant" : "border-border")
                  }
                >
                  {isIdeal && (
                    <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                      Recomendado
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg grid place-items-center text-white bg-gradient-to-br ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-lg leading-tight">{meta.label}</div>
                      <div className="text-xs text-muted-foreground leading-snug">{meta.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-3 mb-2">Módulos recomendados</div>
                  <ul className="space-y-1.5 mb-4">
                    {p.modules.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.why}</p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Button asChild className={isIdeal ? "bg-gradient-primary" : ""}>
                      <Link to="/planos" search={{ nicho, recomendado: p.level } as never}>
                        {p.level === "full" ? "Solicitar proposta" : `Contratar ${meta.label}`} <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                    {p.level !== "full" && (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/planos" search={{ nicho, recomendado: p.level, trial: 1 } as never}>
                          Começar trial
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Combo correlato */}
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{r.combo.title}</h3>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{r.combo.text}</p>
            </div>
          </div>
        </Card>

        {/* Navegação */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
          <Button asChild variant="ghost" size="sm">
            <Link to="/escolher-nicho">← Trocar de nicho</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/planos">Ver todos os planos</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
