import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateChrismedDriveAdmin,
  buildGoogleDriveAuthorizationUrl,
} from "@/lib/chrismed-google-drive.server";

export const Route = createFileRoute("/api/chrismed/google-drive/start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateChrismedDriveAdmin(request);
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
        try {
          const authorizationUrl = buildGoogleDriveAuthorizationUrl(user.id);
          return Response.json({ ok: true, authorizationUrl });
        } catch {
          return Response.json({ error: "google_drive_oauth_not_configured" }, { status: 503 });
        }
      },
    },
  },
});
