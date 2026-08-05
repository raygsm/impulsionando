import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateRequest,
  createSpecialtyRequest,
} from "@/lib/chrismed-specialty-request.server";

export const Route = createFileRoute("/api/chrismed/specialty-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateRequest(request);
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
        const body = (await request.json().catch(() => null)) as {
          requestedName?: string;
          details?: string;
        } | null;
        if (!body?.requestedName)
          return Response.json({ error: "requested_name_required" }, { status: 400 });
        try {
          const id = await createSpecialtyRequest({
            userId: user.id,
            requestedName: body.requestedName,
            details: body.details,
          });
          return Response.json({ ok: true, id }, { status: 201 });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "request_failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
