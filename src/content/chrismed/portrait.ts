/**
 * Fonte única do retrato oficial da Dra. Christiane Alencar.
 *
 * COMO PUBLICAR O RETRATO (etapa de front-end, sem depender do Codex):
 *  1. Colocar o arquivo autorizado em `src/assets/chrismed/dra-christiane.jpg`
 *     (formatos preferidos, nessa ordem: AVIF > WebP > JPG otimizado).
 *  2. Se o arquivo tiver >100 KB, migrar para o CDN via `lovable-assets create`
 *     e importar o `.asset.json` gerado; caso contrário importar direto.
 *  3. Trocar o `undefined` abaixo pelo `.url` do asset ou pelo import da imagem.
 *  4. Rodar `bunx tsgo --noEmit` — Home, /chrismed/dra-cristiane e
 *     /chrismed/ocupacional (Direção Técnica) passam a exibir o retrato
 *     automaticamente via <ChrismedPortrait />.
 *
 * REGRA INEGOCIÁVEL: Nunca substituir por foto genérica, banco de imagens
 * ou geração por IA que altere a identidade da médica. Enquanto for
 * `undefined`, os componentes reorganizam a composição editorial em vez
 * de renderizar moldura vazia.
 */
export const DRA_CHRISTIANE_PORTRAIT_SRC: string | undefined = undefined;

/** Caminho recomendado para importar o asset final (documentação). */
export const DRA_CHRISTIANE_PORTRAIT_TARGET_PATH =
  'src/assets/chrismed/dra-christiane.jpg';
