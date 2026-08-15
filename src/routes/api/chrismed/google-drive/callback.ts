import { createFileRoute } from "@tanstack/react-router";
import { completeGoogleDriveOAuth } from "@/lib/chrismed-google-drive.server";

const ADMIN_URL = "https://chrismed.impulsionando.com.br/admin";

export const Route = createFileRoute("/api/chrismed/google-drive/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (error) {
          return Response.redirect(`${ADMIN_URL}?drive=cancelled`, 302);
        }
        if (!code || !state) {
          return Response.redirect(`${ADMIN_URL}?drive=invalid`, 302);
        }
        try {
          await completeGoogleDriveOAuth({ code, state });
          return Response.redirect(`${ADMIN_URL}?drive=connected`, 302);
        } catch {
          return Response.redirect(`${ADMIN_URL}?drive=error`, 302);
        }
      },
    },
  },
});
