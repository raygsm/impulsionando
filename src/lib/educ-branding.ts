import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EducBranding = {
  id: string;
  company_id: string | null;
  nome_exibicao: string;
  logo_url: string | null;
  favicon_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  hero_titulo: string | null;
  hero_subtitulo: string | null;
  cta_label: string | null;
  cta_url: string | null;
  rodape_texto: string | null;
};

const DEFAULTS: EducBranding = {
  id: "default",
  company_id: null,
  nome_exibicao: "Impulsionando Educação",
  logo_url: null,
  favicon_url: null,
  cor_primaria: "#0F172A",
  cor_secundaria: "#3B82F6",
  cor_fundo: "#FFFFFF",
  hero_titulo: "Plataforma educacional completa",
  hero_subtitulo: "Gestão de polos, matrículas e jornada do aluno em um só lugar.",
  cta_label: "Falar com especialista",
  cta_url: "/contato",
  rodape_texto: null,
};

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "0 0% 0%";
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Lê o branding de Educação (por company_id ou o ativo mais recente) e injeta
 * variáveis CSS no escopo do elemento alvo. Use no layout da área educacional.
 */
export function useEducBranding(companyId?: string | null) {
  const [branding, setBranding] = useState<EducBranding>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any).from("educ_white_label_branding").select("*").eq("ativo", true).limit(1);
      if (companyId) q = q.eq("company_id", companyId);
      const { data } = await q;
      if (cancel) return;
      const row = (data?.[0] as EducBranding | undefined) ?? DEFAULTS;
      setBranding(row);
      setLoading(false);
    }
    load();
    return () => { cancel = true; };
  }, [companyId]);

  // Aplica variáveis CSS no <html> com escopo via classe educ-branding
  useEffect(() => {
    const el = document.documentElement;
    el.style.setProperty("--educ-primary", hexToHsl(branding.cor_primaria));
    el.style.setProperty("--educ-secondary", hexToHsl(branding.cor_secundaria));
    el.style.setProperty("--educ-bg", hexToHsl(branding.cor_fundo));
    if (branding.favicon_url) {
      const link = (document.querySelector("link[rel='icon']") as HTMLLinkElement | null) ?? document.createElement("link");
      link.rel = "icon";
      link.href = branding.favicon_url;
      if (!link.parentNode) document.head.appendChild(link);
    }
    return () => {
      el.style.removeProperty("--educ-primary");
      el.style.removeProperty("--educ-secondary");
      el.style.removeProperty("--educ-bg");
    };
  }, [branding]);

  return { branding, loading };
}
