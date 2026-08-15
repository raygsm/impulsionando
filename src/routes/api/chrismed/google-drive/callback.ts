import { createFileRoute } from "@tanstack/react-router";
import { completeGoogleDriveOAuth } from "@/lib/chrismed-google-drive.server";

export const Route = createFileRoute("/api/chrismed/google-drive/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (error) {
          return Response.redirect("https://chrismed.impulsionando.com.br/chrismed/admin?drive=cancelled", 302);
        }
        if (!code || !state) {
          return Response.redirect("https://chrismed.impulsionando.com.br/chrismed/admin?drive=invalid", 302);
        }
        try {
          await completeGoogleDriveOAuth({ code, state });
          return Response.redirect("https://chrismed.impulsionando.com.br/chrismed/admin?drive=connected", 302);
        } catch {
          return Response.redirect("https://chrismed.impulsionando.com.br/chrismed/admin?drive=error", 302);
        }
      },
    },
  },
});
