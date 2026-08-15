export type CommercialNichePlaybook = {
  slug: string;
  label: string;
  scenario: string;
  hiddenLoss: string;
  transformation: string[];
  relationship: string[];
  loyalty: string[];
  impulsionitoQuestions: string[];
  cta: string;
};

export const COMMERCIAL_NICHE_PLAYBOOK: CommercialNichePlaybook[] = [
  {
    slug: "bares-restaurantes",
    label: "Bares e restaurantes",
    scenario: "Pessoas sentam à mesa, consomem, pagam e vão embora. Sem identificação, o estabelecimento sabe o que vendeu, mas não sabe quem eram os clientes, quanto cada um costuma gastar, suas preferências ou quando deve convidá-los a voltar.",
    hiddenLoss: "Venda registrada sem relacionamento: o cliente continua anônimo e a recorrência depende do acaso.",
    transformation: [
      "O garçom pede apenas nome, telefone e e-mail para identificar o cliente.",
      "A comanda do PDV Impulsionando fica vinculada ao perfil e alimenta o histórico de consumo.",
      "O e-mail de boas-vindas pode ser enviado imediatamente pelo canal ativo do Core.",
      "Cardápio, reservas, pagamentos, eventos e benefícios passam a conversar com o mesmo perfil.",
      "Se a empresa habilitar emissão fiscal e houver CPF identificado, o documento fiscal pode ser associado ao histórico do cliente.",
      "O gestor passa a enxergar ticket, frequência, preferências e comportamento de recompra."
    ],
    relationship: ["Boas-vindas", "Convites de reserva", "Pagamento antecipado de reserva", "Convites e votação de eventos", "Pesquisa de satisfação", "Pesquisa pós-evento", "Reativação de clientes inativos"],
    loyalty: ["Pontos", "Cashback ou cupons quando autorizados", "Benefícios por frequência", "Clientes VIP", "Campanhas por ticket e preferência"],
    impulsionitoQuestions: ["Hoje você sabe quem sentou nas suas mesas ontem?", "Consegue listar seus melhores clientes por frequência e ticket?", "Se fizer um evento amanhã, sabe exatamente quem deveria convidar?"],
    cta: "Quero transformar consumo em relacionamento"
  },
  {
    slug: "materiais-construcao",
    label: "Materiais de construção",
    scenario: "Um cliente compra tinta hoje, elétrica na semana seguinte e hidráulica depois. Sem CRM e histórico integrado, cada compra parece isolada.",
    hiddenLoss: "A loja perde venda complementar, recompra e relacionamento com consumidores, profissionais e construtoras.",
    transformation: ["PDV e ERP consolidam compras e orçamentos", "Histórico mostra categorias e frequência", "Orçamentos entram em follow-up", "Profissionais podem ter condições e jornadas próprias", "Estoque publicado pode aparecer na Busca Impulsionando"],
    relationship: ["Boas-vindas", "Follow-up de orçamento", "Pós-venda", "Campanhas por categoria", "Reativação"],
    loyalty: ["Clube do profissional", "Benefícios por volume", "Indicação", "Condições por recorrência"],
    impulsionitoQuestions: ["Quantos orçamentos não recebem follow-up?", "Você sabe quais clientes estão em obra agora?", "Diferencia consumidor final de profissional?"],
    cta: "Quero vender durante toda a obra"
  },
  {
    slug: "farmacias",
    label: "Farmácias e drogarias",
    scenario: "Clientes compram com frequência, mas muitas operações tratam cada passagem no caixa como venda isolada.",
    hiddenLoss: "A recorrência comercial não vira relacionamento nem inteligência de recompra.",
    transformation: ["Cliente identificado no PDV com consentimentos aplicáveis", "Histórico comercial por categorias e frequência", "Campanhas permitidas e segmentadas", "Estoque autorizado pode ser encontrado pela Busca Impulsionando"],
    relationship: ["Boas-vindas", "Pós-compra", "Campanhas comerciais consentidas", "Aniversário", "Reativação"],
    loyalty: ["Clube de vantagens", "Pontos", "Cupons", "Benefícios por frequência"],
    impulsionitoQuestions: ["Quantos clientes recorrentes ainda passam anônimos pelo caixa?", "Seu programa de fidelidade mede recompra?", "Você sabe quais campanhas fazem o cliente voltar?"],
    cta: "Quero transformar frequência em fidelidade"
  },
  {
    slug: "supermercados",
    label: "Supermercados e mercados",
    scenario: "Centenas de clientes passam pelo caixa diariamente. Sem identificação, a empresa conhece produtos vendidos, mas conhece pouco sobre quem sustenta a recorrência.",
    hiddenLoss: "Promoções genéricas consomem margem sem construir relacionamento individual.",
    transformation: ["Cadastro opcional vinculado às compras", "PDV alimenta frequência, ticket e categorias", "Campanhas usam comportamento real", "Itens publicados podem ser encontrados no Clube em tempo real"],
    relationship: ["Boas-vindas", "Ofertas segmentadas", "Campanhas sazonais", "Reativação", "Pesquisa"],
    loyalty: ["Clube de vantagens", "Preço para membros", "Pontos", "Cupons personalizados"],
    impulsionitoQuestions: ["Você sabe quem são seus clientes mais frequentes?", "Mede o retorno de uma promoção?", "Seu clube gera recorrência ou só desconto?"],
    cta: "Quero conhecer meus clientes de verdade"
  },
  {
    slug: "lava-jato",
    label: "Lava jato e estética automotiva",
    scenario: "O cliente lava o carro e vai embora. Sem histórico, ninguém sabe quando convidá-lo novamente ou quais serviços já realizou.",
    hiddenLoss: "Um serviço naturalmente recorrente vira venda avulsa.",
    transformation: ["Cadastro do cliente e veículo", "Histórico por veículo", "Agenda ou fila", "Ordem de serviço", "Lembrete de retorno", "Oferta de serviços complementares"],
    relationship: ["Boas-vindas", "Aviso de conclusão", "Pesquisa", "Lembrete de retorno"],
    loyalty: ["Pacotes mensais", "Benefício por frequência", "Indicação", "Planos para frotas"],
    impulsionitoQuestions: ["Quantos clientes voltam em 30 dias?", "Você controla histórico por veículo?", "Tem plano recorrente ou depende de o cliente lembrar?"],
    cta: "Quero transformar lavagem em recorrência"
  },
  {
    slug: "petshops",
    label: "Pet shops e serviços pet",
    scenario: "O tutor leva o pet para banho, tosa ou compra produtos, mas a próxima visita muitas vezes depende da memória dele.",
    hiddenLoss: "Recorrência natural sem automação vira agenda imprevisível.",
    transformation: ["Cadastro de tutor e pets", "Agenda", "Histórico de serviços", "Lembrete de retorno", "Pagamento e fidelidade"],
    relationship: ["Confirmação", "Aviso de conclusão", "Pesquisa", "Lembrete de novo atendimento"],
    loyalty: ["Pacotes", "Assinaturas", "Pontos", "Aniversário do pet", "Indicação"],
    impulsionitoQuestions: ["Quantos pets atendidos já têm próxima visita marcada?", "Você tem histórico por pet?", "Usa pacote ou assinatura?"],
    cta: "Quero transformar cada pet em relacionamento recorrente"
  },
  {
    slug: "saloes-estetica",
    label: "Salões, barbearias e estética",
    scenario: "O cliente faz um serviço e sai sem próxima visita. Agenda cheia hoje não garante recorrência amanhã.",
    hiddenLoss: "Clientes somem porque ninguém conduz o ciclo de retorno.",
    transformation: ["Cadastro", "Agenda por profissional", "Histórico de serviços", "Pagamento", "Reagendamento sugerido", "Campanhas por frequência"],
    relationship: ["Confirmação", "Pós-serviço", "Pesquisa", "Lembrete de retorno", "Aniversário"],
    loyalty: ["Pacotes", "Assinatura", "Pontos", "Indicação", "Benefícios VIP"],
    impulsionitoQuestions: ["Você sabe a taxa de retorno por profissional?", "Quantos clientes saem sem próxima visita?", "Tem clientes inativos há 45 ou 60 dias?"],
    cta: "Quero agenda cheia com clientes que voltam"
  }
];

export const CLUB_INVENTORY_DISCOVERY = {
  name: "Busca Impulsionando",
  purpose: "Conectar oferta e demanda usando o estoque autorizado das empresas conectadas ao Core.",
  searchBy: ["código", "nome", "marca", "modelo", "SKU", "categoria"],
  resultMayShow: ["foto", "nome", "modelo", "empresa", "unidade", "disponibilidade", "preço quando publicado", "compra online", "retirada ou compra presencial"],
  rules: [
    "O ERP/PDV mantém o estoque operacional privado da empresa.",
    "Somente produtos e quantidades autorizados pela empresa entram no índice público do Clube.",
    "A disponibilidade apresentada deve vir do estoque do Core em tempo real ou próximo do tempo real.",
    "A empresa escolhe se publica preço, quantidade exata, apenas disponibilidade, compra online e/ou retirada presencial.",
    "Uma busca nunca pode expor custo, margem, estoque reservado, dados internos ou informações não autorizadas.",
    "Compra online deve reservar/baixar estoque de forma transacional para evitar venda duplicada."
  ]
};
