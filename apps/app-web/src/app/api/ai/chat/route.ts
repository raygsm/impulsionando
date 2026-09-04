import { NextResponse } from "next/server";
import { AiChatRequestBodySchema } from "@impulsionando/contracts";
import { readAccessToken } from "@/lib/auth/session";
import { nestClient } from "@/lib/api/server";
import { ApiClientError } from "@impulsionando/api-client";

/**
 * Thin BFF — forwards to Nest POST /api/v1/ai/chat.
 * No domain logic, no service-role, no ungoverned Impulsionito.
 */
export async function POST(req: Request) {
  const token = await readAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sessão ausente", correlationId: "app-web" } },
      { status: 401 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = AiChatRequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Payload inválido", correlationId: "app-web" } },
      { status: 400 },
    );
  }
  try {
    const api = nestClient(token);
    const result = await api.ai.chat(parsed.data, { accessToken: token });
    return NextResponse.json({ data: result.data, meta: { correlationId: result.correlationId } });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, correlationId: err.correlationId } },
        { status: err.status || 502 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Falha no agente", correlationId: "app-web" } },
      { status: 500 },
    );
  }
}
