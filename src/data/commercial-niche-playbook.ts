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
    transformation: ["O garçom pede apenas nome, telefone e e-mail para identificar o cliente.", "A comanda do PDV Impulsionando fica vinculada ao perfil e alimenta o histórico de consumo.", "O e-mail de boas-vindas pode ser enviado imediatamente pelo canal ativo do Core.", "Cardápio, reservas, pagamentos, eventos e benefícios passam a conversar com o mesmo perfil.", "Se a empresa habilitar emissão fiscal e houver CPF identificado, o documento fiscal pode ser associado ao histórico do cliente.", "O gestor passa a enxergar ticket, frequência, preferências e comportamento de recompra."],
    relationship: ["Boas-vindas", "Convites de reserva", "Pagamento antecipado de reserva", "Convites e votação de eventos", "Pesquisa de satisfação", "Pesquisa pós-evento", "Reativação de clientes inativos"],
    loyalty: ["Pontos", "Cashback ou cupons quando autorizados", "Benefícios por frequência", "Clientes VIP", "Campanhas por ticket e preferência"],
    impulsionitoQuestions: ["Hoje você sabe quem sentou nas suas mesas ontem?", "Consegue listar seus melhores clientes por frequência e ticket?", "Se fizer um evento amanhã, sabe exatamente quem deveria convidar?"],
    cta: "Quero transformar consumo em relacionamento"
  },
  {
    slug: "padarias",
    label: "Padarias e confeitarias",
    scenario: "O cliente pode entrar todos os dias para café, pão, confeitaria ou almoço, mas normalmente continua anônimo mesmo sendo extremamente recorrente.",
    hiddenLoss: "Uma das maiores frequências do varejo é desperdiçada: o negócio vende diariamente sem construir memória, preferência ou recorrência mensurável.",
    transformation: ["PDV identifica clientes sem tornar o atendimento pesado", "Histórico mostra frequência, ticket, horários e categorias", "Encomendas de bolos, kits e datas especiais entram no CRM", "Produtos e estoque autorizados podem entrar na Busca Impulsionando", "Campanhas usam comportamento real, não apenas desconto genérico"],
    relationship: ["Boas-vindas", "Encomendas e retirada", "Datas especiais", "Pesquisa de satisfação", "Reativação de clientes que reduziram frequência"],
    loyalty: ["Clube do café", "Benefícios por frequência", "Combos personalizados", "Aniversário", "Assinaturas e encomendas recorrentes"],
    impulsionitoQuestions: ["Você sabe quem compra café aqui quatro vezes por semana?", "Consegue identificar quem deixou de frequentar?", "Quantas encomendas futuras estão ligadas a um CRM e não a anotações?"],
    cta: "Quero transformar rotina em fidelidade"
  },
  {
    slug: "materiais-construcao",
    label: "Materiais de construção",
    scenario: "Um cliente compra tinta hoje, elétrica na semana seguinte e hidráulica depois. Sem CRM e histórico integrado, cada compra parece isolada.",
    hiddenLoss: "A loja perde venda complementar, recompra e relacionamento com consumidores, profissionais e construtoras.",
    transformation: ["PDV e ERP consolidam compras e orçamentos", "Histórico mostra categorias e frequência", "Orçamentos entram em follow-up", "Profissionais podem ter condições e jornadas próprias", "Estoque publicado pode aparecer na Busca Impulsionando", "Impulsionito identifica oportunidades de venda complementar por etapa da obra"],
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
    transformation: ["Cliente identificado no PDV com consentimentos aplicáveis", "Histórico comercial por categorias e frequência", "Campanhas permitidas e segmentadas", "Estoque autorizado pode ser encontrado pela Busca Impulsionando", "Pesquisas e benefícios respeitam privacidade e limites regulatórios"],
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
    transformation: ["Cadastro opcional vinculado às compras", "PDV alimenta frequência, ticket e categorias", "Campanhas usam comportamento real", "Itens publicados podem ser encontrados no Clube em tempo real", "Pesquisas medem satisfação, participação e percepção por unidade"],
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
    slug: "oficinas-autopecas",
    label: "Oficinas e autopeças",
    scenario: "A empresa resolve um problema hoje, mas perde a próxima revisão, a troca preventiva e a oportunidade de vender peças e serviços ligados ao mesmo veículo.",
    hiddenLoss: "Histórico técnico sem CRM transforma manutenção recorrente em nova captação toda vez.",
    transformation: ["Cliente, veículo, quilometragem e ordens de serviço ficam conectados", "Orçamentos entram em follow-up", "Estoque de peças conversa com a ordem de serviço", "Impulsionito lembra retornos e oportunidades preventivas", "Pesquisa mede atendimento, prazo e confiança"],
    relationship: ["Orçamento", "Aprovação", "Status do serviço", "Pós-serviço", "Lembrete preventivo", "Pesquisa"],
    loyalty: ["Plano de manutenção", "Benefício por recorrência", "Indicação", "Frotas"],
    impulsionitoQuestions: ["Você sabe quais veículos deveriam voltar este mês?", "Quantos orçamentos ficam sem retorno?", "Consegue medir ticket e recorrência por cliente e veículo?"],
    cta: "Quero transformar manutenção em relacionamento"
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
  },
  {
    slug: "academias-fitness",
    label: "Academias, studios e fitness",
    scenario: "O aluno compra, começa motivado e pode reduzir frequência silenciosamente antes de cancelar.",
    hiddenLoss: "A empresa descobre risco de churn tarde demais, quando o cliente já decidiu sair.",
    transformation: ["Cadastro, plano e presença ficam conectados", "Queda de frequência vira sinal de risco", "Impulsionito sugere ações de retenção", "Agenda de aulas e profissionais alimenta engajamento", "Pesquisas medem experiência e intenção de permanência"],
    relationship: ["Boas-vindas", "Onboarding do aluno", "Acompanhamento de frequência", "Pesquisa", "Reativação"],
    loyalty: ["Metas", "Benefícios por presença", "Indicação", "Planos recorrentes", "Comunidade"],
    impulsionitoQuestions: ["Você identifica aluno em risco antes do cancelamento?", "Mede frequência por plano?", "Sabe quais aulas aumentam retenção?"],
    cta: "Quero reduzir churn e aumentar permanência"
  },
  {
    slug: "hoteis-pousadas",
    label: "Hotéis, pousadas e hospedagem",
    scenario: "O hóspede reserva, fica alguns dias e desaparece do relacionamento, obrigando o negócio a pagar novamente por aquisição em uma próxima viagem.",
    hiddenLoss: "Cada nova estadia pode recomeçar como aquisição cara em vez de usar o relacionamento já conquistado.",
    transformation: ["Reserva e perfil do hóspede se conectam ao CRM", "Preferências e histórico de estadias ficam disponíveis", "Pós-estadia alimenta pesquisa e reputação", "Campanhas convidam para retorno direto", "Impulsionito identifica oportunidades de upsell e recorrência"],
    relationship: ["Pré-check-in", "Boas-vindas", "Durante a estadia", "Pesquisa pós-estadia", "Campanhas de retorno"],
    loyalty: ["Tarifa direta", "Benefícios recorrentes", "Indicação", "Experiências", "Clube"],
    impulsionitoQuestions: ["Quanto da sua recorrência ainda depende de OTA?", "Você conhece preferências dos hóspedes que voltam?", "Consegue reativar quem se hospedou há 6 ou 12 meses?"],
    cta: "Quero transformar estadia em relacionamento direto"
  },
  {
    slug: "educacao-cursos",
    label: "Educação, cursos e escolas",
    scenario: "O lead pergunta, recebe informação, às vezes faz matrícula, mas marketing, atendimento, cobrança, presença e renovação não conversam entre si.",
    hiddenLoss: "A instituição perde matrícula antes da venda e renovação depois dela por falta de uma jornada única.",
    transformation: ["Lead entra no CRM com origem", "Follow-up acompanha intenção e estágio", "Matrícula conecta financeiro e comunicação", "Engajamento e presença ajudam a prever evasão", "Pesquisas acompanham experiência"],
    relationship: ["Captação", "Matrícula", "Boas-vindas", "Acompanhamento", "Pesquisa", "Renovação"],
    loyalty: ["Renovação", "Indicação", "Comunidade", "Novos cursos", "Alumni"],
    impulsionitoQuestions: ["Quantos interessados não recebem follow-up?", "Você enxerga risco de evasão antes do cancelamento?", "Mede origem das matrículas e renovações?"],
    cta: "Quero conectar captação, matrícula e permanência"
  },
  {
    slug: "servicos-profissionais",
    label: "Serviços profissionais e consultorias",
    scenario: "O negócio recebe oportunidades por indicação, formulário, mensagem e reunião, mas proposta, follow-up, contrato, execução e renovação ficam espalhados.",
    hiddenLoss: "O conhecimento fica na cabeça das pessoas e oportunidades morrem entre etapas.",
    transformation: ["CRM organiza oportunidades", "Agenda e proposta ficam no mesmo histórico", "Contratos e tarefas acompanham execução", "Impulsionito cobra próximos passos", "Pesquisa e CS sustentam renovação e expansão"],
    relationship: ["Diagnóstico", "Proposta", "Onboarding", "Acompanhamento", "Pesquisa", "Renovação"],
    loyalty: ["Retainer", "Upsell", "Cross-sell", "Indicação", "Renovação"],
    impulsionitoQuestions: ["Quantas propostas estão abertas sem próximo passo?", "Você sabe quais clientes têm maior LTV?", "Sua equipe tem uma visão única da relação com cada cliente?"],
    cta: "Quero transformar oportunidades em receita recorrente"
  },
  {
    slug: "distribuidores-industria-b2b",
    label: "Distribuidores, fornecedores e indústria B2B",
    scenario: "Vendedores carregam relacionamento, preço, histórico e oportunidades na própria memória, enquanto pedidos, estoque e financeiro vivem separados.",
    hiddenLoss: "A empresa depende excessivamente do vendedor e perde previsibilidade de carteira, recompra e expansão.",
    transformation: ["Conta, contatos e histórico ficam no CRM", "Pedidos e estoque alimentam visão comercial", "Oportunidades de recompra surgem por comportamento", "Impulsionito organiza carteira e risco", "BI acompanha receita, margem, frequência e concentração"],
    relationship: ["Prospecção", "Cotação", "Pedido", "Pós-venda", "Recompra", "Pesquisa B2B"],
    loyalty: ["Condições por carteira", "Acordos recorrentes", "Programas de canal", "Cross-sell", "Expansão de conta"],
    impulsionitoQuestions: ["Quanto da carteira depende da memória do vendedor?", "Você sabe quem reduziu volume antes de perder o cliente?", "Consegue prever recompra por conta?"],
    cta: "Quero transformar carteira em crescimento previsível"
  }
];

export const CLUB_INVENTORY_DISCOVERY = {
  name: "Busca Impulsionando",
  purpose: "Conectar oferta e demanda usando o estoque autorizado das empresas conectadas ao Core.",
  searchBy: ["código", "nome", "marca", "modelo", "SKU", "categoria"],
  resultMayShow: ["foto", "nome", "modelo", "empresa", "unidade", "disponibilidade", "preço quando publicado", "compra online", "retirada ou compra presencial"],
  rules: ["O ERP/PDV mantém o estoque operacional privado da empresa.", "Somente produtos e quantidades autorizados pela empresa entram no índice público do Clube.", "A disponibilidade apresentada deve vir do estoque do Core em tempo real ou próximo do tempo real.", "A empresa escolhe se publica preço, quantidade exata, apenas disponibilidade, compra online e/ou retirada presencial.", "Uma busca nunca pode expor custo, margem, estoque reservado, dados internos ou informações não autorizadas.", "Compra online deve reservar/baixar estoque de forma transacional para evitar venda duplicada."]
};
