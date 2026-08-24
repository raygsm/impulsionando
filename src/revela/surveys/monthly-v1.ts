export type RevelaQuestion = {
  id: string;
  prompt: string;
  kind: "scale" | "single" | "multi" | "text";
  dimension: string;
  longitudinal: boolean;
  options?: string[];
  followupKey?: string;
};

export const monthlyCoreQuestions: RevelaQuestion[] = [
  { id: "school_joy", prompt: "Neste mês, quanto você gostou de ir para a escola?", kind: "scale", dimension: "wellbeing", longitudinal: true },
  { id: "meaningful_learning", prompt: "Quanto você sentiu que aprendeu algo que realmente gostaria de continuar aprendendo?", kind: "scale", dimension: "curiosity", longitudinal: true },
  { id: "felt_capable", prompt: "Em quantos momentos você sentiu: ‘sou bom nisso’?", kind: "scale", dimension: "self_perception", longitudinal: true },
  { id: "voice", prompt: "Quanto você conseguiu mostrar suas ideias?", kind: "scale", dimension: "communication", longitudinal: true },
  { id: "heard", prompt: "Quanto você se sentiu ouvido pelos adultos da escola?", kind: "scale", dimension: "relationship", longitudinal: true },
  { id: "curiosity", prompt: "Quanto você teve vontade de descobrir alguma coisa nova?", kind: "scale", dimension: "curiosity", longitudinal: true },
  { id: "persistence", prompt: "Quando encontrou dificuldade, quanto teve vontade de continuar tentando?", kind: "scale", dimension: "execution", longitudinal: true },
  { id: "future_clarity", prompt: "Pensando no seu futuro, quanto você sente que está começando a enxergar possibilidades?", kind: "scale", dimension: "future", longitudinal: true },
];

export const monthlyRotatingPool: RevelaQuestion[] = [
  { id: "best_discovery", prompt: "Qual foi a coisa mais interessante que você descobriu neste mês?", kind: "text", dimension: "curiosity", longitudinal: false },
  { id: "flow_activity", prompt: "Qual atividade fez você perceber que o tempo passou rápido?", kind: "text", dimension: "engagement", longitudinal: false },
  { id: "less_of", prompt: "Que atividade você gostaria de fazer menos?", kind: "text", dimension: "preference", longitudinal: false },
  { id: "try_new", prompt: "Se amanhã você pudesse experimentar uma atividade que nunca fez, qual escolheria?", kind: "text", dimension: "exploration", longitudinal: false },
  { id: "improved_skill", prompt: "O que você acha que faz melhor hoje do que há seis meses?", kind: "text", dimension: "self_perception", longitudinal: false },
  { id: "joy_moment", prompt: "Qual momento da escola trouxe mais alegria neste mês?", kind: "text", dimension: "wellbeing", longitudinal: false },
  { id: "frustration", prompt: "O que mais te incomodou ou desanimou?", kind: "text", dimension: "wellbeing", longitudinal: false },
  { id: "new_profession", prompt: "Você conheceu neste mês alguma profissão ou atividade que gostaria de experimentar?", kind: "text", dimension: "future", longitudinal: false },
  { id: "work_style", prompt: "Você prefere atividades sozinho, em dupla, pequeno grupo ou grupo grande?", kind: "single", dimension: "relationship", longitudinal: false, options: ["sozinho", "dupla", "pequeno grupo", "grupo grande", "depende"] },
  { id: "process_preference", prompt: "Você gosta mais de começar algo novo, organizar, melhorar ou terminar?", kind: "single", dimension: "execution", longitudinal: false, options: ["começar", "organizar", "melhorar", "terminar", "depende"] },
];

export function buildMonthlySurvey(seed = 0): RevelaQuestion[] {
  const start = Math.abs(seed) % monthlyRotatingPool.length;
  const rotating = Array.from({ length: 5 }, (_, i) => monthlyRotatingPool[(start + i) % monthlyRotatingPool.length]);
  return [...monthlyCoreQuestions, ...rotating];
}
