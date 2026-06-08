/**
 * Passos declarativos do "Assistente de Configuração do Módulo Instalado" (Fase 3).
 * Cada módulo define etapas e perguntas SIM/NÃO ou de texto.
 * Os valores são gravados em `company_settings` com chave `<modulo>.<setting_key>`.
 */

export type AssistantField = {
  key: string; // setting_definitions.key
  label: string;
  type: "boolean" | "text" | "number";
  description?: string;
  default?: boolean | string | number;
};

export type AssistantStep = {
  title: string;
  description?: string;
  fields: AssistantField[];
};

export type ModuleAssistant = {
  moduleSlug: string;
  steps: AssistantStep[];
};

const AGENDA: ModuleAssistant = {
  moduleSlug: "agenda",
  steps: [
    {
      title: "Identificação",
      fields: [
        { key: "agenda.has_units", label: "Terá unidades / filiais?", type: "boolean", default: false },
        { key: "agenda.has_rooms", label: "Terá salas?", type: "boolean", default: false },
      ],
    },
    {
      title: "Recursos ativos",
      fields: [
        { key: "agenda.has_professionals", label: "Terá profissionais?", type: "boolean", default: true },
        { key: "agenda.has_services", label: "Terá serviços?", type: "boolean", default: true },
        { key: "agenda.has_waitlist", label: "Terá fila de espera?", type: "boolean", default: true },
        { key: "agenda.has_substitution", label: "Terá substituição de profissional?", type: "boolean", default: false },
      ],
    },
    {
      title: "Permissões",
      fields: [
        { key: "agenda.permissions.default", label: "Aplicar permissões padrão?", type: "boolean", default: true },
      ],
    },
    {
      title: "Comunicação",
      fields: [
        { key: "agenda.notify_whatsapp", label: "Enviar WhatsApp?", type: "boolean", default: true },
        { key: "agenda.notify_email", label: "Enviar e-mail?", type: "boolean", default: true },
        { key: "agenda.reminder_24h", label: "Lembrete de 24h?", type: "boolean", default: true },
        { key: "agenda.reminder_2h", label: "Lembrete de 2h?", type: "boolean", default: true },
        { key: "agenda.no_show_followup", label: "Tratar no-show?", type: "boolean", default: true },
      ],
    },
    {
      title: "Integrações",
      fields: [
        { key: "agenda.has_payment", label: "Integrar pagamentos?", type: "boolean", default: false },
        { key: "agenda.has_voip", label: "Integrar VoIP?", type: "boolean", default: false },
      ],
    },
    {
      title: "Automação",
      fields: [
        { key: "agenda.automation.default", label: "Aplicar automações padrão?", type: "boolean", default: true },
        { key: "agenda.automation.triggers", label: "Aplicar gatilhos padrão?", type: "boolean", default: true },
      ],
    },
    {
      title: "Dashboard",
      fields: [
        { key: "agenda.dashboard.enabled", label: "Ativar dashboard do módulo?", type: "boolean", default: true },
        { key: "agenda.logs.advanced", label: "Ativar logs avançados?", type: "boolean", default: false },
      ],
    },
    {
      title: "Finalização",
      description: "Revise e conclua a configuração inicial. Você pode ajustar tudo depois em Parâmetros.",
      fields: [],
    },
  ],
};

const GENERIC: ModuleAssistant = {
  moduleSlug: "_default",
  steps: [
    {
      title: "Identificação",
      fields: [{ key: "_module.identified", label: "Módulo identificado", type: "boolean", default: true }],
    },
    { title: "Recursos ativos", fields: [{ key: "_module.enabled", label: "Habilitar módulo agora?", type: "boolean", default: true }] },
    { title: "Permissões", fields: [{ key: "_module.permissions.default", label: "Aplicar permissões padrão?", type: "boolean", default: true }] },
    { title: "Comunicação", fields: [{ key: "_module.comms.default", label: "Aplicar comunicação padrão?", type: "boolean", default: true }] },
    { title: "Integrações", fields: [] },
    { title: "Automação", fields: [{ key: "_module.automation.default", label: "Aplicar automação padrão?", type: "boolean", default: true }] },
    { title: "Dashboard", fields: [{ key: "_module.dashboard.enabled", label: "Ativar dashboard?", type: "boolean", default: true }] },
    { title: "Finalização", description: "Conclua a configuração inicial.", fields: [] },
  ],
};

export const MODULE_ASSISTANTS: Record<string, ModuleAssistant> = {
  agenda: AGENDA,
};

export function getModuleAssistant(slug: string): ModuleAssistant {
  return MODULE_ASSISTANTS[slug] ?? { ...GENERIC, moduleSlug: slug };
}
