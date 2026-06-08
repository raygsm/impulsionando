// Biblioteca de seções reutilizáveis para o Criador de Páginas (Fase 4).
// Usadas para montar páginas declarativas sem novo prompt no Lovable.
export type PageSectionKey =
  | "hero"
  | "dor"
  | "solucao"
  | "beneficios"
  | "como_funciona"
  | "modulos"
  | "demo"
  | "depoimentos"
  | "planos"
  | "faq"
  | "cta_whatsapp"
  | "cta_contratar"
  | "rodape"
  | "lgpd"
  | "termos";

export interface PageSectionDef {
  key: PageSectionKey;
  label: string;
  description: string;
  defaults: {
    title?: string;
    subtitle?: string;
    body?: string;
    cta?: string;
  };
}

export const PAGE_SECTIONS: PageSectionDef[] = [
  { key: "hero", label: "Hero principal", description: "Destaque do topo da página", defaults: { title: "{{nome_cliente}}", subtitle: "{{cta_principal}}", cta: "Falar no WhatsApp" } },
  { key: "dor", label: "Problema / Dor", description: "Identifica a dor do cliente", defaults: { title: "Você sente que..." } },
  { key: "solucao", label: "Solução", description: "Apresenta a solução", defaults: { title: "Nossa solução" } },
  { key: "beneficios", label: "Benefícios", description: "Lista de benefícios", defaults: { title: "Benefícios", body: "{{beneficios}}" } },
  { key: "como_funciona", label: "Como funciona", description: "Passo a passo", defaults: { title: "Como funciona" } },
  { key: "modulos", label: "Módulos disponíveis", description: "Lista dos módulos contratados", defaults: { title: "Soluções", body: "{{modulos}}" } },
  { key: "demo", label: "Demonstração", description: "Bloco com CTA para demo", defaults: { title: "Veja em ação", cta: "Ver demo" } },
  { key: "depoimentos", label: "Depoimentos", description: "Provas sociais", defaults: { title: "Quem usa recomenda" } },
  { key: "planos", label: "Planos", description: "Tabela de planos", defaults: { title: "Planos e preços" } },
  { key: "faq", label: "FAQ", description: "Dúvidas frequentes", defaults: { title: "Perguntas frequentes" } },
  { key: "cta_whatsapp", label: "CTA WhatsApp", description: "Botão para WhatsApp", defaults: { cta: "Falar no WhatsApp", body: "{{whatsapp}}" } },
  { key: "cta_contratar", label: "CTA Contratar", description: "Botão de conversão", defaults: { cta: "Contratar agora" } },
  { key: "rodape", label: "Rodapé", description: "Rodapé padrão", defaults: { body: "© {{nome_cliente}} — Todos os direitos reservados." } },
  { key: "lgpd", label: "LGPD", description: "Aviso LGPD", defaults: { title: "Privacidade e LGPD" } },
  { key: "termos", label: "Termos de uso", description: "Termos de uso", defaults: { title: "Termos de uso" } },
];

export interface PageSectionInstance {
  key: PageSectionKey;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  body?: string;
  cta?: string;
}

export function defaultSectionsForNiche(_niche?: string | null): PageSectionInstance[] {
  // Reaproveitamento absoluto: ordem padrão única; nichos ajustam apenas defaults.
  return PAGE_SECTIONS.map((s, i) => ({
    key: s.key,
    enabled: !["lgpd", "termos"].includes(s.key),
    order: i,
    ...s.defaults,
  }));
}
