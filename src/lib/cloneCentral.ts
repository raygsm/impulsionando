// Central Interna de Clonagem de Módulos — Impulsionando
// Estrutura técnica reaproveitável (BLOCO 1/4).
// Frontend-only / localStorage. Não toca em dados reais.

export type CloneLayer = "base" | "demo" | "real";

export interface CloneModulePermissionFlags {
  canAccessCloneCenter: boolean; // Pode acessar Central Interna de Clonagem?
  canCloneToProject: boolean;    // Pode clonar módulo para novo projeto/cliente?
  canViewCloneLogs: boolean;     // Pode ver logs internos de clonagem?
}

export interface ModuleBase {
  id: string;
  slug: string;            // ex: "agenda-online"
  name: string;            // ex: "Agenda Online — Base v1.0"
  version: string;         // "1.0.0"
  description: string;
  status: "rascunho" | "estavel" | "descontinuado";
  // Estrutura técnica reaproveitável (preenchida nos próximos blocos)
  structure: {
    screens: string[];
    fields: string[];
    components: string[];
    flows: string[];
    rules: string[];
    parameters: string[];
    defaultPermissions: string[];
    defaultDashboards: string[];
    messageTemplates: string[];
    automations: string[];
    integrations: string[];
    demoMocks: string[];
    nichePresets: string[];
    logsStructure: string[];
    initialConfig: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CloneInstance {
  id: string;
  baseId: string;          // referência ao ModuleBase
  layer: Exclude<CloneLayer, "base">; // "demo" | "real"
  targetName: string;      // nome do projeto/cliente/demo
  niche?: string;
  notes?: string;
  createdAt: string;
}

export interface CloneLog {
  id: string;
  at: string;
  actor: string;           // email/nome do usuário interno
  action:
    | "criou-base"
    | "atualizou-base"
    | "clonou-demo"
    | "clonou-real"
    | "removeu"
    | "tentativa-acesso-negado";
  detail: string;
}

const K_BASES = "imp.clone.bases.v1";
const K_INSTANCES = "imp.clone.instances.v1";
const K_LOGS = "imp.clone.logs.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const cloneStore = {
  listBases(): ModuleBase[] {
    return read<ModuleBase[]>(K_BASES, []);
  },
  saveBase(base: ModuleBase) {
    const all = cloneStore.listBases();
    const i = all.findIndex((b) => b.id === base.id);
    if (i >= 0) all[i] = base;
    else all.push(base);
    write(K_BASES, all);
  },
  removeBase(id: string) {
    write(K_BASES, cloneStore.listBases().filter((b) => b.id !== id));
  },

  listInstances(): CloneInstance[] {
    return read<CloneInstance[]>(K_INSTANCES, []);
  },
  saveInstance(inst: CloneInstance) {
    const all = cloneStore.listInstances();
    all.push(inst);
    write(K_INSTANCES, all);
  },
  removeInstance(id: string) {
    write(K_INSTANCES, cloneStore.listInstances().filter((i) => i.id !== id));
  },

  listLogs(): CloneLog[] {
    return read<CloneLog[]>(K_LOGS, []);
  },
  pushLog(log: Omit<CloneLog, "id" | "at">) {
    const all = cloneStore.listLogs();
    all.unshift({
      ...log,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    });
    write(K_LOGS, all.slice(0, 500));
  },
};

export function uid() {
  return crypto.randomUUID();
}

// Módulos preparados para receber base nos próximos blocos
export const PLANNED_MODULES: { slug: string; name: string }[] = [
  { slug: "agenda-online", name: "Agenda Online" },
  { slug: "crm", name: "CRM" },
  { slug: "whatsapp-inteligente", name: "WhatsApp Inteligente" },
  { slug: "pdv-comandas", name: "PDV e Comandas" },
  { slug: "eventos-ingressos", name: "Eventos e Ingressos" },
  { slug: "afiliados-produtos", name: "Afiliados e Produtos" },
  { slug: "wmp", name: "Prestação de Serviços com Parceiros / WMP" },
  { slug: "advogados", name: "Advogados e Escritórios Jurídicos" },
  { slug: "clinicas", name: "Clínicas e Consultórios" },
  { slug: "prontuario", name: "Prontuário Eletrônico" },
  { slug: "delivery", name: "Delivery" },
  { slug: "estoque", name: "Estoque" },
  { slug: "fitness", name: "Fitness" },
  { slug: "estetica", name: "Estética" },
  { slug: "white-label", name: "White Label" },
  { slug: "bi", name: "BI / Dashboards" },
  { slug: "tags-origem-roi", name: "Tags, Origem e ROI" },
];
