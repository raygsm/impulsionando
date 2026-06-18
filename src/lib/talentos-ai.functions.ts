import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const ExtractInput = z.object({
  texto: z.string().trim().min(20).max(50_000),
  candidato_id: z.string().uuid().optional(),
});

const ExtractSchema = z.object({
  cargos: z.array(z.string()).default([]),
  empresas: z.array(z.string()).default([]),
  habilidades: z.array(z.string()).default([]),
  idiomas: z.array(z.string()).default([]),
  formacao: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  resumo: z.string().default(""),
});

/**
 * Extrai informações estruturadas de um currículo (texto bruto) usando Lovable AI.
 * Quando candidato_id é informado, persiste tags/habilidades/idiomas no perfil.
 */
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
      system:
        "Você extrai informações estruturadas de currículos em português brasileiro. " +
        "Retorne arrays curtos (até 12 itens cada), em minúsculas quando aplicável, sem duplicatas.",
      prompt: `Extraia do currículo a seguir os dados estruturados solicitados.\n\n---\n${data.texto}\n---`,
    });

    // Persiste no candidato se solicitado
    if (data.candidato_id) {
      const { error } = await context.supabase
        .from("talentos_candidatos" as never)
        .update({
          tags: output.tags ?? [],
          habilidades: output.habilidades ?? [],
          idiomas: output.idiomas ?? [],
        } as never)
        .eq("id", data.candidato_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }

    return output;
  });
