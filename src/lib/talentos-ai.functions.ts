import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const ExtractInput = z.object({
  texto: z.string().trim().min(20).max(50_000),
  candidato_id: z.string().uuid().optional(),
});

const ExtractFileInput = z.object({
  file_data_url: z.string().startsWith("data:application/").max(15_000_000),
  filename: z.string().max(200),
  candidato_id: z.string().uuid().optional(),
});

const ExtractSchema = z.object({
  cargos: z.array(z.string()).default([]),
  empresas: z.array(z.string()).default([]),
  experiencias: z.array(z.string()).default([]),
  habilidades: z.array(z.string()).default([]),
  idiomas: z.array(z.string()).default([]),
  formacao: z.array(z.string()).default([]),
  cursos: z.array(z.string()).default([]),
  certificacoes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  resumo: z.string().default(""),
});

const SYSTEM =
  "Você extrai dados estruturados de currículos em português brasileiro. " +
  "Arrays curtos (até 12 itens), em minúsculas quando aplicável, sem duplicatas. " +
  "tags devem agregar cargos+habilidades+idiomas para busca.";

async function persist(
  supabase: { from: (t: string) => unknown },
  userId: string,
  candidato_id: string | undefined,
  output: z.infer<typeof ExtractSchema>,
) {
  if (!candidato_id) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from("talentos_candidatos")
    .update({
      tags: output.tags ?? [],
      habilidades: output.habilidades ?? [],
      idiomas: output.idiomas ?? [],
    })
    .eq("id", candidato_id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export const extractCurriculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: ExtractSchema }),
      system: SYSTEM,
      prompt: `Extraia do currículo a seguir.\n\n---\n${data.texto}\n---`,
    });
    await persist(context.supabase, context.userId, data.candidato_id, output);
    return output;
  });

/** Extrai diretamente de um PDF/DOCX em base64 (data URL). */
export const extractCurriculoFromFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExtractFileInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);

    const match = /^data:([^;]+);base64,(.+)$/.exec(data.file_data_url);
    if (!match) throw new Error("Arquivo inválido");
    const mediaType = match[1];

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: ExtractSchema }),
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extraia os dados estruturados deste currículo." },
          { type: "file", data: data.file_data_url, mediaType, filename: data.filename },
        ],
      }],
    });

    await persist(context.supabase, context.userId, data.candidato_id, output);
    return output;
  });
