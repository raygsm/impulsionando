/**
 * Fonte oficial da identidade médica da CHRISMED.
 *
 * Grafia oficial confirmada pelo cliente (11/07/2026):
 *  - Nome completo formal: "Dra. Christiane Soares de Alencar".
 *  - Uso informal padrão: "Dra. Christiane Alencar".
 *
 * REGRA: qualquer nova UI/copy deve importar destas constantes.
 * Não misturar "Cristiane" e "Christiane" no produto. Substituições
 * manuais espalhadas foram consolidadas nesta fonte única.
 */

export const CHRISMED_DOCTOR = {
  fullName: "Dra. Christiane Soares de Alencar",
  shortName: "Dra. Christiane Alencar",
  firstName: "Christiane",
  lastName: "Alencar",
  /** Uso internacional (EN/ES): mantemos a mesma grafia oficial. */
  fullNameIntl: "Dr. Christiane Soares de Alencar",
  shortNameIntl: "Dr. Christiane Alencar",
} as const;
