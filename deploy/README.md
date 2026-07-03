# Core Impulsionando production deploy

Framework: Vite + React + TanStack Start through `@lovable.dev/vite-tanstack-config`.

Build command:

```bash
npm ci
npm run build
```

Production output:

- `.output/server/index.mjs`: Node/Nitro server entry.
- `.output/public`: public/static assets emitted by the build.

Serving model:

1. Run the Node server with `deploy/impulsionando-core.service` on `127.0.0.1:3000`.
2. Put Nginx in front with `deploy/nginx.impulsionando.com.br.conf`.
3. Point both Cloudflare DNS records (`impulsionando.com.br` and `www`) to the same VPS/Hostinger origin.
4. Keep Cloudflare SSL/TLS in `Full (strict)` when the origin certificate is installed. Avoid `Flexible` because it can create redirect loops and invalid HTTPS behavior.
5. Use the apex domain as canonical: `https://impulsionando.com.br`; `www` redirects to it.

Required public front-end variables in GitHub Actions or `/etc/impulsionando-core.env`:

- `VITE_PUBLIC_SITE_URL=https://impulsionando.com.br`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` / anon key
- `VITE_SUPABASE_PROJECT_ID` when needed by the app

Never put `SUPABASE_SERVICE_ROLE_KEY` in browser-exposed variables.
