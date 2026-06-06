// Demo-only test contact + simulated message dispatcher.
// All data lives in localStorage, isolated to the demo area.
// No real network calls are made — integrations require external credentials.

export const DEMO_TEST_CONTACT_KEY = "impulsionando:demo:test_contact";
export const DEMO_TEST_LOG_KEY = "impulsionando:demo:test_log";

export interface DemoTestContact {
  demo_test_email: string;
  demo_test_whatsapp: string;
  is_demo: true;
  is_test_contact: true;
  source: "demo";
  consent_context: "teste_demonstracao";
  updated_at: string;
}

export interface DemoTestLogEntry {
  id: string;
  scenario_id: string;
  scenario_label: string;
  module: string;
  profile: string;
  channel: "email" | "whatsapp";
  recipient: string;
  subject?: string;
  body: string;
  status:
    | "preparado"
    | "enviado"
    | "simulado"
    | "falhou"
    | "aguardando_integracao";
  created_at: string;
}

export function loadDemoContact(): DemoTestContact | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_TEST_CONTACT_KEY);
    return raw ? (JSON.parse(raw) as DemoTestContact) : null;
  } catch {
    return null;
  }
}

export function saveDemoContact(email: string, whatsapp: string) {
  const next: DemoTestContact = {
    demo_test_email: email.trim(),
    demo_test_whatsapp: whatsapp.trim(),
    is_demo: true,
    is_test_contact: true,
    source: "demo",
    consent_context: "teste_demonstracao",
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(DEMO_TEST_CONTACT_KEY, JSON.stringify(next));
  return next;
}

export function clearDemoContact() {
  localStorage.removeItem(DEMO_TEST_CONTACT_KEY);
}

export function loadDemoLog(): DemoTestLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_TEST_LOG_KEY);
    return raw ? (JSON.parse(raw) as DemoTestLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function pushDemoLog(entry: DemoTestLogEntry) {
  const list = loadDemoLog();
  list.unshift(entry);
  localStorage.setItem(DEMO_TEST_LOG_KEY, JSON.stringify(list.slice(0, 100)));
}

export function clearDemoLog() {
  localStorage.removeItem(DEMO_TEST_LOG_KEY);
}

export interface DemoScenario {
  id: string;
  label: string;
  module: string;
  profile: string;
  subject: string; // without TESTE prefix; prefix is added on render
  body: string;
  channels: Array<"email" | "whatsapp">;
}

const TESTE_PREFIX_SUBJECT = "TESTE — ";
const TESTE_BANNER =
  "TESTE — Esta é uma mensagem de demonstração da plataforma Impulsionando Tecnologia. Nenhuma ação real foi executada.";

export function buildSubject(scenario: DemoScenario) {
  return TESTE_PREFIX_SUBJECT + scenario.subject;
}

export function buildBody(scenario: DemoScenario) {
  return `${TESTE_BANNER}\n\n${scenario.body}`;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "agenda_confirmacao",
    label: "Confirmação de agendamento",
    module: "Agenda",
    profile: "Cliente / Paciente / Aluno fictício",
    subject: "Confirmação de agendamento",
    body:
      "Seu agendamento fictício foi confirmado com sucesso. Esta simulação mostra como o cliente, paciente ou aluno receberia uma confirmação automática em uma operação real.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "agenda_lembrete",
    label: "Lembrete de horário",
    module: "Agenda",
    profile: "Cliente / Paciente fictício",
    subject: "Lembrete de consulta",
    body:
      "Este é um lembrete fictício do seu próximo compromisso. Em uma operação real, o lembrete sairia automaticamente conforme a regra configurada (24h, 2h, 30min antes).",
    channels: ["whatsapp", "email"],
  },
  {
    id: "pagamento_aprovado",
    label: "Pagamento aprovado",
    module: "Financeiro / Pagamentos",
    profile: "Comprador / Cliente fictício",
    subject: "Pagamento aprovado",
    body:
      "O pagamento fictício foi aprovado e a baixa automática foi simulada. Em uma operação real, essa etapa poderia confirmar uma agenda, reserva, pedido, ingresso ou serviço.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "recuperacao_carrinho",
    label: "Recuperação de carrinho / Pix pendente",
    module: "CRM / Recuperação",
    profile: "Comprador fictício",
    subject: "Recuperação de pagamento pendente",
    body:
      "Esta simulação mostra como o CRM poderia recuperar um Pix pendente, boleto pendente ou cartão recusado, com mensagem automática personalizada.",
    channels: ["whatsapp", "email"],
  },
  {
    id: "evento_ingresso",
    label: "Ingresso confirmado (Eventos)",
    module: "Eventos",
    profile: "Participante fictício",
    subject: "Ingresso confirmado",
    body:
      "Seu ingresso fictício foi confirmado. Esta simulação mostra como o participante receberia a confirmação após pagamento aprovado.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "evento_pesquisa",
    label: "Pesquisa pós-evento",
    module: "Eventos",
    profile: "Participante fictício",
    subject: "Pesquisa de satisfação",
    body:
      "Queremos mostrar como a pesquisa pós-evento funcionaria em uma operação real. Responda esta simulação para visualizar o fluxo de avaliação.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "ehr_resultado",
    label: "Aviso ao paciente (Prontuário)",
    module: "Clínicas / EHR",
    profile: "Paciente fictício",
    subject: "Resultado de exame disponível",
    body:
      "Aviso fictício: o resultado do seu exame foi disponibilizado pelo profissional. Em uma operação real, o paciente acessaria o documento via link seguro.",
    channels: ["whatsapp", "email"],
  },
  {
    id: "afiliado_comissao",
    label: "Aviso ao afiliado",
    module: "Afiliados",
    profile: "Afiliado / Coprodutor fictício",
    subject: "Nova comissão registrada",
    body:
      "Simulação de aviso ao afiliado: uma nova venda fictícia gerou comissão. Em uma operação real, esse aviso sai automaticamente após o webhook de pagamento aprovado.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "delivery_status",
    label: "Status de entrega (Delivery)",
    module: "Delivery",
    profile: "Cliente / Entregador fictício",
    subject: "Pedido a caminho",
    body:
      "Pedido fictício saiu para entrega. Esta simulação mostra como o cliente receberia atualizações de status em tempo real do entregador.",
    channels: ["whatsapp", "email"],
  },
  {
    id: "viagem_checklist",
    label: "Checklist de viagem",
    module: "Viagens",
    profile: "Viajante / Consultor fictício",
    subject: "Seu checklist está pronto",
    body:
      "Roteiro fictício pronto para revisão. Esta simulação mostra como o consultor envia o checklist e o pagamento de sinal ao viajante.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "white_label_briefing",
    label: "Briefing White Label",
    module: "White Label",
    profile: "Parceiro / Cliente final fictício",
    subject: "Diagnóstico recebido",
    body:
      "Briefing fictício recebido pelo parceiro white-label. Simulação do retorno automático enviado ao cliente final após o diagnóstico.",
    channels: ["email", "whatsapp"],
  },
  {
    id: "follow_up",
    label: "Follow-up automático (CRM)",
    module: "CRM",
    profile: "Lead fictício",
    subject: "Follow-up automático",
    body:
      "Mensagem fictícia de follow-up de um lead que não respondeu. Em produção, regras do CRM disparam essa cadência automaticamente.",
    channels: ["whatsapp", "email"],
  },
];

export function getScenario(id: string) {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}

export interface SimulateOptions {
  scenario: DemoScenario;
  contact: DemoTestContact;
  channel: "email" | "whatsapp";
}

/**
 * "Sends" a test message. No external gateway is wired in the demo, so this
 * always records the attempt as `aguardando_integracao` and produces a log
 * entry that the user can inspect. Real dispatch would require connecting
 * SMTP / WhatsApp API credentials in production.
 */
/**
 * Sends a real TEST message via the public demo endpoint, which reuses the
 * production email queue and the Z-API WhatsApp helper. Every message is
 * forced server-side to contain TESTE in subject and body. The result is
 * appended to the local demo log so the lead can audit each dispatch.
 */
export async function simulateSend(opts: SimulateOptions): Promise<DemoTestLogEntry> {
  const { scenario, contact, channel } = opts;
  const recipient =
    channel === "email" ? contact.demo_test_email : contact.demo_test_whatsapp;

  const baseEntry: DemoTestLogEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    scenario_id: scenario.id,
    scenario_label: scenario.label,
    module: scenario.module,
    profile: scenario.profile,
    channel,
    recipient,
    subject: channel === "email" ? buildSubject(scenario) : undefined,
    body: buildBody(scenario),
    status: "preparado",
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/public/demo/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        recipient,
        scenario_id: scenario.id,
        scenario_label: scenario.label,
        scenario_module: scenario.module,
        subject: channel === "email" ? buildSubject(scenario) : undefined,
        body: buildBody(scenario),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      status?: string;
      error?: string;
    };
    if (res.ok && json.ok) {
      baseEntry.status = json.status === "sent" ? "enviado" : "enviado";
    } else {
      baseEntry.status = "falhou";
    }
  } catch {
    baseEntry.status = "falhou";
  }

  pushDemoLog(baseEntry);
  return baseEntry;
}

