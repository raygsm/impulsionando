export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  why: string;
  steps: string[];
  test?: string;
  routes: string[];
  tags: string[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    summary: "Complete os dados essenciais e deixe sua operação pronta para usar os módulos contratados.",
    why: "Um cadastro completo permite que identidade, comunicação, cobrança, permissões e automações usem dados consistentes.",
    steps: ["Revise os dados da empresa e do responsável.", "Confirme celular, WhatsApp e e-mails operacional, financeiro e de suporte.", "Revise plano, módulos e usuários.", "Conclua os testes de comunicação antes de iniciar campanhas ou jornadas."],
    routes: ["/onboarding", "/dashboard"],
    tags: ["cadastro", "empresa", "começar", "onboarding"],
  },
  {
    id: "crm",
    title: "CRM — relacionamento e memória do cliente",
    summary: "Organize contatos, leads, oportunidades, atividades, histórico e comunicação em uma visão única.",
    why: "O CRM evita que informações importantes fiquem espalhadas e dá contexto ao atendimento, às automações e ao Impulsionito.",
    steps: ["Cadastre ou importe um contato.", "Classifique-o com estágio, tags e segmento quando aplicável.", "Registre atividades e oportunidades.", "Use a timeline para acompanhar interações e próximos passos.", "Teste com um contato DEMO antes de importar uma base grande."],
    test: "Criar um contato DEMO, registrar uma atividade e confirmar que tudo aparece na timeline; depois remover o dado de teste.",
    routes: ["/crm", "/contacts", "/pipelines"],
    tags: ["crm", "lead", "cliente", "contato", "pipeline", "timeline"],
  },
  {
    id: "comunicacao",
    title: "Comunicação — WhatsApp, e-mail, SMS e voz",
    summary: "Centralize canais e use a identidade da empresa para atendimento, mensagens transacionais e campanhas autorizadas.",
    why: "Uma camada única de comunicação reduz retrabalho e mantém cada interação ligada ao contato correto no CRM.",
    steps: ["Escolha o canal que deseja configurar.", "Informe remetente, número ou credenciais exigidas pelo provedor.", "Salve a configuração com segurança.", "Execute o teste do canal.", "Só habilite automações depois que o teste estiver aprovado."],
    test: "Enviar uma mensagem somente para um destino controlado e verificar envio, entrega/recebimento e registro no CRM quando o canal suportar esses estados.",
    routes: ["/communication", "/comunicacoes", "/admin/comunicacoes"],
    tags: ["whatsapp", "email", "smtp", "sms", "voz", "voip", "mensagem"],
  },
  {
    id: "whatsapp",
    title: "WhatsApp — conectar e testar",
    summary: "Conecte o canal autorizado e confirme que mensagens entram e saem pelo tenant correto.",
    why: "O WhatsApp conectado ao CRM permite preservar histórico, contexto, handoff humano e automações permitidas.",
    steps: ["Abra CRM > Comunicação > WhatsApp.", "Escolha a modalidade disponível para sua conta.", "Se houver pareamento por QR, gere o QR e abra Dispositivos conectados no celular.", "Leia o QR e aguarde o status Conectado.", "Envie uma mensagem de um número externo de teste.", "Confirme entrada no CRM e faça uma resposta controlada."],
    test: "QR/sessão -> mensagem inbound -> contato/timeline -> resposta outbound -> confirmação de registro.",
    routes: ["/communication/whatsapp", "/admin/comunicacoes/whatsapp"],
    tags: ["whatsapp", "qr", "dispositivo", "conectar"],
  },
  {
    id: "email",
    title: "E-mail — configurar remetente e testar",
    summary: "Configure o e-mail usado pela empresa e valide a entrega antes de usar templates ou automações.",
    why: "Um remetente corretamente configurado melhora confiabilidade e reduz falhas de entrega.",
    steps: ["Informe nome do remetente, e-mail de origem e reply-to.", "Quando aplicável, configure SMTP, porta e TLS/SSL.", "Guarde credenciais apenas no mecanismo seguro indicado pela plataforma.", "Informe um e-mail de destino controlado.", "Clique em Enviar e-mail de teste e confirme o resultado."],
    test: "Enviar para um endereço de homologação e registrar PASS/FAIL com diagnóstico legível, sem revelar segredos.",
    routes: ["/communication/email", "/admin/comunicacoes"],
    tags: ["email", "smtp", "dkim", "spf", "dmarc", "teste"],
  },
  {
    id: "erp",
    title: "ERP — organize a operação",
    summary: "Conecte produtos, serviços, fornecedores, compras, vendas, estoque, financeiro e fiscal conforme os módulos habilitados.",
    why: "O ERP reduz controles paralelos e permite que uma ação operacional atualize outras áreas de forma consistente.",
    steps: ["Cadastre categorias e unidades necessárias.", "Cadastre um produto ou serviço de teste.", "Associe fornecedor e dados comerciais quando aplicável.", "Registre uma entrada ou operação DEMO.", "Confirme reflexos em estoque/financeiro somente onde a integração estiver habilitada."],
    test: "Usar registros DEMO claramente identificados e removê-los após a validação.",
    routes: ["/erp", "/inventory", "/sales"],
    tags: ["erp", "produto", "fornecedor", "compra", "venda", "fiscal"],
  },
  {
    id: "estoque-pdv",
    title: "Estoque e PDV",
    summary: "Controle entradas, saídas e vendas para manter saldo operacional consistente.",
    why: "Quando PDV, estoque, CRM e financeiro estão integrados, a venda deixa de ser um evento isolado.",
    steps: ["Crie ou selecione um produto DEMO.", "Registre entrada controlada de 10 unidades.", "Realize uma saída/venda DEMO de 1 unidade.", "Confirme saldo esperado de 9 unidades.", "Confirme integrações habilitadas e remova/estorne o cenário de teste."],
    test: "10 unidades -> saída 1 -> saldo 9, sem contaminar estoque real.",
    routes: ["/inventory", "/sales", "/pdv"],
    tags: ["pdv", "estoque", "saldo", "produto", "venda"],
  },
  {
    id: "agenda",
    title: "Agenda — serviços, profissionais e horários",
    summary: "Configure quem atende, o que pode ser agendado, onde, quando e sob quais regras.",
    why: "Uma agenda estruturada permite disponibilidade confiável, lembretes, pagamentos e jornadas de relacionamento.",
    steps: ["Cadastre ou revise serviços.", "Cadastre profissionais e conclua aprovações exigidas.", "Defina horários, unidades, bloqueios e regras.", "Faça um agendamento controlado.", "Teste remarcação e cancelamento sem afetar agenda real."],
    test: "Criar cenário controlado -> agendar -> confirmar -> remarcar/cancelar -> verificar liberação correta do horário.",
    routes: ["/agenda", "/agenda/services"],
    tags: ["agenda", "profissional", "horario", "aprovação", "agendamento"],
  },
  {
    id: "automacoes",
    title: "Automações e jornadas",
    summary: "Transforme eventos reais do sistema em ações repetíveis e auditáveis.",
    why: "Automação reduz trabalho manual, mas a regra de negócio e o estado oficial continuam no Core.",
    steps: ["Escolha o evento que inicia a jornada.", "Revise condições e público.", "Revise a ação e o canal.", "Execute teste controlado.", "Confira última execução, resultado e eventuais erros antes de ativar em produção."],
    test: "Evento de homologação -> automação -> ação esperada -> callback/log -> PASS, sem disparar para público real.",
    routes: ["/automations", "/workflows"],
    tags: ["automação", "n8n", "jornada", "gatilho", "workflow"],
  },
  {
    id: "seguranca",
    title: "Usuários, permissões e segurança",
    summary: "Dê a cada pessoa somente os acessos necessários para o seu papel.",
    why: "Permissões corretas reduzem risco e evitam que dados ou ações sensíveis apareçam para quem não precisa deles.",
    steps: ["Convide o usuário pelo canal previsto.", "Escolha o papel correto.", "Revise módulos e permissões.", "Teste com o perfil correspondente.", "Revogue acessos que não sejam mais necessários."],
    routes: ["/admin/equipe", "/settings", "/privacy"],
    tags: ["usuário", "permissão", "rbac", "segurança", "equipe"],
  },
];

export function guideForPath(pathname: string) {
  const matches = GUIDE_SECTIONS.filter((section) => section.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)));
  return matches.length ? matches : GUIDE_SECTIONS.slice(0, 3);
}
