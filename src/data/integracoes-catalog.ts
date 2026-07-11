/**
 * Catálogo estático de integrações do Core Impulsionando.
 * ▸ Somente layout — dados mock. As integrações reais (OAuth, tokens,
 *   sincronização) serão implementadas pelo Codex. O Lovable entrega
 *   apenas a experiência de uso.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AtSign,
  BarChart3,
  Briefcase,
  Cable,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Music2,
  Play,
  Send,
  Share2,
  ShoppingBag,
  Store,
  Sparkles,
  Tag,
  Target,
  Video,
  Webhook,
  Workflow,
  Youtube,
  Zap,
} from "lucide-react";

export type IntegrationConnState =
  | "conectado"
  | "atencao"
  | "erro"
  | "nao-configurado"
  | "sincronizando";

export type IntegrationField = {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "password" | "select" | "url";
  options?: string[];
  optional?: boolean;
};

export type IntegrationGroupSlug =
  | "marketing"
  | "redes-sociais"
  | "mensagens"
  | "crm"
  | "automacao";

export type IntegrationItem = {
  slug: string;
  name: string;
  group: IntegrationGroupSlug;
  icon: LucideIcon;
  description: string;
  state: IntegrationConnState;
  lastSync?: string;
  requirements: string[];
  fields: IntegrationField[];
  docsUrl?: string;
};

export const INTEGRATION_GROUPS: {
  slug: IntegrationGroupSlug;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    slug: "marketing",
    label: "Marketing",
    description: "Anúncios, mensuração e analytics em um só lugar.",
    icon: Target,
  },
  {
    slug: "redes-sociais",
    label: "Redes Sociais",
    description: "Presença orgânica e conteúdo dos seus canais.",
    icon: Share2,
  },
  {
    slug: "mensagens",
    label: "Mensagens",
    description: "Conversas com clientes em todos os canais.",
    icon: MessageCircle,
  },
  { slug: "crm", label: "CRM", description: "Base de contatos e relacionamento.", icon: Briefcase },
  {
    slug: "automacao",
    label: "Automação",
    description: "Fluxos, webhooks e integrações programáveis.",
    icon: Workflow,
  },
];

const F = (fields: IntegrationField[]) => fields;

export const INTEGRATIONS: IntegrationItem[] = [
  // Marketing
  {
    slug: "google-ads",
    name: "Google Ads",
    group: "marketing",
    icon: Target,
    description: "Campanhas de busca, display e conversões do Google Ads.",
    state: "nao-configurado",
    requirements: ["Ter uma conta ativa no Google Ads", "Ser administrador da conta"],
    fields: F([
      { id: "customer_id", label: "Customer ID", placeholder: "000-000-0000" },
      { id: "conversion_id", label: "Conversion ID" },
      { id: "conversion_label", label: "Conversion Label", optional: true },
      { id: "developer_token", label: "Developer Token", type: "password", optional: true },
    ]),
  },
  {
    slug: "google-analytics",
    name: "Google Analytics",
    group: "marketing",
    icon: BarChart3,
    description: "Sessões, usuários, conversões e origem de tráfego.",
    state: "conectado",
    lastSync: "há 2 minutos",
    requirements: ["Propriedade GA4 ativa"],
    fields: F([{ id: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXX" }]),
  },
  {
    slug: "google-tag-manager",
    name: "Google Tag Manager",
    group: "marketing",
    icon: Tag,
    description: "Gerencie tags e disparos sem editar código.",
    state: "atencao",
    lastSync: "há 3 dias",
    requirements: ["Container GTM criado"],
    fields: F([{ id: "container_id", label: "Container ID", placeholder: "GTM-XXXXXX" }]),
  },
  {
    slug: "meta-ads",
    name: "Meta Ads",
    group: "marketing",
    icon: Facebook,
    description: "Facebook, Instagram e Audience Network.",
    state: "erro",
    lastSync: "há 1 dia",
    requirements: ["Business Manager configurado", "Pixel instalado"],
    fields: F([
      { id: "business_id", label: "Business ID" },
      { id: "pixel_id", label: "Pixel" },
      { id: "access_token", label: "Access Token", type: "password" },
    ]),
  },
  {
    slug: "tiktok-ads",
    name: "TikTok Ads",
    group: "marketing",
    icon: Music2,
    description: "Campanhas de vídeo e performance no TikTok.",
    state: "nao-configurado",
    requirements: ["Conta TikTok for Business"],
    fields: F([
      { id: "advertiser_id", label: "Advertiser ID" },
      { id: "pixel_id", label: "Pixel ID" },
    ]),
  },
  {
    slug: "linkedin-ads",
    name: "LinkedIn Ads",
    group: "marketing",
    icon: Linkedin,
    description: "Campanhas B2B e geração de leads.",
    state: "nao-configurado",
    requirements: ["Campaign Manager ativo"],
    fields: F([
      { id: "account_id", label: "Account ID" },
      { id: "conversion_id", label: "Conversion ID" },
    ]),
  },
  {
    slug: "pinterest-ads",
    name: "Pinterest Ads",
    group: "marketing",
    icon: Sparkles,
    description: "Campanhas visuais para inspiração e descoberta.",
    state: "nao-configurado",
    requirements: ["Conta comercial no Pinterest"],
    fields: F([{ id: "ad_account_id", label: "Ad Account ID" }]),
  },
  {
    slug: "microsoft-ads",
    name: "Microsoft Ads",
    group: "marketing",
    icon: Target,
    description: "Anúncios na rede Bing e parceiros Microsoft.",
    state: "nao-configurado",
    requirements: ["Conta Microsoft Advertising"],
    fields: F([{ id: "customer_id", label: "Customer ID" }]),
  },
  {
    slug: "apple-search-ads",
    name: "Apple Search Ads",
    group: "marketing",
    icon: Target,
    description: "Anúncios de busca na App Store.",
    state: "nao-configurado",
    requirements: ["Conta Apple Search Ads"],
    fields: F([{ id: "org_id", label: "Org ID" }]),
  },
  {
    slug: "google-business",
    name: "Google Business",
    group: "marketing",
    icon: Store,
    description: "Ficha do Google, avaliações e mensagens.",
    state: "conectado",
    lastSync: "há 15 minutos",
    requirements: ["Perfil verificado no Google"],
    fields: F([{ id: "location_id", label: "Location ID" }]),
  },
  // Redes Sociais
  {
    slug: "instagram",
    name: "Instagram",
    group: "redes-sociais",
    icon: Instagram,
    description: "Publicações, stories, reels e insights.",
    state: "conectado",
    lastSync: "há 1 hora",
    requirements: ["Conta profissional vinculada a uma página do Facebook"],
    fields: F([{ id: "ig_user_id", label: "Instagram User ID" }]),
  },
  {
    slug: "facebook",
    name: "Facebook",
    group: "redes-sociais",
    icon: Facebook,
    description: "Página, publicações e engajamento.",
    state: "conectado",
    lastSync: "há 1 hora",
    requirements: ["Ser administrador da página"],
    fields: F([{ id: "page_id", label: "Page ID" }]),
  },
  {
    slug: "messenger",
    name: "Messenger",
    group: "redes-sociais",
    icon: MessageSquare,
    description: "Conversas do Messenger integradas ao inbox.",
    state: "atencao",
    requirements: ["Página do Facebook conectada"],
    fields: F([{ id: "page_id", label: "Page ID" }]),
  },
  {
    slug: "threads",
    name: "Threads",
    group: "redes-sociais",
    icon: AtSign,
    description: "Conteúdo e conversas na rede Threads.",
    state: "nao-configurado",
    requirements: ["Perfil Threads vinculado ao Instagram"],
    fields: F([{ id: "handle", label: "Usuário" }]),
  },
  {
    slug: "tiktok",
    name: "TikTok",
    group: "redes-sociais",
    icon: Music2,
    description: "Vídeos, insights e mensagens.",
    state: "nao-configurado",
    requirements: ["Conta TikTok"],
    fields: F([{ id: "handle", label: "Usuário" }]),
  },
  {
    slug: "linkedin",
    name: "LinkedIn",
    group: "redes-sociais",
    icon: Linkedin,
    description: "Página empresarial e publicações.",
    state: "nao-configurado",
    requirements: ["Ser administrador da página"],
    fields: F([{ id: "org_id", label: "Organization ID" }]),
  },
  {
    slug: "x",
    name: "X",
    group: "redes-sociais",
    icon: AtSign,
    description: "Publicações e menções em tempo real.",
    state: "nao-configurado",
    requirements: ["Conta X"],
    fields: F([{ id: "handle", label: "Usuário" }]),
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    group: "redes-sociais",
    icon: Sparkles,
    description: "Pins, boards e desempenho.",
    state: "nao-configurado",
    requirements: ["Conta comercial"],
    fields: F([{ id: "profile", label: "Perfil" }]),
  },
  {
    slug: "youtube",
    name: "YouTube",
    group: "redes-sociais",
    icon: Youtube,
    description: "Canal, vídeos e insights.",
    state: "nao-configurado",
    requirements: ["Canal com acesso de proprietário"],
    fields: F([{ id: "channel_id", label: "Channel ID" }]),
  },
  // Mensagens
  {
    slug: "whatsapp",
    name: "WhatsApp",
    group: "mensagens",
    icon: MessageCircle,
    description: "Conversas com clientes pelo WhatsApp oficial.",
    state: "conectado",
    lastSync: "agora",
    requirements: ["Número verificado no WhatsApp Business"],
    fields: F([
      { id: "phone_number_id", label: "Número (ID)" },
      { id: "waba_id", label: "WABA ID" },
    ]),
  },
  {
    slug: "telegram",
    name: "Telegram",
    group: "mensagens",
    icon: Send,
    description: "Canais e bots via Telegram.",
    state: "nao-configurado",
    requirements: ["Bot criado pelo BotFather"],
    fields: F([{ id: "bot_token", label: "Bot Token", type: "password" }]),
  },
  {
    slug: "messenger-inbox",
    name: "Messenger",
    group: "mensagens",
    icon: MessageSquare,
    description: "Conversas do Messenger no inbox unificado.",
    state: "atencao",
    requirements: ["Página do Facebook conectada"],
    fields: F([{ id: "page_id", label: "Page ID" }]),
  },
  {
    slug: "instagram-direct",
    name: "Instagram Direct",
    group: "mensagens",
    icon: Instagram,
    description: "Mensagens diretas do Instagram.",
    state: "conectado",
    lastSync: "há 5 minutos",
    requirements: ["Conta profissional Instagram conectada"],
    fields: F([{ id: "ig_user_id", label: "Instagram User ID" }]),
  },
  {
    slug: "chat-site",
    name: "Chat do Site",
    group: "mensagens",
    icon: MessageCircle,
    description: "Widget de chat embutido no site.",
    state: "nao-configurado",
    requirements: ["Site publicado com o script instalado"],
    fields: F([{ id: "widget_id", label: "Widget ID" }]),
  },
  {
    slug: "app-inbox",
    name: "Aplicativo",
    group: "mensagens",
    icon: Play,
    description: "Mensagens do aplicativo do cliente.",
    state: "nao-configurado",
    requirements: ["App publicado"],
    fields: F([{ id: "app_id", label: "App ID" }]),
  },
  // CRM
  {
    slug: "hubspot",
    name: "HubSpot",
    group: "crm",
    icon: Briefcase,
    description: "Contatos, negócios e pipeline do HubSpot.",
    state: "nao-configurado",
    requirements: ["Conta HubSpot ativa"],
    fields: F([{ id: "hub_id", label: "Hub ID" }]),
  },
  {
    slug: "rd-station",
    name: "RD Station",
    group: "crm",
    icon: Briefcase,
    description: "Contatos, leads e automações da RD.",
    state: "nao-configurado",
    requirements: ["Conta RD Station"],
    fields: F([{ id: "account", label: "Conta" }]),
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    group: "crm",
    icon: Briefcase,
    description: "Base Salesforce sincronizada.",
    state: "nao-configurado",
    requirements: ["Org Salesforce"],
    fields: F([{ id: "org_id", label: "Org ID" }]),
  },
  {
    slug: "activecampaign",
    name: "ActiveCampaign",
    group: "crm",
    icon: Mail,
    description: "Automação de marketing e CRM.",
    state: "nao-configurado",
    requirements: ["Conta ActiveCampaign"],
    fields: F([{ id: "account_url", label: "URL da conta", type: "url" }]),
  },
  {
    slug: "mailchimp",
    name: "Mailchimp",
    group: "crm",
    icon: Mail,
    description: "Listas e campanhas de e-mail.",
    state: "nao-configurado",
    requirements: ["Conta Mailchimp"],
    fields: F([{ id: "audience_id", label: "Audience ID" }]),
  },
  {
    slug: "brevo",
    name: "Brevo",
    group: "crm",
    icon: Mail,
    description: "E-mail, SMS e CRM em um só lugar.",
    state: "nao-configurado",
    requirements: ["Conta Brevo"],
    fields: F([{ id: "workspace", label: "Workspace" }]),
  },
  // Automação
  {
    slug: "n8n",
    name: "N8N",
    group: "automacao",
    icon: Workflow,
    description: "Fluxos de automação self-hosted.",
    state: "conectado",
    lastSync: "há 3 minutos",
    requirements: ["Instância N8N acessível"],
    fields: F([
      { id: "base_url", label: "URL da instância", type: "url" },
      { id: "api_key", label: "Chave de acesso", type: "password" },
    ]),
  },
  {
    slug: "make",
    name: "Make",
    group: "automacao",
    icon: Zap,
    description: "Cenários de automação Make (Integromat).",
    state: "nao-configurado",
    requirements: ["Conta Make"],
    fields: F([{ id: "team_id", label: "Team ID" }]),
  },
  {
    slug: "zapier",
    name: "Zapier",
    group: "automacao",
    icon: Zap,
    description: "Zaps conectando aplicativos externos.",
    state: "nao-configurado",
    requirements: ["Conta Zapier"],
    fields: F([{ id: "webhook_url", label: "URL do Zap", type: "url" }]),
  },
  {
    slug: "webhooks",
    name: "Webhooks",
    group: "automacao",
    icon: Webhook,
    description: "Endpoints HTTP para eventos do Core.",
    state: "atencao",
    requirements: ["Endpoint HTTPS válido"],
    fields: F([{ id: "endpoint", label: "Endpoint", type: "url" }]),
  },
  {
    slug: "apis",
    name: "APIs",
    group: "automacao",
    icon: Cable,
    description: "Integrações programáveis via API.",
    state: "nao-configurado",
    requirements: ["Documentação da API alvo"],
    fields: F([
      { id: "base_url", label: "Base URL", type: "url" },
      { id: "token", label: "Token", type: "password" },
    ]),
  },
];

export function integrationsByGroup(slug: IntegrationGroupSlug) {
  return INTEGRATIONS.filter((i) => i.group === slug);
}

export function findIntegration(group: string, slug: string) {
  return INTEGRATIONS.find((i) => i.group === group && i.slug === slug);
}

// Ícones auxiliares exportados para outras telas
export { Globe, ShoppingBag, Video, Activity };
