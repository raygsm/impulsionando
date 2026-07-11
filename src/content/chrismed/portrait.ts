/**
 * Fonte única do retrato oficial da Dra. Christiane Alencar.
 *
 * PIPELINE AUTOMÁTICO (Onda Final):
 *   1. Basta soltar o arquivo autorizado em
 *      `src/assets/chrismed/dra-christiane.{avif|webp|jpg|jpeg|png}`
 *      (preferência: AVIF > WebP > JPG > PNG).
 *   2. O Vite resolve o URL em build-time via `import.meta.glob` abaixo.
 *   3. Todos os componentes que consomem `DRA_CHRISTIANE_PORTRAIT_SRC`
 *      (Home Hero, /dra-cristiane, Direção Técnica, GMS, chamadas
 *      institucionais) passam a exibir o retrato automaticamente — sem
 *      novos ajustes de código.
 *
 * REGRA INEGOCIÁVEL: Nunca substituir por foto genérica, banco de imagens
 * ou geração por IA que altere a identidade da médica. Enquanto o arquivo
 * não existir, os componentes reorganizam a composição editorial em vez
 * de renderizar moldura vazia.
 */
const PORTRAIT_MODULES = import.meta.glob(
  '/src/assets/chrismed/dra-christiane.{avif,webp,jpg,jpeg,png}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

// Preferência por formato: AVIF > WebP > JPG > JPEG > PNG.
const PRIORITY = ['.avif', '.webp', '.jpg', '.jpeg', '.png'];
function pickPortrait(): string | undefined {
  const entries = Object.entries(PORTRAIT_MODULES);
  if (entries.length === 0) return undefined;
  entries.sort(([a], [b]) => {
    const ai = PRIORITY.findIndex((ext) => a.toLowerCase().endsWith(ext));
    const bi = PRIORITY.findIndex((ext) => b.toLowerCase().endsWith(ext));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return entries[0]?.[1];
}

export const DRA_CHRISTIANE_PORTRAIT_SRC: string | undefined = pickPortrait();

/** Caminho recomendado para o asset final (documentação). */
export const DRA_CHRISTIANE_PORTRAIT_TARGET_PATH =
  'src/assets/chrismed/dra-christiane.jpg';
