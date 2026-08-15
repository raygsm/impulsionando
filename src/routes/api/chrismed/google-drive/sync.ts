import { createFileRoute } from '@tanstack/react-router';
import { authenticateChrismedDriveAdmin } from '@/lib/chrismed-google-drive.server';
import { syncChrismedDriveMetadata } from '@/lib/chrismed-google-drive-client.server';

export const Route = createFileRoute('/api/chrismed/google-drive/sync')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateChrismedDriveAdmin(request);
        if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
        try {
          const result = await syncChrismedDriveMetadata(user.id);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error('[CHRISMED Drive sync]', error);
          return Response.json({ error: error instanceof Error ? error.message : 'google_drive_sync_failed' }, { status: 500 });
        }
      },
    },
  },
});
