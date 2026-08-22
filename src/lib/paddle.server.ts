import { Environment, Paddle, EventName } from '@paddle/paddle-node-sdk';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export { EventName };
export type PaddleEnv = 'sandbox' | 'live';

const API_BASE_URL: Record<PaddleEnv, string> = {
  sandbox: 'https://sandbox-api.paddle.com',
  live: 'https://api.paddle.com',
};

export function getConnectionApiKey(env: PaddleEnv): string {
  return env === 'sandbox'
    ? getEnv('PADDLE_SANDBOX_API_KEY')
    : getEnv('PADDLE_LIVE_API_KEY');
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  const apiKey = getConnectionApiKey(env);
  return new Paddle(apiKey, {
    environment: env === 'sandbox' ? Environment.sandbox : Environment.production,
  });
}

export async function gatewayFetch(env: PaddleEnv, path: string, init?: RequestInit): Promise<Response> {
  const apiKey = getConnectionApiKey(env);
  return fetch(`${API_BASE_URL[env]}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });
}

export function getWebhookSecret(env: PaddleEnv): string {
  return env === 'sandbox'
    ? getEnv('PAYMENTS_SANDBOX_WEBHOOK_SECRET')
    : getEnv('PAYMENTS_LIVE_WEBHOOK_SECRET');
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get('paddle-signature');
  const body = await req.text();
  const secret = getWebhookSecret(env);
  if (!signature || !body) throw new Error('Missing signature or body');
  const paddle = getPaddleClient(env);
  return await paddle.webhooks.unmarshal(body, secret, signature);
}
