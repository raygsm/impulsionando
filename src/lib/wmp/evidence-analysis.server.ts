import { generateText, Output } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";

const BUCKET = "wmp-briefing-evidence";

const AnalysisSchema = z.object({
  observacoes: z.array(z.string().max(300)).max(6),
  riscos: z.array(z.string().max(300)).max(6),
  recomendacoes: z.array(z.string().max(300)).max(6),
  necessita_vistoria: z.boolean(),
  confianca: z.enum(["baixa", "media", "alta"]),
  limitacoes: z.string().max(600),
});

export type WmpVisualAnalysis = z.infer<typeof AnalysisSchema>;

export async function analyzeWmpBriefingImage(input: {
  briefingId: string;
  storagePath: string;
  mimeType: string;
}) {
  if (!input.mimeType.startsWith("image/")) return null;

  const { data: file, error: downloadError } = await supabaseAdmin.storage.from(BUCKET).download(input.storagePath);
  if (downloadError || !file) throw new Error(downloadError?.message ?? "private_image_download_failed");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const resolved = resolveProvider({});
  const result = await generateText({
    model: resolved.model,
    system: [
      "Você é o módulo de pré-diagnóstico visual da WMP — Wagner Miller Produções.",
      "Analise imagens de locais de eventos apenas como apoio operacional preliminar.",
      "Observe elementos visíveis relevantes para som, iluminação, vídeo, palco, circulação, montagem e segurança operacional.",
      "Nunca invente dimensões, lotação, potência elétrica, capacidade estrutural, nível de dB, certificação, disponibilidade ou conformidade legal.",
      "Quando algo não puder ser confirmado visualmente, declare a limitação e recomende validação presencial ou documental.",
      "Não identifique nem descreva pessoas presentes além do necessário para dizer que há circulação/ocupação humana.",
      "A saída deve ser objetiva, profissional e útil à equipe WMP.",
    ].join(" "),
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Faça o pré-diagnóstico visual deste local para planejamento de evento. Priorize fatos observáveis, riscos operacionais e o que precisa ser confirmado pela equipe." },
        { type: "image", image: bytes, mediaType: input.mimeType },
      ],
    }],
    output: Output.object({ schema: AnalysisSchema }),
    maxOutputTokens: 900,
    temperature: 0.2,
  });

  const analysis: WmpVisualAnalysis = result.output;
  const stored = {
    source_storage_path: input.storagePath,
    provider: resolved.provider,
    model: resolved.modelId,
    generated_at: new Date().toISOString(),
    kind: "image_pre_diagnosis",
    ...analysis,
  };

  const { error: appendError } = await supabaseAdmin.rpc("wmp_append_briefing_multimodal_analysis", {
    p_briefing_id: input.briefingId,
    p_analysis: stored,
  });
  if (appendError) throw new Error(appendError.message);

  return stored;
}
