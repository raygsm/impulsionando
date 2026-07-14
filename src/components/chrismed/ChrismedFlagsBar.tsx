/**
 * ChrismedFlagsBar — DESATIVADO por decisão da diretoria (Onda C+):
 * o header do CHRISMED não deve exibir opções de tradução (GB/ES).
 * O componente segue exportado apenas para não quebrar imports antigos;
 * renderiza null. Idioma passa a ser sempre PT.
 */
export function ChrismedFlagsBar(_props?: {
  tone?: 'light' | 'dark';
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  return null;
}
