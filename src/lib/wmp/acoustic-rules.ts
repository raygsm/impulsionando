/**
 * WMP — Pré-diagnóstico acústico determinístico.
 * Sem IA, sem rede. Tudo síncrono e auditável.
 *
 * Inputs no briefing:
 *  - ambiente.tipo: "fechado" | "aberto" | "semi_aberto"
 *  - ambiente.material_piso: "carpete" | "madeira" | "ceramica" | "concreto"
 *  - ambiente.material_paredes: "drywall" | "alvenaria" | "vidro" | "espelho" | "tecido"
 *  - ambiente.teto_altura_m: number
 *  - medidas.largura_m, medidas.comprimento_m
 *  - evento.publico_estimado
 *  - acustica.estilo: "dj_eletronico" | "banda_rock" | "voz_palestra" | "musica_ambiente" | "show_grande_porte"
 *  - acustica.horario_fim: "HH:MM" (regra de PMOC/decibel noturno)
 */

export type WmpAcousticInput = {
  ambiente: {
    tipo?: "fechado" | "aberto" | "semi_aberto";
    material_piso?: "carpete" | "madeira" | "ceramica" | "concreto";
    material_paredes?: "drywall" | "alvenaria" | "vidro" | "espelho" | "tecido";
    teto_altura_m?: number;
  };
  medidas: {
    largura_m?: number;
    comprimento_m?: number;
  };
  evento: {
    publico_estimado?: number;
    horario_fim?: string; // "HH:MM"
    tipo?: string;
  };
  acustica: {
    estilo?:
      | "dj_eletronico"
      | "banda_rock"
      | "voz_palestra"
      | "musica_ambiente"
      | "show_grande_porte";
  };
};

export type WmpAcousticDiagnosis = {
  area_m2: number;
  volume_m3: number | null;
  reverberacao_estimada_s: number | null; // segundos (RT60 simplificado Sabine)
  potencia_recomendada_w: number;         // W RMS totais (PA principal)
  subwoofer_recomendado_w: number;        // W RMS (sub)
  monitores_qtd: number;
  microfones_qtd: number;
  iluminacao_par_qtd: number;
  iluminacao_movingheads_qtd: number;
  alertas: string[];                       // mensagens de risco / cuidado
  recomendacoes: string[];                 // dicas práticas
  pacote_sugerido: "basico" | "intermediario" | "avancado" | "premium";
  confianca: "baixa" | "media" | "alta";   // baseada na completude dos inputs
};

// Coeficientes de absorção médios (250–1k Hz, Sabine simplificado)
const ABS_PISO: Record<string, number> = {
  carpete: 0.35,
  madeira: 0.10,
  ceramica: 0.03,
  concreto: 0.02,
};
const ABS_PAREDE: Record<string, number> = {
  drywall: 0.10,
  alvenaria: 0.04,
  vidro: 0.03,
  espelho: 0.02,
  tecido: 0.45,
};

// W RMS PA por pessoa por estilo (referência prática de mercado)
const W_POR_PESSOA: Record<string, number> = {
  dj_eletronico: 12,
  banda_rock: 14,
  voz_palestra: 3,
  musica_ambiente: 2,
  show_grande_porte: 18,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function diagnoseAcoustics(input: WmpAcousticInput): WmpAcousticDiagnosis {
  const alertas: string[] = [];
  const recomendacoes: string[] = [];

  const largura = Number(input.medidas?.largura_m ?? 0);
  const comprimento = Number(input.medidas?.comprimento_m ?? 0);
  const altura = Number(input.ambiente?.teto_altura_m ?? 0);
  const publico = Number(input.evento?.publico_estimado ?? 0);
  const estilo = input.acustica?.estilo ?? "musica_ambiente";

  const area = largura > 0 && comprimento > 0 ? largura * comprimento : 0;
  const volume = area > 0 && altura > 0 ? area * altura : null;

  // RT60 Sabine simplificado: T = 0.161 * V / A_total
  let rt60: number | null = null;
  if (volume && area > 0 && altura > 0) {
    const absPiso = ABS_PISO[input.ambiente?.material_piso ?? "concreto"] ?? 0.05;
    const absParede = ABS_PAREDE[input.ambiente?.material_paredes ?? "alvenaria"] ?? 0.05;
    const sPiso = area;
    const sParedes = 2 * (largura + comprimento) * altura;
    const sTeto = area;
    const aTotal = sPiso * absPiso + sParedes * absParede + sTeto * 0.05;
    if (aTotal > 0) rt60 = +(0.161 * volume / aTotal).toFixed(2);
  }

  if (rt60 !== null) {
    if (rt60 > 1.6 && (estilo === "voz_palestra" || estilo === "banda_rock")) {
      alertas.push(
        `Reverberação estimada em ${rt60}s — alta para ${estilo === "voz_palestra" ? "palestras" : "bandas"}. Recomendamos painéis acústicos móveis ou cortinas pesadas.`,
      );
    }
    if (rt60 > 2.2) {
      alertas.push("Ambiente extremamente reverberante: priorize line array compacto direcionado e delays para evitar ecos.");
    }
  }

  // Potência total
  const wPorPessoa = W_POR_PESSOA[estilo] ?? 4;
  const basePotencia = publico > 0 ? publico * wPorPessoa : Math.max(800, area * 8);
  const fatorAberto = input.ambiente?.tipo === "aberto" ? 1.6 : input.ambiente?.tipo === "semi_aberto" ? 1.25 : 1.0;
  const potenciaTotal = Math.round(basePotencia * fatorAberto);

  // Subwoofer: 35–45% da potência total dependendo do estilo
  const subRatio = estilo === "dj_eletronico" || estilo === "show_grande_porte" ? 0.45
    : estilo === "banda_rock" ? 0.40
    : estilo === "musica_ambiente" ? 0.20
    : 0.15;
  const subPotencia = Math.round(potenciaTotal * subRatio);

  // Microfones e monitores conforme estilo
  let microfones = 2;
  let monitores = 2;
  let parLed = 4;
  let movingHeads = 0;
  switch (estilo) {
    case "banda_rock":
      microfones = 8; monitores = 4; parLed = 12; movingHeads = 4; break;
    case "show_grande_porte":
      microfones = 12; monitores = 6; parLed = 24; movingHeads = 8; break;
    case "dj_eletronico":
      microfones = 2; monitores = 2; parLed = 16; movingHeads = 6; break;
    case "voz_palestra":
      microfones = 4; monitores = 2; parLed = 6; movingHeads = 0; break;
    case "musica_ambiente":
      microfones = 2; monitores = 2; parLed = 4; movingHeads = 0; break;
  }
  // Ajuste por público
  if (publico > 300) { parLed = Math.round(parLed * 1.5); movingHeads = Math.round(movingHeads * 1.5); }
  if (publico > 800) { parLed = Math.round(parLed * 1.5); movingHeads = Math.round(movingHeads * 1.5); }

  // Horário noturno → alerta de PMOC (limites municipais típicos)
  if (input.evento?.horario_fim) {
    const [hh] = input.evento.horario_fim.split(":").map(Number);
    if (!Number.isNaN(hh) && (hh >= 22 || hh < 6) && input.ambiente?.tipo !== "fechado") {
      alertas.push("Encerramento após 22h em ambiente aberto/semi-aberto: verifique a Lei do Silêncio do município. WMP envia laudo de pressão sonora (dB) sob demanda.");
    }
  }

  if (input.ambiente?.material_paredes === "vidro" || input.ambiente?.material_paredes === "espelho") {
    recomendacoes.push("Paredes refletivas: usar painéis absorventes pontuais atrás do palco para limpar a região médio-alta.");
  }
  if (input.ambiente?.tipo === "aberto") {
    recomendacoes.push("Evento aberto: prever cobertura contra chuva para PA, mesa e cabos. Stage box com IP54 inclusa nos pacotes Avançado e Premium.");
  }
  if (publico > 500 && monitores < 4) monitores = 4;

  // Pacote sugerido
  let pacote: WmpAcousticDiagnosis["pacote_sugerido"] = "basico";
  if (potenciaTotal > 1500) pacote = "intermediario";
  if (potenciaTotal > 4000) pacote = "avancado";
  if (potenciaTotal > 9000 || estilo === "show_grande_porte") pacote = "premium";

  // Confiança do diagnóstico
  const completos = [largura, comprimento, altura, publico].filter((n) => n > 0).length;
  const confianca: WmpAcousticDiagnosis["confianca"] =
    completos === 4 ? "alta" : completos >= 2 ? "media" : "baixa";

  return {
    area_m2: +area.toFixed(1),
    volume_m3: volume ? +volume.toFixed(1) : null,
    reverberacao_estimada_s: rt60,
    potencia_recomendada_w: clamp(potenciaTotal, 300, 60000),
    subwoofer_recomendado_w: clamp(subPotencia, 0, 30000),
    monitores_qtd: monitores,
    microfones_qtd: microfones,
    iluminacao_par_qtd: parLed,
    iluminacao_movingheads_qtd: movingHeads,
    alertas,
    recomendacoes,
    pacote_sugerido: pacote,
    confianca,
  };
}
