import { createFileRoute } from '@tanstack/react-router';
import { authenticateChrismedDriveAdmin } from '@/lib/chrismed-google-drive.server';
import { getChrismedDriveStatus } from '@/lib/chrismed-google-drive-client.server';

export const Route = createFileRoute('/api/chrismed/google-drive/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await authenticateChrismedDriveAdmin(request);
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
        try {
          const status = await getChrismedDriveStatus();
          return Response.json({ ok: true, ...status });
        } catch (error) {
          console.error('[CHRISMED Drive status]', error);
          return Response.json({ error: 'google_drive_status_failed' }, { status: 500 });
        }
      },
    },
  },
});
