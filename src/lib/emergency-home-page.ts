import { IMPULSIONANDO_WHATSAPP } from "./contact-channels";

export function renderEmergencyHomePage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Impulsionando Tecnologia</title>
  <meta name="description" content="Impulsionando Tecnologia — sistemas modulares, automação e atendimento oficial." />
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; }
    main { width: min(92vw, 720px); padding: 40px 24px; text-align: center; }
    .card { border: 1px solid #e2e8f0; border-radius: 28px; background: white; padding: clamp(28px, 5vw, 56px); box-shadow: 0 24px 80px rgba(15, 23, 42, .10); }
    .eyebrow { color: #2563eb; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; font-size: 12px; }
    h1 { margin: 14px 0 12px; font-size: clamp(34px, 8vw, 64px); line-height: .98; letter-spacing: -.05em; }
    p { margin: 0 auto; max-width: 56ch; color: #475569; font-size: 17px; line-height: 1.6; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 28px; }
    a { border-radius: 999px; padding: 13px 20px; font-weight: 800; text-decoration: none; }
    .primary { background: #0f172a; color: white; }
    .secondary { border: 1px solid #cbd5e1; color: #0f172a; }
    .note { margin-top: 20px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <div class="eyebrow">Impulsionando Tecnologia</div>
      <h1>Estamos online.</h1>
      <p>Se você viu uma mensagem de 404 ao abrir o domínio pelo celular, use este acesso oficial enquanto o app principal termina de carregar.</p>
      <div class="actions">
        <a class="primary" href="${IMPULSIONANDO_WHATSAPP.waMe}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20oficial%20da%20Impulsionando">WhatsApp ${IMPULSIONANDO_WHATSAPP.display}</a>
        <a class="secondary" href="/">Recarregar início</a>
      </div>
      <div class="note">Canal oficial: ${IMPULSIONANDO_WHATSAPP.display}</div>
    </section>
  </main>
</body>
</html>`;
}
