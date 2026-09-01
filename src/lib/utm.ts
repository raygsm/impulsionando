/**
 * Anexa parâmetros UTM a uma URL sem sobrescrever valores já presentes.
 * Usado nos CTAs de checkout, WhatsApp e e-book do site Colors Saúde para
 * rastrear campanha/origem no GA4 e no Search Console.
 */

export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export function appendUtm(rawUrl: string, utm: UtmParams): string {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : "https://colors.impulsionando.com.br");
    const map: Record<string, string | undefined> = {
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
      utm_term: utm.term,
    };
    for (const [k, v] of Object.entries(map)) {
      if (!v) continue;
      if (url.searchParams.has(k)) continue; // não sobrescreve
      url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** Preset padrão da Colors — mantém origem única no GA4. */
export function colorsUtm(campaign: string, content?: string): UtmParams {
  return {
    source: "colors_site",
    medium: "web",
    campaign,
    content,
  };
}

/** Aplica preset Colors direto na URL. */
export function withColorsUtm(url: string, campaign: string, content?: string) {
  return appendUtm(url, colorsUtm(campaign, content));
}
