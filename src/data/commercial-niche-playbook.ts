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

const common = {
  relationship: ["Boas-vindas", "Pós-venda", "Pesquisa de satisfação", "Reativação", "Campanhas segmentadas"],
  loyalty: ["Benefícios por recorrência", "Indicação", "Segmentação por LTV", "Campanhas por comportamento"],
};

export const COMMERCIAL_NICHE_PLAYBOOK: CommercialNichePlaybook[] = [
  {
    slug: "bares-restaurantes", label: "Bares e restaurantes",
    scenario: "Pessoas consomem, pagam e vão embora. Sem identificação, o estabelecimento sabe o que vendeu, mas não quem sustenta a recorrência.",
    hiddenLoss: "Venda registrada sem relacionamento: o cliente continua anônimo e a recompra depende do acaso.",
    transformation: ["PDV e comanda vinculados ao cliente", "Histórico de consumo e ticket", "Reservas, eventos e benefícios conectados", "Pesquisa pós-visita", "Campanhas por frequência e preferência"],
    relationship: ["Boas-vindas", "Reserva", "Eventos", "Pesquisa", "Reativação"], loyalty: ["Pontos", "Benefícios VIP", "Cupons", "Frequência"],
    impulsionitoQuestions: ["Você sabe quem sentou nas suas mesas ontem?", "Conhece seus clientes por frequência e ticket?", "Sabe quem convidar para o próximo evento?"],
    cta: "Quero transformar consumo em relacionamento"
  },
  {
    slug: "padarias", label: "Padarias e confeitarias",
    scenario: "O cliente pode voltar todos os dias, mas normalmente continua anônimo mesmo sendo extremamente recorrente.",
    hiddenLoss: "Uma das maiores frequências do varejo é desperdiçada sem memória, preferência e recorrência mensurável.",
    transformation: ["PDV identifica cliente sem tornar o caixa pesado", "Histórico mostra frequência, ticket e horários", "Encomendas entram no CRM", "Produtos autorizados podem entrar na Busca Impulsionando", "Campanhas usam comportamento real"],
    relationship: common.relationship, loyalty: ["Clube do café", "Combos", "Aniversário", "Assinaturas", "Benefícios por frequência"],
    impulsionitoQuestions: ["Quem compra aqui quatro vezes por semana?", "Quem reduziu frequência?", "Quantas encomendas futuras estão no CRM?"],
    cta: "Quero transformar rotina em fidelidade"
  },
  {
    slug: "supermercados", label: "Supermercados e mercados",
    scenario: "Centenas de clientes passam pelo caixa diariamente, mas a operação conhece produtos vendidos melhor do que conhece os clientes que sustentam a recorrência.",
    hiddenLoss: "Promoções genéricas consomem margem sem construir relacionamento individual.",
    transformation: ["Cadastro opcional ligado às compras", "PDV alimenta frequência, ticket e categorias", "Campanhas por comportamento", "Busca Impulsionando para itens publicados", "Pesquisas por unidade e jornada"],
    relationship: common.relationship, loyalty: ["Clube de vantagens", "Preço para membros", "Pontos", "Cupons personalizados"],
    impulsionitoQuestions: ["Quem são seus clientes mais frequentes?", "Mede o retorno de cada promoção?", "Seu clube gera recorrência ou apenas desconto?"],
    cta: "Quero conhecer meus clientes de verdade"
  },
  {
    slug: "materiais-construcao", label: "Materiais de construção",
    scenario: "O mesmo cliente compra por fases da obra, mas cada compra costuma parecer isolada quando orçamento, estoque, PDV e CRM não conversam.",
    hiddenLoss: "A loja perde follow-up de orçamento, venda complementar, recompra e relacionamento com profissionais da construção.",
    transformation: ["PDV e ERP consolidam compras e orçamentos", "Follow-up de orçamento", "Estoque e Busca Impulsionando", "Jornada específica para profissionais e construtoras", "Impulsionito sugere venda complementar por etapa da obra"],
    relationship: ["Orçamento", "Follow-up", "Pós-venda", "Campanhas por categoria", "Reativação"], loyalty: ["Clube do profissional", "Benefícios por volume", "Indicação", "Condições por recorrência"],
    impulsionitoQuestions: ["Quantos orçamentos ficam sem follow-up?", "Sabe quem está em obra agora?", "Diferencia consumidor final de profissional?"],
    cta: "Quero vender durante toda a obra"
  },
  {
    slug: "farmacias", label: "Farmácias e drogarias",
    scenario: "Clientes compram com frequência, mas muitas operações tratam cada passagem no caixa como venda isolada.",
    hiddenLoss: "A recorrência comercial não vira relacionamento nem inteligência de recompra.",
    transformation: ["Cliente identificado no PDV com consentimentos aplicáveis", "Histórico comercial por categorias e frequência", "Campanhas permitidas e segmentadas", "Estoque autorizado na Busca Impulsionando", "Pesquisas respeitando privacidade e limites regulatórios"],
    relationship: common.relationship, loyalty: ["Clube de vantagens", "Pontos", "Cupons", "Benefícios por frequência"],
    impulsionitoQuestions: ["Quantos clientes recorrentes ainda passam anônimos?", "Seu programa mede recompra?", "Quais campanhas realmente trazem retorno?"],
    cta: "Quero transformar frequência em fidelidade"
  },
  {
    slug: "corretoras-seguros-planos-saude", label: "Corretoras de seguros e planos de saúde",
    scenario: "Leads chegam por indicação, mídia e carteira, mas cotação, documentos, renovação e relacionamento costumam ficar espalhados em planilhas e conversas.",
    hiddenLoss: "A corretora perde renovação, cross-sell e follow-up porque não enxerga a vida inteira do cliente e das apólices em uma única jornada.",
    transformation: ["CRM por pessoa, empresa, apólice e vigência", "Pipeline de cotação e proposta", "Lembretes de renovação", "Portal de documentos", "Campanhas por perfil e produto", "BI de produção, renovação, comissão e LTV"],
    relationship: ["Captação", "Cotação", "Proposta", "Emissão", "Pós-venda", "Renovação"], loyalty: ["Renovação assistida", "Cross-sell", "Indicação", "Carteira por LTV"],
    impulsionitoQuestions: ["Quantas apólices vencem nos próximos 90 dias?", "Quantas cotações estão sem próximo passo?", "Você mede renovação e LTV por cliente?"],
    cta: "Quero transformar carteira em receita recorrente"
  },
  {
    slug: "varejo-lojas", label: "Lojas e varejo físico",
    scenario: "O caixa registra vendas, mas sem CRM a loja não transforma compras em memória, preferência, recompra e campanhas inteligentes.",
    hiddenLoss: "Cada compra recomeça do zero e promoções genéricas corroem margem.",
    transformation: ["PDV + estoque + cliente em uma visão", "Histórico de compra", "Campanhas segmentadas", "Clube e fidelidade", "Busca Impulsionando para estoque publicado"],
    relationship: common.relationship, loyalty: common.loyalty,
    impulsionitoQuestions: ["Quem comprou e nunca voltou?", "Quais clientes sustentam maior LTV?", "Quais categorias geram recompra?"],
    cta: "Quero transformar venda em relacionamento"
  },
  {
    slug: "postos-conveniencia", label: "Postos e lojas de conveniência",
    scenario: "Há alta frequência de consumo, mas pouca identificação de cliente, veículo, rota e hábito.",
    hiddenLoss: "A operação perde recorrência mensurável e oportunidades de fidelidade por frequência.",
    transformation: ["Cadastro opcional de cliente e veículo", "Histórico de frequência e ticket", "Campanhas por hábito", "Convênios e frotas", "Pesquisa por unidade"],
    relationship: common.relationship, loyalty: ["Clube", "Benefício por frequência", "Frotas", "Cupons"],
    impulsionitoQuestions: ["Você sabe quem abastece toda semana?", "Consegue separar cliente avulso de frota?", "Mede retenção por unidade?"],
    cta: "Quero transformar frequência em valor"
  },
  {
    slug: "oficinas-autopecas", label: "Oficinas e autopeças",
    scenario: "A empresa resolve o problema de hoje, mas perde revisão, manutenção preventiva e venda complementar ligadas ao mesmo veículo.",
    hiddenLoss: "Histórico técnico sem CRM transforma manutenção recorrente em nova captação toda vez.",
    transformation: ["Cliente, veículo, quilometragem e OS conectados", "Follow-up de orçamento", "Estoque de peças ligado à OS", "Lembretes preventivos", "Pesquisa de atendimento e prazo"],
    relationship: ["Orçamento", "Aprovação", "Status", "Pós-serviço", "Retorno preventivo"], loyalty: ["Plano de manutenção", "Frotas", "Indicação", "Recorrência"],
    impulsionitoQuestions: ["Quais veículos deveriam voltar este mês?", "Quantos orçamentos estão sem retorno?", "Mede ticket e recorrência por veículo?"],
    cta: "Quero transformar manutenção em relacionamento"
  },
  {
    slug: "lava-jato", label: "Lava jato e estética automotiva",
    scenario: "O cliente lava o carro e vai embora; a próxima visita depende da memória dele.",
    hiddenLoss: "Um serviço naturalmente recorrente vira venda avulsa.",
    transformation: ["Cadastro de cliente e veículo", "Histórico por veículo", "Agenda ou fila", "Ordem de serviço", "Lembrete de retorno"],
    relationship: ["Boas-vindas", "Aviso de conclusão", "Pesquisa", "Retorno"], loyalty: ["Pacotes mensais", "Frotas", "Indicação", "Frequência"],
    impulsionitoQuestions: ["Quantos clientes voltam em 30 dias?", "Controla histórico por veículo?", "Tem plano recorrente?"],
    cta: "Quero transformar lavagem em recorrência"
  },
  {
    slug: "petshops", label: "Pet shops e serviços pet",
    scenario: "O tutor leva o pet para serviço ou compra, mas a próxima visita muitas vezes depende da memória dele.",
    hiddenLoss: "Recorrência natural sem automação vira agenda imprevisível.",
    transformation: ["Cadastro de tutor e pets", "Agenda", "Histórico de serviços", "Retorno automático", "Pagamento e fidelidade"],
    relationship: ["Confirmação", "Conclusão", "Pesquisa", "Novo atendimento"], loyalty: ["Pacotes", "Assinaturas", "Aniversário do pet", "Indicação"],
    impulsionitoQuestions: ["Quantos pets já têm próxima visita marcada?", "Você tem histórico por pet?", "Usa pacote ou assinatura?"],
    cta: "Quero transformar cada pet em relacionamento recorrente"
  },
  {
    slug: "saloes-estetica", label: "Salões, barbearias e estética",
    scenario: "Agenda cheia hoje não garante recorrência amanhã quando o cliente sai sem próximo ciclo conduzido.",
    hiddenLoss: "Clientes somem porque ninguém conduz o retorno.",
    transformation: ["Agenda por profissional", "Histórico de serviços", "Pagamento", "Reagendamento sugerido", "Campanhas por frequência"],
    relationship: ["Confirmação", "Pós-serviço", "Pesquisa", "Retorno", "Aniversário"], loyalty: ["Pacotes", "Assinatura", "Pontos", "Indicação", "VIP"],
    impulsionitoQuestions: ["Qual a taxa de retorno por profissional?", "Quantos saem sem próxima visita?", "Quem está inativo há 45 ou 60 dias?"],
    cta: "Quero agenda cheia com clientes que voltam"
  },
  {
    slug: "academias-fitness", label: "Academias, studios e fitness",
    scenario: "O aluno começa motivado e pode reduzir frequência silenciosamente antes de cancelar.",
    hiddenLoss: "A empresa descobre churn tarde demais.",
    transformation: ["Plano, presença e relacionamento conectados", "Queda de frequência vira alerta", "Impulsionito sugere retenção", "Agenda de aulas", "Pesquisa de experiência"],
    relationship: ["Onboarding", "Frequência", "Pesquisa", "Retenção", "Winback"], loyalty: ["Metas", "Benefícios por presença", "Indicação", "Comunidade"],
    impulsionitoQuestions: ["Identifica aluno em risco antes do cancelamento?", "Mede frequência por plano?", "Sabe quais aulas aumentam retenção?"],
    cta: "Quero reduzir churn e aumentar permanência"
  },
  {
    slug: "hoteis-pousadas", label: "Hotéis, pousadas e hospedagem",
    scenario: "O hóspede se hospeda e desaparece do relacionamento, obrigando nova aquisição numa próxima viagem.",
    hiddenLoss: "Cada estadia pode recomeçar como aquisição cara em vez de usar o relacionamento conquistado.",
    transformation: ["Reserva e perfil ligados ao CRM", "Preferências e histórico", "Pesquisa pós-estadia", "Campanhas de retorno direto", "Upsell de experiências"],
    relationship: ["Pré-check-in", "Estadia", "Pesquisa", "Retorno"], loyalty: ["Tarifa direta", "Experiências", "Indicação", "Clube"],
    impulsionitoQuestions: ["Quanto da recorrência depende de OTA?", "Conhece preferências de quem volta?", "Reativa hóspedes antigos?"],
    cta: "Quero transformar estadia em relacionamento direto"
  },
  {
    slug: "turismo-agencias", label: "Agências de turismo e experiências",
    scenario: "Leads pesquisam, pedem orçamento e somem entre cotação, pagamento, documentação e pós-viagem.",
    hiddenLoss: "A agência perde follow-up e recompra por não conduzir a jornada inteira.",
    transformation: ["CRM por viagem e viajante", "Orçamento e proposta", "Pagamento", "Checklist documental", "Pós-viagem e recompra"],
    relationship: ["Lead", "Cotação", "Fechamento", "Pré-viagem", "Pós-viagem"], loyalty: ["Recompra", "Indicação", "Clube", "Datas especiais"],
    impulsionitoQuestions: ["Quantos orçamentos vencem sem follow-up?", "Quem viajou e nunca recebeu nova oferta?", "Você mede LTV por viajante?"],
    cta: "Quero transformar viagem em relacionamento"
  },
  {
    slug: "educacao-cursos", label: "Educação, cursos e escolas",
    scenario: "Marketing, atendimento, matrícula, cobrança, presença e renovação não conversam entre si.",
    hiddenLoss: "A instituição perde matrícula antes da venda e renovação depois dela.",
    transformation: ["CRM com origem do lead", "Follow-up por estágio", "Matrícula e financeiro", "Engajamento e presença", "Pesquisa e renovação"],
    relationship: ["Captação", "Matrícula", "Onboarding", "Acompanhamento", "Renovação"], loyalty: ["Renovação", "Indicação", "Alumni", "Novos cursos"],
    impulsionitoQuestions: ["Quantos interessados não recebem follow-up?", "Vê risco de evasão antes do cancelamento?", "Mede origem de matrícula e renovação?"],
    cta: "Quero conectar captação, matrícula e permanência"
  },
  {
    slug: "servicos-profissionais", label: "Serviços profissionais e consultorias",
    scenario: "Oportunidades chegam por indicação, formulário e reunião, mas proposta, contrato, execução e renovação ficam espalhados.",
    hiddenLoss: "Oportunidades morrem entre etapas e o conhecimento fica na cabeça das pessoas.",
    transformation: ["CRM de oportunidades", "Agenda e proposta", "Contratos e tarefas", "Impulsionito cobra próximos passos", "CS, pesquisa, renovação e expansão"],
    relationship: ["Diagnóstico", "Proposta", "Onboarding", "Acompanhamento", "Renovação"], loyalty: ["Retainer", "Upsell", "Cross-sell", "Indicação"],
    impulsionitoQuestions: ["Quantas propostas estão sem próximo passo?", "Quais clientes têm maior LTV?", "Existe visão única da relação com cada cliente?"],
    cta: "Quero transformar oportunidades em receita recorrente"
  },
  {
    slug: "distribuidores-industria-b2b", label: "Distribuidores, fornecedores e indústria B2B",
    scenario: "Vendedores carregam relacionamento e oportunidades na memória enquanto pedidos, estoque e financeiro vivem separados.",
    hiddenLoss: "A empresa perde previsibilidade de carteira, recompra e expansão.",
    transformation: ["Conta, contatos e histórico no CRM", "Pedidos e estoque na visão comercial", "Recompra por comportamento", "Carteira e risco com Impulsionito", "BI de receita, margem e concentração"],
    relationship: ["Prospecção", "Cotação", "Pedido", "Pós-venda", "Recompra"], loyalty: ["Acordos recorrentes", "Programas de canal", "Cross-sell", "Expansão de conta"],
    impulsionitoQuestions: ["Quanto depende da memória do vendedor?", "Quem reduziu volume?", "Consegue prever recompra por conta?"],
    cta: "Quero transformar carteira em crescimento previsível"
  },
  {
    slug: "condominios-administradoras", label: "Condomínios e administradoras",
    scenario: "Chamados, comunicados, prestadores, cobranças e documentos ficam em canais diferentes e sem histórico único.",
    hiddenLoss: "A administração gasta energia em repetição, ruído e falta de rastreabilidade.",
    transformation: ["Portal por condomínio", "Chamados e SLA", "Comunicados segmentados", "Prestadores e contratos", "Pesquisas e prestação de contas"],
    relationship: ["Comunicados", "Chamados", "Assembleias", "Pesquisas", "Prestação de contas"], loyalty: ["Renovação de contrato", "Satisfação", "Indicação", "Expansão de carteira"],
    impulsionitoQuestions: ["Quantos chamados estão sem SLA?", "Onde ficam os documentos?", "Mede satisfação dos condomínios?"],
    cta: "Quero organizar gestão e relacionamento"
  },
  {
    slug: "locacao-equipamentos", label: "Locação de equipamentos e ativos",
    scenario: "Orçamentos, disponibilidade, retirada, devolução, manutenção e cobrança precisam falar com o mesmo ativo.",
    hiddenLoss: "Sem visão por ativo, a empresa perde ocupação, cobrança e manutenção preventiva.",
    transformation: ["Catálogo de ativos", "Disponibilidade e reserva", "Contrato", "Check-in/check-out", "Manutenção e histórico", "Cobrança e BI de utilização"],
    relationship: ["Cotação", "Reserva", "Entrega", "Devolução", "Renovação"], loyalty: ["Contratos recorrentes", "Cross-sell", "Clientes corporativos", "Indicação"],
    impulsionitoQuestions: ["Qual a taxa de ocupação de cada ativo?", "Quais ativos estão parados?", "Quem deveria renovar?"],
    cta: "Quero transformar ativos em receita previsível"
  },
  {
    slug: "associacoes-clubes", label: "Associações, clubes e comunidades",
    scenario: "Cadastro, contribuição, eventos, benefícios e comunicação costumam operar em bases separadas.",
    hiddenLoss: "Engajamento cai quando a entidade não conhece participação e interesse dos membros.",
    transformation: ["Cadastro único", "Cobrança recorrente", "Eventos", "Benefícios", "Pesquisas de participação e engajamento", "Segmentação por interesse"],
    relationship: ["Onboarding", "Eventos", "Comunicados", "Pesquisa", "Renovação"], loyalty: ["Benefícios", "Comunidade", "Participação", "Renovação"],
    impulsionitoQuestions: ["Quem participa e quem está se afastando?", "Qual benefício gera mais engajamento?", "Mede renovação por perfil?"],
    cta: "Quero aumentar participação e retenção"
  },
  {
    slug: "ongs-terceiro-setor", label: "ONGs e terceiro setor",
    scenario: "Doadores, voluntários, projetos, eventos e prestação de contas precisam de relacionamento contínuo e rastreável.",
    hiddenLoss: "A organização perde recorrência de doação e engajamento por falta de jornada estruturada.",
    transformation: ["CRM de doadores e voluntários", "Campanhas", "Eventos", "Doação recorrente", "Prestação de contas e impacto", "Pesquisas de engajamento"],
    relationship: ["Captação", "Agradecimento", "Impacto", "Eventos", "Reativação"], loyalty: ["Doação recorrente", "Voluntariado", "Indicação", "Comunidade"],
    impulsionitoQuestions: ["Quantos doadores recorrentes você tem?", "Quem parou de doar?", "Consegue mostrar impacto por campanha?"],
    cta: "Quero transformar apoio em relacionamento contínuo"
  },
  {
    slug: "transportes-logistica", label: "Transportes e logística",
    scenario: "Cotação, coleta, entrega, ocorrências, cobrança e relacionamento precisam estar na mesma linha do tempo.",
    hiddenLoss: "Sem visão ponta a ponta, atrasos e exceções viram atendimento reativo e perda de confiança.",
    transformation: ["CRM B2B", "Cotação", "Ordens e status", "Ocorrências e SLA", "Cobrança", "Pesquisa por entrega e conta"],
    relationship: ["Cotação", "Coleta", "Status", "Entrega", "Pesquisa"], loyalty: ["Contratos recorrentes", "SLA", "Expansão de conta", "Indicação"],
    impulsionitoQuestions: ["Quais clientes concentram ocorrências?", "Qual SLA por conta?", "Quem está reduzindo volume?"],
    cta: "Quero conectar operação e relacionamento"
  },
  {
    slug: "laboratorios-diagnostico", label: "Laboratórios e diagnóstico",
    scenario: "Agendamento, preparo, coleta, resultado e relacionamento precisam ser claros para o paciente e para a operação.",
    hiddenLoss: "Ruído de comunicação aumenta faltas, dúvidas e retrabalho.",
    transformation: ["Agenda", "Orientações de preparo", "Confirmações", "Portal de documentos", "Pesquisa pós-atendimento", "CRM de relacionamento"],
    relationship: ["Agendamento", "Preparo", "Atendimento", "Resultado", "Pesquisa"], loyalty: ["Retorno", "Indicação", "Relacionamento com médicos e empresas", "Recorrência"],
    impulsionitoQuestions: ["Quantas faltas poderiam ser evitadas?", "O paciente recebe preparo no canal certo?", "Mede satisfação por unidade?"],
    cta: "Quero reduzir atrito e aumentar confiança"
  },
  {
    slug: "clinicas-veterinarias", label: "Clínicas veterinárias",
    scenario: "Agenda, prontuário do pet, vacinas, retornos e relacionamento com o tutor precisam ser contínuos.",
    hiddenLoss: "Retornos e prevenção se perdem quando o histórico não conduz a próxima ação.",
    transformation: ["Tutor + pet + prontuário", "Agenda", "Vacinas e retornos", "Pagamento", "Pesquisa", "Lembretes preventivos"],
    relationship: ["Agendamento", "Atendimento", "Retorno", "Vacina", "Pesquisa"], loyalty: ["Planos", "Prevenção", "Indicação", "Recorrência"],
    impulsionitoQuestions: ["Quais pets estão com retorno pendente?", "Quais vacinas vencem?", "Mede recorrência por tutor?"],
    cta: "Quero transformar cuidado em recorrência"
  },
  {
    slug: "construtoras-incorporadoras", label: "Construtoras e incorporadoras",
    scenario: "Lead, corretor, unidade, proposta, documentação, obra e pós-entrega precisam estar conectados.",
    hiddenLoss: "O empreendimento perde conversão e relacionamento quando cada etapa vive em uma ferramenta.",
    transformation: ["CRM por empreendimento", "Unidades e disponibilidade", "Propostas", "Documentação", "Relacionamento de obra e entrega", "BI de origem e conversão"],
    relationship: ["Lead", "Visita", "Proposta", "Obra", "Entrega"], loyalty: ["Indicação", "Pós-entrega", "Novos empreendimentos", "Relacionamento"],
    impulsionitoQuestions: ["Qual canal vende mais unidades?", "Quantas propostas estão sem follow-up?", "Como está o relacionamento pós-venda?"],
    cta: "Quero conectar venda, obra e relacionamento"
  }
];
