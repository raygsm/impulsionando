import { NextResponse } from "next/server";
import { SupportTicketCreateBodySchema } from "@impulsionando/contracts";
import { readAccessToken } from "@/lib/auth/session";
import { nestClient } from "@/lib/api/server";
import { ApiClientError } from "@impulsionando/api-client";

export async function POST(req: Request) {
  const token = await readAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sessão ausente", correlationId: "app-web" } },
      { status: 401 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = SupportTicketCreateBodySchema.safeParse({
    ...body,
    source: "app-web.help",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Payload inválido", correlationId: "app-web" } },
      { status: 400 },
    );
  }
  try {
    const api = nestClient(token);
    const result = await api.support.create(parsed.data, {
      accessToken: token,
      idempotencyKey: crypto.randomUUID(),
    });
    return NextResponse.json({ data: result.data, meta: { correlationId: result.correlationId } }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, correlationId: err.correlationId } },
        { status: err.status || 502 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Falha ao criar ticket", correlationId: "app-web" } },
      { status: 500 },
    );
  }
}
